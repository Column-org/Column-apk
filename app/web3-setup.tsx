import React from 'react'
import { View, Text, StyleSheet, Pressable, StatusBar, ScrollView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function Web3SetupScreen() {
    const router = useRouter()
    const insets = useSafeAreaInsets()

    const handleCreateNew = () => {
        router.push('/create-wallet')
    }

    const handleImportPrivateKey = () => {
        router.push({
            pathname: '/import-wallet',
            params: { type: 'privateKey' }
        })
    }

    const handleImportSeedPhrase = () => {
        router.push({
            pathname: '/import-wallet',
            params: { type: 'seedPhrase' }
        })
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <View style={styles.header}>
                <Pressable onPress={() => router.replace('/wallet-setup')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#ffffff" />
                </Pressable>
                <Text style={styles.headerTitle}>Wallet Setup</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoSection}>
                    <Text style={styles.title}>Secure Your Assets</Text>
                    <Text style={styles.subtitle}>
                        You are in full control of your wallet. Your keys are stored locally on your device.
                    </Text>
                </View>

                <View style={styles.optionsContainer}>
                    <Pressable style={styles.optionCard} onPress={handleCreateNew}>
                        <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                            <Ionicons name="add-circle-outline" size={28} color="#4CAF50" />
                        </View>
                        <View style={styles.optionTextContent}>
                            <Text style={styles.optionTitle}>Create New Wallet</Text>
                            <Text style={styles.optionDescription}>
                                Generate a new wallet and save your 12-word recovery phrase.
                            </Text>
                        </View>
                    </Pressable>

                    <View style={styles.divider}>
                        <Text style={styles.dividerText}>Or import existing</Text>
                    </View>

                    <Pressable style={styles.optionCard} onPress={handleImportPrivateKey}>
                        <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                            <Ionicons name="key-outline" size={28} color="#FF9800" />
                        </View>
                        <View style={styles.optionTextContent}>
                            <Text style={styles.optionTitle}>Import Private Key</Text>
                            <Text style={styles.optionDescription}>
                                Paste your existing private key (0x...) to restore your wallet.
                            </Text>
                        </View>
                    </Pressable>

                    <Pressable style={styles.optionCard} onPress={handleImportSeedPhrase}>
                        <View style={[styles.iconContainer, { backgroundColor: '#E1F5FE' }]}>
                            <Ionicons name="document-text-outline" size={28} color="#03A9F4" />
                        </View>
                        <View style={styles.optionTextContent}>
                            <Text style={styles.optionTitle}>Import Seed Phrase</Text>
                            <Text style={styles.optionDescription}>
                                Enter your 12 or 24 word recovery phrase to restore your wallet.
                            </Text>
                        </View>
                    </Pressable>
                </View>
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
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 60,
        paddingBottom: 16,
        backgroundColor: '#121315',
    },
    backButton: {
        padding: 8,
        marginRight: 12,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#ffffff',
        flex: 1,
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 24,
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
    optionsContainer: {
        gap: 16,
    },
    optionCard: {
        backgroundColor: '#1E2022',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionTextContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 4,
    },
    optionDescription: {
        fontSize: 13,
        color: '#8B98A5',
        lineHeight: 18,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
    },
    dividerText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4A4D51',
        letterSpacing: 1.2,
    },
})
