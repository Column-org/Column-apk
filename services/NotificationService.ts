import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const PREFERENCES_STORAGE_KEY = '@app_preferences';

// Lazy load notifications to avoid bundling issues
const getNotifications = () => {
    try {
        // In Expo Go, require can trigger a noisy warning, but we need it for local notifications
        const Notifications = require('expo-notifications');
        return Notifications;
    } catch (e) {
        console.warn('NotificationService: expo-notifications not found');
        return null;
    }
};

let isHandlerSet = false;
const ensureHandler = () => {
    if (isHandlerSet) return;
    try {
        const Notifications = getNotifications();
        if (!Notifications) return;

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
        console.warn('NotificationService: Failed to set handler', e);
    }
};

const areNotificationsEnabled = async () => {
    try {
        const stored = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
        if (stored) {
            const preferences = JSON.parse(stored);
            return preferences.isNotificationsEnabled ?? true;
        }
    } catch (error) {
        console.error('NotificationService: Error checking preference:', error);
    }
    return true; // Default to true if not set
};

export const requestNotificationPermissions = async () => {
    if (Platform.OS === 'web') return false;
    try {
        const Notifications = getNotifications();
        if (!Notifications) return false;

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        return finalStatus === 'granted';
    } catch (e) {
        console.warn('NotificationService: Failed to request permissions:', e);
        return false;
    }
};

export const triggerReceiveNotification = async (amount: string, symbol: string) => {
    if (!(await areNotificationsEnabled())) return;
    ensureHandler();

    try {
        const Notifications = getNotifications();
        if (!Notifications) return;

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Column - Received Assets",
                body: `You received ${amount} ${symbol} in your wallet.`,
                data: { type: 'receive', amount, symbol },
            },
            trigger: null, // trigger immediately
        });
    } catch (e) {
        console.warn('NotificationService: Failed to schedule receive notification:', e);
    }
};

export const triggerSendNotification = async (amount: string, symbol: string, to: string) => {
    if (!(await areNotificationsEnabled())) return;
    ensureHandler();

    try {
        const Notifications = getNotifications();
        if (!Notifications) return;

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Column - Transfer Successful",
                body: `Successfully sent ${amount} ${symbol} to ${to}.`,
                data: { type: 'send', amount, symbol, to },
            },
            trigger: null, // trigger immediately
        });
    } catch (e) {
        console.warn('NotificationService: Failed to schedule send notification:', e);
    }
};
