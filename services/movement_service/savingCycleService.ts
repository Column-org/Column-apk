import { ABI } from './SavingCycleABI'
import { NETWORK_CONFIGS, MovementNetwork } from '../../constants/networkConfig'
import { BACKEND_URL } from './constants'

const MODULE_ADDRESS = ABI.address

export interface AllowedAsset {
    address: string
    name: string
    symbol: string
    decimals: number
}

type SignHashFn = (address: string, hash: string) => Promise<any>

export type SavingCycleResult = {
    success: boolean
    transactionHash?: string
    error?: string
}

export interface SavingCycle {
    id: number
    version: number
    name: string
    description: string
    startTime: number
    endTime: number
    assetAddress: string
    amount: number
    goalAmount: number
    penaltyPercentage: number
}

// Get all cycle IDs for a user
export async function getAllCycleIds(
    userAddress: string,
    network: MovementNetwork = 'testnet'
): Promise<number[]> {
    const config = NETWORK_CONFIGS[network]
    const rpcUrl = config.rpcUrl

    try {
        const response = await fetch(`${rpcUrl}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                function: `${MODULE_ADDRESS}::saving_cycle::get_all_cycle_ids`,
                type_arguments: [],
                arguments: [userAddress],
            }),
        })

        if (!response.ok) {
            console.warn('Failed to fetch cycle IDs')
            return []
        }

        const data = await response.json()
        return data[0] || []
    } catch (error) {
        console.warn('Error fetching cycle IDs:', error)
        return []
    }
}

// Get active cycle IDs for a user
export async function getActiveCycleIds(
    userAddress: string,
    network: MovementNetwork = 'testnet'
): Promise<number[]> {
    const config = NETWORK_CONFIGS[network]
    const rpcUrl = config.rpcUrl

    try {
        const response = await fetch(`${rpcUrl}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                function: `${MODULE_ADDRESS}::saving_cycle::get_active_cycle_ids`,
                type_arguments: [],
                arguments: [userAddress],
            }),
        })

        if (!response.ok) {
            console.warn('Failed to fetch active cycle IDs')
            return []
        }

        const data = await response.json()
        return data[0] || []
    } catch (error) {
        console.warn('Error fetching active cycle IDs:', error)
        return []
    }
}

// Get cycle details
export async function getCycle(
    userAddress: string,
    cycleId: number,
    network: MovementNetwork = 'testnet'
): Promise<SavingCycle | null> {
    const config = NETWORK_CONFIGS[network]
    const rpcUrl = config.rpcUrl

    try {
        const response = await fetch(`${rpcUrl}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                function: `${MODULE_ADDRESS}::saving_cycle::get_cycle`,
                type_arguments: [],
                arguments: [userAddress, cycleId.toString()],
            }),
        })

        if (!response.ok) {
            console.warn('RPC response not OK:', response.status)
            return null
        }

        const result = await response.json()
        console.log('getCycle raw response:', result)

        // The response might be wrapped in a result field
        const data = result.result || result

        if (!data || !Array.isArray(data) || data.length < 9) {
            console.warn('Invalid cycle data format:', data)
            return null
        }

        // Parse the response according to the ABI return type
        // [version, name, description, start_time, end_time, asset_address, amount, goal_amount, penalty_percentage]
        return {
            id: cycleId,
            version: parseInt(data[0]),
            name: data[1],
            description: data[2],
            startTime: parseInt(data[3]),
            endTime: parseInt(data[4]),
            assetAddress: data[5],
            amount: parseInt(data[6]),
            goalAmount: parseInt(data[7]),
            penaltyPercentage: parseInt(data[8]),
        }
    } catch (error) {
        console.error('Error fetching cycle:', error)
        return null
    }
}

// Get all cycles for a user
export async function getAllCycles(
    userAddress: string,
    network: MovementNetwork = 'testnet'
): Promise<SavingCycle[]> {
    try {
        const cycleIds = await getAllCycleIds(userAddress, network)
        const cycles: SavingCycle[] = []

        for (const id of cycleIds) {
            const cycle = await getCycle(userAddress, id, network)
            if (cycle) {
                cycles.push(cycle)
            }
        }

        return cycles
    } catch (error) {
        console.warn('Error fetching all cycles:', error)
        return []
    }
}

// Get total saved across all assets
export async function getTotalSavedAllAssets(
    userAddress: string,
    network: MovementNetwork = 'testnet'
): Promise<number> {
    const config = NETWORK_CONFIGS[network]
    const rpcUrl = config.rpcUrl

    try {
        const response = await fetch(`${rpcUrl}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                function: `${MODULE_ADDRESS}::saving_cycle::get_total_saved_all_assets`,
                type_arguments: [],
                arguments: [userAddress],
            }),
        })

        if (!response.ok) {
            return 0
        }

        const data = await response.json()
        return parseInt(data[0]) || 0
    } catch (error) {
        console.warn('Error fetching total saved:', error)
        return 0
    }
}

