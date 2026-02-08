import React, { useState } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Platform,
    Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useWallet } from '../context/WalletContext'
import { useTheme } from '../hooks/useTheme'
import * as Clipboard from 'expo-clipboard'

export default function ManageAccountScreen() {
    const { address, allWallets, logout: unifiedLogout } = useWallet()
    const router = useRouter()

    const currentWallet = allWallets.find(w => w.address === address)

    const formatAddress = (addr: string | null) => {
        if (!addr) return ''
        return `${addr.slice(0, 4)}...${addr.slice(-4)}`
    }

    const copyToClipboard = async () => {
        if (address) {
            await Clipboard.setStringAsync(address)
            Alert.alert('Copied', 'Address copied to clipboard')
        }
    }

    const handleRemoveWallet = () => {
        Alert.alert(
            'Remove Wallet',
            'Are you sure you want to remove this wallet from this device? Make sure you have backed up your recovery phrase.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        // Implement remove logic if needed, for now just go back or logout
                        router.back()
                    }
                }
            ]
        )
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Manage Account</Text>
                    <View style={{ width: 42 }} />
                </View>

                <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                    {/* Wallet Profile */}
                    <View style={styles.profileSection}>
                        <View style={styles.emojiAvatar}>
                            <Text style={styles.emojiText}>{currentWallet?.emoji || '💰'}</Text>
                        </View>
                        <Text style={styles.walletName}>{currentWallet?.name || 'Wallet'}</Text>
                        <TouchableOpacity style={styles.addressContainer} onPress={copyToClipboard}>
                            <Text style={styles.addressText}>{formatAddress(address)}</Text>
                            <Ionicons name="copy-outline" size={14} color="#8B98A5" style={styles.copyIcon} />
                        </TouchableOpacity>
                    </View>

                    {/* Options List */}
                    <View style={styles.optionsList}>
                        <TouchableOpacity style={styles.optionItem} onPress={() => router.push('/account-center')}>
                            <View style={styles.optionLeft}>
                                <Text style={styles.optionText}>Customize Account</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#8B98A5" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionItem}>
                            <View style={styles.optionLeft}>
                                <Text style={styles.optionText}>Notifications</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#8B98A5" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => router.push({ pathname: '/private-key', params: { showWarning: 'true' } } as any)}
                        >
                            <View style={styles.optionLeft}>
                                <Text style={styles.optionText}>Show Private Key</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#8B98A5" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => router.push({ pathname: '/recovery-phrase', params: { showWarning: 'true' } } as any)}
                        >
                            <View style={styles.optionLeft}>
                                <Text style={styles.optionText}>Show Recovery Phrase</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#8B98A5" />
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Remove Button */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.removeButton} onPress={handleRemoveWallet}>
                        <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121315',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    scrollContent: {
        alignItems: 'center',
        paddingTop: 32,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    emojiAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#ffda34',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        // Match the image's yellow circle background
    },
    emojiText: {
        fontSize: 50,
    },
    walletName: {
        color: '#ffda34',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 8,
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    addressText: {
        color: '#8B98A5',
        fontSize: 15,
        fontWeight: '500',
    },
    copyIcon: {
        marginLeft: 6,
    },
    content: {
        flex: 1,
    },
    optionsList: {
        width: '100%',
        paddingHorizontal: 20,
        gap: 12,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    footer: {
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 20 : 24,
    },
    removeButton: {
        width: '100%',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeButtonText: {
        color: '#EF4444',
        fontSize: 18,
        fontWeight: '700',
    },
})
