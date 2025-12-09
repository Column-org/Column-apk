import React from 'react'
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native'
import { useRouter } from 'expo-router'
import { usePrivy } from '@privy-io/expo'
import PrivyUI from '../components/Login/PrivyUI'
import StarGate from '../components/Login/StarGate'

export default function LoginScreen() {
    const router = useRouter()
    const { user, isReady } = usePrivy()
    const [showPrivyUI, setShowPrivyUI] = React.useState(false)

    // If user is already authenticated, navigate to home
    React.useEffect(() => {
        // Only navigate once when user first becomes authenticated
        // Don't navigate on every Privy session restoration
        if (isReady && user?.id) {
            console.log('User authenticated, navigating to home:', user.id)
            // Use a small timeout to ensure navigation happens after SecurityContext is ready
            const timeoutId = setTimeout(() => {
                router.replace('/(tabs)/home')
            }, 100)

            return () => clearTimeout(timeoutId)
        }
    }, [isReady, user?.id])

    // Auto-redirect to PrivyUI after 20 seconds, but only after Privy is ready
    React.useEffect(() => {
        if (isReady && !user?.id) {
            const timeoutId = setTimeout(() => {
                setShowPrivyUI(true)
            }, 20000) // 20 seconds

            return () => clearTimeout(timeoutId)
        }
    }, [isReady, user?.id])

    // Show dark screen while checking authentication
    if (!isReady) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
            </View>
        )
    }

    // Show PrivyUI after timeout
    if (showPrivyUI) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.content}>
                    <PrivyUI />
                </View>
            </SafeAreaView>
        )
    }

    // Show StarGate interface first
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <StarGate />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
})
