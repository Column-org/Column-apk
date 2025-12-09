import { SavingCycleResult } from './savingCycleService'
import { MovementNetwork } from '../../constants/networkConfig'
import { MODULE_ADDRESS, BACKEND_URL } from './constants'

type SignHashFn = (address: string, hash: string) => Promise<any>

// Top up a cycle (add funds)
export async function topUpCycle(
    senderAddress: string,
    cycleId: number,
    amount: number, // in octas
    signHash: SignHashFn,
    network: MovementNetwork
): Promise<SavingCycleResult> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
        const payload = {
            sender: senderAddress,
            function: `${MODULE_ADDRESS}::saving_cycle::top_up`,
            typeArguments: [],
            functionArguments: [cycleId.toString(), amount.toString()],
        }

        const hashResponse = await fetch(`${BACKEND_URL}/generate-hash`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, network }),
            signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!hashResponse.ok) {
            const error = await hashResponse.json()
            throw new Error(error.error || 'Failed to generate transaction hash')
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
            const error = await submitResponse.json()
            throw new Error(error.error || 'Failed to submit transaction')
        }

        const { hash: txHash } = await submitResponse.json()

        return {
            success: true,
            transactionHash: txHash,
        }
    } catch (error: any) {
        console.error('Error topping up cycle:', error)
        return {
            success: false,
            error: error.message || 'Failed to add funds',
        }
    }
}

// Early withdraw from cycle (with penalty)
export async function earlyWithdrawCycle(
    senderAddress: string,
    cycleId: number,
    signHash: SignHashFn,
    network: MovementNetwork
): Promise<SavingCycleResult> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
        const payload = {
            sender: senderAddress,
            function: `${MODULE_ADDRESS}::saving_cycle::early_withdraw`,
            typeArguments: [],
            functionArguments: [cycleId.toString()],
        }

        const hashResponse = await fetch(`${BACKEND_URL}/generate-hash`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, network }),
            signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!hashResponse.ok) {
            const error = await hashResponse.json()
            throw new Error(error.error || 'Failed to generate transaction hash')
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
            const error = await submitResponse.json()
            throw new Error(error.error || 'Failed to submit transaction')
        }

        const { hash: txHash } = await submitResponse.json()

        return {
            success: true,
            transactionHash: txHash,
        }
    } catch (error: any) {
        console.error('Error early withdrawing:', error)
        return {
            success: false,
            error: error.message || 'Failed to withdraw',
        }
    }
}

// Close cycle (normal withdrawal after end date or goal reached)
export async function closeCycle(
    senderAddress: string,
    cycleId: number,
    signHash: SignHashFn,
    network: MovementNetwork
): Promise<SavingCycleResult> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // Increased to 60 seconds

    try {
        console.log('Closing cycle:', { cycleId, senderAddress, network, backendUrl: BACKEND_URL })

        const payload = {
            sender: senderAddress,
            function: `${MODULE_ADDRESS}::saving_cycle::close_cycle`,
            typeArguments: [],
            functionArguments: [cycleId.toString()],
        }

        console.log('Requesting hash generation...')
        const hashResponse = await fetch(`${BACKEND_URL}/generate-hash`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, network }),
            signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!hashResponse.ok) {
            const error = await hashResponse.json()
            console.error('Hash generation failed:', error)
            throw new Error(error.error || 'Failed to generate transaction hash')
        }

        const { hash, rawTxnHex } = await hashResponse.json()
        console.log('Hash generated successfully')

        console.log('Requesting signature...')
        const signatureResponse = await signHash(senderAddress, hash)

        if (!signatureResponse?.data?.signature || !signatureResponse?.data?.public_key) {
            console.error('Invalid signature response:', signatureResponse)
            throw new Error('Invalid signature response')
        }

        console.log('Submitting transaction...')
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
            const error = await submitResponse.json()
            console.error('Transaction submission failed:', error)
            throw new Error(error.error || 'Failed to submit transaction')
        }

        const { hash: txHash } = await submitResponse.json()
        console.log('Cycle closed successfully:', txHash)

        return {
            success: true,
            transactionHash: txHash,
        }
    } catch (error: any) {
        console.error('Error closing cycle:', error)
        if (error.name === 'AbortError') {
            return {
                success: false,
                error: 'Request timeout. Please check your backend connection and try again.',
            }
        }
        return {
            success: false,
            error: error.message || 'Failed to close cycle',
        }
    }
}
