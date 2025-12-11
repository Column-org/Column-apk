# Web3 Wallet Implementation Roadmap

## Executive Summary

This document analyzes the current Privy-based embedded wallet implementation and provides a comprehensive roadmap for implementing a full Web3 wallet with Aptos provider capabilities, including wallet creation, private key management, transaction signing, and DApp browser functionality on the Movement network.

---

## Current State Analysis

### Privy Embedded Wallet Architecture

**What Privy Provides:**
- Email-based authentication with embedded wallets
- Movement/Aptos chain wallet creation via `@privy-io/expo/extended-chains`
- Basic wallet address management
- Backend-assisted transaction signing using `signRawHash`

**What Privy DOES NOT Provide:**
- Direct private key access or export
- Seedphrase-based wallet import
- Client-side transaction signing
- Aptos wallet provider for DApp interactions
- Full custody control for users

**Current Files:**
- `hooks/usePrivySigning.ts` - Privy wallet signing interface
- `components/Login/PrivyUI.tsx` - Email authentication UI
- Backend endpoints: `/generate-hash`, `/submit-transaction`

### Current Transaction Signing Flow

```
User Action → Frontend calls backend → Backend creates transaction →
Backend serializes & hashes → Frontend calls privy.signRawHash() →
Backend submits signed transaction
```

**Problems:**
1. Backend dependency for every transaction
2. No direct BCS encoding on client
3. Cannot interact with standard DApps
4. Users don't control private keys
5. No Aptos wallet adapter support

### Movement Network Integration

**Current Implementation:**
- Custom RPC: `https://devnet.movementlabs.xyz/v1` (deprecated)
- Testnet RPC: `https://testnet.movementnetwork.xyz/v1`
- Smart contracts for send-to-code functionality
- No direct @aptos-labs/ts-sdk usage

**Files:**
- `services/movement_service/constants.ts` - Network config
- `services/movement_service/sendTransactions.ts` - Send operations
- `hooks/useMovement.ts` - Transaction helpers

---

## Proposed Web3 Wallet Implementation

### Lite Mode vs Pro Mode Architecture

The app will offer two distinct modes at login, with the entire app behavior adapting based on user selection:

#### **Login Flow**

```
┌─────────────────────────────────────────────────────────┐
│              Welcome to Satoshi Wallet                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │              🌟 LITE MODE                         │  │
│  │          Simple & Easy                            │  │
│  │                                                     │  │
│  │  ✓ Email login (Privy)                            │  │
│  │  ✓ Instant setup, no seed phrases                 │  │
│  │  ✓ Perfect for beginners                          │  │
│  │  ✓ Send, receive, save                            │  │
│  │                                                     │  │
│  │  [Continue with Email] 📧                         │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │              🔐 PRO MODE                          │  │
│  │          Full Control                             │  │
│  │                                                     │  │
│  │  ✓ Your keys, your crypto                         │  │
│  │  ✓ Import existing wallets                        │  │
│  │  ✓ DApp browser access                            │  │
│  │  ✓ Advanced features                              │  │
│  │                                                     │  │
│  │  [Get Started] 🚀                                 │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

#### **Pro Mode Setup Options**

When user selects Pro Mode, they see:

```
┌─────────────────────────────────────────────────────────┐
│                  Pro Mode Setup                         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  [Create New Wallet] 🆕                           │  │
│  │  Generate a new wallet with seed phrase           │  │
│  │  • 12-word recovery phrase                        │  │
│  │  • Full ownership & control                       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  [Import Private Key] 🔑                          │  │
│  │  Paste your existing private key                  │  │
│  │  • Supports 0x... format                          │  │
│  │  • Instant import                                 │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  [Import Seed Phrase] 📝                          │  │
│  │  Enter your 12 or 24 word recovery phrase         │  │
│  │  • BIP39 compatible                               │  │
│  │  • Restore existing wallet                        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ← Back to mode selection                                │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Mode Comparison

| Feature | Lite Mode (Privy) | Pro Mode (Web3) |
|---------|------------------|-----------------|
| **Setup Time** | < 30 seconds | 2-5 minutes |
| **Login Method** | Email/Phone | Private Key/Seedphrase |
| **Custody** | Privy-managed | Self-custodial |
| **Recovery** | Email recovery | Seed phrase only |
| **Private Key Access** | ❌ No | ✅ Yes |
| **Seed Phrase** | ❌ Not needed | ✅ Required |
| **Transaction Signing** | Backend-assisted | Client-side |
| **DApp Browser** | ❌ Not available | ✅ Full access |
| **Import Existing Wallet** | ❌ No | ✅ Yes |
| **Export Wallet** | ❌ No | ✅ Yes |
| **Best For** | Beginners, convenience | Advanced users, power users |

### Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Satoshi Wallet App                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Mode Selection at Login (stored in SecureStore)         │
│  ┌─────────────┐                  ┌──────────────────┐  │
│  │  LITE MODE  │                  │    PRO MODE      │  │
│  │   (Privy)   │                  │  (Web3 Wallet)   │  │
│  └──────┬──────┘                  └────────┬─────────┘  │
│         │                                  │             │
│         │                                  │             │
│         ▼                                  ▼             │
│  ┌─────────────┐                  ┌──────────────────┐  │
│  │ Email Auth  │                  │ Key Management   │  │
│  │ Privy SDK   │                  │ - Create wallet  │  │
│  │ Backend TXs │                  │ - Import privkey │  │
│  │             │                  │ - Import seed    │  │
│  └─────────────┘                  │ - Export seed    │  │
│                                   └──────────────────┘  │
│                                            │             │
│  ┌────────────────────────────────────────┼──────────┐  │
│  │               App Features              │          │  │
│  │  - Send & Receive                      │          │  │
│  │  - Token Management                    │          │  │
│  │  - Savings Goals                       │          │  │
│  │  - Transaction History                 │          │  │
│  └────────────────────────────────────────┼──────────┘  │
│                                            │             │
│                                   ┌────────▼─────────┐  │
│                                   │  DApp Browser    │  │
│                                   │  (Pro Mode Only) │  │
│                                   │  - Aptos provider│  │
│                                   │  - WalletConnect │  │
│                                   └──────────────────┘  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### App Behavior Based on Mode

**Lite Mode (Privy):**
- Email login → Privy creates embedded wallet
- Transactions signed through backend (`/generate-hash`, `/submit-transaction`)
- No access to DApp browser tab
- Settings show: "Upgrade to Pro Mode" option
- Limited to basic send/receive/save features

**Pro Mode (Web3):**
- Key-based authentication (private key/seedphrase)
- Transactions signed client-side using @aptos-labs/ts-sdk
- Full access to DApp browser tab
- Settings show: "Export Seed Phrase", "View Private Key"
- Access to all advanced features
- Can connect to external DApps

---

## Implementation Roadmap

### Phase 1: Wallet Creation & Import (Foundation)

**Duration Estimate:** Foundation phase
**Priority:** Critical

#### 1.1 Install Dependencies

```bash
npm install @aptos-labs/ts-sdk bip39 tweetnacl
```

#### 1.2 Create Wallet Manager Service

**File:** `services/walletManager/WalletManager.ts`

