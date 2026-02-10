# Column Wallet Deep-Link Architecture & Implementation

This guide outlines the protocol for external dApps to communicate with the **Column Mobile Wallet**. The architecture follows the secure, encrypted handshake model popularized by Phantom and Nightly, adapted for the **Movement/Aptos** ecosystem.

---

## 1. Handshake & Security Model

Communication is **stateless** and **asynchronous**, relying on encrypted payloads to prevent man-in-the-middle attacks.

### Key Components
- **Encryption**: X25519 (Elliptic Curve Diffie-Hellman) for key exchange.
- **Authentication**: Salsa20/Poly1305 (via `tweetnacl`) for authenticated encryption.
- **Payload Encoding**: Base58 (recommended for URL safety and standard wallet compatibility).

### Handshake Flow
1. **DApp** generates an ephemeral key pair for the session.
2. **DApp** sends its `public_key` to Column via a deep link.
3. **Column** generates its own ephemeral key pair and computes a **Shared Secret**.
4. **Column** responds with its `public_key` and an encrypted payload.
5. **DApp** computes the same **Shared Secret** and decrypts the response.

---

## 2. URL Specification

### Base URI
`column://v1/[method]`

### Required Parameters (Universal)
Every request should include:
- `dapp_encryption_public_key`: Base58 encoded X25519 public key.
- `redirect_link`: URL encoded callback (e.g., `my-app://onDeepLink`).

---

## 3. Supported Methods

### `connect`
Establish a session and share the wallet's public address.

**Request:**
`column://v1/connect?app_url=[DAPP_URL]&dapp_encryption_public_key=[PK]&redirect_link=[URL]`

**Response Payload (Encrypted):**
```json
{
  "public_key": "Base58_Aptos_PubKey",
  "address": "0x...",
  "session": "Session_Identifier_Token"
}
```

---

### `signTransaction`
Signs a transaction but does **not** submit it to the network.

**Request Parameters:**
- `transaction`: Base58 encoded BCS transaction payload.
- `session`: The token received during `connect`.

**Response Payload (Encrypted):**
```json
{
  "signed_transaction": "Base58_Encoded_Signed_TX"
}
```

---

### `signAndSubmitTransaction`
Signs a transaction and broadcasts it to the Movement network.

**Request Parameters:**
- `transaction`: Base58 encoded BCS transaction payload.
- `session`: The token received during `connect`.

**Response Payload (Encrypted):**
```json
{
  "signature": "...",
  "transaction_hash": "0x..."
}
```

---

### `signMessage`
Signs an arbitrary UTF-8 string/message.

**Request Parameters:**
- `message`: Base58 encoded UTF-8 string.
- `session`: The token received during `connect`.

**Response Payload (Encrypted):**
```json
{
  "signature": "..."
}
```

---

### `disconnect`
Invalidates the current session.

**Request Parameters:**
- `session`: The token to invalidate.

---

## 4. Column Wallet SDK Implementation Plan

To make it easy for developers, Column will offer a `@column-labs/wallet-sdk` that:

1.  **Wraps `Linking`**: Automatically handles opening the wallet and listening for the redirect response.
2.  **Manages Keys**: Stores ephemeral session keys in the dApp's local storage.
3.  **Handles Cryptography**: Bundles `tweetnacl` to handle encryption/decryption transparently.
4.  **Transaction Helpers**: Provides utilities to convert standard Move payloads into the required Base58 BCS format.

### Example SDK Usage:
```typescript
import { ColumnWalletSDK } from '@column-labs/wallet-sdk';

const wallet = new ColumnWalletSDK({
  appUrl: 'https://my-dapp.io',
  redirectLink: 'myapp://onResponse'
});

// 1. Connect
const { address } = await wallet.connect();

// 2. Sign and Submit
const txPayload = {
  function: '0x1::coin::transfer',
  type_arguments: ['0x1::aptos_coin::AptosCoin'],
  arguments: [recipient, 1000]
};
const { transactionHash } = await wallet.signAndSubmitTransaction(txPayload);
```

### 4.1 DApp-Side Experience: The Connect Modal
To ensure a high conversion rate, the Column SDK provides a pre-built **Connect Modal** for dApp developers. This modal handles the "Wallet Discovery" phase:

1.  **DApp Interaction**: The user clicks a "Connect Wallet" button on the dApp.
2.  **SDK Modal**: A modal pops up showing supported wallets (with Column as a featured option).
3.  **Handoff**: Upon selecting Column, the SDK:
    *   Generates session keys.
    *   Constructs the `column://v1/connect` URL.
    *   Triggers the system redirect to the Column Mobile app.
4.  **Wallet Side**: Column opens, shows the `DeepLinkApprovalModal`, and performs the signature.
5.  **Return**: Column redirects back to the dApp's `redirect_link`.

---

## 5. UI/UX Standards: The Approval Modal

The deep-link interaction is driven by a premium, glassmorphic **Approval Modal** (`DeepLinkApprovalModal.tsx`). This modal serves as the final security gate before any action is taken.

### Modal Features:
- **Slide-up Bottom Sheet**: High-end animation that overlays the wallet content.
- **Amber Primary Buttons**: Consistent with the "Satoshi" premium brand.
- **DApp Context**: Displays the requesting dApp's name, URL, and icon for verification.
- **Explicit Permissions**: Clearly states what information is being shared (e.g., "This DApp will see your public address").

### Visual Flow:
1.  **Deep Link Received**: The app parses the `column://` URL.
2.  **Modal Triggered**: The `DeepLinkApprovalModal` slides up automatically.
3.  **User Choice**:
    *   **Approve**: The wallet signs the request and redirects back to the dApp with the encrypted payload.
    *   **Decline**: The wallet redirects with an error code or simply closes the modal, keeping the user in the secure Column environment.
