import { DEFAULT_NETWORK, MovementNetwork, MovementNetworkConfig, NETWORK_CONFIGS } from '../constants/networkConfig'
import { BACKEND_URL } from './movement_service/constants'

const MOVE_ICON_FALLBACK = 'https://gateway.pinata.cloud/ipfs/QmUv8RVdgo6cVQzh7kxerWLatDUt4rCEFoCTkCVLuMAa27'

export interface FungibleAsset {
  asset_type: string
  amount: string
  metadata: {
    name: string
    symbol: string
    decimals: number
    icon_uri?: string
    isSpam?: boolean
  }
}

const SPAM_KEYWORDS = [
  'CLAIM', 'FREE', 'AIRDROP', 'GIFT', 'REWARD', 'VISIT', 'WWW.', '.COM', '.ORG', '.NET', '.XYZ', 'VOUCHER',
  'OFFER', 'PRIZE', 'WINNER', 'EARN', 'PROMO'
]

export const isSpamAsset = (name: string, symbol: string): boolean => {
  const upperName = name.toUpperCase()
  const upperSymbol = symbol.toUpperCase()

  // 1. Check Keywords
  if (SPAM_KEYWORDS.some(keyword => upperName.includes(keyword) || upperSymbol.includes(keyword))) {
    return true
  }

  // 2. Check for URLs in name/symbol
  const urlRegex = /(https?:\/\/|www\.)[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}/i
  if (urlRegex.test(upperName) || urlRegex.test(upperSymbol)) {
    return true
  }

  return false
}

const sanitizeIconUri = (symbol: string | undefined, name: string | undefined, uri?: string | null) => {
  // Hardcoded fixes for known broken/missing images
  const brokenUrls = [
    'bridge.movementnetwork.xyz/usdc.png',
    'podium.fi/pass/'
  ]

  const isBroken = uri && brokenUrls.some(broken => uri.includes(broken))

  if (!uri || isBroken) {
    if (symbol?.toUpperCase().includes('USDC')) {
      return 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png'
    }
    if (symbol?.toUpperCase() === 'WEUSD') {
      return 'https://assets.coingecko.com/coins/images/36248/large/WEUSD.png'
    }
    if (symbol?.toLowerCase().includes('moon moverz') || name?.toLowerCase().includes('moon moverz') ||
      symbol?.toLowerCase().includes('moonmoverz') || name?.toLowerCase().includes('moonmoverz')) {
      return 'https://i.ibb.co/3pQjQ6P/moonmoverz.png'
    }
    // Check if symbol OR original URI has "podium"
    if (symbol?.toLowerCase().includes('podium') || (uri && uri.toLowerCase().includes('podium'))) {
      return 'https://i.ibb.co/vzYyS2F/podium-pass.png'
    }
    return symbol === 'USDT.e' || symbol === 'USDT'
      ? 'https://assets.coingecko.com/coins/images/325/large/Tether.png'
      : MOVE_ICON_FALLBACK
  }

  if (symbol?.toUpperCase().includes('USDC')) {
    return 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png'
  }

  if (symbol?.toUpperCase().includes('USDT')) {
    return 'https://assets.coingecko.com/coins/images/325/large/Tether.png'
  }

  if (uri?.endsWith('.svg')) {
    return uri.replace('.svg', '.png')
  }

  return uri
}

const sortAssets = (assets: FungibleAsset[]) =>
  assets.sort((a, b) => {
    if (a.asset_type === '0x1::aptos_coin::AptosCoin') return -1
    if (b.asset_type === '0x1::aptos_coin::AptosCoin') return 1
    return 0
  })

