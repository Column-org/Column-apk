import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Text, Animated } from 'react-native'

export default function StarGate() {
    const fadeAnim = useRef(new Animated.Value(0)).current
    const scaleAnim = useRef(new Animated.Value(0.8)).current

    useEffect(() => {
        // Fade in and scale animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 20,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start()
    }, [])

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <Text style={styles.welcome}>Welcome to</Text>
                <Text style={styles.title}>Column</Text>
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121315',
    },
    content: {
        alignItems: 'center',
    },
    welcome: {
        fontSize: 24,
        color: '#8B98A5',
        marginBottom: 10,
        letterSpacing: 1,
    },
    title: {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#ffda34',
        letterSpacing: 3,
    },
})
