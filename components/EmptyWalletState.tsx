import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

export const EmptyWalletState = () => {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/illu.png')}
                style={styles.image}
                resizeMode="contain"
            />

            <Text style={styles.title}>Your wallet is ready</Text>
            <Text style={styles.subtitle}>
                Fund your wallet with cash or crypto and you'll be set to start trading!
            </Text>


            <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push('/receive')}
                activeOpacity={0.8}
            >
                <Text style={styles.secondaryButtonText}>Deposit Crypto</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        width: '100%',
    },
    image: {
        width: 280,
        height: 180,
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: '#8B98A5',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
        paddingHorizontal: 15,
    },
    primaryButton: {
        backgroundColor: '#ffda34', // Amber/Yellow from app theme
        width: '100%',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButtonText: {
        color: '#121315',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        backgroundColor: '#222327',
        width: '100%',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    secondaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});