async function fetchIndexerAssets(
  walletAddress: string,
  networkConfig: MovementNetworkConfig
): Promise<FungibleAsset[]> {
  const query = `
      query GetFungibleAssets($address: String!) {
        current_fungible_asset_balances(
          where: { owner_address: { _eq: $address }, amount: { _gt: "0" } }
          order_by: { amount: desc }
        ) {
          asset_type
          amount
          metadata {
            name
            symbol
            decimals
            icon_uri
            project_uri
            asset_type
          }
        }
      }
    `

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20000)

  try {
    const response = await fetch(networkConfig.indexerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { address: walletAddress },
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Indexer error: ${response.status}`)
    }

    const result = await response.json()

    if (result.errors || !result.data?.current_fungible_asset_balances) {
      throw new Error('Indexer returned no data')
    }

    const assets: FungibleAsset[] = result.data.current_fungible_asset_balances.map((balance: any) => ({
      asset_type: balance.asset_type,
      amount: balance.amount,
      metadata: {
        name: balance.metadata?.name || 'Unknown Asset',
        symbol: balance.metadata?.symbol || '???',
        decimals: balance.metadata?.decimals || 8,
        icon_uri: sanitizeIconUri(balance.metadata?.symbol, balance.metadata?.name, balance.metadata?.icon_uri),
        isSpam: isSpamAsset(balance.metadata?.name || '', balance.metadata?.symbol || ''),
      },
    }))

    return sortAssets(assets)
  } finally {
    clearTimeout(timeoutId)
  }
}

async function fetchNativeMoveBalance(walletAddress: string, network: MovementNetwork) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(`${BACKEND_URL}/balance/${walletAddress}?network=${network}`, {
      signal: controller.signal,
    })

    if (!response.ok) {
      return null
    }

    const { balance } = await response.json()

    if (!balance || balance <= 0) {
      return null
    }

    // Standardize decimals: 8 for MOVE (Aptos/Movement standard)
    const decimals = 8

    return {
      asset_type: '0x1::aptos_coin::AptosCoin',
      amount: balance.toString(),
      metadata: {
        name: 'Movement',
        symbol: 'MOVE',
        decimals,
        icon_uri: MOVE_ICON_FALLBACK,
      },
    } as FungibleAsset
  } catch (error) {
    // Silently ignore - expected when there's no MOVE balance or network issues
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

type CoinInfo = {
  name: string
  symbol: string
  decimals: number
}

const coinInfoCache = new Map<string, CoinInfo>()

// Helper to fetch from RPC with fallback support
async function fetchRpc(path: string, network: MovementNetwork): Promise<Response> {
  const config = NETWORK_CONFIGS[network]
  const urls = [config.rpcUrl]
  if (config.fallbackRpcUrl) {
    urls.push(config.fallbackRpcUrl)
  }

  let lastError: any = null

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch(`${url}${path}`, {
        signal: controller.signal
      })

      if (response.ok) {
        // Try to clone and text() to check if it's actually JSON before returning
        // but that might be expensive. Let's just return it and handle parse error later.
        clearTimeout(timeoutId)
        return response
      }

      throw new Error(`RPC status ${response.status} at ${url}`)
    } catch (error: any) {
      lastError = error
      const isJsonError = error instanceof SyntaxError || error.message?.includes('JSON')
      if (i < urls.length - 1) {
        console.warn(`[movementAssets] RPC ${url} failed (${isJsonError ? 'JSON Error' : error.message}), trying fallback...`)
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  throw lastError || new Error('All RPC endpoints failed')
}

export async function getFungibleAssets(
  walletAddress: string,
  network: MovementNetwork = DEFAULT_NETWORK
): Promise<FungibleAsset[]> {
  if (!walletAddress) {
    return []
  }

  const networkConfig = NETWORK_CONFIGS[network]

  // Helper for actual fetching (since we might need to retry logic)
  const doFetch = async () => {
    if (networkConfig.skipIndexer) {
      const rpcAssets = await fetchAssetsFromRpc(walletAddress, network)
      return rpcAssets.length > 0 ? rpcAssets : null
    }

    try {
      const indexedAssets = await fetchIndexerAssets(walletAddress, networkConfig)
      return indexedAssets.length > 0 ? indexedAssets : null
    } catch (error) {
      return null
    }
  }

  try {
    const assets = await doFetch()
    if (assets) return assets

    // Fallback to native move balance via backend
    const nativeMove = await fetchNativeMoveBalance(walletAddress, network)
    return nativeMove ? [nativeMove] : []
  } catch (error) {
    const nativeMove = await fetchNativeMoveBalance(walletAddress, network)
    return nativeMove ? [nativeMove] : []
  }
}

async function fetchCoinInfo(coinType: string, network: MovementNetwork): Promise<CoinInfo> {
  const cacheKey = `${network}:${coinType}`
  if (coinInfoCache.has(cacheKey)) {
    return coinInfoCache.get(cacheKey)!
  }

  const providerAccount = coinType.split('::')[0]
  const resourceType = `0x1::coin::CoinInfo<${coinType}>`
  const encodedResourceType = encodeURIComponent(resourceType)

  try {
    const response = await fetchRpc(`/accounts/${providerAccount}/resource/${encodedResourceType}`, network)
    const result = await response.json()
    const data = result.data

    const info: CoinInfo = {
      name: data.name || coinType.split('::').pop() || 'Unknown',
      symbol: data.symbol || '???',
      decimals: typeof data.decimals === 'number' ? data.decimals : parseInt(data.decimals ?? '8', 10),
    }

    coinInfoCache.set(cacheKey, info)
    return info
  } catch (error: any) {
    const isJsonError = error instanceof SyntaxError || error.message?.includes('JSON')
    if (isJsonError) {
      console.warn('[movementAssets] fetchCoinInfo parse error (Nodes down or rate-limited)')
    } else {
      console.warn('[movementAssets] fetchCoinInfo failed:', error.message)
    }

    const fallback: CoinInfo = {
      name: coinType.split('::').pop() || 'Unknown',
      symbol: coinType.split('::').pop() || '???',
      decimals: 8,
    }
    coinInfoCache.set(cacheKey, fallback)
    return fallback
  }
}

async function fetchFAMetadata(assetType: string, network: MovementNetwork): Promise<{ name: string; symbol: string; decimals: number } | null> {
  try {
    const response = await fetchRpc(`/accounts/${assetType}/resource/0x1::fungible_asset::Metadata`, network)
    const result = await response.json()
    const data = result?.data

    return {
      name: data?.name || 'Unknown Asset',
      symbol: data?.symbol || '???',
      decimals: data?.decimals || 8,
    }
  } catch (error: any) {
    const isJsonError = error instanceof SyntaxError || error.message?.includes('JSON')
    if (!isJsonError) {
      console.warn('[movementAssets] fetchFAMetadata failed:', error.message)
    }
    return null
  }
}

async function fetchAssetsFromRpc(walletAddress: string, network: MovementNetwork): Promise<FungibleAsset[]> {
  try {
    const response = await fetchRpc(`/accounts/${walletAddress}/resources?limit=200`, network)
    const resources = await response.json()
    const assets: FungibleAsset[] = []

    // Fetch CoinStore assets (legacy coins)
    const coinStoreTasks = resources
      .filter((r: any) => r?.type?.startsWith('0x1::coin::CoinStore<'))
      .map(async (resource: any) => {
        const match = resource.type.match(/^0x1::coin::CoinStore<(.*)>$/)
        if (!match) return null

        const coinType = match[1]
        const amount = resource?.data?.coin?.value ?? '0'
        if (!amount || amount === '0') return null

        const info = await fetchCoinInfo(coinType, network)
        return {
          asset_type: coinType,
          amount: amount.toString(),
          metadata: {
            name: info.name,
            symbol: info.symbol,
            decimals: info.decimals,
            icon_uri: sanitizeIconUri(info.symbol, info.name, undefined),
            isSpam: isSpamAsset(info.name, info.symbol),
          },
        } as FungibleAsset
      })

    const coinAssets = (await Promise.all(coinStoreTasks)).filter((a): a is FungibleAsset => a !== null)
    assets.push(...coinAssets)

    // Fetch Fungible Assets (FA standard) - direct resources
    const faTasks = resources
      .filter((r: any) => r?.type?.startsWith('0x1::fungible_asset::FungibleStore'))
      .map(async (resource: any) => {
        const assetType = resource?.data?.metadata?.inner
        const amount = resource?.data?.balance ?? '0'

        if (!assetType || !amount || amount === '0') return null
        if (assets.some(a => a.asset_type === assetType)) return null

        const metadata = await fetchFAMetadata(assetType, network)
        if (!metadata) return null

        return {
          asset_type: assetType,
          amount: amount.toString(),
          metadata: {
            name: metadata.name,
            symbol: metadata.symbol,
            decimals: metadata.decimals,
            icon_uri: sanitizeIconUri(metadata.symbol, metadata.name, undefined),
            isSpam: isSpamAsset(metadata.name, metadata.symbol),
          },
        } as FungibleAsset
      })

    const faAssets = (await Promise.all(faTasks)).filter((a): a is FungibleAsset => a !== null)
    assets.push(...faAssets)

    // Fetch Fungible Assets stored in owned objects
    const ownedObjectAddresses: string[] = []
    for (const resource of resources) {
      if (resource?.type === '0x1::object::ObjectCore') {
        const owner = resource?.data?.owner
        if (owner === walletAddress) {
          const objectAddr = resource.address
          if (objectAddr && objectAddr !== walletAddress) {
            ownedObjectAddresses.push(objectAddr)
          }
        }
      }
    }

    const objectTasks = ownedObjectAddresses.map(async (objectAddr) => {
      try {
        const objResponse = await fetchRpc(`/accounts/${objectAddr}/resources`, network)
        const objResources = await objResponse.json()
        const objectAssets: FungibleAsset[] = []

        for (const objResource of objResources) {
          if (objResource?.type !== '0x1::fungible_asset::FungibleStore') continue

          const assetType = objResource?.data?.metadata?.inner
          const amount = objResource?.data?.balance ?? '0'

          if (!assetType || !amount || amount === '0') continue
          if (assets.some(a => a.asset_type === assetType)) continue

          const metadata = await fetchFAMetadata(assetType, network)
          if (metadata) {
            objectAssets.push({
              asset_type: assetType,
              amount: amount.toString(),
              metadata: {
                name: metadata.name,
                symbol: metadata.symbol,
                decimals: metadata.decimals,
                icon_uri: sanitizeIconUri(metadata.symbol, metadata.name, undefined),
                isSpam: isSpamAsset(metadata.name, metadata.symbol),
              },
            } as FungibleAsset)
          }
        }
        return objectAssets
      } catch (error) {
        return []
      }
    })

    const allObjectAssets = await Promise.all(objectTasks)
    allObjectAssets.forEach(itemAssets => {
      assets.push(...itemAssets)
    })

    return sortAssets(assets)
  } catch (error) {
    console.warn('[movementAssets] fetchAssetsFromRpc failed:', error instanceof Error ? error.message : 'Unknown error')
    return []
  }
}

export function formatAssetBalance(amount: string, decimals: number): string {
  const balance = parseFloat(amount) / Math.pow(10, decimals)
  return balance.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  })
}
