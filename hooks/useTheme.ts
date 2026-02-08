import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const THEME_KEY = '@app_theme'

export type ThemeType = 'none' | 'parthenon2'

// Simple event system for theme changes
type ThemeListener = (theme: ThemeType) => void
const themeListeners = new Set<ThemeListener>()

const notifyThemeChange = (theme: ThemeType) => {
    themeListeners.forEach(listener => listener(theme))
}

export const useTheme = () => {
    const [theme, setTheme] = useState<ThemeType>('parthenon2')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadTheme()

        // Listen for theme changes
        const handleThemeChange = (newTheme: ThemeType) => {
            setTheme(newTheme)
        }

        themeListeners.add(handleThemeChange)

        return () => {
            themeListeners.delete(handleThemeChange)
        }
    }, [])

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(THEME_KEY)
            if (savedTheme) {
                setTheme(savedTheme as ThemeType)
            }
        } catch (error) {
            console.error('Error loading theme:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getThemeImage = () => {
        if (theme === 'none') return null
        return require('../assets/parthenon2.webp')
    }

    return { theme, isLoading, getThemeImage }
}

// Function to save theme and notify listeners
export const saveTheme = async (theme: ThemeType) => {
    try {
        await AsyncStorage.setItem(THEME_KEY, theme)
        notifyThemeChange(theme)
    } catch (error) {
        console.error('Error saving theme:', error)
    }
}
