import React from 'react'
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, SafeAreaView, Dimensions, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import ISO6391 from 'iso-639-1'
import { getLanguageFlag } from '../utils/languageFlags'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

const allLanguageCodes = ISO6391.getAllCodes()

const languages = allLanguageCodes.map(code => ({
    code,
    name: ISO6391.getNativeName(code),
    englishName: ISO6391.getName(code),
    flag: getLanguageFlag(code)
}))

const LanguagePage = () => {
    const router = useRouter()
    const { i18n } = useTranslation()

    const handleSelect = async (code: string) => {
        if (i18n.language !== code) {
            await i18n.changeLanguage(code)
        }
        router.back()
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={26} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Language</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.description}>Choose your preferred language</Text>

                <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                    {languages.map((language) => {
                        const isActive = i18n.language === language.code
                        return (
                            <TouchableOpacity
                                key={language.code}
                                style={[styles.languageItem, isActive && styles.languageItemActive]}
                                onPress={() => handleSelect(language.code)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.languageInfo}>
                                    <View style={styles.flagContainer}>
                                        <Text style={styles.flagText}>{language.flag}</Text>
                                    </View>
                                    <View>
                                        <Text style={[styles.languageText, isActive && styles.languageTextActive]}>
                                            {language.name}
                                        </Text>
                                        <Text style={styles.languageEnglishName}>
                                            {language.englishName}
                                        </Text>
                                    </View>
                                    <Text style={styles.languageCode}>{language.code.toUpperCase()}</Text>
                                </View>
                                <View style={styles.languageAction}>
                                    <Text style={styles.languageActionText}>
                                        {isActive ? 'Current' : 'Select'}
                                    </Text>
                                    <Ionicons
                                        name={isActive ? 'checkmark-circle' : 'chevron-forward'}
                                        size={20}
                                        color={isActive ? '#ffda34' : '#8B98A5'}
                                    />
                                </View>
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>
            </View>
        </SafeAreaView >
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
    list: {
        flex: 1,
    },
    listContent: {
        gap: 12,
        paddingBottom: 40,
    },
    languageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 8,
    },
    languageItemActive: {
        backgroundColor: 'rgba(255, 195, 13, 0.05)',
        borderRadius: 10,
    },
    languageInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    flagContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1E2022',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    flagText: {
        fontSize: 20,
    },
    languageEnglishName: {
        color: '#8B98A5',
        fontSize: 12,
    },
    languageText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    languageTextActive: {
        color: '#ffda34',
        fontWeight: '600',
    },
    languageCode: {
        color: '#8B98A5',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    languageAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    languageActionText: {
        color: '#8B98A5',
        fontSize: 12,
        fontWeight: '500',
    },
})

export default LanguagePage

