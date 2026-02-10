import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'

interface AlertModalProps {
    visible: boolean
    type?: 'success' | 'error' | 'info'
    title: string
    message: string
    details?: string[]
    onClose: () => void
    buttonText?: string
}

export default function AlertModal({
    visible,
    type = 'success',
    title,
    message,
    details,
    onClose,
    buttonText = 'OK',
}: AlertModalProps) {
    const slideAnim = useRef(new Animated.Value(-200)).current
    const [copied, setCopied] = useState(false)

    // Extract claim code from details
    const claimCode = details?.find((d) => d.startsWith('Claim Code:'))?.replace('Claim Code: ', '')

    const handleCopy = async () => {
        if (claimCode) {
            await Clipboard.setStringAsync(claimCode)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }).start()
            setCopied(false)
        } else {
            slideAnim.setValue(-200)
        }
    }, [visible, slideAnim])

    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                onClose()
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [visible, onClose])

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.content,
                        {
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <View style={styles.row}>
                        <Ionicons
                            name={type === 'success' ? 'checkmark-circle' : type === 'error' ? 'close-circle' : 'information-circle'}
                            size={28}
                            color={type === 'success' ? '#34C759' : type === 'error' ? '#EF4444' : '#ffda34'}
                        />
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>{title}</Text>
                            {claimCode && (
                                <View style={styles.codeContainer}>
                                    <Text style={styles.codeText}>{claimCode}</Text>
                                    <TouchableOpacity
                                        style={styles.copyButton}
                                        onPress={handleCopy}
                                        activeOpacity={0.7}
                                    >
                                        {copied ? (
                                            <Text style={styles.copiedText}>Copied</Text>
                                        ) : (
                                            <Ionicons name="copy-outline" size={14} color="#ffda34" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        alignItems: 'center',
    },
    content: {
        backgroundColor: '#121315',
        minWidth: 300,
        maxWidth: '92%',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        marginTop: Platform.OS === 'ios' ? 50 : 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: 'white',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    message: {
        color: '#8B98A5',
        fontSize: 13,
        marginTop: 4,
        lineHeight: 18,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(255, 218, 52, 0.08)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 218, 52, 0.15)',
    },
    codeText: {
        color: '#ffda34',
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontWeight: '600',
        flex: 1,
    },
    copyButton: {
        padding: 6,
    },
    copiedText: {
        color: '#34C759',
        fontSize: 11,
        fontWeight: '700',
    },
})

