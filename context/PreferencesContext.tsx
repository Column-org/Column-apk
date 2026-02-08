import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface PreferencesContextType {
    isNFTTabEnabled: boolean
    setNFTTabEnabled: (enabled: boolean) => Promise<void>
    isNFTCollectionEnabled: boolean
    setNFTCollectionEnabled: (enabled: boolean) => Promise<void>
    isNotificationsEnabled: boolean
    setNotificationsEnabled: (enabled: boolean) => Promise<void>
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

const PREFERENCES_STORAGE_KEY = '@app_preferences'

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isNFTTabEnabled, setIsNFTTabEnabled] = useState(true)
    const [isNFTCollectionEnabled, setIsNFTCollectionEnabled] = useState(true)
    const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true)

    useEffect(() => {
        loadPreferences()
    }, [])

    const loadPreferences = async () => {
        try {
            const stored = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY)
            if (stored) {
                const preferences = JSON.parse(stored)
                setIsNFTTabEnabled(preferences.isNFTTabEnabled ?? true)
                setIsNFTCollectionEnabled(preferences.isNFTCollectionEnabled ?? true)
                setIsNotificationsEnabled(preferences.isNotificationsEnabled ?? true)
            }
        } catch (error) {
            console.error('Failed to load preferences:', error)
        }
    }

    const setNFTTabEnabled = async (enabled: boolean) => {
        try {
            setIsNFTTabEnabled(enabled)
            const stored = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY)
            const preferences = stored ? JSON.parse(stored) : {}
            preferences.isNFTTabEnabled = enabled
            await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
        } catch (error) {
            console.error('Failed to save NFT tab preference:', error)
        }
    }

    const setNFTCollectionEnabled = async (enabled: boolean) => {
        try {
            setIsNFTCollectionEnabled(enabled)
            const stored = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY)
            const preferences = stored ? JSON.parse(stored) : {}
            preferences.isNFTCollectionEnabled = enabled
            await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
        } catch (error) {
            console.error('Failed to save NFT collection preference:', error)
        }
    }

    const setNotificationsEnabled = async (enabled: boolean) => {
        try {
            setIsNotificationsEnabled(enabled)
            const stored = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY)
            const preferences = stored ? JSON.parse(stored) : {}
            preferences.isNotificationsEnabled = enabled
            await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
        } catch (error) {
            console.error('Failed to save notification preference:', error)
        }
    }

    return (
        <PreferencesContext.Provider value={{
            isNFTTabEnabled,
            setNFTTabEnabled,
            isNFTCollectionEnabled,
            setNFTCollectionEnabled,
            isNotificationsEnabled,
            setNotificationsEnabled
        }}>
            {children}
        </PreferencesContext.Provider>
    )
}

export const usePreferences = () => {
    const context = useContext(PreferencesContext)
    if (!context) {
        throw new Error('usePreferences must be used within PreferencesProvider')
    }
    return context
}
