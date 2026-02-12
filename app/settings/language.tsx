import React from 'react'
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Dimensions, ScrollView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import ISO6391 from 'iso-639-1'
import { getLanguageFlag } from '../../utils/languageFlags'
import AudioService from '../../services/AudioService'
import { usePreferences } from '../../context/PreferencesContext'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

// Filter languages to only include those that have a specific country flag (not the globe fallback)
const allLanguageCodes = ISO6391.getAllCodes()
const languages = allLanguageCodes
    .map(code => ({
        code,
        name: ISO6391.getNativeName(code),
        englishName: ISO6391.getName(code),
        flag: getLanguageFlag(code)
    }))
    .filter(lang => lang.flag !== '🌐') // Remove languages without flags

const LanguagePage = () => {
    const router = useRouter()
    const { i18n } = useTranslation()
    const { isSoundEnabled, isHapticEnabled } = usePreferences()

    React.useEffect(() => {
        AudioService.setSoundEnabled(isSoundEnabled)
        AudioService.setHapticEnabled(isHapticEnabled)
    }, [isSoundEnabled, isHapticEnabled])

    const handleSelect = async (code: string) => {
        AudioService.feedback('click')
        if (i18n.language !== code) {
            await i18n.changeLanguage(code)
        }
        router.back()
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={26} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Language</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.description}>Choose your preferred language</Text>

                <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                    <View style={styles.listWrapper}>
                        {languages.map((language, index) => {
                            const isActive = i18n.language === language.code

                            // Determine position for "sliced card" style
                            let positionStyle = styles.cardMiddle;
                            if (languages.length === 1) positionStyle = styles.cardSingle;
                            else if (index === 0) positionStyle = styles.cardTop;
                            else if (index === languages.length - 1) positionStyle = styles.cardBottom;

                            return (
                                <TouchableOpacity
                                    key={language.code}
                                    style={[styles.languageItem, positionStyle]}
                                    onPress={() => handleSelect(language.code)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.languageInfo}>
                                        {/* Radio Button */}
                                        <View style={[
                                            styles.radioOuter,
                                            isActive && styles.radioOuterActive,
                                        ]}>
                                            {isActive && <View style={styles.radioInner} />}
                                        </View>

                                        <View style={styles.textContainer}>
                                            <View style={styles.nameRow}>
                                                <Text style={styles.flagSymbol}>{language.flag}</Text>
                                                <Text style={[styles.languageText, isActive && styles.languageTextActive]}>
                                                    {language.name}
                                                </Text>
                                            </View>
                                            <Text style={styles.languageEnglishName}>
                                                {language.englishName}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                </ScrollView>
            </View>
        </View>
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
        paddingTop: Platform.OS === 'ios' ? 50 : 60,
        paddingBottom: Platform.OS === 'ios' ? 12 : 24,
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
    listWrapper: {
        marginBottom: 40,
    },
    languageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10, // Reduced padding
        paddingHorizontal: 16,
        backgroundColor: '#222327',
        borderRadius: 4,
        marginBottom: 2,
    },
    cardTop: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
        borderRadius: 4, // Added to fix lint
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
        borderRadius: 4, // Added to fix lint
    },
    cardSingle: {
        borderRadius: 20,
    },
    languageInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    radioOuter: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: '#8B98A5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterActive: {
        borderColor: '#ffda34',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ffda34',
    },
    textContainer: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    flagSymbol: {
        fontSize: 18,
    },
    languageText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
    },
    languageTextActive: {
        color: '#ffda34',
    },
    languageEnglishName: {
        color: '#8B98A5',
        fontSize: 12,
        fontWeight: '400',
        marginTop: 1,
    },
})

export default LanguagePage


