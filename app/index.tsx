import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useWallet } from '../context/WalletContext'
import { useSecurity } from '../context/SecurityContext'

export default function EntryScreen() {
    const router = useRouter()
    const { isWeb3Loaded, isLoading: isWalletLoading } = useWallet()
    const { isHydrated } = useSecurity()
    const [minDurationReached, setMinDurationReached] = React.useState(false)
    const hasNavigated = useRef(false)
    const isLoading = isWalletLoading || !isHydrated || !minDurationReached

    useEffect(() => {
        // Ensure the splash stays visible for at least 2 seconds for a premium feel
        const timer = setTimeout(() => {
            setMinDurationReached(true)
        }, 2000)
        return () => clearTimeout(timer)
    }, [])

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
                source={require('../assets/Column.png')}
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
        width: 200,
        height: 200,
    },
    loaderContainer: {
        position: 'absolute',
        bottom: 100,
    }
})
