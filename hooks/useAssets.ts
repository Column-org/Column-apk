import { useState, useEffect, useCallback, useRef } from 'react'
import { useWallet } from '../context/WalletContext'
import { useNetwork } from '../context/NetworkContext'
import { getFungibleAssets, FungibleAsset } from '../services/movementAssets'
import { getMovePrice, TokenPriceData } from '../services/pythOracle'

// Global cache to persist assets across component mounts
let assetCache: FungibleAsset[] | null = null
let priceCache: TokenPriceData | null = null
let lastFetchTime = 0
const CACHE_TTL = 30000 // 30 seconds

export function useAssets(refreshKey: number = 0) {
    const { address: walletAddress } = useWallet()
    const { network } = useNetwork()
    const [assets, setAssets] = useState<FungibleAsset[]>(assetCache || [])
    const [movePrice, setMovePrice] = useState<TokenPriceData | null>(priceCache)
    const [isLoading, setIsLoading] = useState(!assetCache)
    const [error, setError] = useState<string | null>(null)
    const isFetchingRef = useRef(false)

    const fetchData = useCallback(async (force: boolean = false) => {
        if (!walletAddress || isFetchingRef.current) return

        const now = Date.now()
        if (!force && assetCache && (now - lastFetchTime < CACHE_TTL)) {
            setAssets(assetCache)
            setMovePrice(priceCache)
            setIsLoading(false)
            return
        }

        isFetchingRef.current = true
        if (!assetCache) setIsLoading(true)

        try {
            const [fetchedAssets, fetchedPrice] = await Promise.all([
                getFungibleAssets(walletAddress, network),
                getMovePrice()
            ])

            assetCache = fetchedAssets
            priceCache = fetchedPrice
            lastFetchTime = now

            setAssets(fetchedAssets)
            setMovePrice(fetchedPrice)
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
        movePrice,
        isLoading,
        error,
        refetch: () => fetchData(true)
    }
}
