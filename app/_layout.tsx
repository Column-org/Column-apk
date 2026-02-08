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


function AppContent() {
  const { isLocked, isSecurityEnabled, isPasscodeSet, isBiometricEnabled } = useSecurity()
  const { walletPublicKey } = useWallet()

  const showLock = isLocked && isSecurityEnabled && walletPublicKey && (isPasscodeSet || isBiometricEnabled)

  return (
    <View style={{ flex: 1 }}>
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
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="send" />
        <Stack.Screen name="receive" />
        <Stack.Screen name="swap" />
        <Stack.Screen name="account-center" options={{ animation: 'fade' }} />
        <Stack.Screen name="passcode-setup" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
      <Sidebar isVisible={isSidebarVisible} onClose={closeSidebar} />
    </>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#121315' }}>
        <NetworkProvider>
          <WalletProvider>
            <SecurityProvider>
              <BalanceVisibilityProvider>
                <PreferencesProvider>
                  <SidebarProvider>
                    <AppContent />
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
