import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
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
  const [lockTimeout, setLockTimeoutState] = useState(0) // 0 = immediate, in minutes
  const [lastActiveTime, setLastActiveTime] = useState<number>(Date.now())
  const [hasAuthenticatedThisSession, setHasAuthenticatedThisSession] = useState(false)

  // Check biometric availability
  useEffect(() => {
    const checkBiometric = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync()
      const enrolled = await LocalAuthentication.isEnrolledAsync()
      setIsBiometricAvailable(compatible && enrolled)
    }
    checkBiometric()
  }, [])

  // Load security settings
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
        setLockTimeoutState(timeout ? parseInt(timeout) : 0)

        // Don't auto-lock on startup - let the AppContent component handle it based on user session
        // The lock will be triggered by app state changes or manual lock
      } catch (error) {
        console.error('Error loading security settings:', error)
      }
    }
    loadSettings()
  }, [])

  // Handle app state changes for auto-lock
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground
        if (isSecurityEnabled && (isPasscodeSet || isBiometricEnabled)) {
          const timeDiff = (Date.now() - lastActiveTime) / 1000 / 60 // in minutes
          // Only lock if we haven't authenticated in this session yet
          // or if enough time has passed based on lockTimeout
          if (!hasAuthenticatedThisSession || timeDiff >= lockTimeout) {
            setIsLocked(true)
            setHasAuthenticatedThisSession(false) // Reset for next authentication
          }
        }
      } else if (nextAppState === 'background') {
        // App went to background
        setLastActiveTime(Date.now())
        // Reset authentication flag when going to background
        setHasAuthenticatedThisSession(false)
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => subscription.remove()
  }, [isSecurityEnabled, isPasscodeSet, isBiometricEnabled, lockTimeout, lastActiveTime, hasAuthenticatedThisSession])

  const setPasscode = useCallback(async (passcode: string) => {
    await SecureStore.setItemAsync(PASSCODE_KEY, passcode)
    setIsPasscodeSet(true)
    // Ensure app stays unlocked after setting passcode
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
      return true
    }
    return false
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

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Satoshi Wallet',
      fallbackLabel: 'Use passcode',
      cancelLabel: 'Cancel',
    })

    if (result.success) {
      setIsLocked(false)
      return true
    }
    return false
  }, [isBiometricEnabled, isBiometricAvailable])

  const unlock = useCallback(() => {
    setIsLocked(false)
    setLastActiveTime(Date.now())
    setHasAuthenticatedThisSession(true) // Mark that user has authenticated in this session
  }, [])

  const lock = useCallback(() => {
    if (isSecurityEnabled && (isPasscodeSet || isBiometricEnabled)) {
      setIsLocked(true)
    }
  }, [isSecurityEnabled, isPasscodeSet, isBiometricEnabled])

  const setLockTimeoutValue = useCallback(async (minutes: number) => {
    await SecureStore.setItemAsync(LOCK_TIMEOUT_KEY, minutes.toString())
    setLockTimeoutState(minutes)
  }, [])

  const enableSecurity = useCallback(async () => {
    // Check secure store directly to avoid state timing issues
    const passcode = await SecureStore.getItemAsync(PASSCODE_KEY)
    if (!passcode) {
      throw new Error('Passcode must be set before enabling security')
    }
    await SecureStore.setItemAsync(SECURITY_ENABLED_KEY, 'true')
    setIsSecurityEnabled(true)
    // Don't lock immediately after enabling - user just authenticated
    setIsLocked(false)
    setLastActiveTime(Date.now())
  }, [])

  const disableSecurity = useCallback(async () => {
    await SecureStore.setItemAsync(SECURITY_ENABLED_KEY, 'false')
    setIsSecurityEnabled(false)
    setIsLocked(false)
  }, [])

  const clearAllSecurity = useCallback(async () => {
    // Clear all security-related data from SecureStore
    await Promise.all([
      SecureStore.deleteItemAsync(PASSCODE_KEY).catch(() => {}),
      SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY).catch(() => {}),
      SecureStore.deleteItemAsync(SECURITY_ENABLED_KEY).catch(() => {}),
      SecureStore.deleteItemAsync(LOCK_TIMEOUT_KEY).catch(() => {}),
    ])

    // Reset all security states
    setIsPasscodeSet(false)
    setIsBiometricEnabled(false)
    setIsSecurityEnabled(false)
    setIsLocked(false)
    setLockTimeoutState(0)
    setHasAuthenticatedThisSession(false)
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
