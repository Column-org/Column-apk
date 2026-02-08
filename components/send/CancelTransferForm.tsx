import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useWallet } from '../../context/WalletContext'
import { useNetwork } from '../../context/NetworkContext'
import { cancelTransferWithCode, viewTransferDetails } from '../../services/movement_service/sendWithCode'
import { removePendingClaim } from '../../services/pendingClaims'
import { compareAddresses } from '../../utils/address'
import AlertModal from '../AlertModal'

export default function CancelTransferForm() {
    const { address: walletAddress, signRawHash: web3SignRawHash, walletPublicKey } = useWallet()
    const { network } = useNetwork()
    const [code, setCode] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isValidating, setIsValidating] = useState(false)
    const [alertModal, setAlertModal] = useState<{
        visible: boolean
        type: 'success' | 'error' | 'info'
        title: string
        message: string
        details?: string[]
    }>({
        visible: false,
        type: 'success',
        title: '',
        message: '',
    })

    const buildSignHash = useCallback(() => {
        if (!walletPublicKey) {
            throw new Error('Wallet public key not available')
        }

        return async (address: string, hash: string) => {
            const { signature } = await web3SignRawHash(hash as any)

            if (!signature) {
                throw new Error('No signature returned from signRawHash')
            }

            return {
                data: {
                    signature,
                    public_key: walletPublicKey,
                },
            }
        }
    }, [web3SignRawHash, walletPublicKey])

    const handleValidateCode = async () => {
        if (!code.trim()) {
            setAlertModal({
                visible: true,
                type: 'error',
                title: 'Failed',
                message: 'Please enter a transfer code',
            })
            return
        }

        setIsValidating(true)
        try {
            const result = await viewTransferDetails(code.trim(), network)

            if (!result.success) {
                setAlertModal({
                    visible: true,
                    type: 'error',
                    title: 'Failed',
                    message: result.error || 'Transfer code does not exist or cannot be found',
                })
                return
            }

            if (!result.details) {
                setAlertModal({
                    visible: true,
                    type: 'error',
                    title: 'Failed',
                    message: 'Could not retrieve transfer details',
                })
                return
            }

            // Check if sender matches current wallet
            if (!compareAddresses(result.details.sender, walletAddress || '')) {
                setAlertModal({
                    visible: true,
                    type: 'error',
                    title: 'Failed',
                    message: 'You are not the sender of this transfer. Only the sender can cancel it.',
                })
                return
            }

            // Check if already claimed
            if (!result.details.isClaimable) {
                setAlertModal({
                    visible: true,
                    type: 'error',
                    title: 'Failed',
                    message: 'This transfer has already been claimed and cannot be canceled',
                })
                return
            }

            // Check if expired
            const now = Math.floor(Date.now() / 1000)
            const expirationTime = parseInt(result.details.expiration)
            if (now > expirationTime) {
                Alert.alert('Info', 'This transfer has expired. You can still cancel it to reclaim your funds.')
            }

            // Show confirmation
            Alert.alert(
                'Cancel Transfer',
                `Are you sure you want to cancel this transfer?\n\nAmount: ${result.details.amount}\nType: ${result.details.type.toUpperCase()}\n\nYour funds will be returned to your wallet.`,
                [
                    { text: 'No', style: 'cancel' },
                    { text: 'Yes, Cancel', style: 'destructive', onPress: handleCancelTransfer }
                ]
            )
        } catch (error) {
            console.error('Validate code error:', error)
            setAlertModal({
                visible: true,
                type: 'error',
                title: 'Failed',
                message: error instanceof Error ? error.message : 'An error occurred while validating the code',
            })
        } finally {
            setIsValidating(false)
        }
    }

    const handleCancelTransfer = async () => {
        if (!walletAddress) {
            setAlertModal({
                visible: true,
                type: 'error',
                title: 'Failed',
                message: 'Wallet address not found. Please reconnect your wallet.',
            })
            return
        }

        setIsLoading(true)
        try {
            const details = await viewTransferDetails(code.trim(), network)

            if (!details.success || !details.details) {
                setAlertModal({
                    visible: true,
                    type: 'error',
                    title: 'Failed',
                    message: details.error || 'Could not retrieve transfer details',
                })
                return
            }

            const transferType = details.details.type
            const signHash = buildSignHash()

            const result = await cancelTransferWithCode(
                { senderAddress: walletAddress, code: code.trim() },
                signHash,
                network,
                transferType
            )

            if (result.success) {
                await removePendingClaim(walletAddress, code.trim())
                setAlertModal({
                    visible: true,
                    type: 'success',
                    title: 'Successful',
                    message: 'Transfer has been canceled and your funds have been returned to your wallet',
                })
                setCode('')
            } else {
                setAlertModal({
                    visible: true,
                    type: 'error',
                    title: 'Failed',
                    message: result.error || 'Failed to cancel transfer. Please try again.',
                })
            }
        } catch (error) {
            console.error('Cancel transfer error:', error)
            setAlertModal({
                visible: true,
                type: 'error',
                title: 'Failed',
                message: error instanceof Error ? error.message : 'An error occurred while canceling the transfer',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="close-circle-outline" size={24} color="#EF4444" />
                <Text style={styles.headerTitle}>Cancel Transfer</Text>
            </View>

            <Text style={styles.description}>
                Enter the transfer code to cancel an unclaimed transfer and get your funds back.
            </Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Transfer Code</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter transfer code"
                    placeholderTextColor="#8B98A5"
                    value={code}
                    onChangeText={(text) => setCode(text.toLowerCase())}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading && !isValidating}
                />
            </View>

            <TouchableOpacity
                style={[styles.button, (!code.trim() || isLoading || isValidating) && styles.buttonDisabled]}
                onPress={handleValidateCode}
                disabled={!code.trim() || isLoading || isValidating}
                activeOpacity={0.7}
            >
                {isValidating || isLoading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.buttonText}>
                        {isValidating ? 'Validating...' : isLoading ? 'Canceling...' : 'Cancel Transfer'}
                    </Text>
                )}
            </TouchableOpacity>

            <View style={styles.warningBox}>
                <Ionicons name="warning-outline" size={20} color="#F59E0B" />
                <Text style={styles.warningText}>
                    You can only cancel transfers that you created and haven't been claimed yet.
                </Text>
            </View>

            <AlertModal
                visible={alertModal.visible}
                type={alertModal.type}
                title={alertModal.title}
                message={alertModal.message}
                details={alertModal.details}
                onClose={() => setAlertModal({ ...alertModal, visible: false })}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '600',
    },
    description: {
        color: '#8B98A5',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#1A1F28',
        borderRadius: 12,
        padding: 16,
        color: 'white',
        fontSize: 16,
    },
    button: {
        backgroundColor: '#EF4444',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonDisabled: {
        backgroundColor: '#4B5563',
        opacity: 0.5,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    warningBox: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderRadius: 12,
        padding: 16,
    },
    warningText: {
        color: '#F59E0B',
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
})
