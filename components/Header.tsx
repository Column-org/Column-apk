import React, { useState, useMemo, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Dimensions, Animated, ScrollView } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSecurity } from '../context/SecurityContext'
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
        <>
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
                        <TouchableOpacity
                            onPress={() => router.push('/browser')}
                            style={styles.actionButton}
                        >
                            <Ionicons name="globe-outline" size={22} color="#8B98A5" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
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
        gap: 8,
    },
    actionButton: {
        padding: 8,
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
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    addWalletButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 218, 52, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 218, 52, 0.2)',
    },
    addWalletText: {
        color: '#ffda34',
        fontSize: 13,
        fontWeight: '600',
    },
    walletList: {
        maxHeight: SCREEN_HEIGHT * 0.4,
    },
    walletItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        marginBottom: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeWalletItem: {
        backgroundColor: 'rgba(255, 218, 52, 0.05)',
        borderColor: 'rgba(255, 218, 52, 0.2)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeWalletIconContainer: {
        backgroundColor: '#ffda34',
    },
    walletItemName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    walletItemAddress: {
        color: '#8B98A5',
        fontSize: 13,
    },
    walletItemLabel: {
        color: '#8B98A5',
        fontSize: 13,
    },
    activeBadge: {
        backgroundColor: 'rgba(255, 218, 52, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 218, 52, 0.2)',
    },
    activeBadgeText: {
        color: '#ffda34',
        fontSize: 10,
        fontWeight: '700',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        gap: 12,
    },
    menuIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuText: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
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
