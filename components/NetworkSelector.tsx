import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useNetwork } from '../context/NetworkContext'

interface NetworkSelectorProps {
    position?: 'top' | 'middle' | 'bottom' | 'single'
}

export const NetworkSelector = ({ position = 'single' }: NetworkSelectorProps) => {
    const router = useRouter()
    const { config } = useNetwork()

    const getPositionStyle = () => {
        switch (position) {
            case 'top': return styles.cardTop
            case 'middle': return styles.cardMiddle
            case 'bottom': return styles.cardBottom
            case 'single': return styles.cardSingle
            default: return styles.cardSingle
        }
    }

    return (
        <TouchableOpacity
            style={[styles.settingItem, getPositionStyle()]}
            onPress={() => router.push('/settings/network')}
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
        backgroundColor: '#222327',
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 2,
    },
    cardTop: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
    },
    cardMiddle: {
        borderRadius: 4,
    },
    cardBottom: {
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        marginBottom: 0,
    },
    cardSingle: {
        borderRadius: 20,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingText: {
        color: 'white',
        fontSize: 14,
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
        fontSize: 13,
    },
})