```typescript
import { Account, Ed25519PrivateKey, Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk'
import * as SecureStore from 'expo-secure-store'
import * as bip39 from 'bip39'

const WALLET_MNEMONIC_KEY = 'wallet_mnemonic'
const WALLET_PRIVATE_KEY = 'wallet_private_key'
const WALLET_TYPE_KEY = 'wallet_type' // 'mnemonic' | 'privateKey' | 'privy'

export class WalletManager {
  private account: Account | null = null
  private aptosClient: Aptos

  constructor() {
    const config = new AptosConfig({
      network: Network.CUSTOM,
      fullnode: 'https://testnet.movementnetwork.xyz/v1'
    })
    this.aptosClient = new Aptos(config)
  }

  // Create new wallet with mnemonic
  async createWallet(): Promise<{ address: string; mnemonic: string }> {
    // Generate 12-word mnemonic
    const mnemonic = bip39.generateMnemonic(128)

    // Derive private key from mnemonic (BIP44 path for Aptos)
    const seed = await bip39.mnemonicToSeed(mnemonic)
    const privateKey = new Ed25519PrivateKey(seed.slice(0, 32))

    // Create account
    this.account = Account.fromPrivateKey({ privateKey })

    // Store securely
    await SecureStore.setItemAsync(WALLET_MNEMONIC_KEY, mnemonic)
    await SecureStore.setItemAsync(WALLET_TYPE_KEY, 'mnemonic')

    return {
      address: this.account.accountAddress.toString(),
      mnemonic
    }
  }

  // Import wallet from private key
  async importFromPrivateKey(privateKeyHex: string): Promise<string> {
    // Remove 0x prefix if present
    const cleanKey = privateKeyHex.startsWith('0x')
      ? privateKeyHex.slice(2)
      : privateKeyHex

    const privateKey = new Ed25519PrivateKey(cleanKey)
    this.account = Account.fromPrivateKey({ privateKey })

    // Store securely (encrypted)
    await SecureStore.setItemAsync(WALLET_PRIVATE_KEY, cleanKey)
    await SecureStore.setItemAsync(WALLET_TYPE_KEY, 'privateKey')

    return this.account.accountAddress.toString()
  }

  // Import wallet from seedphrase
  async importFromSeedphrase(mnemonic: string): Promise<string> {
    // Validate mnemonic
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid seedphrase')
    }

    // Derive private key from mnemonic
    const seed = await bip39.mnemonicToSeed(mnemonic)
    const privateKey = new Ed25519PrivateKey(seed.slice(0, 32))

    this.account = Account.fromPrivateKey({ privateKey })

    // Store securely
    await SecureStore.setItemAsync(WALLET_MNEMONIC_KEY, mnemonic)
    await SecureStore.setItemAsync(WALLET_TYPE_KEY, 'mnemonic')

    return this.account.accountAddress.toString()
  }

  // Load existing wallet
  async loadWallet(): Promise<Account | null> {
    const walletType = await SecureStore.getItemAsync(WALLET_TYPE_KEY)

    if (!walletType) return null

    if (walletType === 'mnemonic') {
      const mnemonic = await SecureStore.getItemAsync(WALLET_MNEMONIC_KEY)
      if (!mnemonic) return null

      const seed = await bip39.mnemonicToSeed(mnemonic)
      const privateKey = new Ed25519PrivateKey(seed.slice(0, 32))
      this.account = Account.fromPrivateKey({ privateKey })
    } else if (walletType === 'privateKey') {
      const privateKeyHex = await SecureStore.getItemAsync(WALLET_PRIVATE_KEY)
      if (!privateKeyHex) return null

      const privateKey = new Ed25519PrivateKey(privateKeyHex)
      this.account = Account.fromPrivateKey({ privateKey })
    }

    return this.account
  }

  // Export seedphrase (for backup)
  async exportSeedphrase(): Promise<string | null> {
    const walletType = await SecureStore.getItemAsync(WALLET_TYPE_KEY)
    if (walletType !== 'mnemonic') return null

    return await SecureStore.getItemAsync(WALLET_MNEMONIC_KEY)
  }

  // Delete wallet
  async deleteWallet(): Promise<void> {
    await SecureStore.deleteItemAsync(WALLET_MNEMONIC_KEY)
    await SecureStore.deleteItemAsync(WALLET_PRIVATE_KEY)
    await SecureStore.deleteItemAsync(WALLET_TYPE_KEY)
    this.account = null
  }

  getAccount(): Account | null {
    return this.account
  }

  getAddress(): string | null {
    return this.account?.accountAddress.toString() || null
  }
}
```

#### 1.3 Create Wallet Context

