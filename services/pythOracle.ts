// Price Oracle Service for live price feeds
// Using CoinGecko for MOVE token and Pyth for other tokens

const PYTH_HERMES_URL = 'https://hermes.pyth.network/v2/updates/price/latest'
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'

// CoinGecko IDs
const COINGECKO_IDS = {
  MOVE: 'movement', // Movement Network token
}

// Pyth Price Feed IDs - these are the official Pyth feed IDs
// Full list: https://pyth.network/developers/price-feed-ids
// Remove '0x' prefix for API calls
export const PYTH_PRICE_FEEDS = {
  BTC: 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43', // BTC/USD
  ETH: 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace', // ETH/USD
  USDC: 'eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a', // USDC/USD
  USDT: '2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b', // USDT/USD
  SOL: 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d', // SOL/USD
  APT: '03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5', // APT/USD (Aptos)
}

export interface PythPrice {
  id: string
  price: {
    price: string
    conf: string
    expo: number
    publish_time: number
  }
  ema_price: {
    price: string
    conf: string
    expo: number
    publish_time: number
  }
}

export interface TokenPriceData {
  symbol: string
  price: number
  confidence: number
  publishTime: number
  priceChange24h?: number
}

// Parse Pyth price response to get USD value
function parsePythPrice(pythPrice: PythPrice): number {
  const price = parseInt(pythPrice.price.price)
  const expo = pythPrice.price.expo
  return price * Math.pow(10, expo)
}

// Fetch single price from Pyth
export async function getPythPrice(feedId: string): Promise<TokenPriceData | null> {
  try {
    const response = await fetch(`${PYTH_HERMES_URL}?ids[]=${feedId}`)

    if (!response.ok) {
      console.error('Pyth API error:', response.status)
      return null
    }

    const data = await response.json()

    if (!data.parsed || data.parsed.length === 0) {
      return null
    }

    const priceData = data.parsed[0]
    const price = parsePythPrice(priceData)
    const confidence = parseInt(priceData.price.conf) * Math.pow(10, priceData.price.expo)

    return {
      symbol: feedId,
      price,
      confidence,
      publishTime: priceData.price.publish_time,
    }
  } catch (error) {
    console.error('Error fetching Pyth price:', error)
    return null
  }
}

// Fetch multiple prices at once
export async function getPythPrices(feedIds: string[]): Promise<Map<string, TokenPriceData>> {
  const priceMap = new Map<string, TokenPriceData>()

  if (feedIds.length === 0) {
    return priceMap
  }

  try {
    const idsQuery = feedIds.map(id => `ids[]=${id}`).join('&')
    const response = await fetch(`${PYTH_HERMES_URL}?${idsQuery}`)

    if (!response.ok) {
      console.error('Pyth API error:', response.status)
      return priceMap
    }

    const data = await response.json()

    if (!data.parsed || !Array.isArray(data.parsed)) {
      return priceMap
    }

    for (const priceData of data.parsed) {
      const price = parsePythPrice(priceData)
      const confidence = parseInt(priceData.price.conf) * Math.pow(10, priceData.price.expo)

      priceMap.set(priceData.id, {
        symbol: priceData.id,
        price,
        confidence,
        publishTime: priceData.price.publish_time,
      })
    }

    return priceMap
  } catch (error) {
    console.error('Error fetching Pyth prices:', error)
    return priceMap
  }
}

// Get MOVE token price from CoinGecko
export async function getMovePrice(): Promise<TokenPriceData | null> {
  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/simple/price?ids=${COINGECKO_IDS.MOVE}&vs_currencies=usd&include_24hr_change=true`
    )

    if (!response.ok) {
      console.error('CoinGecko API error:', response.status)
      return null
    }

    const data = await response.json()
    const moveData = data[COINGECKO_IDS.MOVE]

    if (!moveData) {
      return null
    }

    return {
      symbol: 'MOVE',
      price: moveData.usd,
      confidence: 0, // CoinGecko doesn't provide confidence intervals
      publishTime: Math.floor(Date.now() / 1000),
      priceChange24h: moveData.usd_24h_change || 0,
    }
  } catch (error) {
    console.error('Error fetching MOVE price from CoinGecko:', error)
    return null
  }
}

// Map common token symbols to their Pyth feed IDs
export function getTokenFeedId(symbol: string): string | null {
  const normalizedSymbol = symbol.toUpperCase().trim()

  // MOVE uses CoinGecko, not Pyth
  if (normalizedSymbol === 'MOVE' || normalizedSymbol === 'MOVE COIN' || normalizedSymbol === 'MOVECOIN') {
    return null // Use getMovePrice() instead
  }

  if (normalizedSymbol === 'BTC' || normalizedSymbol === 'BITCOIN' || normalizedSymbol === 'WBTC') {
    return PYTH_PRICE_FEEDS.BTC
  }

  if (normalizedSymbol === 'ETH' || normalizedSymbol === 'ETHEREUM' || normalizedSymbol === 'WETH') {
    return PYTH_PRICE_FEEDS.ETH
  }

  if (normalizedSymbol === 'USDC' || normalizedSymbol === 'USD COIN') {
    return PYTH_PRICE_FEEDS.USDC
  }

  if (normalizedSymbol === 'USDT' || normalizedSymbol === 'TETHER') {
    return PYTH_PRICE_FEEDS.USDT
  }

  if (normalizedSymbol === 'SOL' || normalizedSymbol === 'SOLANA') {
    return PYTH_PRICE_FEEDS.SOL
  }

  if (normalizedSymbol === 'APT' || normalizedSymbol === 'APTOS') {
    return PYTH_PRICE_FEEDS.APT
  }

  return null
}

// Get prices for multiple tokens by their symbols
export async function getTokenPrices(symbols: string[]): Promise<Map<string, TokenPriceData>> {
  const feedIds: string[] = []
  const symbolToFeedId = new Map<string, string>()

  for (const symbol of symbols) {
    const feedId = getTokenFeedId(symbol)
    if (feedId) {
      feedIds.push(feedId)
      symbolToFeedId.set(symbol.toUpperCase(), feedId)
    }
  }

  const pricesByFeedId = await getPythPrices(feedIds)
  const pricesBySymbol = new Map<string, TokenPriceData>()

  for (const [symbol, feedId] of symbolToFeedId) {
    const priceData = pricesByFeedId.get(feedId)
    if (priceData) {
      pricesBySymbol.set(symbol, {
        ...priceData,
        symbol,
      })
    }
  }

  return pricesBySymbol
}
