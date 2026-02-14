import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, StatusBar, Image, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useSecurity } from '../context/SecurityContext'
import { Ionicons } from '@expo/vector-icons'

export default function BiometricSetupScreen() {
    const router = useRouter()
    const { enableBiometric, isBiometricAvailable } = useSecurity()
    const [isLoading, setIsLoading] = useState(false)

    const handleEnable = async () => {
        if (!isBiometricAvailable) {
            Alert.alert('Not Available', 'Biometric authentication is not available on this device.')
            router.replace('/setup-success')
            return
        }

        setIsLoading(true)
        try {
            const success = await enableBiometric()
            if (success) {
                router.replace('/setup-success')
            }
        } catch (error) {
            console.error('Failed to enable biometric:', error)
            Alert.alert('Error', 'Failed to enable biometrics. You can enable it later in settings.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSkip = () => {
        router.replace('/setup-success')
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <View style={{ flex: 1 }} />
                <Pressable
                    onPress={handleSkip}
                    style={({ pressed }) => [styles.skipHeaderButton, pressed && styles.buttonPressed]}
                >
                    <Text style={styles.skipHeaderText}>Skip</Text>
                </Pressable>
            </View>

            <View style={styles.content}>
                <View style={styles.heroContainer}>
                    <Image
                        source={require('../assets/fingerprint.png')}
                        style={styles.heroImage}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.textSection}>
                    <Text style={styles.title}>Secure Your Wallet</Text>
                    <Text style={styles.subtitle}>
                        Enable biometric authentication to quickly and securely unlock your wallet and approve transactions.
                    </Text>
                </View>

                <View style={styles.buttonsContainer}>
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
                </View>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121315',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingTop: 10,
        height: 60,
        alignItems: 'center',
    },
    skipHeaderButton: {
        padding: 10,
    },
    skipHeaderText: {
        color: '#8B98A5',
        fontSize: 16,
        fontWeight: '600',
    },
    heroContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroImage: {
        width: '100%',
        height: 450, // Significantly increased size
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
})
