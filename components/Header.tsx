import React, { useState, useMemo, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Dimensions, Animated } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { Ionicons } from '@expo/vector-icons'
import { usePrivy } from '@privy-io/expo'
import { useCreateWallet } from '@privy-io/expo/extended-chains'
import { useRouter } from 'expo-router'
import { useSecurity } from '../context/SecurityContext'
import { BlurView } from 'expo-blur'
import { useTheme } from '../hooks/useTheme'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

interface HeaderProps {
    onModalStateChange?: (isOpen: boolean) => void
}

export const Header = ({ onModalStateChange }: HeaderProps) => {
    const { user, logout } = usePrivy()
    const { createWallet } = useCreateWallet()
    const { clearAllSecurity } = useSecurity()
    const { theme } = useTheme()
    const router = useRouter()
    const [modalVisible, setModalVisible] = useState(false)
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
    const [isCreatingWallet, setIsCreatingWallet] = useState(false)
    const slideAnim = useRef(new Animated.Value(100)).current

    // Filter Movement wallets from linked accounts
    const movementWallets = useMemo(() => {
        if (!user?.linked_accounts) return []
        return user.linked_accounts.filter(
            (account: any) => account.type === 'wallet' && account.chain_type === 'aptos'
        )
    }, [user?.linked_accounts])

    // Create Movement wallet if user doesn't have one
    useEffect(() => {
        const createMovementWallet = async () => {
            if (user && movementWallets.length === 0 && !isCreatingWallet) {
                setIsCreatingWallet(true)
                try {
                    await createWallet({
                        chainType: 'aptos' as any,
                    })
                } catch (error) {
                    console.error('Failed to create Movement wallet:', error)
                } finally {
                    setIsCreatingWallet(false)
                }
            }
        }
        createMovementWallet()
    }, [user, movementWallets.length, createWallet, isCreatingWallet])

    // Format address for display
    const formatAddress = (address: string) => {
        if (!address) return 'No Wallet'
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    const activeWallet = movementWallets[0]
    const walletAddress = (activeWallet as any)?.address || ''

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true)
    }

    const handleLogoutConfirm = async () => {
        try {
            await clearAllSecurity()
            await logout()
            setShowLogoutConfirm(false)
            setModalVisible(false)
            router.replace('/')
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    const handleLogoutCancel = () => {
        setShowLogoutConfirm(false)
    }

    const handleCopyAddress = async () => {
        if (walletAddress) {
            await Clipboard.setStringAsync(walletAddress)

            // Animate the "Copied!" notification
            Animated.sequence([
                // Slide in from right
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                // Stay visible
                Animated.delay(1500),
                // Slide back out
                Animated.timing(slideAnim, {
                    toValue: 100,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start()
        }
    }

    // Notify parent when modal state changes
    useEffect(() => {
        onModalStateChange?.(modalVisible)
    }, [modalVisible, onModalStateChange])

    return (
        <>
            <View style={styles.header}>
                {theme === 'none' ? (
                    <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
                        <TouchableOpacity
                            style={[styles.walletSelector, styles.walletSelectorWithBlur]}
                            onPress={() => setModalVisible(true)}
                        >
                            <View style={styles.profileIcon}>
                                <Ionicons name="person-circle" size={36} color="#ffda34" />
                            </View>
                            <Text style={styles.walletText}>
                                {isCreatingWallet ? 'Creating...' : formatAddress(walletAddress)}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color="white" />
                        </TouchableOpacity>
                    </BlurView>
                ) : (
                    <TouchableOpacity
                        style={styles.walletSelector}
                        onPress={() => setModalVisible(true)}
                    >
                        <View style={styles.profileIcon}>
                            <Ionicons name="person-circle" size={36} color="#ffda34" />
                        </View>
                        <Text style={styles.walletText}>
                            {isCreatingWallet ? 'Creating...' : formatAddress(walletAddress)}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="white" />
                    </TouchableOpacity>
                )}
                {!isCreatingWallet && walletAddress && (
                    <View style={styles.copyContainer}>
                        <TouchableOpacity onPress={handleCopyAddress} style={styles.actionButton}>
                            <Ionicons name="copy-outline" size={20} color="#8B98A5" />
                        </TouchableOpacity>

                        {/* Animated "Copied!" notification */}
                        <Animated.View
                            style={[
                                styles.copiedNotification,
                                {
                                    transform: [{ translateX: slideAnim }],
                                    opacity: slideAnim.interpolate({
                                        inputRange: [0, 100],
                                        outputRange: [1, 0],
                                    }),
                                },
                            ]}
                        >
                            <Text style={styles.copiedText}>Copied!</Text>
                        </Animated.View>
                    </View>
                )}
            </View>

            {/* Wallet Bottom Sheet Modal */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
                statusBarTranslucent
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setModalVisible(false)}
                >
                    <Pressable
                        style={styles.bottomSheet}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.sheetHandle} />

                        {!showLogoutConfirm ? (
                            <>
                                <Text style={styles.sheetTitle}>Wallets & Collections</Text>

                                <View style={styles.walletItem}>
                                    <View style={styles.walletItemLeft}>
                                        <View style={styles.walletIconContainer}>
                                            <Ionicons name="wallet" size={24} color="#ffda34" />
                                        </View>
                                        <View>
                                            <Text style={styles.walletItemAddress}>
                                                {formatAddress(walletAddress)}
                                            </Text>
                                            <Text style={styles.walletItemLabel}>Connected Wallet</Text>
                                        </View>
                                    </View>
                                    <Ionicons name="link" size={20} color="#8B98A5" />
                                </View>

                                <View style={styles.divider} />

                                <TouchableOpacity
                                    style={styles.logoutButton}
                                    onPress={handleLogoutClick}
                                >
                                    <View style={styles.logoutIconContainer}>
                                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                                    </View>
                                    <Text style={styles.logoutText}>Logout</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <View style={styles.confirmContainer}>
                                    <Text style={styles.confirmTitle}>Logout</Text>
                                    <Text style={styles.confirmMessage}>
                                        Are you sure you want to logout? You'll need to login again to access your wallet.
                                    </Text>
                                </View>

                                <View style={styles.confirmButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={handleLogoutCancel}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.confirmLogoutButton}
                                        onPress={handleLogoutConfirm}
                                    >
                                        <Text style={styles.confirmLogoutButtonText}>Logout</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </>
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
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionButton: {
        padding: 8,
    },
    copyContainer: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
    },
    copiedNotification: {
        position: 'absolute',
        right: 40,
        backgroundColor: '#ffda34',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    copiedText: {
        color: '#121315',
        fontSize: 12,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: '#121315',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 40,
        minHeight: 320,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    sheetTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 24,
    },
    walletItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        marginBottom: 16,
    },
    walletItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    walletIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 195, 13, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    walletItemAddress: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    walletItemLabel: {
        color: '#8B98A5',
        fontSize: 13,
    },
    manageCollections: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        marginBottom: 12,
        gap: 12,
    },
    manageIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    manageText: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginVertical: 16,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        gap: 12,
    },
    logoutIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutText: {
        flex: 1,
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmContainer: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 16,
    },
    confirmIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    confirmTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 12,
    },
    confirmMessage: {
        color: '#8B98A5',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    confirmButtons: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmLogoutButton: {
        flex: 1,
        paddingVertical: 16,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmLogoutButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
})