**File:** `context/WalletContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { WalletManager } from '../services/walletManager/WalletManager'
import { Account } from '@aptos-labs/ts-sdk'

interface WalletContextType {
  walletType: 'privy' | 'web3' | null
  account: Account | null
  address: string | null
  isLoading: boolean

  // Web3 Wallet Methods
  createWeb3Wallet: () => Promise<{ address: string; mnemonic: string }>
  importFromPrivateKey: (privateKey: string) => Promise<string>
  importFromSeedphrase: (mnemonic: string) => Promise<string>
  exportSeedphrase: () => Promise<string | null>
  deleteWeb3Wallet: () => Promise<void>

  // Switch between wallet types
  switchToPrivy: () => void
  switchToWeb3: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [walletManager] = useState(() => new WalletManager())
  const [walletType, setWalletType] = useState<'privy' | 'web3' | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load wallet on mount
  useEffect(() => {
    const loadWallet = async () => {
      setIsLoading(true)
      try {
        const loadedAccount = await walletManager.loadWallet()
        if (loadedAccount) {
          setAccount(loadedAccount)
          setAddress(loadedAccount.accountAddress.toString())
          setWalletType('web3')
        }
      } catch (error) {
        console.error('Failed to load wallet:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadWallet()
  }, [])

  const createWeb3Wallet = useCallback(async () => {
    const result = await walletManager.createWallet()
    const loadedAccount = await walletManager.loadWallet()
    setAccount(loadedAccount)
    setAddress(result.address)
    setWalletType('web3')
    return result
  }, [walletManager])

  const importFromPrivateKey = useCallback(async (privateKey: string) => {
    const address = await walletManager.importFromPrivateKey(privateKey)
    const loadedAccount = await walletManager.loadWallet()
    setAccount(loadedAccount)
    setAddress(address)
    setWalletType('web3')
    return address
  }, [walletManager])

  const importFromSeedphrase = useCallback(async (mnemonic: string) => {
    const address = await walletManager.importFromSeedphrase(mnemonic)
    const loadedAccount = await walletManager.loadWallet()
    setAccount(loadedAccount)
    setAddress(address)
    setWalletType('web3')
    return address
  }, [walletManager])

  const exportSeedphrase = useCallback(async () => {
    return await walletManager.exportSeedphrase()
  }, [walletManager])

  const deleteWeb3Wallet = useCallback(async () => {
    await walletManager.deleteWallet()
    setAccount(null)
    setAddress(null)
    setWalletType(null)
  }, [walletManager])

  const switchToPrivy = useCallback(() => {
    setWalletType('privy')
  }, [])

  const switchToWeb3 = useCallback(() => {
    setWalletType('web3')
  }, [])

  return (
    <WalletContext.Provider
      value={{
        walletType,
        account,
        address,
        isLoading,
        createWeb3Wallet,
        importFromPrivateKey,
        importFromSeedphrase,
        exportSeedphrase,
        deleteWeb3Wallet,
        switchToPrivy,
        switchToWeb3,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
```

---

### Phase 2: Direct Transaction Signing

**Duration Estimate:** Core functionality phase
**Priority:** Critical

#### 2.1 Create Transaction Service

**File:** `services/walletManager/TransactionService.ts`

```typescript
import {
  Account,
  Aptos,
  AptosConfig,
  Network,
  InputGenerateTransactionPayloadData,
  SimpleTransaction,
} from '@aptos-labs/ts-sdk'

export class TransactionService {
  private aptosClient: Aptos

  constructor() {
    const config = new AptosConfig({
      network: Network.CUSTOM,
      fullnode: 'https://testnet.movementnetwork.xyz/v1'
    })
    this.aptosClient = new Aptos(config)
  }

  // Simple transfer (replaces backend-assisted flow)
  async transfer(
    account: Account,
    toAddress: string,
    amount: number
  ): Promise<string> {
    // Build transaction
    const transaction = await this.aptosClient.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: '0x1::coin::transfer',
        typeArguments: ['0x1::aptos_coin::AptosCoin'],
        functionArguments: [toAddress, amount],
      },
    })

    // Sign transaction (client-side)
    const signedTransaction = await this.aptosClient.transaction.sign({
      signer: account,
      transaction,
    })

    // Submit transaction
    const pendingTransaction = await this.aptosClient.transaction.submit.simple({
      transaction,
      senderAuthenticator: signedTransaction,
    })

    // Wait for confirmation
    const committedTransaction = await this.aptosClient.waitForTransaction({
      transactionHash: pendingTransaction.hash,
    })

    return committedTransaction.hash
  }

  // Generic contract interaction
  async executeTransaction(
    account: Account,
    payload: InputGenerateTransactionPayloadData
  ): Promise<string> {
    // Build transaction
    const transaction = await this.aptosClient.transaction.build.simple({
      sender: account.accountAddress,
      data: payload,
    })

    // Sign transaction
    const signedTransaction = await this.aptosClient.transaction.sign({
      signer: account,
      transaction,
    })

    // Submit transaction
    const pendingTransaction = await this.aptosClient.transaction.submit.simple({
      transaction,
      senderAuthenticator: signedTransaction,
    })

    // Wait for confirmation
    const committedTransaction = await this.aptosClient.waitForTransaction({
      transactionHash: pendingTransaction.hash,
    })

    return committedTransaction.hash
  }

  // Get transaction history
  async getTransactionHistory(address: string, limit: number = 25) {
    return await this.aptosClient.getAccountTransactions({
      accountAddress: address,
      options: { limit },
    })
  }

  // Get account balance
  async getBalance(address: string): Promise<number> {
    const resources = await this.aptosClient.getAccountResources({
      accountAddress: address,
    })

    const coinResource = resources.find(
      (r: any) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
    )

    return coinResource ? parseInt((coinResource.data as any).coin.value) : 0
  }
}
```

