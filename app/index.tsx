import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useWallet } from '../context/WalletContext'

export default function EntryScreen() {
    const router = useRouter()
    const { isWeb3Loaded, isLoading } = useWallet()
    const hasNavigated = useRef(false)

    useEffect(() => {
        console.log('[EntryScreen] State change:', { isLoading, isWeb3Loaded, hasNavigated: hasNavigated.current })
        if (isLoading || hasNavigated.current) return

        hasNavigated.current = true
        if (isWeb3Loaded) {
            console.log('[EntryScreen] Navigating to Home')
            router.replace('/(tabs)/home')
        } else {
            console.log('[EntryScreen] Navigating to Wallet Setup')
            router.replace('/wallet-setup')
        }
    }, [isLoading, isWeb3Loaded])

    // While hydrating or navigating, show a professional splash view
    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/Collumn-Login.png')}
                style={styles.logo}
                resizeMode="contain"
            />
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color="#ffda34" />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121315',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 140,
        height: 140,
        marginBottom: 40,
    },
    loaderContainer: {
        position: 'absolute',
        bottom: 60,
    }
})
