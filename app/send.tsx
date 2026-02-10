import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert, Dimensions } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { FungibleAsset, getFungibleAssets, formatAssetBalance } from '../services/movementAssets'
import { useNetwork } from '../context/NetworkContext'
import { createFATransferWithCode, createMoveTransferWithCode } from '../services/movement_service/sendWithCode'
import { useToast } from '../context/ToastContext'
import { useWallet } from '../context/WalletContext'
import TokenSelector from '../components/send/TokenSelector'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

export default function Send() {
    const router = useRouter()
    const { t } = useTranslation()
    const { address: walletAddress, signRawHash: web3SignRawHash, account: web3Account, walletPublicKey } = useWallet()
    const { network } = useNetwork()
    const params = useLocalSearchParams()

    const [sendMode, setSendMode] = useState<'address' | 'code'>('address')
    const [selectedToken, setSelectedToken] = useState<FungibleAsset | null>(null)
    const [amount, setAmount] = useState('')
    const [isSubmittingCode, setIsSubmittingCode] = useState(false)
    const [generatedCode, setGeneratedCode] = useState<string | null>(null)
    const [expirationHours, setExpirationHours] = useState('24')

    const toast = useToast()

    const hasInitialized = useRef(false)

    useEffect(() => {
        if (params.token) {
            try {
                const token = JSON.parse(params.token as string)
                setSelectedToken(token)
                hasInitialized.current = true
            } catch (error) {
                console.error('Send error:', error)
                toast.show('Send Failed', { data: { message: error instanceof Error ? error.message : 'Unknown error' }, type: 'error' })
            }
        }
    }, [params.token, toast])

    useEffect(() => {
        const fetchAssets = async () => {
            if (walletAddress && !hasInitialized.current && !params.token) {
                try {
                    const fetchedAssets = await getFungibleAssets(walletAddress, network)
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

    const handleKeypadPress = (val: string) => {
        if (val === 'backspace') {
            setAmount(prev => prev.slice(0, -1))
        } else if (val === '.') {
            if (!amount.includes('.')) {
                setAmount(prev => prev + '.')
            }
        } else {
            // Prevent leading zeros if not followed by a dot
            if (amount === '0' && val !== '.') {
                setAmount(val)
            } else {
                setAmount(prev => prev + val)
            }
        }
    }

    const setPercentage = (pct: number) => {
        if (!selectedToken) return
        const fullBalance = parseFloat(formatAssetBalance(selectedToken.amount, selectedToken.metadata.decimals).replace(/,/g, ''))
        const val = (fullBalance * pct).toFixed(selectedToken.metadata.decimals)
        setAmount(val.replace(/\.?0+$/, '')) // Clean up trailing zeros
    }

    const buildSignHash = useCallback(() => {
        if (!walletPublicKey) throw new Error('Wallet public key not available')
        return async (address: string, hash: string) => {
            const { signature } = await web3SignRawHash(hash as any)
            if (!signature) throw new Error('No signature returned')
            return { data: { signature, public_key: walletPublicKey } }
        }
    }, [web3SignRawHash, walletPublicKey])

    const handleCreateCodeTransfer = useCallback(async () => {
        if (!walletAddress || !selectedToken) return
        const parsedAmount = parseFloat(amount)
        if (!parsedAmount || parsedAmount <= 0) return

        try {
            const signHash = buildSignHash()
            setIsSubmittingCode(true)
            const result = selectedToken.asset_type === '0x1::aptos_coin::AptosCoin'
                ? await createMoveTransferWithCode({ senderAddress: walletAddress, amount, expirationSeconds: 86400 }, signHash, network)
                : await createFATransferWithCode({
                    senderAddress: walletAddress,
                    assetType: selectedToken.asset_type,
                    amount,
                    decimals: selectedToken.metadata.decimals,
                    expirationSeconds: 86400
                }, signHash, network)

            if (result.success && result.code) {
                toast.show('Success', { data: { message: 'Transfer code created!' }, type: 'success' })
                router.push({
                    pathname: '/claimCode',
                    params: { code: result.code, tokenSymbol: selectedToken.metadata.symbol, amount }
                })
            } else {
                toast.show('Failed', { data: { message: 'Transfer failed: No code generated.' }, type: 'error' })
            }
        } catch (error) {
            console.error('Error creating code transfer:', error)
            toast.show('Failed', { data: { message: error instanceof Error ? error.message : 'Transfer failed' }, type: 'error' })
        } finally {
            setIsSubmittingCode(false)
        }
    }, [walletAddress, selectedToken, amount, network, buildSignHash, router, toast])

    const renderKeypad = () => (
        <View style={styles.keypad}>
            <View style={styles.keypadRow}>
                {['1', '2', '3'].map(k => (
                    <TouchableOpacity key={k} style={styles.key} onPress={() => handleKeypadPress(k)}>
                        <Text style={styles.keyText}>{k}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.keypadRow}>
                {['4', '5', '6'].map(k => (
                    <TouchableOpacity key={k} style={styles.key} onPress={() => handleKeypadPress(k)}>
                        <Text style={styles.keyText}>{k}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.keypadRow}>
                {['7', '8', '9'].map(k => (
                    <TouchableOpacity key={k} style={styles.key} onPress={() => handleKeypadPress(k)}>
                        <Text style={styles.keyText}>{k}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.keypadRow}>
                <TouchableOpacity style={styles.key} onPress={() => handleKeypadPress('.')}>
                    <Text style={styles.keyText}>.</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.key} onPress={() => handleKeypadPress('0')}>
                    <Text style={styles.keyText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.key} onPress={() => handleKeypadPress('backspace')}>
                    <Ionicons name="backspace-outline" size={24} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    )

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Ionicons name="chevron-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('send.title')}</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.mainContent}>
                {/* Mode Selector */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, sendMode === 'address' && styles.activeTab]}
                        onPress={() => setSendMode('address')}
                    >
                        <Text style={[styles.tabText, sendMode === 'address' && styles.activeTabText]}>Address</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, sendMode === 'code' && styles.activeTab]}
                        onPress={() => setSendMode('code')}
                    >
                        <Text style={[styles.tabText, sendMode === 'code' && styles.activeTabText]}>Code</Text>
                    </TouchableOpacity>
                </View>

                <TokenSelector
                    selectedToken={selectedToken}
                    onPress={() => router.push('/selectToken')}
                />

                {/* Amount Section */}
                <View style={styles.amountArea}>
                    <TouchableOpacity style={styles.tokenDisplay} onPress={() => router.push('/selectToken')}>
                        <Text style={styles.amountValueText}>
                            {amount || '0'} <Text style={styles.symbolText}>{selectedToken?.metadata.symbol}</Text>
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.usdPill}>
                        <Text style={styles.usdText}>$ 0.00</Text>
                        <Ionicons name="swap-vertical" size={14} color="#8B98A5" />
                    </View>

                    <Text style={styles.availableText}>
                        {selectedToken ? formatAssetBalance(selectedToken.amount, selectedToken.metadata.decimals) : '0'} {selectedToken?.metadata.symbol} available
                    </Text>
                </View>

                {/* Interactions */}
                <View style={styles.bottomArea}>
                    {/* Percentage buttons */}
                    <View style={styles.percentageRow}>
                        {[0.25, 0.5, 0.75, 1].map((pct, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={styles.pctBtn}
                                onPress={() => setPercentage(pct)}
                            >
                                <Text style={styles.pctText}>{pct === 1 ? 'Max' : `${pct * 100}%`}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {renderKeypad()}

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.nextBtn, (!amount || parseFloat(amount) <= 0) && styles.nextBtnDisabled]}
                        disabled={!amount || parseFloat(amount) <= 0}
                        onPress={() => {
                            if (!selectedToken) {
                                toast.show('Error', { data: { message: 'Please select a token.' }, type: 'error' })
                                return
                            }
                            if (!amount || parseFloat(amount) <= 0) {
                                toast.show('Error', { data: { message: 'Please enter a valid amount.' }, type: 'error' })
                                return
                            }
                            if (!walletAddress) {
                                toast.show('Error', { data: { message: 'Wallet not connected.' }, type: 'error' })
                                return
                            }
                            if (sendMode === 'address') {
                                router.push({
                                    pathname: '/sendConfirm',
                                    params: { token: JSON.stringify(selectedToken), amount }
                                })
                            } else {
                                handleCreateCodeTransfer()
                            }
                        }}
                    >
                        <Text style={styles.nextBtnText}>{sendMode === 'address' ? 'Next' : 'Create Link'}</Text>
                    </TouchableOpacity>
                </View>
            </View>


        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121315',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: IS_SMALL_SCREEN ? 16 : 50,
        paddingBottom: 16,
    },
    headerBtn: {
        padding: 8,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    mainContent: {
        flex: 1,
        justifyContent: 'space-between',
        paddingBottom: 20,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#1C1D21',
        marginHorizontal: 80,
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#2A2B30',
    },
    tabText: {
        color: '#8B98A5',
        fontSize: 13,
        fontWeight: '600',
    },
    activeTabText: {
        color: 'white',
    },
    amountArea: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        paddingTop: 20,
    },
    tokenDisplay: {
        paddingVertical: 10,
    },
    amountValueText: {
        color: '#FFFFFF',
        fontSize: 64,
        fontWeight: '700',
        textAlign: 'center',
    },
    symbolText: {
        color: '#8B98A5',
        fontSize: 48,
        fontWeight: '500',
    },
    usdPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222327',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        marginTop: 12,
    },
    usdText: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '600',
    },
    availableText: {
        color: '#8B98A5',
        fontSize: 15,
        marginTop: 32,
        fontWeight: '500',
    },
    bottomArea: {
        width: '100%',
    },
    percentageRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    pctBtn: {
        backgroundColor: '#222327',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        minWidth: 70,
        alignItems: 'center',
    },
    pctText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    keypad: {
        paddingHorizontal: 0,
        marginBottom: 10,
    },
    keypadRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    key: {
        flex: 1,
        aspectRatio: 2.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 2,
    },
    keyText: {
        color: 'white',
        fontSize: 26,
        fontWeight: '500',
    },
    nextBtn: {
        backgroundColor: '#ffda34',
        marginHorizontal: 20,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    nextBtnText: {
        color: '#000000',
        fontSize: 18,
        fontWeight: '700',
    },
    nextBtnDisabled: {
        backgroundColor: '#222327',
        opacity: 0.5,
    },
})
