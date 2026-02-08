import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity, Platform, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

const { width } = Dimensions.get('window')

interface SweetAlertProps {
    visible: boolean
    type?: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    onConfirm: () => void
    onCancel?: () => void
    confirmText?: string
    cancelText?: string
    showCancel?: boolean
}

export const SweetAlert = ({
    visible,
    type = 'success',
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Got it',
    cancelText = 'Cancel',
    showCancel = false,
}: SweetAlertProps) => {
    const scaleAnim = useRef(new Animated.Value(0.8)).current
    const opacityAnim = useRef(new Animated.Value(0)).current

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 7,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start()
        } else {
            scaleAnim.setValue(0.8)
            opacityAnim.setValue(0)
        }
    }, [visible])

    const getIconInfo = () => {
        switch (type) {
            case 'success':
                return { name: 'checkmark-circle' as const, color: '#34C759' }
            case 'error':
                return { name: 'close-circle' as const, color: '#EF4444' }
            case 'warning':
                return { name: 'warning' as const, color: '#ffda34' }
            case 'info':
                return { name: 'information-circle' as const, color: '#ffda34' }
            default:
                return { name: 'checkmark-circle' as const, color: '#34C759' }
        }
    }

    const { name: iconName, color: iconColor } = getIconInfo()

    if (!visible) return null

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onCancel || onConfirm}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.container,
                        {
                            opacity: opacityAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <View style={styles.content}>
                        <View style={[styles.iconWrapper, { backgroundColor: `${iconColor}15` }]}>
                            <Ionicons name={iconName} size={50} color={iconColor} />
                        </View>

                        <Text style={styles.title}>{title}</Text>
                        {message && <Text style={styles.message}>{message}</Text>}

                        <View style={styles.buttonContainer}>
                            {showCancel && (
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={onCancel}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.button, styles.confirmButton]}
                                onPress={onConfirm}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#ffda34', '#ffd000']}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                                <Text style={styles.confirmButtonText}>{confirmText}</Text>
                            </TouchableOpacity>
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
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: Math.min(width * 0.85, 340),
        backgroundColor: '#1A1F28',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    content: {
        padding: 24,
        alignItems: 'center',
    },
    iconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        color: 'white',
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 10,
    },
    message: {
        color: '#8B98A5',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    confirmButton: {
        backgroundColor: '#ffda34',
    },
    cancelButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    confirmButtonText: {
        color: '#121315',
        fontSize: 16,
        fontWeight: '700',
    },
    cancelButtonText: {
        color: '#8B98A5',
        fontSize: 16,
        fontWeight: '600',
    },
})
