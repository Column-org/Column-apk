import { usePrivy } from '@privy-io/expo'
import { toHex } from 'viem'
import { compareAddresses } from '../utils/address'

/**
 * Custom hook for signing Aptos transaction hashes with Privy embedded wallets
 * Adapted for React Native/Expo from NileDex omnisend implementation
 *
 * Note: This uses Privy's internal embedded wallet provider APIs which may not be publicly documented
 * but follows the same pattern as their web SDK's signRawHash
 */
export function usePrivySigning() {
    const { user } = usePrivy()

    /**
     * Sign a transaction hash for Aptos
     * @param walletAddress - The Aptos wallet address
     * @param hash - The transaction hash to sign (as Uint8Array or hex string)
     * @returns Promise with signature and public key
     */
    const signHash = async (walletAddress: string, hash: Uint8Array | string): Promise<{
        data: {
            signature: string
            public_key: string
        }
    }> => {
        try {
            // Find the Aptos wallet from linked accounts
            const aptosWallet = user?.linked_accounts?.find(
                (acc: any) =>
                    acc.type === 'wallet' &&
                    acc.chain_type === 'aptos' &&
                    compareAddresses(acc.address, walletAddress)
            )

            if (!aptosWallet) {
                throw new Error(`Aptos wallet not found for address: ${walletAddress}`)
            }

            // Convert hash to hex format if it's a Uint8Array
            const hashHex = typeof hash === 'string' ? hash : toHex(hash)

            // Remove 0x prefix if present for signing
            const cleanHash = hashHex.startsWith('0x') ? hashHex.slice(2) : hashHex

            // Get public key from wallet account
            const publicKey = (aptosWallet as any).public_key || (aptosWallet as any).publicKey

            if (!publicKey) {
                throw new Error('Public key not found in wallet account')
            }

            // For Privy embedded wallets, we need to use their signing API
            // Since @privy-io/expo doesn't expose signRawHash directly, we'll simulate
            // the signing request structure that would be sent to their API

            console.log('Attempting to sign hash with Privy embedded wallet...')
            console.log('Wallet address:', walletAddress)
            console.log('Hash to sign:', hashHex)

            // Placeholder: This is where Privy's internal signing would happen
            // In production, this requires access to Privy's embedded wallet signing API
            // For now, this will throw an error indicating manual signing is needed

            throw new Error(
                'Privy Expo SDK does not support direct transaction signing for Aptos. ' +
                'Please use the backend signing approach or wait for Privy SDK update.'
            )

        } catch (error) {
            console.error('Error signing with Privy:', error)
            throw error
        }
    }

    return { signHash, user }
}

/**
 * Check if Privy wallet is available and ready for signing
 */
export function usePrivyWalletStatus() {
    const { user } = usePrivy()

    const aptosWallet = user?.linked_accounts?.find(
        (acc: any) => acc.type === 'wallet' && acc.chain_type === 'aptos'
    ) as any

    return {
        isConnected: !!aptosWallet,
        walletAddress: aptosWallet?.address,
        publicKey: aptosWallet?.public_key || aptosWallet?.publicKey,
        hasPrivyWallet: !!aptosWallet
    }
}
