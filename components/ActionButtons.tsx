import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

export const ActionButtons = () => {
    const router = useRouter()
    const { t } = useTranslation()

    return (
        <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} activeOpacity={1} onPress={() => router.push('/receive')}>
                <Ionicons name="download-outline" size={28} color="#ffda34" />
                <Text style={styles.actionText}>{t('home.receive')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} activeOpacity={1} onPress={() => router.push('/send')}>
                <Ionicons name="paper-plane-outline" size={28} color="#ffda34" />
                <Text style={styles.actionText}>{t('home.send')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} activeOpacity={1} onPress={() => router.push('/swap')}>
                <Ionicons name="repeat-outline" size={28} color="#ffda34" />
                <Text style={styles.actionText}>{t('home.swap')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} activeOpacity={1} onPress={() => router.push('/save')}>
                <Ionicons name="wallet-outline" size={28} color="#ffda34" />
                <Text style={styles.actionText}>{t('home.save')}</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 0,
        zIndex: 10,
        position: 'relative',
    },
    actionButton: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#222327',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 8,
        gap: 8,
    },
    actionText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
})