#### 2.2 Update Send Transaction Hook

**File:** `hooks/useWeb3Transaction.ts`

```typescript
import { useState, useCallback } from 'react'
import { TransactionService } from '../services/walletManager/TransactionService'
import { useWallet } from '../context/WalletContext'

export function useWeb3Transaction() {
  const { account, walletType } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const transactionService = new TransactionService()

  const sendTransaction = useCallback(
    async (toAddress: string, amount: number) => {
      if (walletType !== 'web3' || !account) {
        throw new Error('Web3 wallet not available')
      }

      setIsLoading(true)
      setError(null)

      try {
        // Direct client-side signing - NO BACKEND NEEDED
        const txHash = await transactionService.transfer(
          account,
          toAddress,
          amount
        )

        return { success: true, hash: txHash }
      } catch (err: any) {
        setError(err.message)
        return { success: false, error: err.message }
      } finally {
        setIsLoading(false)
      }
    },
    [account, walletType]
  )

  return { sendTransaction, isLoading, error }
}
```

---

### Phase 3: DApp Browser Integration

**Duration Estimate:** Major feature phase
**Priority:** High

#### 3.1 Aptos Wallet Provider

**File:** `services/dapp/AptosWalletProvider.ts`

```typescript
import { Account } from '@aptos-labs/ts-sdk'
import { TransactionService } from '../walletManager/TransactionService'

export class AptosWalletProvider {
  private account: Account
  private transactionService: TransactionService
  private connectedOrigin: string | null = null

  constructor(account: Account) {
    this.account = account
    this.transactionService = new TransactionService()
  }

  // Standard Aptos wallet adapter interface
  async connect(origin: string): Promise<{ address: string; publicKey: string }> {
    this.connectedOrigin = origin
    return {
      address: this.account.accountAddress.toString(),
      publicKey: this.account.publicKey.toString(),
    }
  }

  async disconnect(): Promise<void> {
    this.connectedOrigin = null
  }

  async isConnected(): Promise<boolean> {
    return this.connectedOrigin !== null
  }

  async getAccount(): Promise<{ address: string; publicKey: string }> {
    return {
      address: this.account.accountAddress.toString(),
      publicKey: this.account.publicKey.toString(),
    }
  }

  async signAndSubmitTransaction(payload: any): Promise<{ hash: string }> {
    if (!this.connectedOrigin) {
      throw new Error('Not connected to any DApp')
    }

    const hash = await this.transactionService.executeTransaction(
      this.account,
      payload
    )

    return { hash }
  }

  async signMessage(message: string): Promise<{ signature: string }> {
    // Sign arbitrary message
    const encoder = new TextEncoder()
    const messageBytes = encoder.encode(message)
    const signature = this.account.sign(messageBytes)

    return { signature: signature.toString() }
  }

  async getNetwork(): Promise<{ name: string; chainId: string }> {
    return {
      name: 'Movement Testnet',
      chainId: '177',
    }
  }
}
```

#### 3.2 DApp Browser Component

**File:** `components/DAppBrowser/DAppBrowser.tsx`

