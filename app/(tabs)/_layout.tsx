import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Platform } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function TabLayout() {
    const { t } = useTranslation()
    const insets = useSafeAreaInsets()

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#121315',
                    borderTopWidth: 0,
                    borderTopColor: 'transparent',
                    paddingBottom: Math.max(insets.bottom, 8),
                    paddingTop: 8,
                    paddingHorizontal: 16,
                    height: 65 + insets.bottom,
                    elevation: 0,
                },
                tabBarActiveTintColor: '#FFFFFF',
                tabBarInactiveTintColor: '#8B98A5',
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                    marginTop: 4,
                    marginBottom: 0,
                },
                tabBarItemStyle: {
                    backgroundColor: 'transparent',
                    paddingHorizontal: 8,
                    gap: 4,
                },
                tabBarIconStyle: {
                    marginBottom: -4,
                },
                sceneStyle: {
                    backgroundColor: '#121315',
                },
                lazy: true,
                animation: 'shift',
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: t('tabs.home'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size || 24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="activities"
                options={{
                    title: t('tabs.activities'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="time-outline" size={size || 24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="checker"
                options={{
                    title: t('tabs.checker'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="checkmark-circle" size={size || 24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: t('tabs.settings'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings" size={size || 24} color={color} />
                    ),
                }}
            />
        </Tabs>
    )
}
