import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '../context/WalletContext'
import { useNetwork } from '../context/NetworkContext'
import { getFungibleAssets, FungibleAsset } from '../services/movementAssets'
import { getBatchTokenPrices, SYMBOL_TO_ID, TokenPrice } from '../services/coinGecko'

// Global state to persist assets across component mounts
let assetCache: FungibleAsset[] | null = null
let priceMapCache: Record<string, TokenPrice> = {}
let lastFetchTime = 0
let isFetchingGlobal = false
const CACHE_TTL = 600000 // 10 minutes

// Listener system to sync all hook instances
const listeners = new Set<(assets: FungibleAsset[], prices: Record<string, TokenPrice>, isLoading: boolean) => void>()

const notifyListeners = (assets: FungibleAsset[], prices: Record<string, TokenPrice>, isLoading: boolean) => {
    listeners.forEach(listener => listener(assets, prices, isLoading))
}

export function useAssets(refreshKey: number = 0) {
    const { address: walletAddress } = useWallet()
    const { network } = useNetwork()
    const [assets, setAssets] = useState<FungibleAsset[]>(assetCache || [])
    const [prices, setPrices] = useState<Record<string, TokenPrice>>(priceMapCache)
    const [isLoading, setIsLoading] = useState(!assetCache && isFetchingGlobal)
    const [error, setError] = useState<string | null>(null)

    // Update state when notifyListeners is called
    useEffect(() => {
        const listener = (newAssets: FungibleAsset[], newPrices: Record<string, TokenPrice>, loading: boolean) => {
            setAssets(newAssets)
            setPrices(newPrices)
            setIsLoading(loading)
        }
        listeners.add(listener)

        // Sync with current global state in case we missed a notification during mount
        if (!isFetchingGlobal && assetCache) {
            setAssets(assetCache)
            setPrices(priceMapCache)
            setIsLoading(false)
        }

        return () => {
            listeners.delete(listener)
        }
    }, [])

    const fetchData = useCallback(async (force: boolean = false) => {
        if (!walletAddress) return

        const now = Date.now()

        // If already fetching, just wait for listeners to be notified
        if (isFetchingGlobal && !force) {
            setIsLoading(true)
            return
        }

        // If not forced and we have a valid cache within TTL, use it
        if (!force && assetCache && (now - lastFetchTime < CACHE_TTL)) {
            setAssets(assetCache)
            setPrices(priceMapCache)
            setIsLoading(false)
            return
        }

        isFetchingGlobal = true
        setIsLoading(true)
        notifyListeners(assetCache || [], priceMapCache, true)

        try {
            const fetchedAssets = await getFungibleAssets(walletAddress, network)

            // Extract unique coingecko IDs for pricing
            const coingeckoIds = fetchedAssets
                .map(a => SYMBOL_TO_ID[a.metadata.symbol.toUpperCase()])
                .filter((id): id is string => !!id)

            // Add MOVE if not present
            if (!coingeckoIds.includes('movement')) {
                coingeckoIds.push('movement')
            }

            const fetchedPrices = await getBatchTokenPrices(coingeckoIds)

            assetCache = fetchedAssets
            priceMapCache = fetchedPrices
            lastFetchTime = now

            setAssets(fetchedAssets)
            setPrices(fetchedPrices)
            notifyListeners(fetchedAssets, fetchedPrices, false)
            setError(null)
        } catch (err) {
            console.error('useAssets: Failed to fetch', err)
            setError('Failed to load assets')
            notifyListeners(assetCache || [], priceMapCache, false)
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
        assets,
        prices,
        movePrice: prices['movement'] || null,
        isLoading,
        error,
        refetch: () => fetchData(true)
    }
}
