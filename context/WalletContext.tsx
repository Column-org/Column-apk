import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { WalletManager, WalletMetadata } from '../services/walletManager/WalletManager'
import { TransactionService } from '../services/walletManager/TransactionService'
import { Account } from '@aptos-labs/ts-sdk'

interface WalletContextType {
    walletAccount: Account | null
    account: Account | null // Compat
    address: string | null
    publicKey: string | null // Alias for walletPublicKey
    walletPublicKey: string | null
    isLoading: boolean
    isWeb3Loaded: boolean // Keeping naming for compat
    network: { name: string; chainId: number; url: string }
    switchNetwork: (networkKey: 'mainnet' | 'testnet') => void

    // Multi-Wallet Support
    allWallets: WalletMetadata[]
    switchWallet: (address: string) => Promise<void>

    // Wallet Methods
    createWeb3Wallet: (name?: string) => Promise<{ address: string; mnemonic: string }>
    importFromPrivateKey: (privateKey: string, name?: string) => Promise<string>
    importFromSeedphrase: (mnemonic: string, name?: string) => Promise<string>
    exportSeedphrase: (address?: string) => Promise<string | null>
    exportPrivateKey: (address?: string) => Promise<string | null>
    deleteWeb3Wallet: (address?: string) => Promise<void>
    updateWallet: (address: string, updates: Partial<WalletMetadata>) => Promise<void>
    logout: () => Promise<void>

    // Signing
    signRawHash: (hash: string) => Promise<{ signature: string }>
    signAndSubmitTransaction: (payload: any) => Promise<string>
    signMessage: (message: string) => Promise<string>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

import { DEFAULT_NETWORK, NETWORK_CONFIGS } from '../constants/networkConfig'

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [walletManager] = useState(() => new WalletManager())
    const [transactionService] = useState(() => new TransactionService())
    const [web3Account, setWeb3Account] = useState<Account | null>(null)
    const [allWallets, setAllWallets] = useState<WalletMetadata[]>([])
    const [isWeb3Loading, setIsWeb3Loading] = useState(true)
    const activeConfig = NETWORK_CONFIGS[DEFAULT_NETWORK]
    const [network, setNetwork] = useState({
        name: activeConfig.displayName,
        chainId: activeConfig.chainId,
        url: activeConfig.rpcUrl
    })
    const [lastBalance, setLastBalance] = useState<bigint | null>(null)

    const refreshWallets = useCallback(async () => {
        const wallets = await walletManager.getAllWallets()
        setAllWallets(wallets)
    }, [walletManager])

    const switchNetwork = useCallback((networkKey: 'mainnet' | 'testnet') => {
        const config = NETWORK_CONFIGS[networkKey]
        const newNetworkState = {
            name: config.displayName,
            chainId: config.chainId,
            url: config.rpcUrl
        }

        setNetwork(newNetworkState)
        transactionService.switchNetwork(config.rpcUrl)
    }, [transactionService])

    useEffect(() => {
        const init = async () => {
            setIsWeb3Loading(true)
            try {
                const loadedAccount = await walletManager.loadWallet()
                if (loadedAccount) {
                    setWeb3Account(loadedAccount)
                    setIsWeb3Loading(false) // Set loading to false as soon as we have an account

                    // Initial balance fetch happens in background
                    transactionService.getBalance(loadedAccount.accountAddress.toString())
                        .then(bal => setLastBalance(bal))
                        .catch(err => console.warn('Initial balance fetch failed:', err))
                } else {
                    setIsWeb3Loading(false)
                }
                await refreshWallets()
            } catch (error) {
                console.error('WalletContext: Failed to initialize WalletProvider:', error)
                setIsWeb3Loading(false)
            }
        }
        init()
    }, [refreshWallets, walletManager, transactionService])

    // Balance Polling for "Receive" Notifications
    useEffect(() => {
        if (!web3Account) return

        const checkBalance = async () => {
            try {
                const currentBalance = await transactionService.getBalance(web3Account.accountAddress.toString())
                if (lastBalance !== null && currentBalance > lastBalance) {
                    const diff = currentBalance - lastBalance
                    const amountStr = (Number(diff) / 100000000).toString()
                    // NotificationService is already available in scope from previous edits if we import it
                    const NotificationService = require('../services/NotificationService')
                    NotificationService.triggerReceiveNotification(amountStr, 'MOVE')
                }
                setLastBalance(currentBalance)
            } catch (error) {
                console.warn('Balance poll failed:', error)
            }
        }

        const interval = setInterval(checkBalance, 30000) // Poll every 30s
        return () => clearInterval(interval)
    }, [web3Account, lastBalance, transactionService])

