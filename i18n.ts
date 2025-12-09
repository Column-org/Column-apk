import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import AsyncStorage from '@react-native-async-storage/async-storage'

import en from './locales/en/translation.json'
import es from './locales/es/translation.json'
import zh from './locales/zh/translation.json'

const LANGUAGE_KEY = '@app_language'

const getStoredLanguage = async () => {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY)
    return storedLanguage || Localization.getLocales()[0].languageCode || 'en'
  } catch (error) {
    return Localization.getLocales()[0].languageCode || 'en'
  }
}

export const changeLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language)
    await i18n.changeLanguage(language)
  } catch (error) {
    console.error('Error changing language:', error)
  }
}

getStoredLanguage().then((language) => {
  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources: {
        en: { translation: en },
        es: { translation: es },
        zh: { translation: zh },
      },
      lng: language,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    })
})

export default i18n
