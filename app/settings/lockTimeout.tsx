import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSecurity } from '../../context/SecurityContext'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

export default function LockTimeout() {
    const router = useRouter()
    const { lockTimeout, setLockTimeout } = useSecurity()

    const timeoutOptions = [
        { label: '1 minute', value: 1, description: 'Lock after 1 minute of inactivity' },
        { label: '5 minutes', value: 5, description: 'Lock after 5 minutes of inactivity' },
        { label: '30 minutes', value: 30, description: 'Lock after 30 minutes of inactivity' },
        { label: '1 hour', value: 60, description: 'Lock after 1 hour of inactivity' },
        { label: '5 hours', value: 300, description: 'Lock after 5 hours of inactivity' },
    ]

    const handleSelectTimeout = async (minutes: number) => {
        await setLockTimeout(minutes)
        router.back()
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={26} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Auto-Lock Timeout</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.description}>
                    Choose how long the app can be inactive before requiring authentication again
                </Text>

                <View style={styles.timeoutList}>
                    {timeoutOptions.map((option) => {
                        const isActive = lockTimeout === option.value
                        return (
                            <TouchableOpacity
                                key={option.value}
                                style={styles.timeoutItem}
                                onPress={() => handleSelectTimeout(option.value)}
                            >
                                <View style={styles.timeoutInfo}>
                                    <View style={[
                                        styles.radioOuter,
                                        isActive && styles.radioOuterActive,
                                    ]}>
                                        {isActive && <View style={styles.radioInner} />}
                                    </View>
                                    <View>
                                        <Text style={styles.timeoutLabel}>
                                            {option.label}
                                        </Text>
                                        <Text style={styles.timeoutDescription}>
                                            {option.description}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )
                    })}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: IS_SMALL_SCREEN ? 16 : 50,
        paddingBottom: IS_SMALL_SCREEN ? 12 : 24,
        gap: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    description: {
        color: '#8B98A5',
        fontSize: 14,
        marginBottom: 24,
    },
    timeoutList: {
        gap: 16,
    },
    timeoutItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    timeoutInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#8B98A5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterActive: {
        borderColor: '#ffda34',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#ffda34',
    },
    timeoutLabel: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    timeoutDescription: {
        color: '#8B98A5',
        fontSize: 13,
    },
})


