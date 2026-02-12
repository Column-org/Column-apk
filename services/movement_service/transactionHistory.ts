import { MovementNetwork, NETWORK_CONFIGS } from '../../constants/networkConfig'
import { octasToMove } from './helpers'
import { compareAddresses } from '../../utils/address'

// Cache for token metadata
const tokenMetadataCache: { [address: string]: { symbol: string; decimals: number; logoURI?: string } } = {}

// Cache for transaction history to prevent unnecessary refetching
const transactionHistoryCache: { [key: string]: Transaction[] } = {}

export interface Transaction {
  hash: string
  type: 'send' | 'receive' | 'swap' | 'contract' | 'unknown'
  timestamp: number
  success: boolean
  amount?: string
  token?: string
  from?: string
  to?: string
  functionName?: string
  gasUsed?: string
  version?: string
  // Swap-specific fields
  swapData?: {
    fromToken: string
    toToken: string
    fromAmount: string
    toAmount: string
    fromTokenLogo?: string
    toTokenLogo?: string
  }
}

export interface TransactionHistoryResult {
  success: boolean
  transactions: Transaction[]
  error?: string
}

/**
 * Fetch token metadata from Mosaic API
 */
export async function getTokenMetadata(tokenAddress: string): Promise<{ symbol: string; decimals: number; logoURI?: string } | null> {
  // Check cache first
  if (tokenMetadataCache[tokenAddress]) {
    return tokenMetadataCache[tokenAddress]
  }

  // Hardcoded common tokens that might not be in Mosaic API
  const commonTokens: { [key: string]: { symbol: string; decimals: number; logoURI?: string } } = {
    '0x1::aptos_coin::AptosCoin': {
      symbol: 'MOVE',
      decimals: 8,
      logoURI: 'https://gateway.pinata.cloud/ipfs/QmUv8RVdgo6cVQzh7kxerWLatDUt4rCEFoCTkCVLuMAa27',
    },
    '0xa': {
      symbol: 'MOVE',
      decimals: 8,
      logoURI: 'https://gateway.pinata.cloud/ipfs/QmUv8RVdgo6cVQzh7kxerWLatDUt4rCEFoCTkCVLuMAa27',
    },
  }

  // Check hardcoded tokens first
  const normalized = tokenAddress.toLowerCase()
  for (const [addr, metadata] of Object.entries(commonTokens)) {
    if (addr.toLowerCase() === normalized) {
      tokenMetadataCache[tokenAddress] = metadata
      return metadata
    }
  }

  try {
    const response = await fetch('https://api.mosaic.ag/v1/tokens', {
      headers: {
        'X-API-Key': '-RlbDSaN2rLCwY5b6dYtyCQr6VrnJKYU',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) return null

    const result = await response.json()
    const tokenById = result.data?.tokenById || {}

    // Find token by matching addresses
    for (const token of Object.values(tokenById) as any[]) {
      const addresses = [
        token.id,
        token.address,
        token.faAddress,
        token.coinAddress,
      ].filter(Boolean).map((addr: string) => addr.toLowerCase())

      if (addresses.includes(tokenAddress.toLowerCase())) {
        const metadata = {
          symbol: token.symbol || 'Unknown',
          decimals: token.decimals || 8,
          logoURI: token.iconUri,
        }
        tokenMetadataCache[tokenAddress] = metadata
        return metadata
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching token metadata:', error)
    return null
  }
}

function parseTransactionType(tx: any, walletAddress: string): Transaction['type'] {
  if (!tx.payload) return 'unknown'

  const payload = tx.payload
  const functionName = payload.function || ''

  // Check for common transaction types
  if (functionName.includes('::coin::transfer') || functionName.includes('::aptos_account::transfer')) {
    // Determine if send or receive based on sender
    if (tx.sender && compareAddresses(tx.sender, walletAddress)) {
      return 'send'
    }
    return 'receive'
  }

  if (functionName.includes('swap') || functionName.includes('router')) {
    return 'swap'
  }

  return 'contract'
}

async function extractTransactionDetails(tx: any, walletAddress: string): Promise<Transaction> {
  const type = parseTransactionType(tx, walletAddress)
  let amount: string | undefined
  let token = 'MOVE'
  let to: string | undefined
  let from: string | undefined
  let swapData: Transaction['swapData'] | undefined
  const functionName = tx.payload?.function || ''

  // Extract swap data from events if it's a swap transaction
  if (type === 'swap' && tx.events && Array.isArray(tx.events)) {
    for (const event of tx.events) {
      if (event.type?.includes('router::SwapEvent')) {
        const inputAsset = event.data?.input_asset
        const outputAsset = event.data?.output_asset
        const inputAmount = event.data?.input_amount
        const outputAmount = event.data?.output_amount

        if (inputAsset && outputAsset && inputAmount && outputAmount) {
          // Fetch metadata for both tokens
          const fromMeta = await getTokenMetadata(inputAsset)
          const toMeta = await getTokenMetadata(outputAsset)

          if (fromMeta && toMeta) {
            const fromAmountDecimal = (parseInt(inputAmount) / Math.pow(10, fromMeta.decimals)).toFixed(6)
            const toAmountDecimal = (parseInt(outputAmount) / Math.pow(10, toMeta.decimals)).toFixed(6)

            swapData = {
              fromToken: fromMeta.symbol,
              toToken: toMeta.symbol,
              fromAmount: fromAmountDecimal,
              toAmount: toAmountDecimal,
              fromTokenLogo: fromMeta.logoURI,
              toTokenLogo: toMeta.logoURI,
            }

            // Set amount to the input amount for display in history
            amount = fromAmountDecimal
            token = fromMeta.symbol
          }
        }
        break
      }
    }
  }

  // First try to extract from payload arguments (most reliable for transfers)
  if (!amount && tx.payload?.arguments && Array.isArray(tx.payload.arguments)) {
    const args = tx.payload.arguments

    // For coin transfers, amount is typically the second argument
    if (functionName.includes('::coin::transfer') || functionName.includes('::aptos_account::transfer')) {
      if (args.length >= 1 && typeof args[0] === 'string' && args[0].startsWith('0x')) {
        to = args[0]
      }
      if (args.length >= 2) {
        const rawAmount = args[1]
        if (typeof rawAmount === 'string' || typeof rawAmount === 'number') {
          amount = octasToMove(parseInt(rawAmount.toString())).toFixed(4)
        }
      }
    }
  }

  // If no amount found from payload, try events
  if (!amount && tx.events && Array.isArray(tx.events)) {
    for (const event of tx.events) {
      // Check for coin events - prioritize WithdrawEvent for sends
      if (type === 'send' && event.type?.includes('WithdrawEvent')) {
        const rawAmount = event.data?.amount
        if (rawAmount) {
          amount = octasToMove(parseInt(rawAmount)).toFixed(4)
        }
      } else if (type === 'receive' && event.type?.includes('DepositEvent')) {
        const rawAmount = event.data?.amount
        if (rawAmount) {
          amount = octasToMove(parseInt(rawAmount)).toFixed(4)
        }
      } else if (event.type?.includes('::coin::WithdrawEvent') || event.type?.includes('::coin::DepositEvent')) {
        const rawAmount = event.data?.amount
        if (rawAmount && !amount) {
          amount = octasToMove(parseInt(rawAmount)).toFixed(4)
        }
      }

      // Extract recipient from transfer events
      if (event.type?.includes('DepositEvent') && event.guid?.account_address) {
        if (!to) to = event.guid.account_address
      }
    }
  }

  from = tx.sender

  return {
    hash: tx.hash || tx.version?.toString() || '',
    type,
    timestamp: Math.floor(parseInt(tx.timestamp || '0') / 1000000), // Convert microseconds to seconds
    success: tx.success === true || tx.vm_status === 'Executed successfully',
    amount,
    token,
    from,
    to,
    functionName: functionName.split('::').pop() || 'Unknown',
    gasUsed: tx.gas_used?.toString(),
    version: tx.version?.toString(),
    swapData,
  }
}

export function getCachedTransactions(walletAddress: string, network: MovementNetwork): Transaction[] | null {
  const cacheKey = `${walletAddress}:${network}`
  return transactionHistoryCache[cacheKey] || null
}

export async function getTransactionHistory(
  walletAddress: string,
  network: MovementNetwork,
  options: { limit?: number; start?: number } = {}
): Promise<TransactionHistoryResult> {
  const { limit = 25, start } = options
  const rpcUrl = NETWORK_CONFIGS[network].rpcUrl
  const cacheKey = `${walletAddress}:${network}`

  // If we have cached transactions and no specific start point, return them immediately
  if (transactionHistoryCache[cacheKey] && start === undefined && !options.limit) {
    return {
      success: true,
      transactions: transactionHistoryCache[cacheKey],
    }
  }

  try {
    let url = `${rpcUrl}/accounts/${walletAddress}/transactions?limit=${limit}`
    if (start !== undefined) {
      url += `&start=${start}`
    }
    const response = await fetch(url)

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: true,
          transactions: [],
        }
      }
      throw new Error(`Failed to fetch transactions: ${response.status}`)
    }

    const txs = await response.json()

    if (!Array.isArray(txs)) {
      return {
        success: true,
        transactions: [],
      }
    }

    const transactions = await Promise.all(
      txs.map((tx) => extractTransactionDetails(tx, walletAddress))
    )

    // Sort by timestamp descending (newest first)
    transactions.sort((a, b) => b.timestamp - a.timestamp)

    // Cache the result for next time
    if (start === undefined) {
      transactionHistoryCache[cacheKey] = transactions
    }

    return {
      success: true,
      transactions,
    }
  } catch (error) {
    console.error('Error fetching transaction history:', error)
    return {
      success: false,
      transactions: [],
      error: error instanceof Error ? error.message : 'Failed to fetch transactions',
    }
  }
}

export async function getAllTransactions(
  walletAddress: string,
  network: MovementNetwork
): Promise<TransactionHistoryResult> {
  let allTransactions: Transaction[] = []
  let start = 0
  const limit = 100
  let hasMore = true

  try {
    while (hasMore) {
      const result = await getTransactionHistory(walletAddress, network, { limit, start })

      if (!result.success) {
        return result
      }

      if (result.transactions.length === 0) {
        hasMore = false
      } else {
        allTransactions = allTransactions.concat(result.transactions)
        start += result.transactions.length

        // Safety check to prevent infinite loops
        if (result.transactions.length < limit) {
          hasMore = false
        }
      }
    }

    // Sort all transactions by timestamp descending
    allTransactions.sort((a, b) => b.timestamp - a.timestamp)

    return {
      success: true,
      transactions: allTransactions,
    }
  } catch (error) {
    console.error('Error fetching all transactions:', error)
    return {
      success: false,
      transactions: allTransactions,
      error: error instanceof Error ? error.message : 'Failed to fetch all transactions',
    }
  }
}
