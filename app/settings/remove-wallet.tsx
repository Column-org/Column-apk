import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import AuthenticationModal from '../../components/security/AuthenticationModal'
import { useSecurity } from '../../context/SecurityContext'
import { useWallet } from '../../context/WalletContext'

export default function RemoveWalletScreen() {
    const router = useRouter()
    const { isBiometricEnabled, isPasscodeSet } = useSecurity()
    const { deleteWeb3Wallet, address, allWallets } = useWallet()
    const [showAuthModal, setShowAuthModal] = useState(false)

    const onConfirmRemove = () => {
        if (isPasscodeSet || isBiometricEnabled) {
            setShowAuthModal(true)
        } else {
            removeWallet()
        }
    }

    const removeWallet = async () => {
        try {
            if (address) {
                const hasMultipleWallets = allWallets.length > 1;
                await deleteWeb3Wallet(address)

                router.dismissAll()
                if (hasMultipleWallets) {
                    router.replace('/(tabs)/settings')
                } else {
                    router.replace('/')
                }
            }
        } catch (error) {
            console.error("Failed to remove wallet:", error)
        }
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="close" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Remove Wallet</Text>
                    <View style={{ width: 42 }} />
                </View>

                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="warning" size={48} color="#EF4444" />
                    </View>

                    <Text style={styles.title}>Are you sure?</Text>
                    <Text style={styles.message}>
                        You are about to remove this wallet from your device. Everything associated with this wallet will be logically erased from local storage.
                    </Text>
                    <View style={styles.warningBox}>
                        <Ionicons name="alert-circle" size={24} color="#ffda34" />
                        <Text style={styles.warningText}>
                            Make sure you have backed up your Recovery Phrase. If you haven't, you will lose access to your funds forever.
                        </Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} activeOpacity={0.7}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removeButton} onPress={onConfirmRemove} activeOpacity={0.7}>
                        <Text style={styles.removeButtonText}>Yes, Remove Wallet</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <AuthenticationModal
                visible={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={() => {
                    setShowAuthModal(false)
                    removeWallet()
                }}
                title="Remove Wallet"
                subtitle="Enter passcode or use biometric to confirm removal"
            />
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
        justifyContent: 'space-between',
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
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    title: {
        color: 'white',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 16,
        textAlign: 'center',
    },
    message: {
        color: '#8B98A5',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 218, 52, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 218, 52, 0.2)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'flex-start',
        gap: 12,
    },
    warningText: {
        color: '#ffda34',
        fontSize: 14,
        lineHeight: 22,
        flex: 1,
        fontWeight: '500',
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        gap: 12,
    },
    removeButton: {
        width: '100%',
        backgroundColor: '#EF4444',
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    cancelButton: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
})