```typescript
import React, { useRef, useState, useEffect } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { WebView } from 'react-native-webview'
import { useWallet } from '../../context/WalletContext'
import { AptosWalletProvider } from '../../services/dapp/AptosWalletProvider'

interface DAppBrowserProps {
  url: string
  onNavigationChange?: (url: string) => void
}

export function DAppBrowser({ url, onNavigationChange }: DAppBrowserProps) {
  const webViewRef = useRef<WebView>(null)
  const { account, walletType } = useWallet()
  const [isLoading, setIsLoading] = useState(true)
  const [walletProvider, setWalletProvider] = useState<AptosWalletProvider | null>(null)

  useEffect(() => {
    if (account && walletType === 'web3') {
      setWalletProvider(new AptosWalletProvider(account))
    }
  }, [account, walletType])

  // Inject Aptos wallet provider into webpage
  const injectedJavaScript = `
    (function() {
      // Create window.aptos provider
      window.aptos = {
        connect: async () => {
          return new Promise((resolve) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'APTOS_CONNECT',
            }))

            // Listen for response
            const listener = (event) => {
              const data = JSON.parse(event.data)
              if (data.type === 'APTOS_CONNECT_RESPONSE') {
                window.removeEventListener('message', listener)
                resolve(data.payload)
              }
            }
            window.addEventListener('message', listener)
          })
        },

        disconnect: async () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'APTOS_DISCONNECT',
          }))
        },

        account: async () => {
          return new Promise((resolve) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'APTOS_ACCOUNT',
            }))

            const listener = (event) => {
              const data = JSON.parse(event.data)
              if (data.type === 'APTOS_ACCOUNT_RESPONSE') {
                window.removeEventListener('message', listener)
                resolve(data.payload)
              }
            }
            window.addEventListener('message', listener)
          })
        },

        signAndSubmitTransaction: async (payload) => {
          return new Promise((resolve, reject) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'APTOS_SIGN_AND_SUBMIT',
              payload: payload,
            }))

            const listener = (event) => {
              const data = JSON.parse(event.data)
              if (data.type === 'APTOS_SIGN_AND_SUBMIT_RESPONSE') {
                window.removeEventListener('message', listener)
                if (data.error) {
                  reject(new Error(data.error))
                } else {
                  resolve(data.payload)
                }
              }
            }
            window.addEventListener('message', listener)
          })
        },

        isConnected: () => true,
      }

      // Signal that wallet is ready
      window.dispatchEvent(new Event('aptos#initialized'))

      console.log('Satoshi Wallet injected successfully')
    })()
    true;
  `

  const handleMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data)

      switch (message.type) {
        case 'APTOS_CONNECT':
          if (walletProvider) {
            const result = await walletProvider.connect(url)
            webViewRef.current?.postMessage(
              JSON.stringify({
                type: 'APTOS_CONNECT_RESPONSE',
                payload: result,
              })
            )
          }
          break

        case 'APTOS_DISCONNECT':
          if (walletProvider) {
            await walletProvider.disconnect()
          }
          break

        case 'APTOS_ACCOUNT':
          if (walletProvider) {
            const account = await walletProvider.getAccount()
            webViewRef.current?.postMessage(
              JSON.stringify({
                type: 'APTOS_ACCOUNT_RESPONSE',
                payload: account,
              })
            )
          }
          break

        case 'APTOS_SIGN_AND_SUBMIT':
          if (walletProvider) {
            try {
              const result = await walletProvider.signAndSubmitTransaction(
                message.payload
              )
              webViewRef.current?.postMessage(
                JSON.stringify({
                  type: 'APTOS_SIGN_AND_SUBMIT_RESPONSE',
                  payload: result,
                })
              )
            } catch (error: any) {
              webViewRef.current?.postMessage(
                JSON.stringify({
                  type: 'APTOS_SIGN_AND_SUBMIT_RESPONSE',
                  error: error.message,
                })
              )
            }
          }
          break
      }
    } catch (error) {
      console.error('Error handling message from DApp:', error)
    }
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
        onMessage={handleMessage}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onNavigationStateChange={(navState) => {
          onNavigationChange?.(navState.url)
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffda34" />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121315',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121315',
  },
})
```

#### 3.3 Browser Screen

**File:** `app/(tabs)/browser.tsx`

