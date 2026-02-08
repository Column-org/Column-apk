import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, StatusBar, ScrollView, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWallet } from '../context/WalletContext'
import { useSecurity } from '../context/SecurityContext'
import * as Clipboard from 'expo-clipboard'
import * as LocalAuthentication from 'expo-local-authentication'

import { SecurityWarning } from '../components/SecurityWarning'

export default function RecoveryPhraseScreen() {
    const router = useRouter()
    const { exportSeedphrase } = useWallet()
    const insets = useSafeAreaInsets()
    const { isBiometricEnabled } = useSecurity()
    const [mnemonic, setMnemonic] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showWarning, setShowWarning] = useState(true)

    const handleConfirmWarning = async () => {
        setShowWarning(false)
        authenticateAndLoad()
    }

    const authenticateAndLoad = async () => {
        if (!isBiometricEnabled) {
            Alert.alert(
                'Security Required',
                'Please enable Biometric Lock in Settings to view your Recovery Phrase.',
                [{ text: 'OK', onPress: () => router.back() }]
            )
            return
        }

        const hasHardware = await LocalAuthentication.hasHardwareAsync()
        const isEnrolled = await LocalAuthentication.isEnrolledAsync()

        if (hasHardware && isEnrolled) {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to view Recovery Phrase',
                fallbackLabel: 'Cancel',
            })

            if (!result.success) {
                router.back()
                return
            }
        }

        loadSeedphrase()
    }

    const loadSeedphrase = async () => {
        try {
            const phrase = await exportSeedphrase()
            if (phrase) {
                setMnemonic(phrase.split(' '))
            } else {
                Alert.alert('Error', 'Could not retrieve recovery phrase.')
            }
        } catch (error) {
            console.error('Failed to load seed phrase:', error)
            Alert.alert('Error', 'Failed to load recovery phrase.')
        } finally {
            setIsLoading(false)
        }
    }

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(mnemonic.join(' '))
        Alert.alert('Copied', 'Recovery phrase copied to clipboard.')
    }

    if (showWarning) {
        return (
            <SecurityWarning
                title="Recovery Phrase"
                buttonText="Show Recovery Phrase"
                onConfirm={handleConfirmWarning}
            />
        )
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#ffffff" />
                </Pressable>
                <Text style={styles.headerTitle}>Recovery Phrase</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoSection}>
                    <Text style={styles.subtitle}>
                        Your recovery phrase is the only way to restore your wallet. Keep it formatting-safe.
                    </Text>
                </View>

                <View style={styles.mnemonicContainer}>
                    {(mnemonic.length > 0 ? mnemonic : Array(12).fill('••••••')).map((word, index) => (
                        <View key={index} style={styles.wordBadge}>
                            <Text style={styles.wordIndex}>{index + 1}</Text>
                            <Text style={styles.wordText}>{word}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.warningCard}>
                    <Ionicons name="warning-outline" size={24} color="#FFD60A" />
                    <Text style={styles.warningText}>
                        Never share your recovery phrase. Anyone with these words can steal all your funds.
                    </Text>
                </View>

                <Pressable style={styles.copyButton} onPress={copyToClipboard}>
                    <Ionicons name="copy-outline" size={20} color="#121315" />
                    <Text style={styles.copyButtonText}>Copy to Clipboard</Text>
                </Pressable>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121315',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#ffffff',
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 40,
    },
    infoSection: {
        marginBottom: 32,
    },
    subtitle: {
        fontSize: 15,
        color: '#8B98A5',
        lineHeight: 22,
    },
    mnemonicContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
        marginBottom: 32,
    },
    wordBadge: {
        backgroundColor: '#1E2022',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: '30%',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    wordIndex: {
        fontSize: 12,
        color: '#4A4D51',
        marginRight: 8,
        fontWeight: '600',
    },
    wordText: {
        fontSize: 15,
        color: '#ffffff',
        fontWeight: '500',
    },
    warningCard: {
        backgroundColor: 'rgba(255, 214, 10, 0.1)',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 214, 10, 0.2)',
    },
    warningText: {
        flex: 1,
        color: '#FFD60A',
        fontSize: 13,
        lineHeight: 18,
    },
    copyButton: {
        backgroundColor: '#ffda34',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
    },
    copyButtonText: {
        color: '#121315',
        fontSize: 16,
        fontWeight: '700',
    },
    loadingText: {
        color: '#8B98A5',
        textAlign: 'center',
        marginTop: 20,
    },
})
