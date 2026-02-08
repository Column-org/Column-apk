import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFERENCES_STORAGE_KEY = '@app_preferences';

const areNotificationsEnabled = async () => {
    try {
        const stored = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
        if (stored) {
            const preferences = JSON.parse(stored);
            return preferences.isNotificationsEnabled ?? true;
        }
    } catch (error) {
        console.error('Error checking notification preference:', error);
    }
    return true; // Default to true if not set
};

// Lazy loader for notifications to avoid initialization errors in some environments
const getNotifications = () => {
    try {
        return require('expo-notifications');
    } catch (e) {
        // Silently fail in Expo Go - this is expected
        return null;
    }
};

let isHandlerSet = false;
const ensureHandler = () => {
    if (isHandlerSet) return;
    try {
        const Notifications = getNotifications();
        if (!Notifications) return; // Skip if notifications not available

        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldPlaySound: true,
                shouldSetBadge: false,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });
        isHandlerSet = true;
    } catch (e) {
        // Silently ignore - expected in Expo Go
    }
};

export const requestNotificationPermissions = async () => {
    if (Platform.OS === 'web') return false;
    try {
        const Notifications = getNotifications();
        if (!Notifications) return false; // Not available in Expo Go

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        return finalStatus === 'granted';
    } catch (e) {
        return false;
    }
};

export const triggerReceiveNotification = async (amount: string, symbol: string) => {
    if (!(await areNotificationsEnabled())) return;
    ensureHandler();

    try {
        const Notifications = getNotifications();
        if (!Notifications) return; // Not available in Expo Go

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Column - Received Assets",
                body: `You received ${amount} ${symbol} in your wallet.`,
                data: { type: 'receive', amount, symbol },
            },
            trigger: null, // trigger immediately
        });
    } catch (e) {
        // Silently ignore
    }
};

export const triggerSendNotification = async (amount: string, symbol: string, to: string) => {
    if (!(await areNotificationsEnabled())) return;
    ensureHandler();

    try {
        const Notifications = getNotifications();
        if (!Notifications) return; // Not available in Expo Go

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Column - Transfer Successful",
                body: `Successfully sent ${amount} ${symbol} to ${to}.`,
                data: { type: 'send', amount, symbol, to },
            },
            trigger: null, // trigger immediately
        });
    } catch (e) {
        // Silently ignore
    }
};
