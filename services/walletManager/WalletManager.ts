import { Account, Ed25519PrivateKey, PrivateKey, Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk'
import * as SecureStore from 'expo-secure-store'
import * as bip39 from 'bip39'

const WALLETS_LIST_KEY = 'wallets_list'
const ACTIVE_WALLET_ADDRESS_KEY = 'active_wallet_address'
const WALLET_SECRET_PREFIX = 'wallet_secret_'

const APTOS_DERIVATION_PATH = "m/44'/637'/0'/0'/0'"

export interface WalletMetadata {
    address: string
    name: string
    emoji?: string
    type: 'mnemonic' | 'privateKey'
}

import { DEFAULT_NETWORK, NETWORK_CONFIGS } from '../../constants/networkConfig'

export class WalletManager {
    private account: Account | null = null
    private aptosClient: Aptos
    private accountCache: Map<string, Account> = new Map()

    constructor() {
        const config = new AptosConfig({
            network: Network.CUSTOM,
            fullnode: NETWORK_CONFIGS[DEFAULT_NETWORK].rpcUrl
        })
        this.aptosClient = new Aptos(config)
    }

    private async deriveAccountFromMnemonic(mnemonic: string): Promise<Account> {
        return Account.fromDerivationPath({
            path: APTOS_DERIVATION_PATH,
            mnemonic
        })
    }

    private async saveWalletMetadata(metadata: WalletMetadata) {
        const wallets = await this.getAllWallets()
        const existingIndex = wallets.findIndex(w => w.address === metadata.address)

        if (existingIndex >= 0) {
            wallets[existingIndex] = metadata
        } else {
            wallets.push(metadata)
        }

        await SecureStore.setItemAsync(WALLETS_LIST_KEY, JSON.stringify(wallets))
        await SecureStore.setItemAsync(ACTIVE_WALLET_ADDRESS_KEY, metadata.address)
    }

    async getAllWallets(): Promise<WalletMetadata[]> {
        const walletsJson = await SecureStore.getItemAsync(WALLETS_LIST_KEY)
        return walletsJson ? JSON.parse(walletsJson) : []
    }

    async createWallet(name?: string): Promise<{ address: string; mnemonic: string }> {
        const mnemonic = bip39.generateMnemonic(128)
        this.account = await this.deriveAccountFromMnemonic(mnemonic)
        const address = this.account.accountAddress.toString()

        const wallets = await this.getAllWallets()
        const walletName = name || `Wallet ${wallets.length + 1}`

        await SecureStore.setItemAsync(`${WALLET_SECRET_PREFIX}${address}`, mnemonic)
        await SecureStore.setItemAsync(ACTIVE_WALLET_ADDRESS_KEY, address)
        await this.saveWalletMetadata({
            address,
            name: walletName,
            emoji: '💰',
            type: 'mnemonic'
        })

        // Cache the account for fast switching
        this.accountCache.set(address, this.account)

        return { address, mnemonic }
    }

    async importFromPrivateKey(privateKeyHex: string, name?: string): Promise<string> {
        const cleanKey = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex
        const formattedKey = PrivateKey.formatPrivateKey(cleanKey, 'ed25519' as any)
        const privateKey = new Ed25519PrivateKey(formattedKey)
        this.account = Account.fromPrivateKey({ privateKey })
        const address = this.account.accountAddress.toString()

        const wallets = await this.getAllWallets()
        const walletName = name || `Wallet ${wallets.length + 1}`

        await SecureStore.setItemAsync(`${WALLET_SECRET_PREFIX}${address}`, cleanKey)
        await this.saveWalletMetadata({
            address,
            name: walletName,
            emoji: '🌟',
            type: 'privateKey'
        })

        // Cache the account for fast switching
        this.accountCache.set(address, this.account)

        return address
    }

    async importFromSeedphrase(mnemonic: string, name?: string): Promise<string> {
        const normalizedMnemonic = mnemonic.trim().toLowerCase()
        if (!bip39.validateMnemonic(normalizedMnemonic)) {
            throw new Error('Invalid seedphrase')
        }

        this.account = await this.deriveAccountFromMnemonic(normalizedMnemonic)
        const address = this.account.accountAddress.toString()

        const wallets = await this.getAllWallets()
        const walletName = name || `Wallet ${wallets.length + 1}`

        await SecureStore.setItemAsync(`${WALLET_SECRET_PREFIX}${address}`, normalizedMnemonic)
        await this.saveWalletMetadata({
            address,
            name: walletName,
            emoji: '💎',
            type: 'mnemonic'
        })

        // Cache the account for fast switching
        this.accountCache.set(address, this.account)

        return address
    }

    async switchWallet(address: string): Promise<Account | null> {
        // If it's already the active account and loaded, just return it
        if (this.account && this.account.accountAddress.toString() === address) {
            return this.account
        }

        // Check cache first - THIS IS THE FAST PATH
        const cachedAccount = this.accountCache.get(address)
        if (cachedAccount) {
            this.account = cachedAccount
            // Update active wallet in background
            SecureStore.setItemAsync(ACTIVE_WALLET_ADDRESS_KEY, address).catch(console.error)
            return this.account
        }

        // Fallback for not cached - should be rare after pre-caching
        const secret = await SecureStore.getItemAsync(`${WALLET_SECRET_PREFIX}${address}`)
        if (!secret) return null

        const wallets = await this.getAllWallets()
        const wallet = wallets.find(w => w.address === address)
        if (!wallet) return null

        let account: Account
        if (wallet.type === 'mnemonic') {
            account = await this.deriveAccountFromMnemonic(secret)
        } else {
            const formattedKey = PrivateKey.formatPrivateKey(secret, 'ed25519' as any)
            const privateKey = new Ed25519PrivateKey(formattedKey)
            account = Account.fromPrivateKey({ privateKey })
        }

        this.accountCache.set(address, account)
        this.account = account
        SecureStore.setItemAsync(ACTIVE_WALLET_ADDRESS_KEY, address).catch(console.error)
        return account
    }

    /**
     * Pre-cache all wallet accounts in the background.
     * This makes switching instantaneous because derivation happens upfront.
     */
    private async preCacheAllAccounts() {
        try {
            const wallets = await this.getAllWallets()
            for (const wallet of wallets) {
                if (this.accountCache.has(wallet.address)) continue

                const secret = await SecureStore.getItemAsync(`${WALLET_SECRET_PREFIX}${wallet.address}`)
                if (!secret) continue

                let account: Account
                if (wallet.type === 'mnemonic') {
                    account = await this.deriveAccountFromMnemonic(secret)
                } else {
                    const formattedKey = PrivateKey.formatPrivateKey(secret, 'ed25519' as any)
                    const privateKey = new Ed25519PrivateKey(formattedKey)
                    account = Account.fromPrivateKey({ privateKey })
                }
                this.accountCache.set(wallet.address, account)
            }
        } catch (e) {
            console.error('Pre-caching failed:', e)
        }
    }

    async loadWallet(): Promise<Account | null> {
        // 1. Kick off background pre-caching immediately
        this.preCacheAllAccounts()

        // 2. Load the active wallet quickly
        const activeAddress = await SecureStore.getItemAsync(ACTIVE_WALLET_ADDRESS_KEY)
        if (activeAddress) {
            try {
                const account = await this.switchWallet(activeAddress)
                if (account) return account
            } catch (e) {
                console.error('Failed to load active wallet:', e)
            }
        }

        const wallets = await this.getAllWallets()
        if (wallets.length > 0) {
            return await this.switchWallet(wallets[0].address)
        }

        return null
    }

    async exportSeedphrase(address?: string): Promise<string | null> {
        const targetAddress = address || this.account?.accountAddress.toString()
        if (!targetAddress) return null

        const wallets = await this.getAllWallets()
        const wallet = wallets.find(w => w.address === targetAddress)
        if (wallet?.type !== 'mnemonic') return null

        return await SecureStore.getItemAsync(`${WALLET_SECRET_PREFIX}${targetAddress}`)
    }

    async exportPrivateKey(address?: string): Promise<string | null> {
        const targetAddress = address || this.account?.accountAddress.toString()
        if (!targetAddress) return null

        const secret = await SecureStore.getItemAsync(`${WALLET_SECRET_PREFIX}${targetAddress}`)
        if (!secret) return null

        const wallets = await this.getAllWallets()
        const wallet = wallets.find(w => w.address === targetAddress)

        if (wallet?.type === 'privateKey') return secret

        if (wallet?.type === 'mnemonic') {
            const account = await this.deriveAccountFromMnemonic(secret)
            return (account as any).privateKey.toString()
        }

        return null
    }

    async deleteWallet(address: string): Promise<void> {
        const wallets = await this.getAllWallets()
        const newWallets = wallets.filter(w => w.address !== address)

        await SecureStore.setItemAsync(WALLETS_LIST_KEY, JSON.stringify(newWallets))
        await SecureStore.deleteItemAsync(`${WALLET_SECRET_PREFIX}${address}`)

        // Clear from cache
        this.accountCache.delete(address)

        const activeAddress = await SecureStore.getItemAsync(ACTIVE_WALLET_ADDRESS_KEY)
        if (activeAddress === address) {
            if (newWallets.length > 0) {
                await this.switchWallet(newWallets[0].address)
            } else {
                await SecureStore.deleteItemAsync(ACTIVE_WALLET_ADDRESS_KEY)
                this.account = null
            }
        }
    }

    async deleteAllWallets(): Promise<void> {
        const wallets = await this.getAllWallets()
        for (const w of wallets) {
            await SecureStore.deleteItemAsync(`${WALLET_SECRET_PREFIX}${w.address}`)
        }
        await SecureStore.deleteItemAsync(WALLETS_LIST_KEY)
        await SecureStore.deleteItemAsync(ACTIVE_WALLET_ADDRESS_KEY)
        this.account = null
        // Clear all cached accounts
        this.accountCache.clear()
    }

    async updateWallet(address: string, updates: Partial<WalletMetadata>): Promise<void> {
        const wallets = await this.getAllWallets()
        const index = wallets.findIndex(w => w.address === address)
        if (index === -1) throw new Error('Wallet not found')

        wallets[index] = { ...wallets[index], ...updates }
        await SecureStore.setItemAsync(WALLETS_LIST_KEY, JSON.stringify(wallets))
    }

    getAccount(): Account | null {
        return this.account
    }

    getAddress(): string | null {
        return this.account?.accountAddress.toString() || null
    }
}
