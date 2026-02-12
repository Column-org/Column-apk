import { Tabs } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomNavigation } from '../../components/BottomNavigation'

export default function TabLayout() {
    const { t } = useTranslation()
    const insets = useSafeAreaInsets()

    return (
        <View style={{ flex: 1, backgroundColor: '#121315' }}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        display: 'none', // Hide default tab bar
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
                    }}
                />
                <Tabs.Screen
                    name="activities"
                    options={{
                        title: t('tabs.activities'),
                    }}
                />
                <Tabs.Screen
                    name="checker"
                    options={{
                        title: t('tabs.checker'),
                    }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{
                        title: t('tabs.settings'),
                    }}
                />
            </Tabs>

            {/* Custom Premium Bottom Navigation */}
            <BottomNavigation />
        </View>
    )
}