    const createWeb3Wallet = useCallback(async (name?: string) => {
        setIsWeb3Loading(true)
        // Give UI a chance to render the loader
        await new Promise(resolve => setTimeout(resolve, 50))
        try {
            const result = await walletManager.createWallet(name)
            const loadedAccount = await walletManager.loadWallet()
            setWeb3Account(loadedAccount)
            await refreshWallets()
            return result
        } finally {
            setIsWeb3Loading(false)
        }
    }, [walletManager, refreshWallets])

    const importFromPrivateKey = useCallback(async (privateKey: string, name?: string) => {
        setIsWeb3Loading(true)
        await new Promise(resolve => setTimeout(resolve, 50))
        try {
            const address = await walletManager.importFromPrivateKey(privateKey, name)
            const loadedAccount = await walletManager.loadWallet()
            setWeb3Account(loadedAccount)
            await refreshWallets()
            return address
        } finally {
            setIsWeb3Loading(false)
        }
    }, [walletManager, refreshWallets])

    const importFromSeedphrase = useCallback(async (mnemonic: string, name?: string) => {
        setIsWeb3Loading(true)
        await new Promise(resolve => setTimeout(resolve, 50))
        try {
            const address = await walletManager.importFromSeedphrase(mnemonic, name)
            const loadedAccount = await walletManager.loadWallet()
            setWeb3Account(loadedAccount)
            await refreshWallets()
            return address
        } finally {
            setIsWeb3Loading(false)
        }
    }, [walletManager, refreshWallets])

    const switchWallet = useCallback(async (address: string) => {
        if (web3Account?.accountAddress.toString() === address) return
        try {
            const account = await walletManager.switchWallet(address)
            setWeb3Account(account)
        } catch (error) {
            console.error('WalletContext: switchWallet error:', error)
        }
    }, [walletManager, web3Account])

    const exportSeedphrase = useCallback(async (address?: string) => {
        return await walletManager.exportSeedphrase(address)
    }, [walletManager])

    const exportPrivateKey = useCallback(async (address?: string) => {
        return await walletManager.exportPrivateKey(address)
    }, [walletManager])

    const deleteWeb3Wallet = useCallback(async (address?: string) => {
        const targetAddress = address || web3Account?.accountAddress.toString()
        if (targetAddress) {
            await walletManager.deleteWallet(targetAddress)
            const loaded = await walletManager.loadWallet()
            setWeb3Account(loaded)
            await refreshWallets()
        }
    }, [walletManager, web3Account, refreshWallets])

    const updateWallet = useCallback(async (address: string, updates: Partial<WalletMetadata>) => {
        await walletManager.updateWallet(address, updates)
        await refreshWallets()
    }, [walletManager, refreshWallets])

    const logout = useCallback(async () => {
        setIsWeb3Loading(true)
        try {
            await walletManager.deleteAllWallets()
            setWeb3Account(null)
            await refreshWallets()
        } catch (error) {
            console.error('WalletContext: Logout error:', error)
        } finally {
            setIsWeb3Loading(false)
        }
    }, [walletManager, refreshWallets])

    const signRawHash = useCallback(async (hash: string) => {
        if (!web3Account) {
            throw new Error('No account loaded')
        }
        const cleanHash = hash.startsWith('0x') ? hash.slice(2) : hash
        const hashBytes = Buffer.from(cleanHash, 'hex')
        const signature = web3Account.sign(hashBytes)
        return { signature: signature.toString() }
    }, [web3Account])

    const signAndSubmitTransaction = useCallback(async (payload: any) => {
        console.log('WalletContext: signAndSubmitTransaction called with:', JSON.stringify(payload));
        if (web3Account) {
            try {
                const hash = await transactionService.executeTransaction(web3Account, payload);
                console.log('WalletContext: Transaction success:', hash);
                return hash;
            } catch (error: any) {
                console.error('WalletContext: Transaction failed:', error);
                throw error;
            }
        }
        throw new Error('No wallet active')
    }, [web3Account, transactionService])

    const signMessage = useCallback(async (message: string) => {
        if (web3Account) {
            const signature = web3Account.sign(Buffer.from(message))
            return signature.toString()
        }
        throw new Error('No wallet active')
    }, [web3Account])

    const address = useMemo(() => {
        return web3Account?.accountAddress.toString() || null
    }, [web3Account])

    const publicKey = useMemo(() => {
        return web3Account?.publicKey.toString() || null
    }, [web3Account])

    const isLoading = isWeb3Loading

    return (
        <WalletContext.Provider
            value={{
                walletAccount: web3Account,
                account: web3Account, // compat
                address,
                publicKey,
                walletPublicKey: publicKey,
                isLoading,
                isWeb3Loaded: !!web3Account,
                allWallets,
                switchWallet,
                createWeb3Wallet,
                importFromPrivateKey,
                importFromSeedphrase,
                exportSeedphrase,
                exportPrivateKey,
                deleteWeb3Wallet,
                logout,
                signRawHash,
                signAndSubmitTransaction,
                signMessage,
                network,
                switchNetwork,
                updateWallet,
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
