# Column Wallet Deep-Link Specification

This document defines the deep-linking protocol for the Column Wallet, allowing external dApps and websites to interact with the wallet securely. Following the standards set by industry leaders like Phantom and Nightly, Column uses an encrypted handshake and payload system based on the **AIP-62** and **Solana/Phantom V1** specifications.

---

## 1. Core Concepts

### URL Schemes
- **Scheme**: `column://v1/`
- **Universal Link**: `https://column.app/ul/v1/` (Preferred for better UX and fallback to App Store)

### Security (Standard Encryption)
Column uses **Diffie-Hellman Key Exchange (X25519)** and **TweetNaCl** (Salsa20/Poly1305) to ensure all communication between the dApp and the wallet is private and tamper-proof.

1.  **Handshake**: The dApp generates an ephemeral session key pair.
2.  **Request**: The dApp sends its public key to Column via a deep link.
3.  **Response**: Column derives a shared secret, encrypts the response (public key, signature, etc.), and redirects back to the dApp.

---

## 2. The SDK-First Approach (Recommended)

While manual URL construction is possible, the **best approach** is to provide a dedicated **Column Wallet SDK** for web and mobile.

### Why an SDK?
- **Abstraction**: Handles ephemeral key generation and shared secret derivation automatically.
- **Error Handling**: Standardizes response parsing and decryption.
- **User Experience**: Provides a consistent transaction approval flow that matches the app's premium aesthetic.
- **Serialization**: Handles complex transaction serialization (BCS for Movement/Aptos).

---

## 3. Protocol Methods

### `connect`
Initial handshake to obtain the user's public key and establish an encrypted session.

**DApp Request:**
```
column://v1/connect?
  app_url=https://dapp.example.com&
  dapp_encryption_public_key=[Base58_DApp_PK]&
  redirect_link=dapp-scheme://onConnect
```

**Wallet Response:**
```
dapp-scheme://onConnect?
  nonce=[Base58_Nonce]&
  data=[Base58_Encrypted_Payload]
```
*The decrypted payload contains the user's `address` and `public_key`.*

---

### `signAndSendTransaction`
Signs a transaction and broadcasts it to the Movement network.

**DApp Request:**
```
column://v1/signAndSendTransaction?
  transaction=[Base58_BCS_Transaction]&
  encryption_public_key=[Base58_DApp_PK]&
  nonce=[Base58_Nonce]&
  data=[Base58_Encrypted_Metadata]&
  redirect_link=dapp-scheme://onTransaction
```

**Wallet Response:**
```
dapp-scheme://onTransaction?
  nonce=[Base58_Nonce]&
  data=[Base58_Encrypted_Payload]
```
*The decrypted payload contains the `signature` or `transaction_hash`.*

---

### `signMessage`
Signs an arbitrary UTF-8 string.

**DApp Request:**
```
column://v1/signMessage?
  message=[Base58_Message]&
  encryption_public_key=[Base58_DApp_PK]&
  redirect_link=dapp-scheme://onSign
```

---

## 4. Implementation Strategy

### Phase 1: The App Side (Wallet)
1.  **Deeplink Handler**: Implement `Linking.addEventListener` in `_layout.tsx` to catch `column://` URLs.
2.  **Request Manager**: A central service to parse, decrypt, and queue incoming requests.
3.  **Approval UI**: Create a glassmorphic "Transaction Request" modal using the `SweetAlert` or `AlertModal` patterns established in the Satoshi project.
4.  **Security**: Use `SecureStore` to persist session secrets for trusted dApps (to avoid re-connecting every time).

### Phase 2: The Client Side (SDK)
1.  **Column-link NPM Package**: A lightweight TypeScript SDK.
2.  **Encryption Wrapper**: Built-in support for `tweetnacl`.
3.  **Deep Link Listeners**: Helpers for dApps to listen for responses from Column.

---

## 5. UI/UX Vision

The deep-link interaction should feel like a premium extension of the app:
- **Slide-in from Top**: Using the same animation pattern as the new Themed Toasts.
- **Amber Accents**: Highlighting the "Sign" and "Approve" buttons.
- **Glassmorphism**: A semi-transparent overlay that blurs the background dApp (if using a DApp browser) or provides a sleek transition back to the originating app.
