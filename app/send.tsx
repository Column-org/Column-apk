import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert, Dimensions } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { usePrivy } from '@privy-io/expo'
import { FungibleAsset, getFungibleAssets } from '../services/movementAssets'
import { useNetwork } from '../context/NetworkContext'
import TokenSelector from '../components/send/TokenSelector'
import AmountInput from '../components/send/AmountInput'
import CodeTransferForm from '../components/send/CodeTransferForm'
import { useSignRawHash } from '@privy-io/expo/extended-chains'
import { createFATransferWithCode, createMoveTransferWithCode } from '../services/movement_service/sendWithCode'
import { addPendingClaim } from '../services/pendingClaims'
import AlertModal from '../components/AlertModal'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

export default function Send() {
    const router = useRouter()
    const { t } = useTranslation()
    const { user } = usePrivy()
    const { network } = useNetwork()
    const params = useLocalSearchParams()
    const { signRawHash } = useSignRawHash()
    const [sendMode, setSendMode] = useState<'address' | 'code'>('address')
    const [selectedToken, setSelectedToken] = useState<FungibleAsset | null>(null)
    const [amount, setAmount] = useState('')
    const [displayAmount, setDisplayAmount] = useState('')
    const [expirationHours, setExpirationHours] = useState('24')
    const [isSubmittingCode, setIsSubmittingCode] = useState(false)
    const [generatedCode, setGeneratedCode] = useState<string | null>(null)
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
    const hasInitialized = useRef(false)

    // Get Movement wallet address
    const movementWallets = useMemo(() => {
        if (!user?.linked_accounts) return []
        return user.linked_accounts.filter(
            (account: any) => account.type === 'wallet' && account.chain_type === 'aptos'
        )
    }, [user?.linked_accounts])

    const walletAddress = movementWallets[0]?.address || ''
    const walletPublicKey = movementWallets[0]?.public_key || movementWallets[0]?.publicKey || ''

    // Listen for selected token from params FIRST (higher priority)
    useEffect(() => {
        if (params.token) {
            try {
                const token = JSON.parse(params.token as string)
                console.log('Setting selected token from params:', token.metadata.symbol)
                setSelectedToken(token)
                hasInitialized.current = true // Mark as initialized when token is selected
            } catch (error) {
                console.error('Error parsing token:', error)
            }
        }
    }, [params.token])

    // Fetch assets when wallet is available and set first as default (only once, and only if no token from params)
    useEffect(() => {
        const fetchAssets = async () => {
            if (walletAddress && !hasInitialized.current && !params.token) {
                try {
                    const fetchedAssets = await getFungibleAssets(walletAddress, network)
                    // Set first asset as default if none selected
                    if (fetchedAssets.length > 0) {
                        setSelectedToken(fetchedAssets[0])
                        hasInitialized.current = true
                    }
                } catch (error) {
                    console.error('Error fetching assets:', error)
                }
            }
        }
        fetchAssets()
    }, [walletAddress, params.token, network])

    // Handle number pad input
    const handleNumberPress = (num: string) => {
        if (num === 'CLEAR') {
            setAmount('')
            setDisplayAmount('')
        } else if (num === '.') {
            if (!amount.includes('.')) {
                const newAmount = amount + num
                setAmount(newAmount)
                setDisplayAmount(newAmount)
            }
        } else if (num === 'DELETE') {
            const newAmount = amount.slice(0, -1)
            setAmount(newAmount)
            setDisplayAmount(newAmount)
        } else {
            const newAmount = amount + num
            setAmount(newAmount)
            setDisplayAmount(newAmount)
        }
    }

    useEffect(() => {
        if (sendMode === 'address' && generatedCode) {
            setGeneratedCode(null)
        }
    }, [sendMode, generatedCode])

    const buildSignHash = useCallback(() => {
        if (!walletPublicKey) {
            throw new Error('Wallet public key not available')
        }

        return async (address: string, hash: string) => {
            const { signature } = await signRawHash({
                address,
                chainType: 'aptos',
                hash,
            })

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
    }, [signRawHash, walletPublicKey])

    const handleCreateCodeTransfer = useCallback(async () => {
        if (!walletAddress) {
            Alert.alert('No Wallet', 'Connect your Movement wallet before creating a transfer.')
            return
        }

        if (!selectedToken) {
            Alert.alert('Select Token', 'Choose a token to send with a claim code.')
            return
        }

        const parsedAmount = parseFloat(displayAmount)
        if (!parsedAmount || parsedAmount <= 0) {
            Alert.alert('Invalid amount', 'Enter a valid amount greater than zero.')
            return
        }

        const parsedExpiration = parseFloat(expirationHours)
        if (!parsedExpiration || parsedExpiration <= 0) {
            Alert.alert('Invalid expiration', 'Enter a valid expiration time in hours.')
            return
        }

        try {
            const signHash = buildSignHash()
            const expirationSeconds = Math.floor(parsedExpiration * 3600)

            setIsSubmittingCode(true)
            const result =
                selectedToken.asset_type === '0x1::aptos_coin::AptosCoin'
                    ? await createMoveTransferWithCode(
                          {
                              senderAddress: walletAddress,
                              amount: displayAmount,
                              expirationSeconds,
                          },
                          signHash,
                          network
                      )
                    : await createFATransferWithCode(
                          {
                              senderAddress: walletAddress,
                              assetType: selectedToken.asset_type,
                              amount: displayAmount,
                              decimals: selectedToken.metadata.decimals,
                              expirationSeconds,
                          },
                          signHash,
                          network
                      )

            if (!result.success || !result.transactionHash) {
                throw new Error(result.error || 'Transaction failed')
            }

            setGeneratedCode(result.code || null)
            setAmount('')
            setDisplayAmount('')

            if (result.code) {
                await addPendingClaim({
                    code: result.code,
                    type: selectedToken.asset_type === '0x1::aptos_coin::AptosCoin' ? 'move' : 'fa',
                    tokenSymbol: selectedToken.metadata.symbol,
                    tokenName: selectedToken.metadata.name,
                    amountDisplay: displayAmount,
                    sender: walletAddress,
                    network,
                    assetMetadata: selectedToken.asset_type,
                    decimals: selectedToken.metadata.decimals,
                    createdAt: Math.floor(Date.now() / 1000),
                    expiration: Math.floor(Date.now() / 1000) + expirationSeconds,
                    savedAt: Date.now(),
                })

                // Navigate to claim code page
                router.push({
                    pathname: '/claimCode',
                    params: {
                        code: result.code,
                        tokenName: selectedToken.metadata.name,
                        tokenSymbol: selectedToken.metadata.symbol,
                        amount: displayAmount,
                    },
                })
            }
        } catch (error) {
            setAlertModal({
                visible: true,
                type: 'error',
                title: 'Failed',
                message: '',
            })
        } finally {
            setIsSubmittingCode(false)
        }
    }, [walletAddress, selectedToken, displayAmount, expirationHours, network, buildSignHash])

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#121315" />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
                removeClippedSubviews={true}
                overScrollMode="never"
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                        <Ionicons name="close" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('send.title')}</Text>
                    <View style={styles.headerIcons}>
                        <TouchableOpacity
                            onPress={() => router.push('/cancelTransfer')}
                            activeOpacity={0.7}
                            style={styles.iconButton}
                        >
                            <Ionicons name="close-circle-outline" size={28} color="#EF4444" />
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.7} style={styles.iconButton}>
                            <Ionicons name="information-circle-outline" size={28} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, sendMode === 'address' && styles.activeTab]}
                        onPress={() => setSendMode('address')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabText, sendMode === 'address' && styles.activeTabText]}>
                            Address
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, sendMode === 'code' && styles.activeTab]}
                        onPress={() => setSendMode('code')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabText, sendMode === 'code' && styles.activeTabText]}>
                            Code
                        </Text>
                    </TouchableOpacity>
                </View>

                {sendMode === 'address' ? (
                    <>
                        <TokenSelector
                            selectedToken={selectedToken}
                            onPress={() => router.push('/selectToken')}
                        />

                        <AmountInput
                            displayAmount={displayAmount}
                            selectedToken={selectedToken}
                            onChangeAmount={(text) => {
                                setAmount(text)
                                setDisplayAmount(text)
                            }}
                        />

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    (!selectedToken || !displayAmount || parseFloat(displayAmount) <= 0) &&
                                        styles.sendButtonDisabled,
                                ]}
                                activeOpacity={0.7}
                                disabled={!selectedToken || !displayAmount || parseFloat(displayAmount) <= 0}
                                onPress={() => {
                                    if (!selectedToken) return

                                    router.push({
                                        pathname: '/sendConfirm',
                                        params: {
                                            token: JSON.stringify(selectedToken),
                                            amount: displayAmount,
                                        },
                                    })
                                }}
                            >
                                <Text style={styles.sendButtonText}>Next</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <CodeTransferForm
                        selectedToken={selectedToken}
                        onSelectToken={() => router.push('/selectToken')}
                        displayAmount={displayAmount}
                        onChangeAmount={(text) => {
                            setAmount(text)
                            setDisplayAmount(text)
                        }}
                        expirationHours={expirationHours}
                        onChangeExpiration={setExpirationHours}
                        onSubmit={handleCreateCodeTransfer}
                        isSubmitting={isSubmittingCode}
                        generatedCode={generatedCode}
                    />
                )}
            </ScrollView>

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
        flex: 1,
        backgroundColor: '#121315',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: IS_SMALL_SCREEN ? 16 : 50,
        paddingBottom: 10,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    headerIcons: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    iconButton: {
        padding: 4,
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 80,
        marginTop: 20,
        marginBottom: 30,
        backgroundColor: '#222327',
        borderRadius: 10,
        padding: 3,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    activeTab: {
        backgroundColor: '#121315',
    },
    tabText: {
        color: '#8B98A5',
        fontSize: 13,
        fontWeight: '600',
    },
    activeTabText: {
        color: 'white',
    },
    amountInputContainer: {
        width: '100%',
        marginTop: 20,
    },
    amountInput: {
        backgroundColor: '#222327',
        borderRadius: 12,
        padding: 16,
        color: 'white',
        fontSize: 24,
        fontWeight: '600',
        textAlign: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    addressInputContainer: {
        width: '100%',
        marginTop: 20,
    },
    inputLabel: {
        color: '#8B98A5',
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    addressTextInput: {
        backgroundColor: '#222327',
        borderRadius: 12,
        padding: 16,
        color: 'white',
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    codeTextInput: {
        backgroundColor: '#222327',
        borderRadius: 12,
        padding: 16,
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    buttonContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    sendButton: {
        backgroundColor: '#ffda34',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    sendButtonText: {
        color: '#121315',
        fontSize: 16,
        fontWeight: '700',
    },
    sendButtonDisabled: {
        backgroundColor: '#3A3F4A',
    },
})
