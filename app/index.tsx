import React, { useEffect, useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useWallet } from '../context/WalletContext'

export default function EntryScreen() {
    const router = useRouter()
    const { isWeb3Loaded, isLoading } = useWallet()
    const hasNavigated = useRef(false)

    useEffect(() => {
        if (isLoading || hasNavigated.current) return

        hasNavigated.current = true
        if (isWeb3Loaded) {
            console.log('[Entry] Navigating to home')
            router.replace('/(tabs)/home')
        } else {
            console.log('[Entry] Navigating to setup')
            router.replace('/wallet-setup')
        }
    }, [isLoading, isWeb3Loaded])

    return (
        <View style={styles.container} />
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121315',
        justifyContent: 'center',
        alignItems: 'center',
    },
})
