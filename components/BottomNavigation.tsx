import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, usePathname } from 'expo-router'

export const BottomNavigation = () => {
    const router = useRouter()
    const pathname = usePathname()

    const getActiveTab = () => {
        if (pathname === '/') return 'Home'
        if (pathname === '/activities') return 'Activities'
        if (pathname === '/settings') return 'Settings'
        return 'Home'
    }

    const activeTab = getActiveTab()

    return (
        <View style={styles.bottomNav}>
            <TouchableOpacity
                style={styles.navItem}
                onPress={() => router.push('/')}
            >
                <Ionicons
                    name={activeTab === 'Home' ? 'home' : 'home-outline'}
                    size={24}
                    color={activeTab === 'Home' ? '#ffda34' : '#8B98A5'}
                />
                <Text style={[styles.navText, activeTab === 'Home' && styles.activeNavText]}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.navItem}
                onPress={() => router.push('/activities')}
            >
                <Ionicons
                    name={activeTab === 'Activities' ? 'list' : 'list-outline'}
                    size={24}
                    color={activeTab === 'Activities' ? '#ffda34' : '#8B98A5'}
                />
                <Text style={[styles.navText, activeTab === 'Activities' && styles.activeNavText]}>Activities</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.navItem}
                onPress={() => router.push('/settings')}
            >
                <Ionicons
                    name={activeTab === 'Settings' ? 'settings' : 'settings-outline'}
                    size={24}
                    color={activeTab === 'Settings' ? '#ffda34' : '#8B98A5'}
                />
                <Text style={[styles.navText, activeTab === 'Settings' && styles.activeNavText]}>Settings</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#1A1F28',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        paddingBottom: 28,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
    },
    navText: {
        fontSize: 11,
        color: '#8B98A5',
        fontWeight: '500',
        marginTop: 4,
    },
    activeNavText: {
        color: '#ffda34',
        fontWeight: '600',
    },
})
