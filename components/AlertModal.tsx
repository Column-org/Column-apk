import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity } from 'react-native'
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
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
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
                            size={32}
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
            </TouchableOpacity>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    content: {
        backgroundColor: '#1A1F28',
        minWidth: 280,
        maxWidth: '90%',
        minHeight: 70,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignSelf: 'center',
        marginTop: 60,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    message: {
        color: '#8B98A5',
        fontSize: 11,
        marginTop: 2,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 6,
    },
    codeText: {
        color: 'white',
        fontSize: 11,
        fontFamily: 'monospace',
        flex: 1,
    },
    copyButton: {
        padding: 4,
    },
    copiedText: {
        color: '#34C759',
        fontSize: 10,
        fontWeight: '600',
    },
})

