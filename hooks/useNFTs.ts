import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '../context/WalletContext'
import { useNetwork } from '../context/NetworkContext'
import { getEnrichedUserNFTs, UserNFT, NFTMetadata } from '../services/movement_service/nftService'

// Global state to persist NFTs across component mounts
let nftCache: Array<UserNFT & { metadata?: NFTMetadata }> | null = null
let lastFetchTime = 0
let isFetchingGlobal = false
const CACHE_TTL = 600000 // 10 minutes

// Listener system to sync all hook instances
const listeners = new Set<(nfts: Array<UserNFT & { metadata?: NFTMetadata }>, isLoading: boolean) => void>()

const notifyListeners = (nfts: Array<UserNFT & { metadata?: NFTMetadata }>, isLoading: boolean) => {
    listeners.forEach(listener => listener(nfts, isLoading))
}

export function useNFTs(refreshKey: number = 0) {
    const { address: walletAddress } = useWallet()
    const { network } = useNetwork()
    const [nfts, setNfts] = useState<Array<UserNFT & { metadata?: NFTMetadata }>>(nftCache || [])
    const [isLoading, setIsLoading] = useState(!nftCache && isFetchingGlobal)
    const [error, setError] = useState<string | null>(null)

    // Update state when notifyListeners is called
    useEffect(() => {
        const listener = (newNfts: Array<UserNFT & { metadata?: NFTMetadata }>, loading: boolean) => {
            setNfts(newNfts)
            setIsLoading(loading)
        }
        listeners.add(listener)

        // Sync with current global state in case we missed a notification during mount
        if (!isFetchingGlobal && nftCache) {
            setNfts(nftCache)
            setIsLoading(false)
        }

        return () => {
            listeners.delete(listener)
        }
    }, [])

    const fetchData = useCallback(async (force: boolean = false) => {
        if (!walletAddress) return

        const now = Date.now()

        // If already fetching, just wait for listeners
        if (isFetchingGlobal && !force) {
            setIsLoading(true)
            return
        }

        // If valid cache, use it
        if (!force && nftCache && (now - lastFetchTime < CACHE_TTL)) {
            setNfts(nftCache)
            setIsLoading(false)
            return
        }

        isFetchingGlobal = true
        setIsLoading(true)
        notifyListeners(nftCache || [], true)

        try {
            const fetchedNFTs = await getEnrichedUserNFTs(walletAddress, network)

            nftCache = fetchedNFTs
            lastFetchTime = now

            setNfts(fetchedNFTs)
            notifyListeners(fetchedNFTs, false)
            setError(null)
        } catch (err) {
            console.error('useNFTs: Failed to fetch', err)
            setError('Failed to load NFTs')
            notifyListeners(nftCache || [], false)
        } finally {
            setIsLoading(false)
            isFetchingGlobal = false
        }
    }, [walletAddress, network])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    useEffect(() => {
        if (refreshKey > 0) {
            fetchData(true)
        }
    }, [refreshKey, fetchData])

    return {
        nfts,
        isLoading,
        error,
        refetch: () => fetchData(true)
    }
}
