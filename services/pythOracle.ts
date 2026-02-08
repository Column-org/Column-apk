// Price Oracle Service for MOVE token price
// Using CoinGecko API

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'
const COINGECKO_MOVE_ID = 'movement' // Movement Network token

export interface TokenPriceData {
  symbol: string
  price: number
  confidence: number
  publishTime: number
  priceChange24h?: number
}

// Price cache with TTL
interface CachedPrice {
  data: TokenPriceData
  timestamp: number
}

const priceCache = new Map<string, CachedPrice>()
const CACHE_TTL = 30000 // 30 seconds cache

// Get MOVE token price from CoinGecko with caching
export async function getMovePrice(): Promise<TokenPriceData | null> {
  const cacheKey = 'MOVE'
  const cached = priceCache.get(cacheKey)

  // Return cached price if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/simple/price?ids=${COINGECKO_MOVE_ID}&vs_currencies=usd&include_24hr_change=true`
    )

    if (!response.ok) {
      // If rate limited and we have cached data, return it even if expired
      if (response.status === 429 && cached) {
        console.warn('CoinGecko rate limited, using cached price')
        return cached.data
      }
      console.error('CoinGecko API error:', response.status)
      return cached?.data || null
    }

    const data = await response.json()
    const moveData = data[COINGECKO_MOVE_ID]

    if (!moveData) {
      return cached?.data || null
    }

    const priceData: TokenPriceData = {
      symbol: 'MOVE',
      price: moveData.usd,
      confidence: 0, // CoinGecko doesn't provide confidence intervals
      publishTime: Math.floor(Date.now() / 1000),
      priceChange24h: moveData.usd_24h_change || 0,
    }

    // Cache the result
    priceCache.set(cacheKey, {
      data: priceData,
      timestamp: Date.now()
    })

    return priceData
  } catch (error) {
    console.error('Error fetching MOVE price from CoinGecko:', error)
    return cached?.data || null
  }
}
