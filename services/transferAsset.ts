import { DEFAULT_NETWORK, MovementNetwork } from '../constants/networkConfig'
import { BACKEND_URL } from './movement_service/constants'
import * as NotificationService from './NotificationService'

type TransferNetworkOptions = {
    network?: MovementNetwork
}

export interface TransferAssetParams {
    senderAddress: string
    recipientAddress: string
    assetType: string
    amount: string
    decimals: number
}

export interface TransferResult {
    success: boolean
    transactionHash?: string
    error?: string
}

/**
 * Transfer fungible asset using Privy wallet via backend
 */
export async function transferFungibleAsset(
    params: TransferAssetParams,
    signHash: (address: string, hash: string) => Promise<any>,
    options: TransferNetworkOptions = {}
): Promise<TransferResult> {
    const network = options.network ?? DEFAULT_NETWORK

    try {
        const { senderAddress, recipientAddress, assetType, amount, decimals } = params

        // Convert amount to smallest units (apply decimals)
        const amountInUnits = Math.floor(parseFloat(amount) * Math.pow(10, decimals))

        // Step 1: Generate transaction hash from backend
        // For fungible assets, use the metadata object address in function args, not type args
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        let hashResponse: Response
        try {
            hashResponse = await fetch(`${BACKEND_URL}/generate-hash`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: senderAddress,
                    function: '0x1::primary_fungible_store::transfer',
                    typeArguments: ['0x1::fungible_asset::Metadata'],  // Generic metadata type
                    functionArguments: [
                        assetType,          // Metadata object address
                        recipientAddress,   // Recipient address
                        amountInUnits       // Amount in smallest units
                    ],
                    network,
                }),
                signal: controller.signal
            })
            clearTimeout(timeoutId)
        } catch (fetchError: any) {
            clearTimeout(timeoutId)
            if (fetchError.name === 'AbortError') {
                throw new Error('Backend request timed out. Please check if the backend server is running.')
            }
            throw new Error(`Network error: ${fetchError.message || 'Unable to reach backend server'}`)
        }

        if (!hashResponse.ok) {
            const error = await hashResponse.json()
            throw new Error(error.error || 'Failed to generate transaction hash')
        }

        const { hash, rawTxnHex } = await hashResponse.json()

        // Step 2: Sign the hash using Privy
        const signatureResponse = await signHash(senderAddress, hash)

        if (!signatureResponse?.data?.signature || !signatureResponse?.data?.public_key) {
            throw new Error('Invalid signature response from Privy')
        }

        // Step 3: Submit signed transaction to backend
        const submitResponse = await fetch(`${BACKEND_URL}/submit-transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rawTxnHex,
                publicKey: signatureResponse.data.public_key,
                signature: signatureResponse.data.signature,
                network,
            })
        })

        if (!submitResponse.ok) {
            const error = await submitResponse.json()
            throw new Error(error.error || 'Failed to submit transaction')
        }

        const result = await submitResponse.json()

        if (!result.success) {
            throw new Error(result.vmStatus || 'Transaction failed')
        }

        NotificationService.triggerSendNotification(amount, 'Token', recipientAddress)

        return {
            success: true,
            transactionHash: result.transactionHash
        }
    } catch (error) {
        console.error('Transfer failed:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
}

/**
 * Transfer native MOVE token (simplified version)
 */
export async function transferMove(
    params: Omit<TransferAssetParams, 'assetType' | 'decimals'>,
    signHash: (address: string, hash: string) => Promise<any>,
    options: TransferNetworkOptions = {}
): Promise<TransferResult> {
    const network = options.network ?? DEFAULT_NETWORK

    try {
        const { senderAddress, recipientAddress, amount } = params

        // MOVE has 8 decimals
        const amountInOctas = Math.floor(parseFloat(amount) * Math.pow(10, 8))

        // Step 1: Generate transaction hash from backend
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        let hashResponse: Response
        try {
            hashResponse = await fetch(`${BACKEND_URL}/generate-hash`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: senderAddress,
                    function: '0x1::aptos_account::transfer',
                    typeArguments: [],
                    functionArguments: [
                        recipientAddress,
                        amountInOctas
                    ],
                    network,
                }),
                signal: controller.signal
            })
            clearTimeout(timeoutId)
        } catch (fetchError: any) {
            clearTimeout(timeoutId)
            if (fetchError.name === 'AbortError') {
                throw new Error('Backend request timed out. Please check if the backend server is running.')
            }
            throw new Error(`Network error: ${fetchError.message || 'Unable to reach backend server'}`)
        }

        if (!hashResponse.ok) {
            const error = await hashResponse.json()
            throw new Error(error.error || 'Failed to generate transaction hash')
        }

        const { hash, rawTxnHex } = await hashResponse.json()

        // Step 2: Sign the hash using Privy
        const signatureResponse = await signHash(senderAddress, hash)

        if (!signatureResponse?.data?.signature || !signatureResponse?.data?.public_key) {
            throw new Error('Invalid signature response from Privy')
        }

        // Step 3: Submit signed transaction to backend
        const submitResponse = await fetch(`${BACKEND_URL}/submit-transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rawTxnHex,
                publicKey: signatureResponse.data.public_key,
                signature: signatureResponse.data.signature,
                network,
            })
        })

        if (!submitResponse.ok) {
            const error = await submitResponse.json()
            throw new Error(error.error || 'Failed to submit transaction')
        }

        const result = await submitResponse.json()

        if (!result.success) {
            throw new Error(result.vmStatus || 'Transaction failed')
        }

        NotificationService.triggerSendNotification(amount, 'MOVE', recipientAddress)

        return {
            success: true,
            transactionHash: result.transactionHash
        }
    } catch (error) {
        console.error('Transfer failed:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
}
