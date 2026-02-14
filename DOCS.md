# 🏗️ Column Wallet SDK Documentation

Welcome to the official integration guide for the **Column Wallet**. This document explains how to integrate Column into your web application using our Zero-Config DeepLink SDK.

---

## 🚀 Quick Start

### 1. Installation
Currently, you can integrate the SDK by including the `ColumnWalletSDK` and `ColumnCrypto` classes in your project.

```bash
# Core dependencies
npm install bs58 tweetnacl buffer
```

### 2. Basic Configuration
The SDK is designed to be **Zero-Config**. It automatically detects your App Name, Icon, and Description from your HTML metadata.

**In your `index.html`:**
```html
<title>My Awesome dApp</title>
<meta name="description" content="The best yield protocol on Movement.">
<link rel="icon" href="/logo.png">
```

---

## 🛠️ Implementation Guide

### 1. Initialize the SDK
Initialize the SDK once in your application.

```typescript
import { ColumnWalletSDK } from '@column-labs/wallet-sdk';

const sdk = new ColumnWalletSDK({
  // 'column' is the production scheme. 
  // For testing in Expo, use your local IP: 'exp://192.168.1.XX:8081/--'
  walletScheme: 'column' 
});
```

### 2. Connect Wallet
To initiate a connection, call `openConnectModal()`. This opens a premium selection UI for the user.

```typescript
const handleConnect = () => {
  sdk.openConnectModal();
};
```

### 3. Handle Redirect Responses
After the user approves/declines in the wallet, they are redirected back to your app with a payload in the URL. You must parse this response.

```typescript
useEffect(() => {
  const handleRedirect = () => {
    const url = window.location.href;
    if (url.includes('data=') || url.includes('address=')) {
      try {
        const response = sdk.handleResponse(url);
        
        if (response.address) {
          // Store connection details
          setAddress(response.address);
          localStorage.setItem('wallet_address', response.address);
          
          if (response.column_encryption_public_key) {
            // CRITICAL: Save this for future transactions
            localStorage.setItem('enc_pk', response.column_encryption_public_key);
            sdk.setWalletEncryptionPublicKey(response.column_encryption_public_key);
          }
        }
      } catch (error) {
        console.error("Connection failed", error);
      } finally {
        // Clean the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  };
  handleRedirect();
}, []);
```

### 4. Transactions (Sign & Submit)
To send a transaction, construct a standard Aptos/Movement payload and pass it to `signAndSubmitTransaction`.

```typescript
const handleTransaction = () => {
  const payload = {
    function: '0x1::aptos_account::transfer',
    typeArguments: [],
    functionArguments: [recipientAddress, "1000000"] // 0.01 MOVE
  };

  // This redirects the user to the Column Wallet for approval
  window.location.href = sdk.signAndSubmitTransaction(payload);
};
```

### 5. Disconnecting
Simply clear your local state and storage.

```typescript
const handleDisconnect = () => {
  localStorage.removeItem('wallet_address');
  localStorage.removeItem('enc_pk');
  setAddress(null);
};
```

---

## 🔄 Multi-dApp & Cross-App Compatibility

The Column SDK is designed to handle multiple dApps (or multiple instances of your own apps) simultaneously on the same device.

### 1. Unique Session Identities
Every time the SDK is initialized, it generates a unique cryptographic "Session Key". Even if you have 3 different apps on your phone using Column, they each have their own private "conversation" with the wallet. They never cross-talk.

### 2. Precise Redirects
The Wallet uses the exact `redirect_link` (Web) or `scheme` (Native) provided in the request to return the user. 
*   **Web dApp A** returns to `https://dapp-a.com`
*   **Web dApp B** returns to `https://dapp-b.com`
*   **Native App C** returns to `myapp-c://`

### 3. Best Practices for Production
*   **Unique App URLs**: Always provide a unique `appUrl` in your config. This is how the wallet identifies and groups your session in the user's history.
*   **Unique Native Schemes**: Ensure every mobile app has a unique `scheme` in its `app.json`.
*   **Session Storage**: To keep users logged in across refreshes, store the `sessionSecretKey` in Secure Storage and pass it to the constructor on next launch.

---

Need help? Reach out to the **Column Labs** team. 🚀
