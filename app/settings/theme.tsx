import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, StatusBar, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme, saveTheme, ThemeType } from '../../hooks/useTheme'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

export default function AppTheme() {
    const router = useRouter()
    const { theme: selectedTheme } = useTheme()

    const handleSaveTheme = async (theme: ThemeType) => {
        await saveTheme(theme)
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>App Theme</Text>
                    <View style={{ width: 24 }} />
                </View>

                <Text style={styles.description}>
                    Set your preferred theme for the app background.
                </Text>

                <View style={styles.themeSection}>
                    <Text style={styles.sectionTitle}>Backsplash</Text>

                    <View style={styles.themeOptions}>
                        <TouchableOpacity
                            style={[
                                styles.themeCard,
                                selectedTheme === 'parthenon2' && styles.themeCardActive
                            ]}
                            onPress={() => handleSaveTheme('parthenon2')}
                            activeOpacity={0.8}
                        >
                            <Image
                                source={require('../../assets/parthenon2.webp')}
                                style={styles.themeImage}
                                resizeMode="cover"
                            />
                            {selectedTheme === 'parthenon2' && (
                                <View style={styles.selectedBadge}>
                                    <Ionicons name="checkmark-circle" size={24} color="#ffda34" />
                                </View>
                            )}
                            <View style={styles.themeOverlay}>
                                <Text style={styles.themeName}>Parthenon 2</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121315',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: IS_SMALL_SCREEN ? 16 : 50,
        paddingBottom: IS_SMALL_SCREEN ? 8 : 20,
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
    },
    description: {
        color: '#8B98A5',
        fontSize: 14,
        lineHeight: 20,
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    themeSection: {
        paddingHorizontal: 20,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
    },
    themeOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
    },
    themeCard: {
        width: '47%',
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
    },
    themeCardActive: {
        borderColor: '#ffda34',
        borderWidth: 3,
    },
    themeImage: {
        width: '100%',
        height: '100%',
    },
    noneTheme: {
        backgroundColor: '#1A1F28',
        justifyContent: 'center',
        alignItems: 'center',
    },
    themeOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 12,
        alignItems: 'center',
    },
    themeName: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    selectedBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 20,
        padding: 2,
    },
})


