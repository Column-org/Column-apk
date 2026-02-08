import { MovementNetwork, NETWORK_CONFIGS } from '../../constants/networkConfig'

export interface NFTCollection {
  collection_name: string
  creator_address: string
  description: string
  uri: string
}

export interface NFTTokenData {
  token_name: string
  token_uri: string
  token_properties: any
  collection_id: string
  current_collection: NFTCollection
}

export interface UserNFT {
  token_data_id: string
  amount: string
  current_token_data: NFTTokenData
}

export interface NFTMetadata {
  name: string
  description?: string
  image?: string
  animation_url?: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
}

/**
 * Fetch user's NFTs from Movement Network indexer
 */
async function fetchFromEndpoint(endpoint: string, ownerAddress: string): Promise<UserNFT[]> {
  const query = `
    query GetUserNFTs($owner: String!) {
      current_token_ownerships_v2(
        where: {
          owner_address: {_eq: $owner},
          amount: {_gt: "0"}
        }
        order_by: {last_transaction_timestamp: desc}
      ) {
        token_data_id
        amount
        current_token_data {
          token_name
          token_uri
          token_properties
          collection_id
          current_collection {
            collection_name
            creator_address
            description
            uri
          }
        }
      }
    }
  `

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        owner: ownerAddress,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to fetch NFTs: ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()

  if (data.errors) {
    throw new Error(data.errors[0]?.message || 'GraphQL query failed')
  }

  return data.data?.current_token_ownerships_v2 || []
}

export async function getUserNFTs(
  ownerAddress: string,
  network: MovementNetwork = 'mainnet'
): Promise<UserNFT[]> {
  const config = NETWORK_CONFIGS[network]
  const primaryEndpoint = config.indexerUrl

  try {
    const nfts = await fetchFromEndpoint(primaryEndpoint, ownerAddress)
    return nfts
  } catch (primaryError) {
    // Try fallback if available
    if (config.fallbackIndexerUrl) {
      const fallbackEndpoint = config.fallbackIndexerUrl

      try {
        const nfts = await fetchFromEndpoint(fallbackEndpoint, ownerAddress)
        return nfts
      } catch (fallbackError) {
        // Both failed - return empty array silently
        return []
      }
    }

    // No fallback - return empty array silently
    return []
  }
}

/**
 * Fetch NFT metadata from token URI
 */
export async function fetchNFTMetadata(tokenUri: string): Promise<NFTMetadata | null> {
  try {
    // Handle IPFS URLs
    let fetchUrl = tokenUri
    if (tokenUri.startsWith('ipfs://')) {
      fetchUrl = tokenUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
    }

    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.warn(`Failed to fetch metadata from ${fetchUrl}: ${response.status}`)
      return null
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return null
    }

    try {
      const metadata = await response.json()

      // Handle IPFS image URLs in metadata
      if (metadata.image && typeof metadata.image === 'string' && metadata.image.startsWith('ipfs://')) {
        metadata.image = metadata.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
      }

      return metadata
    } catch (parseError) {
      return null
    }
  } catch (error) {
    console.warn('Error fetching NFT metadata:', error)
    return null
  }
}

/**
 * Get enriched NFT data with metadata
 */
export async function getEnrichedUserNFTs(
  ownerAddress: string,
  network: MovementNetwork = 'mainnet'
): Promise<Array<UserNFT & { metadata?: NFTMetadata }>> {
  try {
    const nfts = await getUserNFTs(ownerAddress, network)

    // If no NFTs, return empty array
    if (nfts.length === 0) {
      return []
    }

    // Fetch metadata for each NFT (in parallel, limit concurrency)
    const enrichedNFTs = await Promise.all(
      nfts.map(async (nft) => {
        try {
          const metadata = nft.current_token_data?.token_uri
            ? await fetchNFTMetadata(nft.current_token_data.token_uri)
            : null

          return {
            ...nft,
            metadata: metadata || undefined,
          }
        } catch (error) {
          // Silently return NFT without metadata
          return nft
        }
      })
    )

    return enrichedNFTs
  } catch (error) {
    // Return empty array on any error
    return []
  }
}
