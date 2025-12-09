import { Stack } from 'expo-router'
import { PrivyProvider, usePrivy } from '@privy-io/expo'
import { PrivyElements } from '@privy-io/expo/ui'
import Constants from 'expo-constants'
import { View, LogBox } from 'react-native'
import React, { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NetworkProvider } from '../context/NetworkContext'
import { SecurityProvider, useSecurity } from '../context/SecurityContext'
import { BalanceVisibilityProvider } from '../context/BalanceVisibilityContext'
import { PreferencesProvider } from '../context/PreferencesContext'
import LockScreen from '../components/security/LockScreen'

// Suppress Privy "Unauthorized" errors during initial session check
LogBox.ignoreLogs(['Unauthorized', 'was not handled by any navigator'])

// Global error handler to suppress Privy unauthorized errors and navigation timing errors during initial auth check
const originalConsoleError = console.error
console.error = (...args) => {
  const errorMessage = args.join(' ')
  if (errorMessage.includes('Unauthorized') && errorMessage.includes('privy')) {
    // Silently ignore Privy unauthorized errors during session restoration
    return
  }
  if (errorMessage.includes('was not handled by any navigator') && errorMessage.includes('(tabs)')) {
    // Silently ignore navigation timing errors during initial navigation
    return
  }
  originalConsoleError(...args)
}

function AppContent() {
  const { isLocked, isSecurityEnabled, lock, isPasscodeSet, isBiometricEnabled, unlock } = useSecurity()
  const { user, isReady } = usePrivy()
  const hasLockedOnMountRef = React.useRef(false)
  const isInitialMountRef = React.useRef(true)
  const userIdRef = React.useRef<string | null>(null)

  // Lock the app only on true cold start when security is already configured
  // Don't lock during Privy session restoration after background/foreground
  useEffect(() => {
    if (isReady && user) {
      const currentUserId = user.id
      const isNewSession = userIdRef.current !== currentUserId

      // Update user ID ref
      userIdRef.current = currentUserId

      // Only lock on initial mount with existing security settings
      // AND only if this is truly the first time seeing this user in this app session
      if (isInitialMountRef.current && isNewSession) {
        // Only lock if security was ALREADY configured before this session
        const shouldLock = isSecurityEnabled && (isPasscodeSet || isBiometricEnabled) && !hasLockedOnMountRef.current

        if (shouldLock) {
          lock()
          hasLockedOnMountRef.current = true
        }

        // Always mark initial mount as complete after checking
        isInitialMountRef.current = false
      }
    }

    // Reset the flags when user logs out
    if (!user) {
      hasLockedOnMountRef.current = false
      isInitialMountRef.current = true
      userIdRef.current = null
    }
  }, [isReady, user, isSecurityEnabled, isPasscodeSet, isBiometricEnabled, lock])

  // Only show lock screen if user is logged in AND security is enabled AND app is locked
  if (isLocked && isSecurityEnabled && user && (isPasscodeSet || isBiometricEnabled)) {
    return <LockScreen />
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#121315',
          },
          animation: 'none',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="send" />
        <Stack.Screen name="receive" />
        <Stack.Screen name="swap" />
        <Stack.Screen name="passcode-setup" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
      <PrivyElements />
    </>
  )
}

export default function RootLayout() {
  const privyAppId = Constants.expoConfig?.extra?.privyAppId
  const privyClientId = Constants.expoConfig?.extra?.privyClientId

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#121315' }}>
        <NetworkProvider>
          <PrivyProvider
            appId={privyAppId}
            clientId={privyClientId}
            config={{
              appearance: {
                theme: 'dark',
              },
            }}
          >
            <SecurityProvider>
              <BalanceVisibilityProvider>
                <PreferencesProvider>
                  <AppContent />
                </PreferencesProvider>
              </BalanceVisibilityProvider>
            </SecurityProvider>
          </PrivyProvider>
        </NetworkProvider>
      </View>
    </SafeAreaProvider>
  )
}
