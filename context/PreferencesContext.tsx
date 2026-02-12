import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import AudioService from '../services/AudioService'

interface PreferencesContextType {
    isNFTTabEnabled: boolean
    setNFTTabEnabled: (enabled: boolean) => Promise<void>
    isNFTCollectionEnabled: boolean
    setNFTCollectionEnabled: (enabled: boolean) => Promise<void>
    isNotificationsEnabled: boolean
    setNotificationsEnabled: (enabled: boolean) => Promise<void>
    isSoundEnabled: boolean
    setSoundEnabled: (enabled: boolean) => Promise<void>
    isHapticEnabled: boolean
    setHapticEnabled: (enabled: boolean) => Promise<void>
    isDeveloperModeEnabled: boolean
    setDeveloperModeEnabled: (enabled: boolean) => Promise<void>
    isSpamFilterEnabled: boolean
    setSpamFilterEnabled: (enabled: boolean) => Promise<void>
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

const PREFERENCES_STORAGE_KEY = '@app_preferences'

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isNFTTabEnabled, setIsNFTTabEnabled] = useState(true)
    const [isNFTCollectionEnabled, setIsNFTCollectionEnabled] = useState(true)
    const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true)
    const [isSoundEnabled, setIsSoundEnabled] = useState(true)
    const [isHapticEnabled, setIsHapticEnabled] = useState(true)
    const [isDeveloperModeEnabled, setIsDeveloperModeEnabled] = useState(false)
    const [isSpamFilterEnabled, setIsSpamFilterEnabled] = useState(true)

    useEffect(() => {
        loadPreferences()
    }, [])

    useEffect(() => {
        AudioService.setSoundEnabled(isSoundEnabled)
        AudioService.setHapticEnabled(isHapticEnabled)
    }, [isSoundEnabled, isHapticEnabled])

    const loadPreferences = async () => {
        try {
            const stored = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY)
            if (stored) {
                const preferences = JSON.parse(stored)
                setIsNFTTabEnabled(preferences.isNFTTabEnabled ?? true)
                setIsNFTCollectionEnabled(preferences.isNFTCollectionEnabled ?? true)
                setIsNotificationsEnabled(preferences.isNotificationsEnabled ?? true)
                setIsSoundEnabled(preferences.isSoundEnabled ?? true)
                setIsHapticEnabled(preferences.isHapticEnabled ?? true)
                setIsDeveloperModeEnabled(preferences.isDeveloperModeEnabled ?? false)
                setIsSpamFilterEnabled(preferences.isSpamFilterEnabled ?? true)
            }
        } catch (error) {
            console.error('Failed to load preferences:', error)
        }
    }

    const savePreference = async (key: string, value: any) => {
        try {
            const stored = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY)
            const preferences = stored ? JSON.parse(stored) : {}
            preferences[key] = value
            await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
        } catch (error) {
            console.error(`Failed to save preference for ${key}:`, error)
        }
    }

    const setNFTTabEnabled = async (enabled: boolean) => {
        setIsNFTTabEnabled(enabled)
        await savePreference('isNFTTabEnabled', enabled)
    }

    const setNFTCollectionEnabled = async (enabled: boolean) => {
        setIsNFTCollectionEnabled(enabled)
        await savePreference('isNFTCollectionEnabled', enabled)
    }

    const setNotificationsEnabled = async (enabled: boolean) => {
        setIsNotificationsEnabled(enabled)
        await savePreference('isNotificationsEnabled', enabled)
    }

    const setSoundEnabled = async (enabled: boolean) => {
        setIsSoundEnabled(enabled)
        await savePreference('isSoundEnabled', enabled)
    }

    const setHapticEnabled = async (enabled: boolean) => {
        setIsHapticEnabled(enabled)
        await savePreference('isHapticEnabled', enabled)
    }

    const setDeveloperModeEnabled = async (enabled: boolean) => {
        setIsDeveloperModeEnabled(enabled)
        await savePreference('isDeveloperModeEnabled', enabled)
    }

    const setSpamFilterEnabled = async (enabled: boolean) => {
        setIsSpamFilterEnabled(enabled)
        await savePreference('isSpamFilterEnabled', enabled)
    }

    return (
        <PreferencesContext.Provider value={{
            isNFTTabEnabled,
            setNFTTabEnabled,
            isNFTCollectionEnabled,
            setNFTCollectionEnabled,
            isNotificationsEnabled,
            setNotificationsEnabled,
            isSoundEnabled,
            setSoundEnabled,
            isHapticEnabled,
            setHapticEnabled,
            isDeveloperModeEnabled,
            setDeveloperModeEnabled,
            isSpamFilterEnabled,
            setSpamFilterEnabled
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
