import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { usePrivy } from '@privy-io/expo'
import os from 'os'

interface SendCodeViaEmailProps {
    code: string
    tokenName: string
    tokenSymbol: string
    amount: string
}

// Get local IP address
function getLocalIPAddress() {
    const interfaces = os.networkInterfaces()
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address
            }
        }
    }
    return 'localhost'
}

export default function SendCodeViaEmail({ code, tokenName, tokenSymbol, amount }: SendCodeViaEmailProps) {
    const { user } = usePrivy()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    const localIP = getLocalIPAddress()
    const backendUrl = `http://${localIP}:3000/api`

    const handleSendEmail = async () => {
        // Validate email
        if (!email || !email.includes('@')) {
            Alert.alert('Invalid Email', 'Please enter a valid email address')
            return
        }

        setLoading(true)
        setStatus(null)

        try {
            const response = await fetch(`${backendUrl}/send-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: email.trim(),
                    code: code,
                    senderName: (user as any)?.email || 'A friend',
                    subject: `Your ${tokenName} Transfer Code`,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send email')
            }

            setStatus({
                type: 'success',
                message: `Code sent to ${email}!`,
            })

            // Clear email after success
            setTimeout(() => {
                setEmail('')
                setStatus(null)
            }, 3000)
        } catch (error: any) {
            console.error('Error sending email:', error)
            setStatus({
                type: 'error',
                message: error.message || 'Failed to send email. Please try again.',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="mail-outline" size={20} color="#ffda34" />
                <Text style={styles.headerText}>Send Code via Email</Text>
            </View>

            <Text style={styles.description}>
                Send {amount} {tokenSymbol} transfer code to a friend's email
            </Text>

            <View style={styles.inputContainer}>
                <Ionicons name="mail" size={18} color="#8B98A5" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="friend@example.com"
                    placeholderTextColor="#8B98A5"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                />
            </View>

            {status && (
                <View
                    style={[
                        styles.statusContainer,
                        status.type === 'success' ? styles.successContainer : styles.errorContainer,
                    ]}
                >
                    <Ionicons
                        name={status.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                        size={16}
                        color={status.type === 'success' ? '#10B981' : '#EF4444'}
                    />
                    <Text
                        style={[styles.statusText, status.type === 'success' ? styles.successText : styles.errorText]}
                    >
                        {status.message}
                    </Text>
                </View>
            )}

            <TouchableOpacity
                style={[styles.sendButton, (loading || !email) && styles.sendButtonDisabled]}
                onPress={handleSendEmail}
                disabled={loading || !email}
                activeOpacity={0.7}
            >
                {loading ? (
                    <ActivityIndicator color="#121315" />
                ) : (
                    <>
                        <Ionicons name="send" size={18} color="#121315" />
                        <Text style={styles.sendButtonText}>Send Email</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#222327',
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    headerText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffda34',
    },
    description: {
        fontSize: 13,
        color: '#8B98A5',
        marginBottom: 14,
        lineHeight: 18,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1d22',
        borderRadius: 10,
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        paddingVertical: 12,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
        gap: 6,
    },
    successContainer: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 1,
        borderColor: '#10B981',
    },
    errorContainer: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    statusText: {
        flex: 1,
        fontSize: 12,
    },
    successText: {
        color: '#10B981',
    },
    errorText: {
        color: '#EF4444',
    },
    sendButton: {
        backgroundColor: '#ffda34',
        borderRadius: 10,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonText: {
        color: '#121315',
        fontSize: 14,
        fontWeight: '600',
    },
})
