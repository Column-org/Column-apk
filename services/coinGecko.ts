const COINGECKO_API = 'https://api.coingecko.com/api/v3'

export interface TokenPrice {
  usd: number
  usd_24h_change: number
}

export interface PriceHistory {
  prices: number[][]
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
      // Silently fail on rate limits (429) or other errors
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
    // Silently fail
    return null
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
      // Silently fail on rate limits (429) or other errors
      return []
    }

    const data: PriceHistory = await response.json()

    if (data.prices) {
      // Return just the price values (second element of each array)
      return data.prices.map(([, price]) => price)
    }

    return []
  } catch (error) {
    // Silently fail
    return []
  }
}
