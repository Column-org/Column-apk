import { MovementNetwork, NETWORK_CONFIGS } from '../../constants/networkConfig'

const MOSAIC_API_URL = 'https://api.mosaic.ag/v1'
const MOSAIC_API_KEY = '-RlbDSaN2rLCwY5b6dYtyCQr6VrnJKYU' // TODO: Replace with your actual API key

export interface MosaicToken {
  address: string
  decimals: number
  name: string
  symbol: string
  logoURI?: string
  coingeckoId?: string
}

export interface SwapQuote {
  srcAsset: string
  dstAsset: string
  srcAmount: string
  dstAmount: string
  feeAmount: string
  paths: any[]
  tx: {
    function: string
    typeArguments: string[]
    functionArguments: any[]
  }
}

export interface GetQuoteParams {
  srcAsset: string
  dstAsset: string
  amount: string
  slippage?: number // in basis points, e.g., 50 = 0.5%
  sender?: string
  receiver?: string
  feeInBps?: number
  isFeeIn?: boolean
}

/**
 * Get list of available tokens for swapping
 */
export async function getTokens(network: MovementNetwork = 'mainnet'): Promise<MosaicToken[]> {
  try {
    const response = await fetch(`${MOSAIC_API_URL}/tokens`, {
      method: 'GET',
      headers: {
        'X-API-Key': MOSAIC_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch tokens: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    // Parse the tokenById object into an array
    if (!result.data || !result.data.tokenById) {
      return []
    }

    const tokenById = result.data.tokenById
    const tokens: MosaicToken[] = Object.values(tokenById).map((token: any) => ({
      address: token.id || token.address || token.faAddress,
      decimals: token.decimals,
      name: token.name,
      symbol: token.symbol,
      logoURI: token.iconUri,
      coingeckoId: token.coingeckoId,
    }))

    // Sort: verified first, then by name
    return tokens.sort((a, b) => {
      const aName = a.name?.toLowerCase() || ''
      const bName = b.name?.toLowerCase() || ''
      return aName.localeCompare(bName)
    })
  } catch (error) {
    console.error('Error fetching Mosaic tokens:', error)
    throw error
  }
}

/**
 * Get swap quote from Mosaic aggregator
 */
export async function getSwapQuote(params: GetQuoteParams): Promise<SwapQuote> {
  try {
    const queryParams = new URLSearchParams({
      srcAsset: params.srcAsset,
      dstAsset: params.dstAsset,
      amount: params.amount,
    })

    if (params.slippage !== undefined) {
      queryParams.append('slippage', params.slippage.toString())
    }

    if (params.sender) {
      queryParams.append('sender', params.sender)
    }

    if (params.receiver) {
      queryParams.append('receiver', params.receiver)
    }

    if (params.feeInBps !== undefined) {
      queryParams.append('feeInBps', params.feeInBps.toString())
    }

    if (params.isFeeIn !== undefined) {
      queryParams.append('isFeeIn', params.isFeeIn.toString())
    }

    const response = await fetch(`${MOSAIC_API_URL}/quote?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'X-API-Key': MOSAIC_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to get quote: ${response.status}`)
    }

    const result = await response.json()

    // Return the data object which contains the quote
    if (!result.data) {
      throw new Error('Invalid quote response: missing data')
    }

    return result.data
  } catch (error) {
    console.error('Error getting swap quote:', error)
    throw error
  }
}

/**
 * Parse token amount with decimals
 */
export function parseTokenAmount(amount: number, decimals: number): string {
  return Math.floor(amount * Math.pow(10, decimals)).toString()
}

/**
 * Format token amount from raw to human-readable
 */
export function formatTokenAmount(rawAmount: string, decimals: number): number {
  return parseInt(rawAmount) / Math.pow(10, decimals)
}

/**
 * Calculate price impact percentage
 */
export function calculatePriceImpact(priceImpact: string): number {
  return parseFloat(priceImpact) * 100
}

/**
 * Common token addresses on Movement/Aptos
 */
export const COMMON_TOKENS = {
  MOVE: '0x1::aptos_coin::AptosCoin',
  // Add more common tokens as they become available on Movement
}
