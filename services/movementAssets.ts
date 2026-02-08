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
  }
}

const sanitizeIconUri = (symbol: string | undefined, uri?: string | null) => {
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
        icon_uri: sanitizeIconUri(balance.metadata?.symbol, balance.metadata?.icon_uri),
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

    return {
      asset_type: '0x1::aptos_coin::AptosCoin',
      amount: balance.toString(),
      metadata: {
        name: 'Movement',
        symbol: 'MOVE',
        decimals: 8,
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

async function fetchCoinInfo(coinType: string, networkConfig: MovementNetworkConfig): Promise<CoinInfo> {
  if (coinInfoCache.has(coinType)) {
    return coinInfoCache.get(coinType)!
  }

  const providerAccount = coinType.split('::')[0]
  const resourceType = `0x1::coin::CoinInfo<${coinType}>`
  const encodedResourceType = encodeURIComponent(resourceType)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(`${networkConfig.rpcUrl}/accounts/${providerAccount}/resource/${encodedResourceType}`, {
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Coin info response ${response.status}`)
    }

    const { data } = await response.json()

    const info: CoinInfo = {
      name: data.name || coinType.split('::').pop() || 'Unknown',
      symbol: data.symbol || '???',
      decimals: typeof data.decimals === 'number' ? data.decimals : parseInt(data.decimals ?? '8', 10),
    }

    coinInfoCache.set(coinType, info)
    return info
  } catch (error) {
    console.error('Failed to fetch coin info', coinType, error)
    const fallback: CoinInfo = {
      name: coinType.split('::').pop() || 'Unknown',
      symbol: coinType.split('::').pop() || '???',
      decimals: 8,
    }
    coinInfoCache.set(coinType, fallback)
    return fallback
  } finally {
    clearTimeout(timeoutId)
  }
}

async function fetchFAMetadata(assetType: string, networkConfig: MovementNetworkConfig): Promise<{ name: string; symbol: string; decimals: number } | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(`${networkConfig.rpcUrl}/accounts/${assetType}/resource/0x1::fungible_asset::Metadata`, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return null
    }

    const result = await response.json()
    const data = result?.data

    return {
      name: data?.name || 'Unknown Asset',
      symbol: data?.symbol || '???',
      decimals: data?.decimals || 8,
    }
  } catch (error) {
    console.error('Failed to fetch FA metadata for', assetType, error)
    return null
  }
}

async function fetchAssetsFromRpc(walletAddress: string, networkConfig: MovementNetworkConfig): Promise<FungibleAsset[]> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20000)

  try {
    const response = await fetch(`${networkConfig.rpcUrl}/accounts/${walletAddress}/resources?limit=200`, {
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Resources response ${response.status}`)
    }

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

        const info = await fetchCoinInfo(coinType, networkConfig)
        return {
          asset_type: coinType,
          amount: amount.toString(),
          metadata: {
            name: info.name,
            symbol: info.symbol,
            decimals: info.decimals,
            icon_uri: sanitizeIconUri(info.symbol, undefined),
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

        const metadata = await fetchFAMetadata(assetType, networkConfig)
        if (!metadata) return null

        return {
          asset_type: assetType,
          amount: amount.toString(),
          metadata: {
            name: metadata.name,
            symbol: metadata.symbol,
            decimals: metadata.decimals,
            icon_uri: sanitizeIconUri(metadata.symbol, undefined),
          },
        } as FungibleAsset
      })

    const faAssets = (await Promise.all(faTasks)).filter((a): a is FungibleAsset => a !== null)
    assets.push(...faAssets)

    // Fetch Fungible Assets stored in owned objects
    // Movement Network stores FA in separate object addresses
    const ownedObjectAddresses: string[] = []

    for (const resource of resources) {
      if (resource?.type === '0x1::object::ObjectCore') {
        const owner = resource?.data?.owner
        if (owner === walletAddress) {
          // Extract the object address - it's stored in the resource address or state_key
          const objectAddr = resource.address
          if (objectAddr && objectAddr !== walletAddress) {
            ownedObjectAddresses.push(objectAddr)
          }
        }
      }
    }

    // Fetch FA resources from owned objects in parallel
    const objectTasks = ownedObjectAddresses.map(async (objectAddr) => {
      try {
        const objController = new AbortController()
        const objTimeoutId = setTimeout(() => objController.abort(), 10000)

        const objResponse = await fetch(`${networkConfig.rpcUrl}/accounts/${objectAddr}/resources`, {
          signal: objController.signal,
        })

        clearTimeout(objTimeoutId)

        if (!objResponse.ok) return []

        const objResources = await objResponse.json()
        const objectAssets: FungibleAsset[] = []

        for (const objResource of objResources) {
          if (objResource?.type !== '0x1::fungible_asset::FungibleStore') continue

          const assetType = objResource?.data?.metadata?.inner
          const amount = objResource?.data?.balance ?? '0'

          if (!assetType || !amount || amount === '0') continue
          if (assets.some(a => a.asset_type === assetType)) continue

          const metadata = await fetchFAMetadata(assetType, networkConfig)
          if (metadata) {
            objectAssets.push({
              asset_type: assetType,
              amount: amount.toString(),
              metadata: {
                name: metadata.name,
                symbol: metadata.symbol,
                decimals: metadata.decimals,
                icon_uri: sanitizeIconUri(metadata.symbol, undefined),
              },
            } as FungibleAsset)
          }
        }
        return objectAssets
      } catch (error) {
        console.error(`Failed to fetch FA from object ${objectAddr}:`, error)
        return []
      }
    })

    const allObjectAssets = await Promise.all(objectTasks)
    allObjectAssets.forEach(itemAssets => {
      assets.push(...itemAssets)
    })

    return sortAssets(assets)
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function getFungibleAssets(
  walletAddress: string,
  network: MovementNetwork = DEFAULT_NETWORK
): Promise<FungibleAsset[]> {
  if (!walletAddress) {
    return []
  }

  const networkConfig = NETWORK_CONFIGS[network]

  if (networkConfig.skipIndexer) {
    try {
      const rpcAssets = await fetchAssetsFromRpc(walletAddress, networkConfig)

      if (rpcAssets.length > 0) {
        return rpcAssets
      }
    } catch (error) {
      console.error('Failed to fetch assets from RPC', error)
    }

    const balance = await fetchNativeMoveBalance(walletAddress, network)
    return balance ? [balance] : []
  }

  try {
    const indexedAssets = await fetchIndexerAssets(walletAddress, networkConfig)

    if (indexedAssets.length > 0) {
      return indexedAssets
    }

    const nativeMove = await fetchNativeMoveBalance(walletAddress, network)
    return nativeMove ? [nativeMove] : []
  } catch (error) {
    const nativeMove = await fetchNativeMoveBalance(walletAddress, network)
    return nativeMove ? [nativeMove] : []
  }
}

export function formatAssetBalance(amount: string, decimals: number): string {
  const balance = parseFloat(amount) / Math.pow(10, decimals)
  return balance.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  })
}
