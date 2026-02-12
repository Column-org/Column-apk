import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, StatusBar, ScrollView, Alert, Share, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWallet } from '../context/WalletContext'
import * as Clipboard from 'expo-clipboard'

export default function CreateWalletScreen() {
    const router = useRouter()
    const { createWeb3Wallet } = useWallet()
    const insets = useSafeAreaInsets()
    const [mnemonic, setMnemonic] = useState<string[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [hasConfirmed, setHasConfirmed] = useState(false)

    const generateWallet = async () => {
        setIsGenerating(true)
        try {
            const result = await createWeb3Wallet()
            setMnemonic(result.mnemonic.split(' '))
        } catch (error) {
            Alert.alert('Error', 'Failed to generate wallet. Please try again.')
        } finally {
            setIsGenerating(false)
        }
    }

    useEffect(() => {
        generateWallet()
    }, [])

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(mnemonic.join(' '))
        Alert.alert('Copied', 'Seed phrase copied to clipboard.')
    }

    const handleContinue = () => {
        if (!hasConfirmed) {
            Alert.alert('Wait!', 'Please confirm that you have saved your recovery phrase.')
            return
        }
        router.replace('/(tabs)/home')
    }

    const handleShare = async () => {
        try {
            await Share.share({
                message: mnemonic.join(' '),
            })
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#ffffff" />
                </Pressable>
                <Text style={styles.headerTitle}>New Wallet</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoSection}>
                    <Text style={styles.title}>Your Recovery Phrase</Text>
                    <Text style={styles.subtitle}>
                        Write down or copy these 12 words in the right order and save them somewhere safe.
                    </Text>
                </View>

                <View style={styles.mnemonicContainer}>
                    {isGenerating ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color="#ffda34" />
                            <Text style={styles.loaderText}>Generating your secure keys...</Text>
                        </View>
                    ) : (
                        mnemonic.map((word, index) => (
                            <View key={index} style={styles.wordBadge}>
                                <Text style={styles.wordIndex}>{index + 1}</Text>
                                <Text style={styles.wordText}>{word}</Text>
                            </View>
                        ))
                    )}
                </View>

                <View style={styles.actionsRow}>
                    <Pressable style={styles.actionButton} onPress={copyToClipboard}>
                        <Ionicons name="copy-outline" size={20} color="#ffda34" />
                        <Text style={styles.actionButtonText}>Copy</Text>
                    </Pressable>
                    <Pressable style={styles.actionButton} onPress={handleShare}>
                        <Ionicons name="share-outline" size={20} color="#ffda34" />
                        <Text style={styles.actionButtonText}>Share</Text>
                    </Pressable>
                </View>

                <View style={styles.warningCard}>
                    <Ionicons name="warning-outline" size={24} color="#FFD60A" />
                    <Text style={styles.warningText}>
                        Never share your recovery phrase. Anyone with these words can steal all your funds.
                    </Text>
                </View>

                <Pressable
                    style={styles.checkboxContainer}
                    onPress={() => setHasConfirmed(!hasConfirmed)}
                >
                    <View style={[styles.checkbox, hasConfirmed && styles.checkboxActive]}>
                        {hasConfirmed && <Ionicons name="checkmark" size={16} color="#121315" />}
                    </View>
                    <Text style={styles.checkboxLabel}>I have saved my recovery phrase securely</Text>
                </Pressable>
            </ScrollView>

            <View style={styles.footer}>
                <Pressable
                    style={[styles.continueButton, !hasConfirmed && styles.buttonDisabled]}
                    onPress={handleContinue}
                    disabled={!hasConfirmed}
                >
                    <Text style={styles.continueButtonText}>Continue</Text>
                </Pressable>
            </View>
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
        paddingTop: 12,
        paddingBottom: 40,
    },
    infoSection: {
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 12,
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
        marginBottom: 24,
        minHeight: 180,
    },
    loaderContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    loaderText: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '500',
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
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 32,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 10,
    },
    actionButtonText: {
        color: '#ffda34',
        fontSize: 15,
        fontWeight: '600',
    },
    warningCard: {
        backgroundColor: 'rgba(255, 214, 10, 0.1)',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 214, 10, 0.2)',
    },
    warningText: {
        flex: 1,
        color: '#FFD60A',
        fontSize: 13,
        lineHeight: 18,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#4A4D51',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: '#ffda34',
        borderColor: '#ffda34',
    },
    checkboxLabel: {
        flex: 1,
        color: '#ffffff',
        fontSize: 14,
    },
    footer: {
        padding: 24,
        backgroundColor: '#121315',
    },
    continueButton: {
        backgroundColor: '#ffda34',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#4A4D51',
        opacity: 0.5,
    },
    continueButtonText: {
        color: '#121315',
        fontSize: 17,
        fontWeight: '700',
    },
})
