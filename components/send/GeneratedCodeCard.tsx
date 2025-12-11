import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'

interface GeneratedCodeCardProps {
    code: string
    tokenName: string
    onCopySuccess: () => void
    onEmailShare?: () => void
}

export default function GeneratedCodeCard({ code, tokenName, onCopySuccess, onEmailShare }: GeneratedCodeCardProps) {
    const handleCopyCode = async () => {
        await Clipboard.setStringAsync(code)
        onCopySuccess()
    }

    const handleCopyMessage = async () => {
        const shareMessage = `🎁 You received ${tokenName} tokens!\n\nClaim Code:\n${code}\n\nPaste this code in the claim form to receive your tokens!`
        await Clipboard.setStringAsync(shareMessage)
        onCopySuccess()
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.label}>CLAIM CODE</Text>
            </View>

            <View style={styles.codeContainer}>
                <Text style={styles.code}>{code}</Text>
            </View>

            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleCopyCode}
                    activeOpacity={0.7}
                >
                    <Ionicons name="copy-outline" size={22} color="#ffda34" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleCopyMessage}
                    activeOpacity={0.7}
                >
                    <Ionicons name="share-outline" size={22} color="#ffda34" />
                </TouchableOpacity>

                {/* Email share temporarily disabled */}
                {/* {onEmailShare && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={onEmailShare}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="mail-outline" size={22} color="#ffda34" />
                    </TouchableOpacity>
                )} */}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#222327',
    },
    header: {
        marginBottom: 16,
    },
    label: {
        color: '#ffda34',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    codeContainer: {
        backgroundColor: '#1a1d22',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
    },
    code: {
        color: 'white',
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
        letterSpacing: 2,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
    },
    actionButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#1a1d22',
        justifyContent: 'center',
        alignItems: 'center',
    },
})
