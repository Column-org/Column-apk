import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Pressable,
    ScrollView,
    Platform,
    StatusBar,
    ImageBackground,
    Image,
    Switch,
    Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useWallet } from '../context/WalletContext'
import { useTheme } from '../hooks/useTheme'
import { useSecurity } from '../context/SecurityContext'
import { usePreferences } from '../context/PreferencesContext'
import { BlurView } from 'expo-blur'
import * as Clipboard from 'expo-clipboard'
import * as NotificationService from '../services/NotificationService'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const SIDEBAR_WIDTH = SCREEN_WIDTH // Cover completely

interface SidebarProps {
    isVisible: boolean
    onClose: () => void
}

export const Sidebar = ({ isVisible, onClose }: SidebarProps) => {
    const { address: walletAddress, allWallets, switchWallet, logout: unifiedLogout } = useWallet()
    const { clearAllSecurity } = useSecurity()
    const { isNotificationsEnabled, setNotificationsEnabled } = usePreferences()
    const { getThemeImage } = useTheme()
    const router = useRouter()
    const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current
    const opacityAnim = useRef(new Animated.Value(0)).current

    const currentWallet = allWallets.find(w => w.address === walletAddress)

    const handleLogout = async () => {
        try {
            onClose()
            await clearAllSecurity()
            await unifiedLogout()
            router.replace('/')
        } catch (error) {
            console.error('Logout error:', error)
            router.replace('/')
        }
    }

    useEffect(() => {
        if (isVisible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start()
        } else {
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) {
                    // Reset slide position immediately after fade to avoid ghosting when opening again
                    slideAnim.setValue(-SIDEBAR_WIDTH)
                }
            })
        }
    }, [isVisible])

    const formatAddress = (address: string | null) => {
        if (!address) return 'No Wallet'
        return `${address.slice(0, 4)}...${address.slice(-4)}`
    }

    const copyToClipboard = async () => {
        if (walletAddress) {
            await Clipboard.setStringAsync(walletAddress)
        }
    }

    const formatAddressShort = (address: string | null) => {
        if (!address) return '0x...'
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }


    if (!isVisible && (slideAnim as any)._value === -SIDEBAR_WIDTH) return null

    return (
        <View style={[styles.container, { height: isVisible || (slideAnim as any)._value !== -SIDEBAR_WIDTH ? '100%' : 0 }]} pointerEvents={isVisible ? 'auto' : 'none'}>
            <Animated.View
                style={[styles.overlay, { opacity: opacityAnim }]}
            >
                <Pressable style={styles.overlayPressable} onPress={onClose} />
            </Animated.View>

            <Animated.View
                style={[
                    styles.sidebar,
                    { transform: [{ translateX: slideAnim }] }
                ]}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.mainContent}>
                        {/* Header Section */}
                        <View style={styles.header}>
                            <View style={styles.walletInfo}>
                                <View style={styles.avatarContainer}>
                                    {currentWallet?.emoji ? (
                                        <View style={styles.emojiAvatar}>
                                            <Text style={styles.sidebarEmoji}>{currentWallet.emoji}</Text>
                                        </View>
                                    ) : (
                                        <Ionicons name="person-circle" size={56} color="#ffda34" />
                                    )}
                                </View>
                                <View style={styles.walletDetails}>
                                    <Text style={styles.walletName}>{currentWallet?.name || 'Wallet'}</Text>
                                    <View style={styles.addressRow}>
                                        <Text style={styles.addressText}>{formatAddress(walletAddress)}</Text>
                                        <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
                                            <Ionicons name="copy-outline" size={14} color="#8B98A5" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={28} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.menuContent} contentContainerStyle={styles.menuContentContainer}>
                            <View style={styles.menuItems}>
                                <TouchableOpacity
                                    style={styles.switchButton}
                                    onPress={() => {
                                        onClose()
                                        // Delay to let the fade animation complete before switching screens
                                        setTimeout(() => {
                                            router.push('/account-center' as any)
                                        }, 250)
                                    }}
                                >
                                    <View style={styles.switchButtonContent}>
                                        <Ionicons name="swap-horizontal" size={20} color="#ffda34" />
                                        <Text style={styles.switchButtonText}>Switch Wallet</Text>
                                    </View>
                                </TouchableOpacity>

                                {/* Address Book Option */}
                                <TouchableOpacity
                                    style={styles.sidebarOption}
                                    onPress={() => {
                                        onClose()
                                        setTimeout(() => {
                                            router.push('/address-book' as any)
                                        }, 250)
                                    }}
                                >
                                    <Text style={styles.sidebarOptionText}>Address Book</Text>
                                </TouchableOpacity>

                                {/* Notification Toggle */}
                                <View style={styles.sidebarOption}>
                                    <Text style={styles.sidebarOptionText}>Column Notifications</Text>
                                    <Switch
                                        value={isNotificationsEnabled}
                                        onValueChange={setNotificationsEnabled}
                                        trackColor={{ false: '#3A3F4A', true: 'rgba(255, 255, 255, 0.3)' }}
                                        thumbColor={isNotificationsEnabled ? '#FFFFFF' : '#8B98A5'}
                                        ios_backgroundColor="#3A3F4A"
                                        style={styles.notificationSwitch}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.logoutButton}
                                onPress={() => {
                                    Alert.alert(
                                        'Logout',
                                        'Are you sure you want to logout? This will clear all data on this device.',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Logout',
                                                style: 'destructive',
                                                onPress: handleLogout,
                                            },
                                        ]
                                    )
                                }}
                            >
                                <View style={styles.logoutButtonContent}>
                                    <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                                    <Text style={styles.logoutButtonText}>Logout</Text>
                                </View>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>

                    {/* Navigation Items and other sections removed as requested */}
                </SafeAreaView>
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    overlayPressable: {
        flex: 1,
    },
    sidebar: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        backgroundColor: '#121315',
        overflow: 'hidden',
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    safeArea: {
        flex: 1,
    },
    mainContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: SCREEN_HEIGHT < 750 ? 16 : 50,
        paddingBottom: SCREEN_HEIGHT < 750 ? 8 : 20,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    backButton: {
        padding: 4,
    },
    closeButton: {
        padding: 8,
        marginLeft: 10,
    },
    walletInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        marginRight: 16,
    },
    emojiAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sidebarEmoji: {
        fontSize: 32,
    },
    walletDetails: {
        flex: 1,
    },
    walletName: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    addressText: {
        color: '#8B98A5',
        fontSize: 16,
        marginRight: 8,
    },
    copyButton: {
        padding: 4,
    },
    switchButton: {
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 0,
        marginBottom: 20,
    },
    switchButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    switchButtonText: {
        color: '#ffda34',
        fontSize: 15,
        fontWeight: '600',
    },
    sidebarOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 0,
        marginBottom: 8,
    },
    sidebarOptionText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    notificationTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 0,
        marginTop: 20,
        marginBottom: 10,
    },
    notificationIconContainer: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    logoIcon: {
        width: 32,
        height: 32,
    },
    notificationTextContainer: {
        flex: 1,
        marginRight: 12,
    },
    notificationTriggerLabel: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    notificationTriggerDesc: {
        color: '#8B98A5',
        fontSize: 13,
        marginTop: 2,
    },
    notificationSwitch: {
        transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
    },
    groupContainer: {
        marginTop: 20,
        marginBottom: 10,
    },
    groupTitle: {
        color: '#8B98A5',
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
    },
    walletList: {
        gap: 12,
    },
    walletItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
    },
    activeWalletItem: {
        borderColor: 'rgba(255, 218, 52, 0.3)',
        borderWidth: 1,
        backgroundColor: 'rgba(255, 218, 52, 0.02)',
    },
    walletItemName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    walletItemAddress: {
        color: '#8B98A5',
        fontSize: 14,
    },
    walletValue: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffda34',
        paddingVertical: 16,
        borderRadius: 16,
        marginTop: 30,
        gap: 8,
    },
    addButtonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '700',
    },
    menuContent: {
        flex: 1,
    },
    menuContentContainer: {
        flexGrow: 1,
        justifyContent: 'space-between',
    },
    menuItems: {
        flex: 1,
    },
    accountCenterContent: {
        flex: 1,
    },
    logoutButton: {
        paddingVertical: 16,
        paddingHorizontal: 0,
        marginBottom: 20,
    },
    logoutButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 10,
    },
    logoutButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
})
