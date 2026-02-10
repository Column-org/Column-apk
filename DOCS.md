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

## 💎 Best Practices

1.  **Session Persistence**: Always check `localStorage` on page load to restore the user session.
2.  **Encryption Key Recovery**: You **must** call `sdk.setWalletEncryptionPublicKey(savedKey)` when restoring a session, or the SDK won't be able to encrypt your transaction requests.
3.  **URL Cleanup**: Always use `window.history.replaceState` after parsing a response to keep your app's URLs clean and prevent accidental double-processing.

---

## 📡 Redirect Logic Breakdown

| Parameter | Description |
| :--- | :--- |
| `address` | The user's wallet address (Aptos/Movement). |
| `public_key` | The user's account public key. |
| `column_encryption_public_key` | A unique key used to encrypt all future requests to the wallet. |
| `transaction_hash` | Returned after a successful `signAndSubmit` request. |
| `error` | Returned if the user declines or a failure occurs (e.g., `USER_DECLINED`). |

---

Need help? Reach out to the **Column Labs** team. 🚀