// Get total saved for a specific asset
export async function getTotalSavedByAsset(
    userAddress: string,
    assetAddress: string,
    network: MovementNetwork = 'testnet'
): Promise<number> {
    const config = NETWORK_CONFIGS[network]
    const rpcUrl = config.rpcUrl

    try {
        const response = await fetch(`${rpcUrl}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                function: `${MODULE_ADDRESS}::saving_cycle::get_total_saved_by_asset`,
                type_arguments: [],
                arguments: [userAddress, assetAddress],
            }),
        })

        if (!response.ok) {
            return 0
        }

        const data = await response.json()
        return parseInt(data[0]) || 0
    } catch (error) {
        console.warn('Error fetching total saved by asset:', error)
        return 0
    }
}

// Check if contract is paused
export async function isPaused(
    network: MovementNetwork = 'testnet'
): Promise<boolean> {
    const config = NETWORK_CONFIGS[network]
    const rpcUrl = config.rpcUrl

    try {
        const response = await fetch(`${rpcUrl}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                function: `${MODULE_ADDRESS}::saving_cycle::is_paused`,
                type_arguments: [],
                arguments: [],
            }),
        })

        if (!response.ok) {
            return false
        }

        const data = await response.json()
        return data[0] === true
    } catch (error) {
        console.warn('Error checking pause status:', error)
        return false
    }
}

// Get contract version
export async function getContractVersion(
    network: MovementNetwork = 'testnet'
): Promise<number> {
    const config = NETWORK_CONFIGS[network]
    const rpcUrl = config.rpcUrl

    try {
        const response = await fetch(`${rpcUrl}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                function: `${MODULE_ADDRESS}::saving_cycle::get_contract_version`,
                type_arguments: [],
                arguments: [],
            }),
        })

        if (!response.ok) {
            return 1
        }

        const data = await response.json()
        return parseInt(data[0]) || 1
    } catch (error) {
        console.warn('Error fetching contract version:', error)
        return 1
    }
}

// Check if goal is reached
export async function isGoalReached(
    userAddress: string,
    cycleId: number,
    network: MovementNetwork = 'testnet'
): Promise<boolean> {
    const config = NETWORK_CONFIGS[network]
    const rpcUrl = config.rpcUrl

    try {
        const response = await fetch(`${rpcUrl}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                function: `${MODULE_ADDRESS}::saving_cycle::is_goal_reached`,
                type_arguments: [],
                arguments: [userAddress, cycleId.toString()],
            }),
        })

        if (!response.ok) {
            return false
        }

        const data = await response.json()
        return data[0] === true
    } catch (error) {
        console.warn('Error checking goal status:', error)
        return false
    }
}

// Get goal progress percentage (0-100+)
export async function getGoalProgress(
    userAddress: string,
    cycleId: number,
    network: MovementNetwork = 'testnet'
): Promise<number> {
    const config = NETWORK_CONFIGS[network]
    const rpcUrl = config.rpcUrl

    try {
        const response = await fetch(`${rpcUrl}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                function: `${MODULE_ADDRESS}::saving_cycle::get_goal_progress`,
                type_arguments: [],
                arguments: [userAddress, cycleId.toString()],
            }),
        })

        if (!response.ok) {
            return 0
        }

        const data = await response.json()
        return parseInt(data[0]) || 0
    } catch (error) {
        console.warn('Error fetching goal progress:', error)
        return 0
    }
}

// Check if cycle is expired
export async function isCycleExpired(
    userAddress: string,
    cycleId: number,
    network: MovementNetwork = 'testnet'
): Promise<boolean> {
    const config = NETWORK_CONFIGS[network]
    const rpcUrl = config.rpcUrl

    try {
        const response = await fetch(`${rpcUrl}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                function: `${MODULE_ADDRESS}::saving_cycle::is_cycle_expired`,
                type_arguments: [],
                arguments: [userAddress, cycleId.toString()],
            }),
        })

        if (!response.ok) {
            return false
        }

        const data = await response.json()
        return data[0] === true
    } catch (error) {
        console.warn('Error checking cycle expiry:', error)
        return false
    }
}

