import { Stack, useRouter, useSegments } from 'expo-router'
import { View, LogBox, StyleSheet } from 'react-native'
import React, { useEffect, useRef } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NetworkProvider } from '../context/NetworkContext'
import { SecurityProvider, useSecurity } from '../context/SecurityContext'
import { BalanceVisibilityProvider } from '../context/BalanceVisibilityContext'
import { PreferencesProvider } from '../context/PreferencesContext'
import { WalletProvider, useWallet } from '../context/WalletContext'
import { SidebarProvider, useSidebar } from '../context/SidebarContext'
import { Sidebar } from '../components/Sidebar'
import LockScreen from '../components/security/LockScreen'
import { ToastProvider } from '../context/ToastContext'
import { DeepLinkProvider } from '../context/DeepLinkContext'
import { GlobalGlowProvider } from '../context/GlobalGlowContext'

import { AuraBackground } from '../components/AuraBackground'
import AudioService from '../services/audio/AudioService'

// Ignore the noisy expo-notifications warning in Expo Go
LogBox.ignoreLogs(['warnOfExpoGoPushUsage']);

function AppContent() {
  const { isLocked, isSecurityEnabled, isPasscodeSet, isBiometricEnabled } = useSecurity()
  const { walletPublicKey } = useWallet()

  const showLock = isLocked && isSecurityEnabled && walletPublicKey && (isPasscodeSet || isBiometricEnabled)

  return (
    <View style={{ flex: 1, backgroundColor: '#121315' }}>
      <AuraBackground />
      <AppUI />
      {showLock && (
        <View style={StyleSheet.absoluteFill}>
          <LockScreen />
        </View>
      )}
    </View>
  )
}

function AppUI() {
  const { isSidebarVisible, closeSidebar } = useSidebar()

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
        <Stack.Screen name="wallet-setup" />
        <Stack.Screen name="biometric-setup" />
        <Stack.Screen name="setup-success" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="send" />
        <Stack.Screen name="receive" />
        <Stack.Screen name="swap" />
        <Stack.Screen name="settings/account-center" options={{ animation: 'fade' }} />
        <Stack.Screen name="settings/passcode-setup" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
      <Sidebar isVisible={isSidebarVisible} onClose={closeSidebar} />
    </>
  )
}


export default function RootLayout() {
  useEffect(() => {
    // Prime the audio engine immediately
    AudioService.init()
  }, [])

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#121315' }}>
        <NetworkProvider>
          <WalletProvider>
            <SecurityProvider>
              <BalanceVisibilityProvider>
                <PreferencesProvider>
                  <SidebarProvider>
                    <ToastProvider>
                      <GlobalGlowProvider>
                        <DeepLinkProvider>
                          <AppContent />
                        </DeepLinkProvider>
                      </GlobalGlowProvider>
                    </ToastProvider>
                  </SidebarProvider>
                </PreferencesProvider>
              </BalanceVisibilityProvider>
            </SecurityProvider>
          </WalletProvider>
        </NetworkProvider>
      </View>
    </SafeAreaProvider>
  )
}
