import React from 'react'
import { View, StyleSheet, Text, Image } from 'react-native'

export default function StarGate() {
    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <Image
                    source={require('../../assets/Column.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>
            <Text style={styles.title}>Column</Text>
            <Text style={styles.subtitle}>Secure Crypto Wallet</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    logoContainer: {
        marginBottom: 30,
    },
    logo: {
        width: 120,
        height: 120,
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ffda34',
        marginBottom: 10,
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 16,
        color: '#8B98A5',
        letterSpacing: 1,
    },
})
