import React, { useState, useMemo, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, TextInput, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useNetwork } from '../context/NetworkContext'
import { getSwapQuote, getTokens, formatTokenAmount, parseTokenAmount, MosaicToken, SwapQuote } from '../services/mosaic/mosaicService'
import SwapTokenSelector from '../components/swap/SwapTokenSelector'
import { useToast } from '../context/ToastContext'
import BACKEND_CONFIG from '../config/backend'
import { useWallet } from '../context/WalletContext'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

export default function Swap() {
  const router = useRouter()
  const { t } = useTranslation()
  const { address: walletAddress, signRawHash: web3SignRawHash, account: web3Account, walletPublicKey } = useWallet()
  const { network } = useNetwork()

  const [tokens, setTokens] = useState<MosaicToken[]>([])
  const [isLoadingTokens, setIsLoadingTokens] = useState(true)
  const [fromToken, setFromToken] = useState<MosaicToken | null>(null)
  const [toToken, setToToken] = useState<MosaicToken | null>(null)
  const [fromAmount, setFromAmount] = useState('')
  const [displayAmount, setDisplayAmount] = useState('0')
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [slippage] = useState(50) // 0.5% default
  const toast = useToast()


  // Load tokens on mount
  useEffect(() => {
    loadTokens()
  }, [network])

  const loadTokens = async () => {
    try {
      setIsLoadingTokens(true)
      const fetchedTokens = await getTokens(network)
      setTokens(fetchedTokens)

      // Set MOVE as default from token
      const moveToken = fetchedTokens.find(t => t.symbol === 'MOVE' || t.address === '0xa')
      if (moveToken) {
        setFromToken(moveToken)
      }

      // Set USDC.e as default to token
      const usdcToken = fetchedTokens.find(t => t.symbol === 'USDC.e')
      if (usdcToken && moveToken?.address !== usdcToken.address) {
        setToToken(usdcToken)
      }
    } catch (error) {
      console.error('Error loading tokens:', error)
      toast.show('Error', { data: { message: 'Failed to load tokens. Please try again.' }, type: 'error' })
    } finally {
      setIsLoadingTokens(false)
    }
  }

  // Get quote when amount or tokens change
  useEffect(() => {
    const getQuoteDebounced = setTimeout(() => {
      if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0 && walletAddress) {
        fetchQuote()
      } else {
        setQuote(null)
      }
    }, 500)

    return () => clearTimeout(getQuoteDebounced)
  }, [fromAmount, fromToken, toToken, walletAddress])

  const fetchQuote = async () => {
    if (!fromToken || !toToken || !fromAmount || !walletAddress) return

    try {
      setIsLoadingQuote(true)
      const amount = parseTokenAmount(parseFloat(fromAmount), fromToken.decimals)

      const quoteData = await getSwapQuote({
        srcAsset: fromToken.address,
        dstAsset: toToken.address,
        amount,
        slippage,
        sender: walletAddress,
        receiver: walletAddress,
      })

      setQuote(quoteData)
    } catch (error) {
      console.error('Error getting quote:', error)
      setQuote(null)
      toast.show('Quote Error', { data: { message: 'Failed to get swap quote. Please try different amounts or tokens.' }, type: 'error' })
    } finally {
      setIsLoadingQuote(false)
    }
  }

  const handleSwap = async () => {
    if (!quote || !fromToken || !toToken || !walletAddress) {
      return
    }

    try {
      setIsSwapping(true)

      // Step 1: Generate hash using backend with Mosaic transaction data
      const API_BASE_URL = BACKEND_CONFIG.BASE_URL

      const hashResponse = await fetch(`${API_BASE_URL}/generate-hash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: walletAddress,
          function: quote.tx.function,
          typeArguments: quote.tx.typeArguments,
          functionArguments: quote.tx.functionArguments,
          network,
        }),
      })

      if (!hashResponse.ok) {
        const errorText = await hashResponse.text()
        console.error('Hash generation failed:', errorText)
        throw new Error(`Failed to generate transaction hash: ${errorText}`)
      }

      const { hash, rawTxnHex } = await hashResponse.json()

      // Step 2: Sign hash
      const { signature } = await web3SignRawHash(hash as any)

      // Step 3: Submit signed transaction
      const publicKey = walletPublicKey

      const submitResponse = await fetch(`${API_BASE_URL}/submit-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawTxnHex,
          publicKey,
          signature,
          network,
        }),
      })

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text()
        console.error('Transaction submission failed:', errorText)
        throw new Error(`Failed to submit signed transaction: ${errorText}`)
      }

      const result = await submitResponse.json()

      if (!result.success) {
        throw new Error(result.vmStatus || 'Transaction failed')
      }

      // Success!
      const toAmountValue = quote && toToken ? formatTokenAmount(quote.dstAmount, toToken.decimals) : 0

      toast.show('Swap Successful!', {
        data: { message: `Swapped ${fromAmount} ${fromToken.symbol} for ${toAmountValue.toFixed(6)} ${toToken.symbol}` },
        type: 'success'
      })

      // Reset form
      setFromAmount('')
      setDisplayAmount('0')
      setQuote(null)

    } catch (error: any) {
      console.error('Swap error:', error)
      toast.show('Swap Failed', {
        data: { message: error.message || 'An error occurred during the swap. Please try again.' },
        type: 'error'
      })
    } finally {
      setIsSwapping(false)
    }
  }

  const switchTokens = () => {
    const tempToken = fromToken
    setFromToken(toToken)
    setToToken(tempToken)
  }

  const handleFromTokenSelect = (token: MosaicToken) => {
    if (token.address === toToken?.address) {
      setToToken(fromToken)
    }
    setFromToken(token)
  }

  const handleToTokenSelect = (token: MosaicToken) => {
    if (token.address === fromToken?.address) {
      setFromToken(toToken)
    }
    setToToken(token)
  }

  const handleAmountChange = (amount: string, display: string) => {
    setFromAmount(amount)
    setDisplayAmount(display)
  }

  const toAmount = quote && toToken ? formatTokenAmount(quote.dstAmount, toToken.decimals) : 0

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121315" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Swap</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* You Pay Card */}
        <View style={styles.swapCard}>
          <Text style={styles.cardLabel}>You Pay</Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.amountInput}
              value={fromAmount}
              onChangeText={(text) => {
                const regex = /^\d*\.?\d*$/
                if (regex.test(text) || text === '') {
                  handleAmountChange(text, text || '0')
                }
              }}
              placeholder="0"
              placeholderTextColor="#3a3a3a"
              keyboardType="decimal-pad"
              selectionColor="#ffda34"
            />

            <SwapTokenSelector
              selectedToken={fromToken}
              tokens={tokens}
              onSelectToken={handleFromTokenSelect}
              label="Select Token"
            />
          </View>
        </View>

        {/* Switch Button */}
        <View style={styles.switchContainer}>
          <TouchableOpacity onPress={switchTokens} style={styles.switchButton}>
            <Ionicons name="swap-vertical" size={20} color="#121315" />
          </TouchableOpacity>
        </View>

        {/* You Receive Card */}
        <View style={styles.swapCard}>
          <Text style={styles.cardLabel}>You Receive</Text>

          <View style={styles.inputRow}>
            {isLoadingQuote ? (
              <View style={styles.skeletonContainer}>
                <View style={styles.skeletonLine} />
              </View>
            ) : (
              <Text style={styles.outputAmount}>
                {toAmount > 0 ? toAmount.toFixed(6) : '0'}
              </Text>
            )}

            <SwapTokenSelector
              selectedToken={toToken}
              tokens={tokens}
              onSelectToken={handleToTokenSelect}
              label="Select Token"
            />
          </View>
        </View>

        {/* Quote Details */}
        {quote && fromToken && toToken && !isLoadingQuote && (
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rate</Text>
              <Text style={styles.detailValue}>
                1 {fromToken.symbol} ≈ {(toAmount / parseFloat(fromAmount || '1')).toFixed(4)} {toToken.symbol}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Slippage Tolerance</Text>
              <Text style={styles.detailValue}>{slippage / 100}%</Text>
            </View>
          </View>
        )}

        {/* Swap Button */}
        <TouchableOpacity
          style={[
            styles.swapButton,
            (!fromToken || !toToken || !fromAmount || !quote || isLoadingQuote || isSwapping) && styles.swapButtonDisabled
          ]}
          onPress={handleSwap}
          disabled={!fromToken || !toToken || !fromAmount || !quote || isLoadingQuote || isSwapping}
        >
          {isSwapping ? (
            <View style={styles.swapButtonContent}>
              <ActivityIndicator size="small" color="#121315" />
              <Text style={styles.swapButtonText}>Swapping...</Text>
            </View>
          ) : (
            <Text style={styles.swapButtonText}>
              {!fromToken || !toToken ? 'Select Tokens' :
                !fromAmount || parseFloat(fromAmount) === 0 ? 'Enter Amount' :
                  'Swap Tokens'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>


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
    paddingHorizontal: 20,
    paddingTop: IS_SMALL_SCREEN ? 16 : 60,
    paddingBottom: IS_SMALL_SCREEN ? 8 : 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 28,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#8B98A5',
    fontSize: 16,
    marginTop: 16,
  },
  swapCard: {
    backgroundColor: '#1a1b1f',
    borderRadius: 20,
    padding: 20,
    borderWidth: 0,
  },
  cardLabel: {
    color: '#8B98A5',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  amountInput: {
    flex: 1,
    color: 'white',
    fontSize: 48,
    fontWeight: '600',
    padding: 0,
  },
  balanceRow: {
    marginTop: 12,
  },
  balanceText: {
    color: '#666666',
    fontSize: 14,
  },
  switchContainer: {
    alignItems: 'center',
    marginVertical: -16,
    zIndex: 10,
  },
  switchButton: {
    backgroundColor: '#ffda34',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#121315',
  },
  outputAmount: {
    flex: 1,
    color: 'white',
    fontSize: 48,
    fontWeight: '600',
  },
  loadingQuote: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailsCard: {
    backgroundColor: '#1a1b1f',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 0,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#8B98A5',
    fontSize: 14,
  },
  detailValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  swapButton: {
    backgroundColor: '#ffda34',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  swapButtonDisabled: {
    backgroundColor: '#2a2b2f',
    opacity: 0.5,
  },
  swapButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  swapButtonText: {
    color: '#121315',
    fontSize: 18,
    fontWeight: '700',
  },
  skeletonContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  skeletonLine: {
    height: 48,
    backgroundColor: '#2a2b2f',
    borderRadius: 8,
  },
})
