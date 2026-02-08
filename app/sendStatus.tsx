import React, { useState, useEffect, useMemo, useRef } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useWallet } from '../context/WalletContext'
import { transferFungibleAsset, transferMove, TransferAssetParams, TransferResult } from '../services/transferAsset'
import { FungibleAsset } from '../services/movementAssets'
import { useNetwork } from '../context/NetworkContext'

type TransactionStatus = 'sending' | 'sent' | 'failed'

export default function SendStatus() {
    const router = useRouter()
    const params = useLocalSearchParams()
    const { address: walletAddress, signRawHash: web3SignRawHash, account: web3Account, walletPublicKey } = useWallet()
    const { network } = useNetwork()
    const [status, setStatus] = useState<TransactionStatus>('sending')
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [txHash, setTxHash] = useState<string>('')


    const hasExecutedRef = useRef(false)

    useEffect(() => {
        // Prevent multiple executions
        if (hasExecutedRef.current) {
            return
        }

        // Don't execute if we don't have all required data yet
        if (!params.token || !params.amount || !params.recipient || !walletAddress || !walletPublicKey) {
            return
        }

        // Mark as executed immediately to prevent duplicate calls
        hasExecutedRef.current = true

        let isMounted = true
        let timeoutId: NodeJS.Timeout | null = null

        const executeTransfer = async () => {
            if (!params.token || !params.amount || !params.recipient || !walletAddress) {
                if (isMounted) {
                    setStatus('failed')
                    setErrorMessage('Missing transaction parameters or wallet not found')
                }
                return
            }

            // Set a timeout to prevent infinite hanging
            timeoutId = setTimeout(() => {
                if (isMounted) {
                    setStatus('failed')
                    setErrorMessage('Transaction timed out. Please try again.')
                }
            }, 60000) // 60 second timeout

            // Get public key from wallet object
            let publicKey = walletPublicKey

            // If public_key is not on wallet object, fail gracefully
            if (!publicKey) {
                if (isMounted) {
                    setStatus('failed')
                    setErrorMessage('Unable to retrieve wallet public key. The wallet may need to be re-initialized.')
                }
                if (timeoutId) clearTimeout(timeoutId)
                return
            }

            // Use unified signRawHash to sign the transaction hash
            const signHash = async (address: string, hash: string) => {
                try {
                    const { signature } = await web3SignRawHash(hash as any)

                    if (!signature) {
                        throw new Error('No signature returned from signing function')
                    }

                    // Return format expected by transferAsset.ts
                    return {
                        data: {
                            signature,
                            public_key: publicKey
                        }
                    }
                } catch (error) {
                    console.error('Sign hash error:', error)
                    throw error
                }
            }

            try {
                const token: FungibleAsset = JSON.parse(params.token as string)

                // Use transferMove for native MOVE, transferFungibleAsset for other tokens
                let result: TransferResult

                if (token.asset_type === '0x1::aptos_coin::AptosCoin') {
                    result = await transferMove({
                        senderAddress: walletAddress,
                        recipientAddress: params.recipient as string,
                        amount: params.amount as string
                    }, signHash, { network })
                } else {
                    const transferParams: TransferAssetParams = {
                        senderAddress: walletAddress,
                        recipientAddress: params.recipient as string,
                        assetType: token.asset_type,
                        amount: params.amount as string,
                        decimals: token.metadata.decimals
                    }
                    result = await transferFungibleAsset(transferParams, signHash, { network })
                }

                if (timeoutId) clearTimeout(timeoutId)

                if (isMounted) {
                    if (result.success && result.transactionHash) {
                        setStatus('sent')
                        setTxHash(result.transactionHash)
                    } else {
                        setStatus('failed')
                        setErrorMessage(result.error || 'Transaction failed')
                    }
                }
            } catch (error) {
                console.error('Transfer error:', error)
                if (timeoutId) clearTimeout(timeoutId)
                if (isMounted) {
                    setStatus('failed')
                    setErrorMessage(error instanceof Error ? error.message : 'Unknown error')
                }
            }
        }

        executeTransfer()

        return () => {
            isMounted = false
            if (timeoutId) clearTimeout(timeoutId)
        }
    }, [params.token, params.amount, params.recipient, walletAddress, walletPublicKey, web3SignRawHash, network]) // Only run when these change

    const getGradientColors = (): readonly [string, string, ...string[]] => {
        switch (status) {
            case 'sending':
                return ['#ffda34', '#121315']
            case 'sent':
                return ['#4CAF50', '#121315']
            case 'failed':
                return ['#F44336', '#121315']
            default:
                return ['#ffda34', '#121315']
        }
    }

    const getStatusIcon = () => {
        switch (status) {
            case 'sending':
                return null
            case 'sent':
                return <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            case 'failed':
                return <Ionicons name="close-circle" size={80} color="#F44336" />
        }
    }

    const getStatusText = () => {
        switch (status) {
            case 'sending':
                return 'Sending Transaction...'
            case 'sent':
                return 'Transaction Sent!'
            case 'failed':
                return 'Transaction Failed'
        }
    }

    const getStatusMessage = () => {
        switch (status) {
            case 'sending':
                return 'Please wait while we process your transaction'
            case 'sent':
                return txHash ? `Hash: ${txHash.slice(0, 8)}...${txHash.slice(-8)}` : 'Your transaction has been successfully sent'
            case 'failed':
                return errorMessage || 'Something went wrong. Please try again'
        }
    }

    const handleAction = () => {
        if (status === 'sent') {
            router.replace('/(tabs)/home')
        } else if (status === 'failed') {
            router.back()
        }
    }

    const getActionButtonText = () => {
        switch (status) {
            case 'sent':
                return 'Back to Home'
            case 'failed':
                return 'Try Again'
            default:
                return ''
        }
    }

    return (
        <LinearGradient
            colors={getGradientColors()}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    {status === 'sending' ? (
                        <ActivityIndicator size={80} color="#ffda34" />
                    ) : (
                        getStatusIcon()
                    )}
                </View>

                <Text style={styles.statusText}>{getStatusText()}</Text>
                <Text style={styles.messageText}>{getStatusMessage()}</Text>

                {status !== 'sending' && (
                    <TouchableOpacity
                        onPress={handleAction}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.actionButtonText}>{getActionButtonText()}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    iconContainer: {
        marginBottom: 30,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusText: {
        color: 'white',
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },
    messageText: {
        color: '#8B98A5',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 40,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        marginTop: 20,
    },
})
