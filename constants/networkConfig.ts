export type MovementNetwork = 'mainnet' | 'testnet'

export interface MovementNetworkConfig {
  key: MovementNetwork
  displayName: string
  rpcUrl: string
  indexerUrl: string
  fallbackRpcUrl?: string
  fallbackIndexerUrl?: string
  faucetUrl?: string | null
  skipIndexer?: boolean
}

export const NETWORK_CONFIGS: Record<MovementNetwork, MovementNetworkConfig> = {
  mainnet: {
    key: 'mainnet',
    displayName: 'Movement Mainnet',
    rpcUrl: 'https://rpc.sentio.xyz/movement/v1', // Primary: Sentio
    indexerUrl: 'https://rpc.sentio.xyz/movement-indexer/v1/graphql', // Primary: Sentio
    fallbackRpcUrl: 'https://full.mainnet.movementinfra.xyz/v1', // Fallback: Movement
    fallbackIndexerUrl: 'https://indexer.mainnet.movementnetwork.xyz/v1/graphql', // Fallback: Movement
    faucetUrl: null,
    skipIndexer: false,
  },
  testnet: {
    key: 'testnet',
    displayName: 'Movement Testnet',
    rpcUrl: 'https://testnet.movementnetwork.xyz/v1',
    indexerUrl: 'https://indexer.testnet.movementnetwork.xyz/v1/graphql',
    faucetUrl: 'https://faucet.testnet.movementnetwork.xyz/',
    skipIndexer: false,
  },
}

export const DEFAULT_NETWORK: MovementNetwork = 'mainnet'

export function isMovementNetwork(value: string | undefined | null): value is MovementNetwork {
  if (!value) return false
  return value === 'mainnet' || value === 'testnet'
}

