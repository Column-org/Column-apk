import React from 'react'
import { View, Text, StyleSheet, Pressable, SafeAreaView, StatusBar, Image } from 'react-native'
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
                <View style={styles.header}>
                    <Image
                        source={require('../assets/Collumn-Login.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
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
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 64,
    },
    logo: {
        width: 140,
        height: 140,
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
