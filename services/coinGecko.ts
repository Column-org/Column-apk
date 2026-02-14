const COINGECKO_API = 'https://api.coingecko.com/api/v3'

export interface TokenPrice {
  usd: number
  usd_24h_change: number
}

export interface PriceHistory {
  prices: number[][]
}

export const SYMBOL_TO_ID: Record<string, string> = {
  'MOVE': 'movement',
  'MOVEMENT': 'movement',
  'USDC': 'usd-coin',
  'USDC.E': 'usd-coin',
  'USDT': 'tether',
  'USDT.E': 'tether',
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'WETH': 'ethereum',
  'WBTC': 'bitcoin',
  'SOL': 'solana',
  'APT': 'aptos',
  'WEUSD': 'weusd',
}

export async function getMoveTokenPrice(): Promise<TokenPrice | null> {
  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=movement&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (data.movement) {
      return {
        usd: data.movement.usd,
        usd_24h_change: data.movement.usd_24h_change || 0,
      }
    }

    return null
  } catch (error) {
    return null
  }
}

export async function getBatchTokenPrices(ids: string[]): Promise<Record<string, TokenPrice>> {
  if (ids.length === 0) return {}

  try {
    const uniqueIds = Array.from(new Set(ids)).join(',')
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${uniqueIds}&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) return {}

    const data = await response.json()
    const result: Record<string, TokenPrice> = {}

    for (const id of ids) {
      if (data[id]) {
        result[id] = {
          usd: data[id].usd,
          usd_24h_change: data[id].usd_24h_change || 0
        }
      }
    }

    return result
  } catch (error) {
    console.warn('Batch price fetch failed', error)
    return {}
  }
}

export async function getMoveTokenPriceHistory(days: number = 7): Promise<number[]> {
  try {
    const response = await fetch(
      `${COINGECKO_API}/coins/movement/market_chart?vs_currency=usd&days=${days}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return []
    }

    const data: PriceHistory = await response.json()

    if (data.prices) {
      return data.prices.map(([, price]) => price)
    }

    return []
  } catch (error) {
    return []
  }
}
