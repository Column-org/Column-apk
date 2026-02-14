import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '../context/WalletContext'
import { useNetwork } from '../context/NetworkContext'
import { getTransactionHistory, Transaction, getCachedTransactions } from '../services/movement_service/transactionHistory'

// Global state to persist transactions
const transactionCaches = new Map<string, Transaction[]>()
let isFetchingGlobal = false
const listeners = new Set<(txs: Transaction[], isLoading: boolean) => void>()

const notifyListeners = (txs: Transaction[], isLoading: boolean) => {
    listeners.forEach(listener => listener(txs, isLoading))
}

export function useTransactions() {
    const { address: walletAddress } = useWallet()
    const { network } = useNetwork()
    const cacheKey = `${walletAddress}:${network}`

    const [transactions, setTransactions] = useState<Transaction[]>(() =>
        transactionCaches.get(cacheKey) || (walletAddress && network ? getCachedTransactions(walletAddress, network) || [] : [])
    )
    const [isLoading, setIsLoading] = useState(transactions.length === 0 && isFetchingGlobal)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const listener = (newTxs: Transaction[], loading: boolean) => {
            setTransactions(newTxs)
            setIsLoading(loading)
        }
        listeners.add(listener)

        // Sync check
        if (!isFetchingGlobal && transactionCaches.has(cacheKey)) {
            setTransactions(transactionCaches.get(cacheKey)!)
            setIsLoading(false)
        }

        return () => {
            listeners.delete(listener)
        }
    }, [cacheKey])

    const fetchData = useCallback(async (force: boolean = false) => {
        if (!walletAddress) return

        if (isFetchingGlobal && !force) {
            setIsLoading(true)
            return
        }

        const cached = transactionCaches.get(cacheKey)
        if (!force && cached && cached.length > 0) {
            setTransactions(cached)
            setIsLoading(false)
            return
        }

        isFetchingGlobal = true
        setIsLoading(true)
        notifyListeners(transactions, true)

        try {
            const result = await getTransactionHistory(walletAddress, network, { limit: 50 })
            if (result.success) {
                transactionCaches.set(cacheKey, result.transactions)
                setTransactions(result.transactions)
                notifyListeners(result.transactions, false)
                setError(null)
            } else {
                setError(result.error || 'Failed to load transactions')
                notifyListeners(transactions, false)
            }
        } catch (err) {
            console.error('useTransactions: Failed', err)
            setError('Failed to load transactions')
            notifyListeners(transactions, false)
        } finally {
            setIsLoading(false)
            isFetchingGlobal = false
        }
    }, [walletAddress, network, cacheKey, transactions])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return {
        transactions,
        isLoading,
        error,
        refetch: () => fetchData(true)
    }
}
