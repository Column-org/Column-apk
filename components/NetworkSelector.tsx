import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useNetwork } from '../context/NetworkContext'

export const NetworkSelector = () => {
    const router = useRouter()
    const { config } = useNetwork()

    return (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/network')}
        >
            <View style={styles.settingLeft}>
                <Ionicons name="server-outline" size={22} color="#ffda34" />
                <Text style={styles.settingText}>Network</Text>
            </View>
            <View style={styles.settingRight}>
                <Text style={styles.settingValue}>
                    {config.displayName}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#8B98A5" />
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 15,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    settingValue: {
        color: '#8B98A5',
        fontSize: 14,
    },
})