```typescript
import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { DAppBrowser } from '../../components/DAppBrowser/DAppBrowser'
import { useWallet } from '../../context/WalletContext'

export default function BrowserScreen() {
  const { walletType } = useWallet()
  const [url, setUrl] = useState('')
  const [currentUrl, setCurrentUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleNavigate = () => {
    let formattedUrl = url.trim()

    // Add https:// if no protocol specified
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl
    }

    setCurrentUrl(formattedUrl)
  }

  if (walletType !== 'web3') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.emptyState}>
          <Ionicons name="globe-outline" size={64} color="#8B98A5" />
          <Text style={styles.emptyTitle}>Web3 Wallet Required</Text>
          <Text style={styles.emptyDescription}>
            You need to create or import a Web3 wallet to use the DApp browser
          </Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* URL Bar */}
      <View style={styles.urlBar}>
        <TextInput
          style={styles.urlInput}
          value={url}
          onChangeText={setUrl}
          placeholder="Enter URL or search..."
          placeholderTextColor="#8B98A5"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={handleNavigate}
        />
        <TouchableOpacity onPress={handleNavigate} style={styles.goButton}>
          <Ionicons name="arrow-forward" size={20} color="#121315" />
        </TouchableOpacity>
      </View>

      {/* Browser */}
      {currentUrl ? (
        <DAppBrowser
          url={currentUrl}
          onNavigationChange={(newUrl) => {
            setUrl(newUrl)
            setCurrentUrl(newUrl)
          }}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="compass-outline" size={64} color="#8B98A5" />
          <Text style={styles.emptyTitle}>Explore DApps</Text>
          <Text style={styles.emptyDescription}>
            Enter a URL above to start browsing decentralized applications
          </Text>

          {/* Popular DApps */}
          <View style={styles.dappSuggestions}>
            <Text style={styles.suggestionsTitle}>Popular DApps</Text>
            <TouchableOpacity
              style={styles.dappCard}
              onPress={() => {
                setUrl('https://pancakeswap.finance')
                setCurrentUrl('https://pancakeswap.finance')
              }}
            >
              <Text style={styles.dappName}>PancakeSwap</Text>
              <Text style={styles.dappUrl}>pancakeswap.finance</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121315',
  },
  urlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#222327',
    gap: 8,
  },
  urlInput: {
    flex: 1,
    backgroundColor: '#121315',
    color: 'white',
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  goButton: {
    backgroundColor: '#ffda34',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#8B98A5',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  dappSuggestions: {
    marginTop: 40,
    width: '100%',
  },
  suggestionsTitle: {
    color: '#8B98A5',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  dappCard: {
    backgroundColor: '#222327',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  dappName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dappUrl: {
    color: '#8B98A5',
    fontSize: 13,
  },
})
```

---

### Phase 4: Migration & Coexistence Strategy

**Duration Estimate:** Integration phase
**Priority:** Medium

#### 4.1 Wallet Selection Screen

**File:** `app/walletSetup.tsx`

```typescript
import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function WalletSetup() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Choose Your Wallet</Text>
        <Text style={styles.subtitle}>
          Select how you want to manage your assets
        </Text>

        {/* Privy Option */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push('/privySetup')}
        >
          <View style={styles.optionIcon}>
            <Ionicons name="mail" size={32} color="#ffda34" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Privy Wallet (Easy)</Text>
            <Text style={styles.optionDescription}>
              Email-based wallet. Quick setup, no seed phrase needed. Ideal for beginners.
            </Text>
            <View style={styles.featuresList}>
              <Text style={styles.feature}>✓ Email login</Text>
              <Text style={styles.feature}>✓ No seed phrases</Text>
              <Text style={styles.feature}>✓ Easy recovery</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Web3 Wallet Option */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push('/web3Setup')}
        >
          <View style={styles.optionIcon}>
            <Ionicons name="key" size={32} color="#ffda34" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Web3 Wallet (Advanced)</Text>
            <Text style={styles.optionDescription}>
              Self-custodial wallet with full control. For experienced users.
            </Text>
            <View style={styles.featuresList}>
              <Text style={styles.feature}>✓ Full private key control</Text>
              <Text style={styles.feature}>✓ Import existing wallets</Text>
              <Text style={styles.feature}>✓ DApp browser access</Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121315',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#8B98A5',
    fontSize: 16,
    marginBottom: 40,
  },
  optionCard: {
    backgroundColor: '#222327',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 218, 52, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  optionDescription: {
    color: '#8B98A5',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  featuresList: {
    gap: 4,
  },
  feature: {
    color: '#ffda34',
    fontSize: 13,
  },
})
```

#### 4.2 Update App Entry Point

Modify `app/index.tsx` to include wallet selection flow:

```typescript
// Check if user has any wallet setup
const hasPrivyWallet = user?.linked_accounts?.some(
  (account: any) => account.type === 'wallet'
)
const hasWeb3Wallet = walletAddress !== null

if (!hasPrivyWallet && !hasWeb3Wallet) {
  // First time user - show wallet setup
  router.replace('/walletSetup')
} else {
  // User has wallet - go to home
  router.replace('/(tabs)/home')
}
```

---

## Security Considerations

