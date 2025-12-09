export interface TokenMetadata {
  chainId: number
  tokenAddress: string | null
  faAddress: string
  name: string
  symbol: string
  decimals: number
  logoUrl: string
  websiteUrl: string
}

export const TOKEN_METADATA: Record<string, TokenMetadata> = {
  "0xa": {
    chainId: 126, // Movement mainnet
    tokenAddress: null,
    faAddress: "0xa",
    name: "Move Coin",
    symbol: "MOVE",
    decimals: 8,
    logoUrl: "https://ipfs.io/ipfs/QmUv8RVdgo6cVQzh7kxerWLatDUt4rCEFoCTkCVLuMAa27",
    websiteUrl: "https://movementnetwork.xyz"
  },
  "gmoon": {
    chainId: 126, // Movement mainnet
    tokenAddress: null,
    faAddress: "0xbc460206050b3c3e1c8300d164913371eaf2178c91a919920b60dee378e7b35a",
    name: "GMOON",
    symbol: "GMOON",
    decimals: 8,
    logoUrl: "https://ipfs.io/ipfs/QmUv8RVdgo6cVQzh7kxerWLatDUt4rCEFoCTkCVLuMAa27",
    websiteUrl: "https://movementnetwork.xyz"
  }
}