// Check if cycle is goal-based
export async function isGoalBased(
    userAddress: string,
    cycleId: number,
    network: MovementNetwork = 'testnet'
): Promise<boolean> {
    const config = NETWORK_CONFIGS[network]
    const rpcUrl = config.rpcUrl

    try {
        const response = await fetch(`${rpcUrl}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                function: `${MODULE_ADDRESS}::saving_cycle::is_goal_based`,
                type_arguments: [],
                arguments: [userAddress, cycleId.toString()],
            }),
        })

        if (!response.ok) {
            return false
        }

        const data = await response.json()
        return data[0] === true
    } catch (error) {
        console.warn('Error checking cycle type:', error)
        return false
    }
}

// Get cycle version
export async function getCycleVersion(
    userAddress: string,
    cycleId: number,
    network: MovementNetwork = 'testnet'
): Promise<number> {
    const config = NETWORK_CONFIGS[network]
    const rpcUrl = config.rpcUrl

    try {
        const response = await fetch(`${rpcUrl}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                function: `${MODULE_ADDRESS}::saving_cycle::get_cycle_version`,
                type_arguments: [],
                arguments: [userAddress, cycleId.toString()],
            }),
        })

        if (!response.ok) {
            return 1
        }

        const data = await response.json()
        return parseInt(data[0]) || 1
    } catch (error) {
        console.warn('Error fetching cycle version:', error)
        return 1
    }
}

// Convert base units to human readable amount
export function fromBaseUnit(amount: number | string, decimals: number): number {
    const val = typeof amount === 'string' ? parseInt(amount) : amount
    return val / Math.pow(10, decimals)
}

// Convert human readable amount to base units
export function toBaseUnit(amount: number, decimals: number): number {
    return Math.floor(amount * Math.pow(10, decimals))
}

// Legacy helpers for MOVE (8 decimals)
export function octasToMove(octas: number): number {
    return fromBaseUnit(octas, 8)
}

export function moveToOctas(move: number): number {
    return toBaseUnit(move, 8)
}

// Get Fungible Asset balance from backend
export async function getFABalance(
    ownerAddress: string,
    assetAddress: string,
    network: MovementNetwork = 'testnet'
): Promise<string> {
    try {
        const response = await fetch(`${BACKEND_URL}/fa-balance/${ownerAddress}/${assetAddress}?network=${network}`)
        if (!response.ok) return '0'
        const data = await response.json()
        return data.balance?.toString() || '0'
    } catch (error) {
        console.warn('Error fetching FA balance:', error)
        return '0'
    }
}

// Fetch allowed fungible assets from the indexer
export async function getAllowedAssets(
    network: MovementNetwork = 'testnet'
): Promise<AllowedAsset[]> {
    const config = NETWORK_CONFIGS[network]
    const indexerUrl = config.indexerUrl

    const query = `
        query GetFungibleAssetMetadata($addresses: [String!]!) {
            fungible_asset_metadata(
                where: {asset_type: {_in: $addresses}}
            ) {
                asset_type
                name
                symbol
                decimals
            }
        }
    `

    // Known allowed FA addresses
    const allowedFAAddresses = [
        '0xbc460206050b3c3e1c8300d164913371eaf2178c91a919920b60dee378e7b35a', // GMOON FA
    ]

    // Hardcoded MOVE Coin - it's a Coin type, not an FA, so not in fungible_asset_metadata
    const moveCoin: AllowedAsset = {
        address: '0x1::aptos_coin::AptosCoin',
        name: 'Movement',
        symbol: 'MOVE',
        decimals: 8
    }

    try {
        const response = await fetch(indexerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                variables: { addresses: allowedFAAddresses }
            })
        })

        if (!response.ok) {
            console.warn('Failed to fetch allowed assets')
            return [moveCoin] // Return at least MOVE
        }

        const data = await response.json()

        if (data.errors) {
            console.warn('GraphQL errors:', data.errors)
            return [moveCoin] // Return at least MOVE
        }

        const assets = data.data?.fungible_asset_metadata || []

        const faAssets = assets.map((asset: any) => ({
            address: asset.asset_type,
            name: asset.name,
            symbol: asset.symbol,
            decimals: asset.decimals
        }))

        // Return MOVE Coin first, then any FAs found
        return [moveCoin, ...faAssets]
    } catch (error) {
        console.warn('Error fetching allowed assets:', error)
        return [moveCoin] // Return at least MOVE on error
    }
}