### 1. Key Storage
- **Current**: Use `expo-secure-store` with hardware-backed keystore on both iOS and Android
- **Encryption**: All private keys encrypted at rest
- **Biometric protection**: Require face ID/fingerprint for sensitive operations

### 2. Transaction Signing
- **User confirmation**: Always show transaction details before signing
- **Gas fee estimation**: Display estimated fees
- **Simulation**: Test transactions before submission
- **Rate limiting**: Prevent rapid successive transactions

### 3. DApp Security
- **Origin verification**: Track connected DApp origins
- **Permission system**: Request user approval for each transaction
- **Phishing protection**: Warn users about suspicious domains
- **Session management**: Auto-disconnect after timeout

### 4. Backup & Recovery
- **Seedphrase backup**: Show once, require user confirmation
- **Cloud backup option**: Encrypted backup to iCloud/Google Drive (optional)
- **Export warnings**: Clearly communicate risks of exporting keys

---

## Testing Strategy

### 1. Wallet Creation & Import
- [ ] Create new wallet generates valid mnemonic
- [ ] Import from valid private key succeeds
- [ ] Import from valid seedphrase succeeds
- [ ] Invalid inputs are rejected with clear errors
- [ ] Keys are properly encrypted in secure store

### 2. Transaction Signing
- [ ] Simple transfers execute successfully
- [ ] Complex contract interactions work
- [ ] Failed transactions show proper errors
- [ ] Transaction history displays correctly
- [ ] Gas estimation is accurate

### 3. DApp Browser
- [ ] Wallet provider injects successfully
- [ ] Connection requests work
- [ ] Transaction signing from DApp functions
- [ ] Message signing works
- [ ] Disconnect cleans up properly

### 4. Security
- [ ] Biometric authentication works on both platforms
- [ ] App lock functions after timeout
- [ ] Private keys never exposed in logs
- [ ] Secure store properly isolated per user

---

## Deployment Checklist

### Pre-Launch
- [ ] Complete security audit of key management
- [ ] Test on multiple devices (iOS & Android)
- [ ] Verify Movement network compatibility
- [ ] Create user documentation
- [ ] Set up error monitoring
- [ ] Implement analytics for feature usage

### Launch Strategy
1. **Soft launch**: Release to existing Privy users as opt-in
2. **Beta period**: Gather feedback on Web3 features
3. **Full release**: Make Web3 wallet default for new users
4. **Migration support**: Help existing users transition

### Post-Launch
- [ ] Monitor transaction success rates
- [ ] Track DApp usage metrics
- [ ] Collect user feedback
- [ ] Iterate on UX improvements
- [ ] Add more DApp integrations

---

## Technical Dependencies

### Required Packages
```json
{
  "@aptos-labs/ts-sdk": "^1.28.0",
  "bip39": "^3.1.0",
  "tweetnacl": "^1.0.3",
  "expo-secure-store": "^13.0.2",
  "expo-local-authentication": "^14.0.1",
  "react-native-webview": "^13.6.4"
}
```

### Movement Network Configuration
- **Testnet RPC**: https://testnet.movementnetwork.xyz/v1
- **Chain ID**: 177
- **Faucet**: https://faucet.movementnetwork.xyz

---

## Timeline Estimate

| Phase | Tasks | Estimated Duration |
|-------|-------|-------------------|
| Phase 1 | Wallet creation & import | 2-3 weeks |
| Phase 2 | Direct transaction signing | 2 weeks |
| Phase 3 | DApp browser | 3-4 weeks |
| Phase 4 | Migration & testing | 2 weeks |
| **Total** | | **9-11 weeks** |

---

## Success Metrics

1. **Adoption Rate**: % of users choosing Web3 wallet
2. **Transaction Success Rate**: >95% successful transactions
3. **DApp Engagement**: Number of unique DApps visited
4. **User Satisfaction**: App store ratings improvement
5. **Security**: Zero key compromise incidents

---

## Conclusion

This roadmap transforms the Satoshi Wallet from a Privy-dependent embedded wallet into a full-featured Web3 wallet with Aptos provider capabilities. The phased approach allows for:

- **Incremental development** without disrupting existing users
- **Coexistence** of both wallet types during transition
- **User choice** between simplicity (Privy) and control (Web3)
- **DApp ecosystem** access through browser integration

The implementation prioritizes security, user experience, and compatibility with the Movement network ecosystem while maintaining the clean, modern UI that users expect.
