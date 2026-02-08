export type MovementNetwork = 'mainnet' | 'testnet'

export interface MovementNetworkConfig {
  key: MovementNetwork
  displayName: string
  chainId: number
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
    chainId: 126,
    rpcUrl: 'https://rpc.sentio.xyz/movement/v1',
    indexerUrl: 'https://rpc.sentio.xyz/movement-indexer/v1/graphql',
    fallbackRpcUrl: 'https://full.mainnet.movementinfra.xyz/v1',
    fallbackIndexerUrl: 'https://indexer.mainnet.movementnetwork.xyz/v1/graphql',
    faucetUrl: null,
    skipIndexer: false,
  },
  testnet: {
    key: 'testnet',
    displayName: 'Movement Testnet',
    chainId: 250,
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

