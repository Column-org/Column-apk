import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Vibration, StatusBar, Modal, Platform, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSecurity } from '../../context/SecurityContext'

const { width, height } = Dimensions.get('window')

interface AuthenticationModalProps {
    visible: boolean
    onSuccess: () => void
    onClose: () => void
    title?: string
    subtitle?: string
}

export default function AuthenticationModal({
    visible,
    onSuccess,
    onClose,
    title = 'Verify Identity',
    subtitle = 'Enter passcode or use biometric'
}: AuthenticationModalProps) {
    const { verifyPasscode, authenticateWithBiometric, isBiometricEnabled, isPasscodeSet } = useSecurity()
    const [passcode, setPasscode] = useState('')
    const [error, setError] = useState('')
    const [attempts, setAttempts] = useState(0)
    const [isAuthenticating, setIsAuthenticating] = useState(false)
    const hasTriggeredInitialAuth = useRef(false)
    const insets = useSafeAreaInsets()

    useEffect(() => {
        if (visible) {
            setPasscode('')
            setError('')
            setAttempts(0)
            hasTriggeredInitialAuth.current = false
        }
    }, [visible])



    const handleBiometric = async () => {
        if (isAuthenticating || !isBiometricEnabled) return

        setIsAuthenticating(true)
        try {
            const success = await authenticateWithBiometric()
            if (success) {
                onSuccess()
            }
        } finally {
            setIsAuthenticating(false)
        }
    }

    const handleNumberPress = async (num: string) => {
        if (passcode.length >= 6) return

        const newPasscode = passcode + num
        setPasscode(newPasscode)
        setError('')

        if (newPasscode.length === 6) {
            if (isPasscodeSet) {
                const isValid = await verifyPasscode(newPasscode)
                if (isValid) {
                    onSuccess()
                } else {
                    Vibration.vibrate(200)
                    setError('Incorrect passcode')
                    setAttempts((prev) => prev + 1)
                    setTimeout(() => setPasscode(''), 300)
                }
            } else {
                // Should not happen if passcode is not set, but just in case
                setError('Passcode not set')
                setTimeout(() => setPasscode(''), 300)
            }
        }
    }

    const handleDelete = () => {
        setPasscode((prev) => prev.slice(0, -1))
        setError('')
    }

    const renderDots = () => {
        return (
            <View style={styles.dotsContainer}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <View key={i} style={[styles.dot, i < passcode.length && styles.dotFilled]} />
                ))}
            </View>
        )
    }

    const renderNumberPad = () => {
        const numbers = [
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['biometric', '0', 'delete'],
        ]

        return (
            <View style={[styles.numberPad, { paddingBottom: Math.max(insets.bottom, 40) }]}>
                {numbers.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.numberRow}>
                        {row.map((item) => {
                            if (item === 'biometric') {
                                return (
                                    <TouchableOpacity
                                        key={item}
                                        style={[styles.numberButton, !isBiometricEnabled && { opacity: 0 }]}
                                        onPress={isBiometricEnabled ? handleBiometric : undefined}
                                        disabled={!isBiometricEnabled}
                                        activeOpacity={isBiometricEnabled ? 0.7 : 1}
                                    >
                                        {isBiometricEnabled && <Ionicons name="finger-print" size={28} color="#ffda34" />}
                                    </TouchableOpacity>
                                )
                            }
                            if (item === 'delete') {
                                return (
                                    <TouchableOpacity
                                        key={item}
                                        style={styles.numberButton}
                                        onPress={handleDelete}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="backspace-outline" size={28} color="white" />
                                    </TouchableOpacity>
                                )
                            }
                            return (
                                <TouchableOpacity
                                    key={item}
                                    style={styles.numberButton}
                                    onPress={() => handleNumberPress(item)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.numberText}>{item}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                ))}
            </View>
        )
    }

    const renderContent = () => {
        // If only biometric is enabled (no passcode), and passcode is somehow not set (should not happen if they had to set passcode first, but just in case)
        if (isBiometricEnabled && !isPasscodeSet) {
            return (
                <View style={styles.content}>
                    <View style={styles.biometricContent}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="finger-print" size={64} color="#ffda34" />
                        </View>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.subtitle}>Use biometric authentication to verify</Text>
                        <TouchableOpacity
                            style={styles.biometricButton}
                            onPress={handleBiometric}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="finger-print" size={32} color="#121315" />
                            <Text style={styles.biometricButtonText}>Authenticate</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )
        }

        return (
            <>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="lock-closed" size={48} color="#ffda34" />
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>

                    {renderDots()}

                    {error ? <Text style={styles.errorText}>{error}</Text> : <View style={styles.errorPlaceholder} />}

                    {attempts >= 3 && (
                        <Text style={styles.warningText}>Too many incorrect attempts. Please try again carefully.</Text>
                    )}
                </View>
                {renderNumberPad()}
            </>
        )
    }

    if (!visible) return null;

    if (Platform.OS === 'android') {
        return (
            <View style={[styles.androidAbsoluteModal, { top: -insets.top, bottom: -insets.bottom }]}>
                <View style={[styles.container, { paddingBottom: insets.bottom }]}>
                    <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                        <View style={{ width: 28 }} />
                    </View>
                    {renderContent()}
                </View>
            </View>
        )
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <StatusBar barStyle="light-content" translucent={true} />
                <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color="white" />
                    </TouchableOpacity>
                    <View style={{ width: 28 }} />
                </View>
                {renderContent()}
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121315',
        justifyContent: 'space-between',
    },
    androidAbsoluteModal: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: '#121315',
        zIndex: 99999,
        elevation: 99999,
    },
    header: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    closeButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 195, 13, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        color: 'white',
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        color: '#8B98A5',
        fontSize: 14,
        marginBottom: 32,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 24,
    },
    dot: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#8B98A5',
    },
    dotFilled: {
        backgroundColor: '#ffda34',
        borderColor: '#ffda34',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 14,
        height: 20,
    },
    errorPlaceholder: {
        height: 20,
    },
    warningText: {
        color: '#FF9500',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 8,
    },
    numberPad: {
        paddingHorizontal: 40,
        paddingBottom: 40,
    },
    numberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    numberButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    numberText: {
        color: 'white',
        fontSize: 28,
        fontWeight: '600',
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#ffda34',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginTop: 40,
    },
    biometricButtonText: {
        color: '#121315',
        fontSize: 18,
        fontWeight: '700',
    },
    biometricContent: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    }
})
