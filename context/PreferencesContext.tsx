import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import AudioService from '../services/audio/AudioService'

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
    isPnlGlowEnabled: boolean
    setPnlGlowEnabled: (enabled: boolean) => Promise<void>
    pnlGlowPulseCount: number
    setPnlGlowPulseCount: (count: number) => Promise<void>
    pnlGlowFrequency: 'always' | 'daily'
    setPnlGlowFrequency: (freq: 'always' | 'daily') => Promise<void>
    lastPnlGlowShown: number
    setLastPnlGlowShown: (timestamp: number) => Promise<void>
    pnlGlowBlurSize: number
    setPnlGlowBlurSize: (size: number) => Promise<void>
    pnlGlowColorPositive: string
    setPnlGlowColorPositive: (color: string) => Promise<void>
    pnlGlowColorNegative: string
    setPnlGlowColorNegative: (color: string) => Promise<void>
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
    const [isPnlGlowEnabled, setIsPnlGlowEnabled] = useState(true)
    const [pnlGlowPulseCount, setPnlGlowPulseCountState] = useState(2)
    const [pnlGlowFrequency, setPnlGlowFrequencyState] = useState<'always' | 'daily'>('always')
    const [lastPnlGlowShown, setLastPnlGlowShownState] = useState(0)
    const [pnlGlowBlurSize, setPnlGlowBlurSizeState] = useState(40)
    const [pnlGlowColorPositive, setPnlGlowColorPositiveState] = useState('#ffda34')
    const [pnlGlowColorNegative, setPnlGlowColorNegativeState] = useState('#ef4444')

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
                setIsPnlGlowEnabled(preferences.isPnlGlowEnabled ?? true)
                setPnlGlowPulseCountState(preferences.pnlGlowPulseCount ?? 2)
                setPnlGlowFrequencyState(preferences.pnlGlowFrequency ?? 'always')
                setLastPnlGlowShownState(preferences.lastPnlGlowShown ?? 0)
                setPnlGlowBlurSizeState(preferences.pnlGlowBlurSize ?? 40)
                setPnlGlowColorPositiveState(preferences.pnlGlowColorPositive ?? '#ffda34')
                setPnlGlowColorNegativeState(preferences.pnlGlowColorNegative ?? '#ef4444')
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

    const setNFTTabEnabled = useCallback(async (enabled: boolean) => {
        setIsNFTTabEnabled(enabled)
        await savePreference('isNFTTabEnabled', enabled)
    }, [])

    const setNFTCollectionEnabled = useCallback(async (enabled: boolean) => {
        setIsNFTCollectionEnabled(enabled)
        await savePreference('isNFTCollectionEnabled', enabled)
    }, [])

    const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
        setIsNotificationsEnabled(enabled)
        await savePreference('isNotificationsEnabled', enabled)
    }, [])

    const setSoundEnabled = useCallback(async (enabled: boolean) => {
        setIsSoundEnabled(enabled)
        await savePreference('isSoundEnabled', enabled)
    }, [])

    const setHapticEnabled = useCallback(async (enabled: boolean) => {
        setIsHapticEnabled(enabled)
        await savePreference('isHapticEnabled', enabled)
    }, [])

    const setDeveloperModeEnabled = useCallback(async (enabled: boolean) => {
        setIsDeveloperModeEnabled(enabled)
        await savePreference('isDeveloperModeEnabled', enabled)
    }, [])

    const setSpamFilterEnabled = useCallback(async (enabled: boolean) => {
        setIsSpamFilterEnabled(enabled)
        await savePreference('isSpamFilterEnabled', enabled)
    }, [])

    const setPnlGlowEnabled = useCallback(async (enabled: boolean) => {
        setIsPnlGlowEnabled(enabled)
        await savePreference('isPnlGlowEnabled', enabled)
    }, [])

    const setPnlGlowPulseCount = useCallback(async (count: number) => {
        setPnlGlowPulseCountState(count)
        await savePreference('pnlGlowPulseCount', count)
    }, [])

    const setPnlGlowFrequency = useCallback(async (freq: 'always' | 'daily') => {
        setPnlGlowFrequencyState(freq)
        await savePreference('pnlGlowFrequency', freq)
    }, [])

    const setLastPnlGlowShown = useCallback(async (timestamp: number) => {
        setLastPnlGlowShownState(timestamp)
        await savePreference('lastPnlGlowShown', timestamp)
    }, [])

    const setPnlGlowBlurSize = useCallback(async (size: number) => {
        setPnlGlowBlurSizeState(size)
        await savePreference('pnlGlowBlurSize', size)
    }, [])

    const setPnlGlowColorPositive = useCallback(async (color: string) => {
        setPnlGlowColorPositiveState(color)
        await savePreference('pnlGlowColorPositive', color)
    }, [])

    const setPnlGlowColorNegative = useCallback(async (color: string) => {
        setPnlGlowColorNegativeState(color)
        await savePreference('pnlGlowColorNegative', color)
    }, [])

    const contextValue = useMemo(() => ({
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
        setSpamFilterEnabled,
        isPnlGlowEnabled,
        setPnlGlowEnabled,
        pnlGlowPulseCount,
        setPnlGlowPulseCount,
        pnlGlowFrequency,
        setPnlGlowFrequency,
        lastPnlGlowShown,
        setLastPnlGlowShown,
        pnlGlowBlurSize,
        setPnlGlowBlurSize,
        pnlGlowColorPositive,
        setPnlGlowColorPositive,
        pnlGlowColorNegative,
        setPnlGlowColorNegative
    }), [
        isNFTTabEnabled, setNFTTabEnabled,
        isNFTCollectionEnabled, setNFTCollectionEnabled,
        isNotificationsEnabled, setNotificationsEnabled,
        isSoundEnabled, setSoundEnabled,
        isHapticEnabled, setHapticEnabled,
        isDeveloperModeEnabled, setDeveloperModeEnabled,
        isSpamFilterEnabled, setSpamFilterEnabled,
        isPnlGlowEnabled, setPnlGlowEnabled,
        pnlGlowPulseCount, setPnlGlowPulseCount,
        pnlGlowFrequency, setPnlGlowFrequency,
        lastPnlGlowShown, setLastPnlGlowShown,
        pnlGlowBlurSize, setPnlGlowBlurSize,
        pnlGlowColorPositive, setPnlGlowColorPositive,
        pnlGlowColorNegative, setPnlGlowColorNegative
    ])

    return (
        <PreferencesContext.Provider value={contextValue}>
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
