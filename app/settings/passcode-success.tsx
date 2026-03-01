import React, { useEffect } from 'react'
import { View, Text, StyleSheet, StatusBar, Image, Pressable, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

export default function PasscodeSuccessScreen() {
    const router = useRouter()
    const fadeAnim = React.useRef(new Animated.Value(0)).current
    const scaleAnim = React.useRef(new Animated.Value(0.9)).current

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start()
    }, [])

    const handleContinue = () => {
        // Since we opened passcode-setup on top of settings, we should pop back to the root settings page
        // Use dismiss to safely go back 2 screens if needed, or simply let the router go back
        // but wait, passcode-success is pushed. Let's redirect to settings tab.
        router.dismissAll()
        router.replace('/(tabs)/settings')
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.content}>
                <Animated.View
                    style={[
                        styles.heroContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}
                >
                    <Image
                        source={require('../../assets/success.png')}
                        style={styles.heroImage}
                        resizeMode="contain"
                    />
                </Animated.View>

                <View style={styles.textSection}>
                    <Text style={styles.title}>Passcode Set!</Text>
                    <Text style={styles.subtitle}>
                        Your passcode has been set successfully. You can now use it to secure your wallet.
                    </Text>
                </View>

                <View style={styles.buttonsContainer}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.primaryButton,
                            pressed && styles.buttonPressed
                        ]}
                        onPress={handleContinue}
                    >
                        <Text style={styles.primaryButtonText}>Continue</Text>
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
    heroContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroImage: {
        width: '100%',
        height: 400, // Slightly smaller than setup-success to fit well
    },
    textSection: {
        alignItems: 'center',
        marginBottom: 48,
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonPressed: {
        opacity: 0.8,
    },
    primaryButtonText: {
        color: '#121315',
        fontSize: 18,
        fontWeight: '700',
    },
})
