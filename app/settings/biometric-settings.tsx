import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, StatusBar, Image, Alert, ActivityIndicator, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useSecurity } from '../../context/SecurityContext'
import { Ionicons } from '@expo/vector-icons'
import AuthenticationModal from '../../components/security/AuthenticationModal'

export default function BiometricSettingsScreen() {
    const router = useRouter()
    const { enableBiometric, disableBiometric, disableSecurity, isBiometricAvailable, isBiometricEnabled, isPasscodeSet } = useSecurity()
    const [isLoading, setIsLoading] = useState(false)
    const [showAuthModal, setShowAuthModal] = useState(false)

    // Handle enabling
    const handleEnable = async () => {
        if (!isBiometricAvailable) {
            Alert.alert('Not Available', 'Biometric authentication is not available on this device.')
            return
        }
        setIsLoading(true)
        const success = await enableBiometric()
        if (success) {
            router.replace('/settings/biometric-success')
        }
        setIsLoading(false)
    }

    // Handle disabling
    const handleDisable = () => {
        if (isPasscodeSet) {
            // Must authenticate before disabling
            setShowAuthModal(true)
        } else {
            executeDisable()
        }
    }

    const executeDisable = async () => {
        setIsLoading(true)
        await disableBiometric()
        // Determine whether to completely disable security if biometrics was the only method
        if (!isPasscodeSet) {
            await disableSecurity()
        }
        setIsLoading(false)
        router.back()
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Ionicons name="chevron-back" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Biometric Settings</Text>
                <View style={styles.headerBtn} />
            </View>

            <View style={styles.content}>
                <View style={styles.heroContainer}>
                    <Image
                        source={require('../../assets/fingerprint.png')}
                        style={styles.heroImage}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.textSection}>
                    <Text style={styles.title}>{isBiometricEnabled ? 'Biometrics Enabled' : 'Secure Your Wallet'}</Text>
                    <Text style={styles.subtitle}>
                        {isBiometricEnabled
                            ? 'You are currently using biometric authentication to quickly and securely unlock your wallet.'
                            : 'Enable biometric authentication to quickly and securely unlock your wallet and approve transactions.'}
                    </Text>
                </View>

                <View style={styles.buttonsContainer}>
                    {isBiometricEnabled ? (
                        <Pressable
                            style={({ pressed }) => [
                                styles.disableButton,
                                pressed && styles.buttonPressed,
                                isLoading && styles.buttonDisabled
                            ]}
                            onPress={handleDisable}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#EF4444" />
                            ) : (
                                <>
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" style={{ marginRight: 10 }} />
                                    <Text style={styles.disableButtonText}>Disable Biometrics</Text>
                                </>
                            )}
                        </Pressable>
                    ) : (
                        <Pressable
                            style={({ pressed }) => [
                                styles.primaryButton,
                                pressed && styles.buttonPressed,
                                isLoading && styles.buttonDisabled
                            ]}
                            onPress={handleEnable}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#121315" />
                            ) : (
                                <>
                                    <Ionicons name="finger-print" size={24} color="#121315" style={{ marginRight: 10 }} />
                                    <Text style={styles.primaryButtonText}>Enable Biometrics</Text>
                                </>
                            )}
                        </Pressable>
                    )}
                </View>
            </View>

            <AuthenticationModal
                visible={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={() => {
                    setShowAuthModal(false)
                    executeDisable()
                }}
                title="Disable Biometrics"
                subtitle="Verify to disable biometric lock"
            />
        </SafeAreaView>
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 10,
        height: 60,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    headerBtn: {
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    heroContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroImage: {
        width: '100%',
        height: 450,
    },
    textSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#8B98A5',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    buttonsContainer: {
        gap: 16,
    },
    primaryButton: {
        backgroundColor: '#ffda34',
        borderRadius: 16,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disableButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 16,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    buttonPressed: {
        opacity: 0.8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    primaryButtonText: {
        color: '#121315',
        fontSize: 18,
        fontWeight: '700',
    },
    disableButtonText: {
        color: '#EF4444',
        fontSize: 18,
        fontWeight: '700',
    },
})
