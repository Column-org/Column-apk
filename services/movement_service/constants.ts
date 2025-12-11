import { FA5Style } from "@expo/vector-icons/build/FontAwesome5";

export const MODULE_ADDRESS = "0x00eb30f24eab56506b8abaea431fb0c6f6aa64622018298b54b1c3d40006fc75";

export const CONTRACT_MODULE = "sendmove";
export const SAVING_CYCLE_MODULE = "saving_cycle";

// Backend Environment Configuration
// Change USE_LOCAL_BACKEND to switch between local and production
export const USE_LOCAL_BACKEND = false; // Set to false for production

export const BACKEND_URLS = {
  local: "http://10.148.185.245:3000",
  production: "https://column-backend.vercel.app"
};

// Automatically select backend URL based on environment
export const BACKEND_URL = USE_LOCAL_BACKEND ? BACKEND_URLS.local : BACKEND_URLS.production;

// Latest Movement Network endpoints (updated 2025)
export const NETWORK_CONFIG = {
  // Primary testnet endpoint with timeout settings
  fullnode: "https://testnet.movementnetwork.xyz/v1",
  // GraphQL indexer endpoint
  indexer: "https://hasura.testnet.movementnetwork.xyz/v1/graphql",
  // Network details
  chainId: 250,
  // Faucet endpoints
  faucet: "https://faucet.testnet.movementinfra.xyz/",
  faucetUI: "https://faucet.movementnetwork.xyz/",
  // Explorer
  explorer: "https://explorer.movementnetwork.xyz/?network=bardock+testnet",
  // Network status
  status: "https://status.movementnetwork.xyz/",
  // Client configuration
  requestTimeout: 30000, // 30 seconds
  retryAttempts: 3
};