import React, { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useWallet } from '../context/WalletContext'
import { useSidebar } from '../context/SidebarContext'
import { BlurView } from 'expo-blur'
import { useTheme } from '../hooks/useTheme'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

export const Header = () => {
    const { address: walletAddress, allWallets } = useWallet()
    const { openSidebar } = useSidebar()
    const { theme } = useTheme()
    const router = useRouter()

    const currentWallet = allWallets.find(w => w.address === walletAddress)

    // Format address for display
    const formatAddress = (address: string | null) => {
        if (!address) return 'No Wallet'
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    return (
        <View style={styles.header}>
            {theme === 'none' ? (
                <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
                    <TouchableOpacity
                        style={[styles.walletSelector, styles.walletSelectorWithBlur]}
                        onPress={openSidebar}
                    >
                        <View style={styles.profileIcon}>
                            {currentWallet?.emoji ? (
                                <View style={styles.headerEmojiContainer}>
                                    <Text style={styles.headerEmoji}>{currentWallet.emoji}</Text>
                                </View>
                            ) : (
                                <Ionicons name="person-circle" size={36} color="#ffda34" />
                            )}
                        </View>
                        <View>
                            <Text style={styles.walletText}>
                                {currentWallet?.name || formatAddress(walletAddress)}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={16} color="white" />
                    </TouchableOpacity>
                </BlurView>
            ) : (
                <TouchableOpacity
                    style={styles.walletSelector}
                    onPress={openSidebar}
                >
                    <View style={styles.profileIcon}>
                        {currentWallet?.emoji ? (
                            <View style={styles.headerEmojiContainer}>
                                <Text style={styles.headerEmoji}>{currentWallet.emoji}</Text>
                            </View>
                        ) : (
                            <Ionicons name="person-circle" size={36} color="#ffda34" />
                        )}
                    </View>
                    <View>
                        <Text style={styles.walletText}>
                            {currentWallet?.name || formatAddress(walletAddress)}
                        </Text>
                    </View>
                    <Ionicons name="chevron-down" size={16} color="white" />
                </TouchableOpacity>
            )}

            {walletAddress && (
                <View style={styles.headerActions}>
                    <View style={styles.heartbeatContainer}>
                        <HeartbeatDot />
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/qrScanner')}
                        style={styles.actionButton}
                    >
                        <Ionicons name="scan-outline" size={22} color="#8B98A5" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.push('/browser')}
                        style={styles.actionButton}
                    >
                        <Ionicons name="globe-outline" size={22} color="#8B98A5" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    )
}

const HeartbeatDot = () => {
    const pulseAnim = useRef(new Animated.Value(1)).current

    useEffect(() => {
        const animate = () => {
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 2,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                })
            ]).start()
        }

        const interval = setInterval(animate, 3000)
        animate()
        return () => clearInterval(interval)
    }, [])

    return (
        <View style={styles.heartbeatOuter}>
            <Animated.View
                style={[
                    styles.heartbeatInner,
                    {
                        transform: [{ scale: pulseAnim }],
                        opacity: pulseAnim.interpolate({
                            inputRange: [1, 2],
                            outputRange: [0.6, 0]
                        })
                    }
                ]}
            />
            <View style={styles.heartbeatCore} />
        </View>
    )
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: IS_SMALL_SCREEN ? 16 : 50,
        paddingBottom: IS_SMALL_SCREEN ? 8 : 20,
    },
    blurContainer: {
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: 'rgba(42, 44, 48, 0.6)',
    },
    walletSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    walletSelectorWithBlur: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    profileIcon: {
        marginRight: 4,
    },
    walletText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    headerEmojiContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerEmoji: {
        fontSize: 20,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionButton: {
        padding: 8,
    },
    heartbeatContainer: {
        paddingHorizontal: 8,
    },
    heartbeatOuter: {
        width: 12,
        height: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heartbeatCore: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#00FFA3',
        shadowColor: '#00FFA3',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
    },
    heartbeatInner: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#00FFA3',
    },
})
