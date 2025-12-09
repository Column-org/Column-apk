import { MovementNetwork, NETWORK_CONFIGS } from '../../constants/networkConfig'
import { MODULE_ADDRESS } from './constants'

export interface TransferDetails {
  sender: string
  amount: string
  created_at: string
  expiration: string
}

export interface FATransferDetails {
  sender: string
  recipient: string
  amount: string
  created_at: string
  expiration: string
}

/**
 * Helper to call view functions with fallback
 */
async function callViewFunction(
  functionName: string,
  args: any[],
  network: MovementNetwork
): Promise<any> {
  const config = NETWORK_CONFIGS[network]
  const primaryEndpoint = config.rpcUrl

  try {
    const response = await fetch(`${primaryEndpoint}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: `${MODULE_ADDRESS}::sendmove::${functionName}`,
        type_arguments: [],
        arguments: args,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  } catch (primaryError) {
    // Try fallback if available
    if (config.fallbackRpcUrl) {
      const fallbackEndpoint = config.fallbackRpcUrl
      const response = await fetch(`${fallbackEndpoint}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: `${MODULE_ADDRESS}::sendmove::${functionName}`,
          type_arguments: [],
          arguments: args,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed ${functionName}: ${response.statusText}`)
      }

      return await response.json()
    }

    throw primaryError
  }
}

/**
 * Check if a transfer code exists (for native MOVE tokens)
 */
export async function checkCodeExists(
  code: string,
  network: MovementNetwork = 'mainnet'
): Promise<boolean> {
  try {
    const data = await callViewFunction('check_code_exists', [code], network)
    return data[0] === true
  } catch (error) {
    console.error('Error checking code exists:', error)
    return false
  }
}

/**
 * Check if a FA transfer code exists
 */
export async function checkFACodeExists(
  code: string,
  network: MovementNetwork = 'mainnet'
): Promise<boolean> {
  try {
    const data = await callViewFunction('check_fa_code_exists', [code], network)
    return data[0] === true
  } catch (error) {
    console.error('Error checking FA code exists:', error)
    return false
  }
}

/**
 * Get transfer details by code
 */
export async function getTransferDetails(
  code: string,
  network: MovementNetwork = 'mainnet'
): Promise<TransferDetails | null> {
  try {
    const data = await callViewFunction('get_transfer', [code], network)
    return {
      sender: data[0],
      amount: data[1],
      created_at: data[2],
      expiration: data[3],
    }
  } catch (error) {
    console.error('Error getting transfer details:', error)
    return null
  }
}

/**
 * Get FA transfer details by code
 */
export async function getFATransferDetails(
  code: string,
  network: MovementNetwork = 'mainnet'
): Promise<FATransferDetails | null> {
  try {
    const data = await callViewFunction('get_fa_transfer', [code], network)
    return {
      sender: data[0],
      recipient: data[1],
      amount: data[2],
      created_at: data[3],
      expiration: data[4],
    }
  } catch (error) {
    console.error('Error getting FA transfer details:', error)
    return null
  }
}

/**
 * Check if transfer is claimable
 */
export async function isTransferClaimable(
  code: string,
  network: MovementNetwork = 'mainnet'
): Promise<boolean> {
  try {
    const data = await callViewFunction('is_transfer_claimable', [code], network)
    return data[0] === true
  } catch (error) {
    console.error('Error checking if transfer claimable:', error)
    return false
  }
}

/**
 * Check if FA transfer is claimable
 */
export async function isFATransferClaimable(
  code: string,
  network: MovementNetwork = 'mainnet'
): Promise<boolean> {
  try {
    const data = await callViewFunction('is_fa_transfer_claimable', [code], network)
    return data[0] === true
  } catch (error) {
    console.error('Error checking if FA transfer claimable:', error)
    return false
  }
}

/**
 * Get escrow address holding funds
 * Note: Not available on mainnet yet
 */
export async function getResourceEscrowAddress(
  network: MovementNetwork = 'mainnet'
): Promise<string | null> {
  // Escrow system not deployed on mainnet yet
  if (network === 'mainnet') {
    return null
  }

  try {
    const data = await callViewFunction('get_resource_escrow_address', [], network)
    return data[0]
  } catch (error) {
    return null
  }
}

/**
 * Get total number of transfers created
 * Note: Not available on mainnet yet
 */
export async function getTotalTransfers(
  network: MovementNetwork = 'mainnet'
): Promise<number> {
  // Escrow system not deployed on mainnet yet
  if (network === 'mainnet') {
    return 0
  }

  try {
    const data = await callViewFunction('get_total_transfers', [], network)
    return parseInt(data[0]) || 0
  } catch (error) {
    return 0
  }
}
