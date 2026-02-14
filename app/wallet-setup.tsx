import React from 'react'
import { View, Text, StyleSheet, Pressable, StatusBar, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

export default function WalletSetupScreen() {
    const router = useRouter()

    const handleWeb3Setup = () => {
        router.push('/web3-setup')
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.content}>
                <View style={styles.heroContainer}>
                    <Image
                        source={require('../assets/first-page.png')}
                        style={styles.heroImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.welcomeTitle}>Welcome to Column</Text>
                    <Text style={styles.welcomeSubtitle}>Your gateway to the Movement ecosystem.</Text>
                </View>

                <View style={styles.buttonsContainer}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.primaryButton,
                            pressed && styles.buttonPressed
                        ]}
                        onPress={handleWeb3Setup}
                    >
                        <Text style={styles.primaryButtonText}>Get Started</Text>
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
        paddingHorizontal: 20, // Slightly reduced for larger image feel
        paddingBottom: 24,
    },
    heroContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroImage: {
        width: '100%',
        height: 460, // Slightly reduced to fit text beautifully
    },
    welcomeTitle: {
        color: '#ffffff',
        fontSize: 32,
        fontWeight: '800',
        marginTop: 24,
        textAlign: 'center',
    },
    welcomeSubtitle: {
        color: '#8B98A5',
        fontSize: 16,
        marginTop: 8,
        textAlign: 'center',
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
    secondaryButton: {
        backgroundColor: 'transparent',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    buttonPressed: {
        opacity: 0.7,
    },
    primaryButtonText: {
        color: '#121315',
        fontSize: 16,
        fontWeight: '700',
    },
})