// Build transaction payload for creating a cycle
// Parameters must match contract: name, description, start_time, end_time, asset_address, deposit_amount, goal_amount
export function buildCreateCyclePayload(
    name: string,
    description: string,
    startTime: number, // Unix timestamp in seconds
    endTime: number, // Unix timestamp in seconds
    assetAddress: string,
    depositAmount: number, // in octas
    goalAmount: number, // in octas (0 for time-based)
    penaltyPercentage: number // percentage (e.g. 5 for 5%)
) {
    return {
        function: `${MODULE_ADDRESS}::saving_cycle::create_cycle`,
        type_arguments: [],
        arguments: [
            name,
            description,
            startTime.toString(),
            endTime.toString(),
            assetAddress,
            depositAmount.toString(),
            goalAmount.toString(),
            penaltyPercentage.toString(),
        ],
    }
}

// Build transaction payload for top-up
export function buildTopUpPayload(cycleId: number, amount: number) {
    return {
        function: `${MODULE_ADDRESS}::saving_cycle::top_up`,
        type_arguments: [],
        arguments: [cycleId.toString(), amount.toString()],
    }
}

// Build transaction payload for early withdrawal
export function buildEarlyWithdrawPayload(cycleId: number) {
    return {
        function: `${MODULE_ADDRESS}::saving_cycle::early_withdraw`,
        type_arguments: [],
        arguments: [cycleId.toString()],
    }
}

// Build transaction payload for closing cycle
export function buildCloseCyclePayload(cycleId: number) {
    return {
        function: `${MODULE_ADDRESS}::saving_cycle::close_cycle`,
        type_arguments: [],
        arguments: [cycleId.toString()],
    }
}

// Submit transaction to create a cycle
export async function createCycle(
    senderAddress: string,
    name: string,
    description: string,
    startTime: number, // Unix timestamp in seconds
    endTime: number, // Unix timestamp in seconds
    assetAddress: string,
    depositAmount: number, // in octas
    goalAmount: number, // in octas
    penaltyPercentage: number, // percentage
    signHash: SignHashFn,
    network: MovementNetwork
): Promise<SavingCycleResult> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
        const payload = {
            sender: senderAddress,
            function: `${MODULE_ADDRESS}::saving_cycle::create_cycle`,
            typeArguments: [],
            functionArguments: [
                name,
                description,
                startTime.toString(),
                endTime.toString(),
                assetAddress,
                depositAmount.toString(),
                goalAmount.toString(),
                penaltyPercentage.toString(),
            ],
            network,
        }

        console.log('Creating cycle with payload:', payload)
        console.log('Backend URL:', BACKEND_URL)
        console.log('Full URL:', `${BACKEND_URL}/generate-hash`)

        const hashResponse = await fetch(`${BACKEND_URL}/generate-hash`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
        })

        console.log('Hash response status:', hashResponse.status)

        clearTimeout(timeoutId)

        if (!hashResponse.ok) {
            let errorMessage = 'Failed to generate transaction hash'
            try {
                const error = await hashResponse.json()
                errorMessage = error.error || errorMessage
            } catch (parseError) {
                // Response body is empty or invalid JSON
                errorMessage = `Server error: ${hashResponse.status} ${hashResponse.statusText}`
            }
            throw new Error(errorMessage)
        }

        const { hash, rawTxnHex } = await hashResponse.json()
        const signatureResponse = await signHash(senderAddress, hash)

        if (!signatureResponse?.data?.signature || !signatureResponse?.data?.public_key) {
            throw new Error('Invalid signature response')
        }

        const submitResponse = await fetch(`${BACKEND_URL}/submit-transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rawTxnHex,
                publicKey: signatureResponse.data.public_key,
                signature: signatureResponse.data.signature,
                network,
            }),
        })

        if (!submitResponse.ok) {
            let errorMessage = 'Failed to submit transaction'
            try {
                const error = await submitResponse.json()
                errorMessage = error.error || errorMessage
            } catch (parseError) {
                // Response body is empty or invalid JSON
                errorMessage = `Server error: ${submitResponse.status} ${submitResponse.statusText}`
            }
            throw new Error(errorMessage)
        }

        const { hash: txHash } = await submitResponse.json()

        return {
            success: true,
            transactionHash: txHash,
        }
    } catch (error: any) {
        console.error('Error creating cycle:', error)
        return {
            success: false,
            error: error.message || 'Failed to create saving cycle',
        }
    }
}

