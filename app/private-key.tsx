import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, StatusBar, ScrollView, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWallet } from '../context/WalletContext'
import { useSecurity } from '../context/SecurityContext'
import * as Clipboard from 'expo-clipboard'
import * as LocalAuthentication from 'expo-local-authentication'

export default function PrivateKeyScreen() {
    const router = useRouter()
    const { exportPrivateKey } = useWallet()
    const insets = useSafeAreaInsets()
    const { isBiometricEnabled } = useSecurity()
    const [privateKey, setPrivateKey] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        authenticateAndLoad()
    }, [])

    const authenticateAndLoad = async () => {
        if (!isBiometricEnabled) {
            Alert.alert(
                'Security Required',
                'Please enable Biometric Lock in Settings to view your Private Key.',
                [{ text: 'OK', onPress: () => router.back() }]
            )
            return
        }

        const hasHardware = await LocalAuthentication.hasHardwareAsync()
        const isEnrolled = await LocalAuthentication.isEnrolledAsync()

        if (hasHardware && isEnrolled) {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to view Private Key',
                fallbackLabel: 'Cancel',
            })

            if (!result.success) {
                router.back()
                return
            }
        }

        loadPrivateKey()
    }

    const loadPrivateKey = async () => {
        try {
            const key = await exportPrivateKey()
            if (key) {
                // Strip the ed25519-priv- prefix if present
                const cleanKey = key.replace('ed25519-priv-', '')
                setPrivateKey(cleanKey)
            } else {
                Alert.alert('Error', 'Could not retrieve private key.')
            }
        } catch (error) {
            console.error('Failed to load private key:', error)
            Alert.alert('Error', 'Failed to load private key.')
        } finally {
            setIsLoading(false)
        }
    }

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(privateKey)
        Alert.alert('Copied', 'Private key copied to clipboard.')
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#ffffff" />
                </Pressable>
                <Text style={styles.headerTitle}>Private Key</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoSection}>
                    <Text style={styles.subtitle}>
                        Your private key grants full access to your wallet account.
                    </Text>
                </View>

                {isLoading ? (
                    <Text style={styles.loadingText}>Loading...</Text>
                ) : (
                    <View style={styles.keyContainer}>
                        <Pressable
                            style={styles.blurContainer}
                            onPress={() => setIsVisible(!isVisible)}
                        >
                            <Text style={[styles.keyText, !isVisible && styles.blurredText]}>
                                {isVisible ? privateKey : '•'.repeat(privateKey.length || 64)}
                            </Text>
                            {!isVisible && (
                                <View style={styles.tapToReveal}>
                                    <Ionicons name="eye-outline" size={24} color="#ffda34" />
                                    <Text style={styles.tapToRevealText}>Tap to reveal</Text>
                                </View>
                            )}
                        </Pressable>
                    </View>
                )}

                <View style={styles.warningCard}>
                    <Ionicons name="warning-outline" size={24} color="#FFD60A" />
                    <Text style={styles.warningText}>
                        Never share your private key. Anyone with this key can steal all your funds.
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
    keyContainer: {
        backgroundColor: '#1E2022',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: 32,
        overflow: 'hidden',
    },
    blurContainer: {
        padding: 20,
        minHeight: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyText: {
        fontSize: 15,
        color: '#ffffff',
        lineHeight: 24,
        textAlign: 'center',
        fontFamily: 'monospace',
    },
    blurredText: {
        color: '#4A4D51',
        letterSpacing: 2,
    },
    tapToReveal: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    tapToRevealText: {
        color: '#ffda34',
        fontSize: 14,
        fontWeight: '600',
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
