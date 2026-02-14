import React, { useEffect } from 'react'
import { View, Text, StyleSheet, StatusBar, Image, Pressable, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTheme } from '../hooks/useTheme'

export default function SetupSuccessScreen() {
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
        router.replace('/(tabs)/home')
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
                        source={require('../assets/success.png')}
                        style={styles.heroImage}
                        resizeMode="contain"
                    />
                </Animated.View>

                <View style={styles.textSection}>
                    <Text style={styles.title}>All Set!</Text>
                    <Text style={styles.subtitle}>
                        Your wallet is ready. Welcome to the future of the Movement ecosystem.
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
                        <Text style={styles.primaryButtonText}>Go to Home</Text>
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
        height: 500, // As requested
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
