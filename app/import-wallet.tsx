import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, StatusBar, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWallet } from '../context/WalletContext'

export default function ImportWalletScreen() {
    const router = useRouter()
    const { type } = useLocalSearchParams<{ type: 'privateKey' | 'seedPhrase' }>()
    const { importFromPrivateKey, importFromSeedphrase } = useWallet()
    const insets = useSafeAreaInsets()
    const [value, setValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleImport = async () => {
        if (!value.trim()) {
            Alert.alert('Error', `Please enter your ${type === 'privateKey' ? 'private key' : 'seed phrase'}.`)
            return
        }

        setIsLoading(true)
        // Give UI thread a chance to render the loader
        await new Promise(resolve => setTimeout(resolve, 50))

        try {
            if (type === 'privateKey') {
                await importFromPrivateKey(value.trim())
            } else {
                await importFromSeedphrase(value.trim())
            }
            router.replace('/(tabs)/home')
        } catch (error: any) {
            Alert.alert('Import Failed', error.message || 'Please check your inputs and try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#ffffff" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Import Wallet</Text>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.infoSection}>
                        <Text style={styles.title}>
                            {type === 'privateKey' ? 'Enter Private Key' : 'Enter Seed Phrase'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {type === 'privateKey'
                                ? 'Typically a 64-character hexadecimal string starting with 0x.'
                                : 'Enter your 12 or 24 words separated by spaces.'}
                        </Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder={type === 'privateKey' ? '0x...' : 'word1 word2 word3...'}
                            placeholderTextColor="#4A4D51"
                            multiline
                            numberOfLines={4}
                            value={value}
                            onChangeText={setValue}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.warningCard}>
                        <Ionicons name="lock-closed-outline" size={20} color="#8B98A5" />
                        <Text style={styles.warningText}>
                            Your keys are encrypted and stored locally on your device. We never have access to them.
                        </Text>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <Pressable
                        style={[styles.importButton, isLoading && styles.buttonDisabled]}
                        onPress={handleImport}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#121315" />
                        ) : (
                            <Text style={styles.importButtonText}>Import Wallet</Text>
                        )}
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
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
        paddingTop: 24,
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
    inputContainer: {
        backgroundColor: '#1E2022',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: 24,
    },
    input: {
        color: '#ffffff',
        fontSize: 16,
        minHeight: 120,
        textAlignVertical: 'top',
    },
    warningCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 4,
    },
    warningText: {
        flex: 1,
        color: '#64748B',
        fontSize: 13,
        lineHeight: 18,
    },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    importButton: {
        backgroundColor: '#ffda34',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    importButtonText: {
        color: '#121315',
        fontSize: 17,
        fontWeight: '700',
    },
})
