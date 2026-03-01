import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    StatusBar,
    Platform,
    ImageBackground,
    KeyboardAvoidingView,
    Dimensions
} from 'react-native'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useWallet } from '../../context/WalletContext'
import { useTheme } from '../../hooks/useTheme'

const EMOJIS = ['💰', '🚀', '🌟', '💎', '🦊', '🐻', '🐼', '🐱', '🐶', '🦄']

export default function EditWallet() {
    const { updateWallet, allWallets } = useWallet()
    const { getThemeImage } = useTheme()
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const params = useLocalSearchParams<{ address: string, name: string, emoji: string }>()

    const [editName, setEditName] = useState(params.name || '')
    const [editEmoji, setEditEmoji] = useState(params.emoji || '💰')
    const [isSaving, setIsSaving] = useState(false)

    // Ensure we have current data if it changed
    useEffect(() => {
        const wallet = allWallets.find(w => w.address === params.address)
        if (wallet) {
            setEditName(wallet.name)
            setEditEmoji(wallet.emoji || '💰')
        }
    }, [allWallets, params.address])

    const handleSave = async () => {
        if (!params.address || isSaving) return

        setIsSaving(true)
        try {
            await updateWallet(params.address, {
                name: editName,
                emoji: editEmoji
            })
            router.back()
        } catch (error) {
            console.error('Failed to save wallet changes:', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            {getThemeImage() && (
                <ImageBackground
                    source={getThemeImage()}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                />
            )}

            <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Wallet</Text>
                    <View style={{ width: 44 }} />
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.section}>
                        <Text style={styles.label}>Wallet Name</Text>
                        <TextInput
                            style={styles.input}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Enter wallet name"
                            placeholderTextColor="#8B98A5"
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Wallet Icon</Text>
                        <View style={styles.emojiGrid}>
                            {EMOJIS.map(emoji => (
                                <TouchableOpacity
                                    key={emoji}
                                    style={[styles.emojiItem, editEmoji === emoji && styles.selectedEmoji]}
                                    onPress={() => setEditEmoji(emoji)}
                                >
                                    <Text style={styles.emojiLarge}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                    <TouchableOpacity
                        style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        <Text style={styles.saveButtonText}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Text>
                    </TouchableOpacity>
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
    backgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.2,
    },
    headerWrapper: {
        zIndex: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        height: 56,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: 'bold',
        letterSpacing: -0.3,
    },
    headerSaveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 218, 52, 0.15)',
        marginRight: 8,
    },
    headerSaveText: {
        color: '#ffda34',
        fontSize: 15,
        fontWeight: '700',
    },
    scrollContent: {
        padding: 24,
    },
    section: {
        marginBottom: 32,
    },
    label: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        marginLeft: 4,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 18,
        color: 'white',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    emojiItem: {
        width: 60,
        height: 60,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedEmoji: {
        borderColor: '#ffda34',
        backgroundColor: 'rgba(255, 218, 52, 0.1)',
    },
    emojiLarge: {
        fontSize: 32,
    },
    footer: {
        padding: 24,
    },
    saveButton: {
        backgroundColor: '#ffda34',
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#000000',
        fontSize: 18,
        fontWeight: '700',
    },
})
