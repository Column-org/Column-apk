import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'
import { AppState, AppStateStatus } from 'react-native'

const PASSCODE_KEY = 'app_passcode'
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled'
const SECURITY_ENABLED_KEY = 'security_enabled'
const LOCK_TIMEOUT_KEY = 'lock_timeout'

interface SecurityContextType {
  isSecurityEnabled: boolean
  isBiometricEnabled: boolean
  isBiometricAvailable: boolean
  isLocked: boolean
  isPasscodeSet: boolean
  lockTimeout: number
  setPasscode: (passcode: string) => Promise<void>
  verifyPasscode: (passcode: string) => Promise<boolean>
  removePasscode: () => Promise<void>
  enableBiometric: () => Promise<boolean>
  disableBiometric: () => Promise<void>
  authenticateWithBiometric: () => Promise<boolean>
  unlock: () => void
  lock: () => void
  setLockTimeout: (minutes: number) => Promise<void>
  enableSecurity: () => Promise<void>
  disableSecurity: () => Promise<void>
  clearAllSecurity: () => Promise<void>
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined)

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [isSecurityEnabled, setIsSecurityEnabled] = useState(false)
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false)
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [isPasscodeSet, setIsPasscodeSet] = useState(false)
  const [lockTimeout, setLockTimeoutState] = useState(1)

  const lastActiveTime = useRef<number>(Date.now())
  const lastUnlockTime = useRef<number>(0)
  const isAuthInProgress = useRef<boolean>(false)
  const appStateListenerPaused = useRef<boolean>(false)

  const settingsRef = useRef({
    isSecurityEnabled,
    isPasscodeSet,
    isBiometricEnabled,
    lockTimeout,
    isLocked
  })

  useEffect(() => {
    settingsRef.current = {
      isSecurityEnabled,
      isPasscodeSet,
      isBiometricEnabled,
      lockTimeout,
      isLocked
    }
  }, [isSecurityEnabled, isPasscodeSet, isBiometricEnabled, lockTimeout, isLocked])

  useEffect(() => {
    const checkBiometric = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync()
      const enrolled = await LocalAuthentication.isEnrolledAsync()
      setIsBiometricAvailable(compatible && enrolled)
    }
    checkBiometric()
  }, [])

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [passcode, biometricEnabled, securityEnabled, timeout] = await Promise.all([
          SecureStore.getItemAsync(PASSCODE_KEY),
          SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY),
          SecureStore.getItemAsync(SECURITY_ENABLED_KEY),
          SecureStore.getItemAsync(LOCK_TIMEOUT_KEY),
        ])

        setIsPasscodeSet(!!passcode)
        setIsBiometricEnabled(biometricEnabled === 'true')
        setIsSecurityEnabled(securityEnabled === 'true')

        const storedTimeout = timeout ? parseInt(timeout) : 1
        setLockTimeoutState(storedTimeout === 0 ? 1 : storedTimeout)

        if (securityEnabled === 'true' && (passcode || biometricEnabled === 'true')) {
          setIsLocked(true)
        }
      } catch (error) {
        console.error('Error loading security settings:', error)
      }
    }
    loadSettings()
  }, [])

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // CRITICAL: Skip ALL processing if listener is paused
      if (appStateListenerPaused.current) {
        console.log('[SecurityContext] AppState listener paused, ignoring state change:', nextAppState)
        return
      }

      const { isSecurityEnabled, isPasscodeSet, isBiometricEnabled, lockTimeout, isLocked } = settingsRef.current

      console.log('[SecurityContext] AppState changed to:', nextAppState, {
        isSecurityEnabled,
        isPasscodeSet,
        isBiometricEnabled,
        isLocked,
        isAuthInProgress: isAuthInProgress.current
      })

      if (nextAppState === 'active') {
        const now = Date.now()
        const timeDiff = (now - lastActiveTime.current) / 1000 / 60
        const timeSinceUnlock = (now - lastUnlockTime.current) / 1000

        console.log('[SecurityContext] Active state check:', {
          timeDiff: timeDiff.toFixed(2) + ' min',
          timeSinceUnlock: timeSinceUnlock.toFixed(2) + ' sec',
          lockTimeout: lockTimeout + ' min',
          shouldLock: timeDiff >= lockTimeout && timeSinceUnlock > 10
        })

        // Only lock if enough time has passed AND we're not in auth flow
        if (isSecurityEnabled && (isPasscodeSet || isBiometricEnabled) && !isLocked && !isAuthInProgress.current) {
          if (timeDiff >= lockTimeout && timeSinceUnlock > 10) {
            console.log('[SecurityContext] Auto-locking due to timeout')
            setIsLocked(true)
          }
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        lastActiveTime.current = Date.now()
        console.log('[SecurityContext] App backgrounded, recording time')
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => subscription.remove()
  }, [])

  const setPasscode = useCallback(async (passcode: string) => {
    await SecureStore.setItemAsync(PASSCODE_KEY, passcode)
    setIsPasscodeSet(true)
    setIsLocked(false)
  }, [])

  const verifyPasscode = useCallback(async (passcode: string) => {
    const storedPasscode = await SecureStore.getItemAsync(PASSCODE_KEY)
    return storedPasscode === passcode
  }, [])

  const removePasscode = useCallback(async () => {
    await SecureStore.deleteItemAsync(PASSCODE_KEY)
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY)
    await SecureStore.deleteItemAsync(SECURITY_ENABLED_KEY)
    setIsPasscodeSet(false)
    setIsBiometricEnabled(false)
    setIsSecurityEnabled(false)
    setIsLocked(false)
  }, [])

  const enableBiometric = useCallback(async () => {
    if (!isBiometricAvailable) return false

    isAuthInProgress.current = true
    appStateListenerPaused.current = true

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable biometrics',
        fallbackLabel: 'Cancel',
        disableDeviceFallback: true,
      })

      if (result.success) {
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true')
        await SecureStore.setItemAsync(SECURITY_ENABLED_KEY, 'true')
        setIsBiometricEnabled(true)
        setIsSecurityEnabled(true)
        setIsLocked(false)
        lastUnlockTime.current = Date.now()
        return true
      }
      return false
    } finally {
      // Reset activity time to prevent immediate re-lock
      lastActiveTime.current = Date.now()
      // Wait before re-enabling listener to allow app to stabilize
      setTimeout(() => {
        isAuthInProgress.current = false
        appStateListenerPaused.current = false
        console.log('[SecurityContext] Listener re-enabled after biometric enable')
      }, 5000)
    }
  }, [isBiometricAvailable])

  const disableBiometric = useCallback(async () => {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'false')
    await SecureStore.setItemAsync(SECURITY_ENABLED_KEY, 'false')
    setIsBiometricEnabled(false)
    setIsSecurityEnabled(false)
    setIsLocked(false)
  }, [])

  const authenticateWithBiometric = useCallback(async () => {
    if (!isBiometricEnabled || !isBiometricAvailable) return false

    isAuthInProgress.current = true
    appStateListenerPaused.current = true

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Satoshi Wallet',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
      })

      if (result.success) {
        setIsLocked(false)
        lastActiveTime.current = Date.now()
        lastUnlockTime.current = Date.now()
        return true
      }
      return false
    } finally {
      // Reset activity time to prevent immediate re-lock
      lastActiveTime.current = Date.now()
      // Critical: Wait before re-enabling the listener
      setTimeout(() => {
        isAuthInProgress.current = false
        appStateListenerPaused.current = false
        console.log('[SecurityContext] Listener re-enabled after biometric auth')
      }, 5000)
    }
  }, [isBiometricEnabled, isBiometricAvailable])

  const unlock = useCallback(() => {
    setIsLocked(false)
    lastActiveTime.current = Date.now()
    lastUnlockTime.current = Date.now()
  }, [])

  const lock = useCallback(() => {
    if (isSecurityEnabled && (isPasscodeSet || isBiometricEnabled)) {
      setIsLocked(true)
    }
  }, [isSecurityEnabled, isPasscodeSet, isBiometricEnabled])

  const setLockTimeoutValue = useCallback(async (minutes: number) => {
    const val = Math.max(1, minutes)
    await SecureStore.setItemAsync(LOCK_TIMEOUT_KEY, val.toString())
    setLockTimeoutState(val)
  }, [])

  const enableSecurity = useCallback(async () => {
    const passcode = await SecureStore.getItemAsync(PASSCODE_KEY)
    if (!passcode) {
      throw new Error('Passcode must be set before enabling security')
    }
    await SecureStore.setItemAsync(SECURITY_ENABLED_KEY, 'true')
    setIsSecurityEnabled(true)
    setIsLocked(false)
    lastActiveTime.current = Date.now()
  }, [])

  const disableSecurity = useCallback(async () => {
    await SecureStore.setItemAsync(SECURITY_ENABLED_KEY, 'false')
    setIsSecurityEnabled(false)
    setIsLocked(false)
  }, [])

  const clearAllSecurity = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(PASSCODE_KEY).catch(() => { }),
      SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY).catch(() => { }),
      SecureStore.deleteItemAsync(SECURITY_ENABLED_KEY).catch(() => { }),
      SecureStore.deleteItemAsync(LOCK_TIMEOUT_KEY).catch(() => { }),
    ])

    setIsPasscodeSet(false)
    setIsBiometricEnabled(false)
    setIsSecurityEnabled(false)
    setIsLocked(false)
    setLockTimeoutState(1)
  }, [])

  return (
    <SecurityContext.Provider
      value={{
        isSecurityEnabled,
        isBiometricEnabled,
        isBiometricAvailable,
        isLocked,
        isPasscodeSet,
        lockTimeout,
        setPasscode,
        verifyPasscode,
        removePasscode,
        enableBiometric,
        disableBiometric,
        authenticateWithBiometric,
        unlock,
        lock,
        setLockTimeout: setLockTimeoutValue,
        enableSecurity,
        disableSecurity,
        clearAllSecurity,
      }}
    >
      {children}
    </SecurityContext.Provider>
  )
}

export function useSecurity() {
  const context = useContext(SecurityContext)
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider')
  }
  return context
}
