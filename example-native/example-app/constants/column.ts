import { ColumnWalletNative } from '@column-org/wallet-sdk';

/**
 * 1. Define your App's Metadata
 * If you leave 'appName', 'appDescription', or 'redirectLink' blank,
 * ColumnWalletNative will attempt to auto-detect them from your app.json/Expo config!
 */
const SDK_CONFIG = {
    // appName: "Auto-detected!",
    // appDescription: "Auto-detected!",
    appIcon: "https://columnwallet.com/logo.png", // Recommended: Provide a public icon URL
    appUrl: "https://native.columnwallet.com",   // Use a unique URL for the native app
    // redirectLink: "Auto-detected!",
    walletScheme: "column",                      // Standard for Column Wallet
};

/**
 * 2. Export the initialized SDK instance
 * ColumnWalletNative automatically handles Expo/React Native environment detection.
 */
export const column = new ColumnWalletNative(SDK_CONFIG);

