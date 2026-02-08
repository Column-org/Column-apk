import { useState, useEffect, useCallback, useRef } from 'react'
import { useWallet } from '../context/WalletContext'
import { useNetwork } from '../context/NetworkContext'
import { getFungibleAssets, FungibleAsset } from '../services/movementAssets'
import { getBatchTokenPrices, SYMBOL_TO_ID, TokenPrice } from '../services/coinGecko'

// Global cache to persist assets across component mounts
let assetCache: FungibleAsset[] | null = null
let priceMapCache: Record<string, TokenPrice> = {}
let lastFetchTime = 0
const CACHE_TTL = 30000 // 30 seconds

export function useAssets(refreshKey: number = 0) {
    const { address: walletAddress } = useWallet()
    const { network } = useNetwork()
    const [assets, setAssets] = useState<FungibleAsset[]>(assetCache || [])
    const [prices, setPrices] = useState<Record<string, TokenPrice>>(priceMapCache)
    const [isLoading, setIsLoading] = useState(!assetCache)
    const [error, setError] = useState<string | null>(null)
    const isFetchingRef = useRef(false)

    const fetchData = useCallback(async (force: boolean = false) => {
        if (!walletAddress || isFetchingRef.current) return

        const now = Date.now()
        if (!force && assetCache && (now - lastFetchTime < CACHE_TTL)) {
            setAssets(assetCache)
            setPrices(priceMapCache)
            setIsLoading(false)
            return
        }

        isFetchingRef.current = true
        if (!assetCache) setIsLoading(true)

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
            setError(null)
        } catch (err) {
            console.error('useAssets: Failed to fetch', err)
            setError('Failed to load assets')
        } finally {
            setIsLoading(false)
            isFetchingRef.current = false
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
        movePrice: prices['movement'] || null, // For backward compatibility
        isLoading,
        error,
        refetch: () => fetchData(true)
    }
}
