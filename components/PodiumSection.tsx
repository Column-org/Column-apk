import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useWallet } from '../context/WalletContext'
import { useNetwork } from '../context/NetworkContext'
import { getFungibleAssets } from '../services/movementAssets'
import { LinearGradient } from 'expo-linear-gradient'

export const PodiumSection = () => {
    const { address: walletAddress } = useWallet()
    const { network } = useNetwork()
    const [hasPass, setHasPass] = useState(false)
    const fadeAnim = React.useRef(new Animated.Value(0)).current

    const checkPodiumPass = useCallback(async () => {
        if (!walletAddress) return
        try {
            const assets = await getFungibleAssets(walletAddress, network)
            console.log(`[Podium] Checking ${assets.length} assets for Podium Pass...`)

            const podiumAsset = assets.find(asset => {
                const name = asset.metadata.name?.toLowerCase() || ''
                const symbol = asset.metadata.symbol?.toLowerCase() || ''
                const iconUri = asset.metadata.icon_uri?.toLowerCase() || ''
                const type = asset.asset_type?.toLowerCase() || ''

                const isMatch = name.includes('podium') ||
                    symbol.includes('podium') ||
                    iconUri.includes('podium') ||
                    type.includes('podium')

                if (isMatch) console.log(`[Podium] Found Match: ${name} (${symbol})`)
                return isMatch
            })

            if (podiumAsset) {
                setHasPass(true)
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }).start()
            } else {
                setHasPass(false)
            }
        } catch (error) {
            console.error('[Podium] Error checking Podium Pass:', error)
        }
    }, [walletAddress, network])

    useEffect(() => {
        checkPodiumPass()
    }, [checkPodiumPass])

    if (!hasPass) return null

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <LinearGradient
                colors={['#0D1A1E', '#081215']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Image
                            source={{ uri: 'https://i.ibb.co/vzYyS2F/podium-pass.png' }}
                            style={styles.podiumIcon}
                        />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>Project Podium Active</Text>
                        <Text style={styles.description}>Podium Pass holders gain exclusive yield & ecosystem rewards.</Text>
                    </View>
                    <TouchableOpacity style={styles.closeButton}>
                        <Ionicons name="close-outline" size={20} color="#8B98A5" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 10,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 255, 0.1)',
    },
    gradient: {
        padding: 16,
        paddingVertical: 20,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: 16,
    },
    podiumIcon: {
        width: 48,
        height: 48,
        borderRadius: 8,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: '#00D1FF', // Cyan color like the screenshot
        fontSize: 18,
        fontWeight: 'bold',
    },
    description: {
        color: '#FFFFFF',
        fontSize: 14,
        marginTop: 4,
        opacity: 0.8,
    },
    closeButton: {
        alignSelf: 'flex-start',
        padding: 4,
    }
})
