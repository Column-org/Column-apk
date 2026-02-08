import React, { useState, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Pressable, ScrollView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'

interface SecurityWarningProps {
    title: string
    onConfirm: () => void
    buttonText: string
}

export const SecurityWarning = ({ title, onConfirm, buttonText }: SecurityWarningProps) => {
    const [isPressing, setIsPressing] = useState(false)
    const progress = useRef(new Animated.Value(0)).current

    const handlePressIn = () => {
        setIsPressing(true)
        Animated.timing(progress, {
            toValue: 1,
            duration: 3000, // 3 seconds hold as requested
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished) {
                onConfirm()
            }
        })
    }

    const handlePressOut = () => {
        setIsPressing(false)
        Animated.spring(progress, {
            toValue: 0,
            useNativeDriver: false,
        }).start()
    }

    const progressWidth = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    })

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.iconContainer}>
                        <View style={styles.warningCircle}>
                            <Ionicons name="alert" size={48} color="#EF4444" />
                        </View>
                    </View>

                    <Text style={styles.title}>Warning</Text>
                    <Text style={styles.description}>
                        Please read the following carefully before viewing your {title.toLowerCase()}
                    </Text>

                    <View style={styles.itemsContainer}>
                        <View style={styles.warningItem}>
                            <View style={styles.itemIconContainer}>
                                <Ionicons name="wallet-outline" size={24} color="#8B98A5" />
                            </View>
                            <Text style={styles.itemText}>
                                Your recovery phrase or private key is the only way to recover your account
                            </Text>
                        </View>

                        <View style={styles.warningItem}>
                            <View style={styles.itemIconContainer}>
                                <Ionicons name="eye-off-outline" size={24} color="#8B98A5" />
                            </View>
                            <Text style={styles.itemText}>
                                View this in a private area and do not let anyone see it
                            </Text>
                        </View>

                        <View style={styles.warningItem}>
                            <View style={styles.itemIconContainer}>
                                <Ionicons name="ban-outline" size={24} color="#8B98A5" />
                            </View>
                            <Text style={styles.itemText}>
                                Do not share this with anyone
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <Text style={styles.holdNote}>
                        {isPressing ? 'Keep holding...' : 'Press and hold to reveal'}
                    </Text>
                    <Pressable
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        style={styles.confirmButton}
                    >
                        <Animated.View style={[styles.progressTrack, { width: progressWidth }]} />
                        <Text style={styles.confirmButtonText}>{buttonText}</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121315',
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 60,
    },
    iconContainer: {
        marginBottom: 32,
    },
    warningCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    title: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 16,
    },
    description: {
        color: '#8B98A5',
        fontSize: 17,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 48,
    },
    itemsContainer: {
        width: '100%',
        gap: 32,
    },
    warningItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    itemIconContainer: {
        width: 24,
        alignItems: 'center',
    },
    itemText: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '500',
    },
    footer: {
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 24,
        paddingTop: 16,
        alignItems: 'center',
    },
    holdNote: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    confirmButton: {
        width: '100%',
        backgroundColor: 'rgba(255, 218, 52, 0.1)', // Amber based background
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 218, 52, 0.2)',
    },
    progressTrack: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        backgroundColor: '#ffda34', // Signature Amber
    },
    confirmButtonText: {
        color: '#000000',
        fontSize: 18,
        fontWeight: '700',
        zIndex: 1, // Ensure text is above progress bar
    },
})
