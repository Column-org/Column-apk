import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useRouter, usePathname } from 'expo-router'
import AudioService from '../services/AudioService'
import { usePreferences } from '../context/PreferencesContext'

const { width } = Dimensions.get('window')

export const BottomNavigation = () => {
    const router = useRouter()
    const pathname = usePathname()
    const { isSoundEnabled, isHapticEnabled } = usePreferences()

    // Animation for active indicator
    const indicatorX = React.useRef(new Animated.Value(0)).current

    useEffect(() => {
        AudioService.setSoundEnabled(isSoundEnabled)
        AudioService.setHapticEnabled(isHapticEnabled)
    }, [isSoundEnabled, isHapticEnabled])

    const tabs = [
        { name: 'Home', path: '/', icon: 'home' },
        { name: 'History', path: '/activities', icon: 'repeat' },
        { name: 'Shield', path: '/checker', icon: 'shield' },
        { name: 'Settings', path: '/settings', icon: 'settings' },
    ]

    const getActiveIndex = () => {
        if (pathname === '/' || pathname === '/(tabs)/home') return 0
        if (pathname === '/activities' || pathname === '/(tabs)/activities') return 1
        if (pathname === '/checker' || pathname === '/(tabs)/checker') return 2
        if (pathname === '/settings' || pathname === '/(tabs)/settings') return 3
        return 0
    }

    const activeIndex = getActiveIndex()

    useEffect(() => {
        Animated.spring(indicatorX, {
            toValue: activeIndex * (width / tabs.length),
            useNativeDriver: true,
            tension: 60,
            friction: 10
        }).start()
    }, [activeIndex])

    const handlePress = (path: string) => {
        // Trigger audio/haptic feedback immediately
        AudioService.feedback('click')
        // Navigate immediately
        router.push(path as any)
    }

    return (
        <View style={styles.container}>
            <View style={styles.navBackground}>
                <View style={styles.navContent}>
                    {/* Floating Active Indicator Background */}
                    <Animated.View
                        style={[
                            styles.indicator,
                            {
                                width: width / tabs.length,
                                transform: [{ translateX: indicatorX }]
                            }
                        ]}
                    >
                        <View style={styles.amberIndicator} />
                    </Animated.View>

                    {tabs.map((tab, index) => {
                        const isActive = activeIndex === index
                        return (
                            <TouchableOpacity
                                key={tab.name}
                                style={styles.navItem}
                                onPress={() => handlePress(tab.path)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconWrapper}>
                                    <Feather
                                        name={tab.icon as any}
                                        size={20}
                                        color={isActive ? '#ffda34' : '#8B98A5'}
                                    />
                                </View>
                                <Text style={[
                                    styles.navLabel,
                                    isActive && styles.activeNavLabel
                                ]}>
                                    {tab.name}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
    },
    navBackground: {
        backgroundColor: '#121315',
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 34 : 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    navContent: {
        flexDirection: 'row',
        position: 'relative',
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    iconWrapper: {
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navLabel: {
        fontSize: 10,
        color: '#8B98A5',
        fontWeight: '500',
        marginTop: 2,
    },
    activeNavLabel: {
        color: '#ffda34',
        fontWeight: '700',
    },
    indicator: {
        position: 'absolute',
        top: -10,
        bottom: 0,
        justifyContent: 'flex-start',
        alignItems: 'center',
        zIndex: 1,
    },
    amberIndicator: {
        width: 32,
        height: 3,
        backgroundColor: '#ffda34',
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
        shadowColor: '#ffda34',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    }
})
