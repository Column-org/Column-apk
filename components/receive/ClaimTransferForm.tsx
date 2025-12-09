import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, LayoutAnimation } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { TransferDetails, viewTransferDetails } from '../../services/movement_service/sendWithCode'
import { octasToMove } from '../../services/movement_service/helpers'
import { useNetwork } from '../../context/NetworkContext'

interface ClaimTransferFormProps {
  code: string
  onChangeCode: (value: string) => void
  onSubmit: (transferType: 'move' | 'fa') => void
  isSubmitting: boolean
}

export default function ClaimTransferForm({ code, onChangeCode, onSubmit, isSubmitting }: ClaimTransferFormProps) {
  const { network } = useNetwork()
  const [isChecking, setIsChecking] = useState(false)
  const [transferDetails, setTransferDetails] = useState<TransferDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [buttonMode, setButtonMode] = useState<'check' | 'claim'>('check')
  const [showMoreDetails, setShowMoreDetails] = useState(false)

  const trimmedCode = code.trim()
  const isButtonDisabled =
    buttonMode === 'check'
      ? trimmedCode.length < 8 || isChecking || isSubmitting
      : isSubmitting || isChecking || !transferDetails?.isClaimable

  useEffect(() => {
    setTransferDetails(null)
    setError(null)
    setButtonMode('check')
    setShowMoreDetails(false)
  }, [code, network])

  const checkTransferDetails = async (codeToCheck: string) => {
    if (codeToCheck.length < 8) {
      setError('Please enter a valid claim code')
      return
    }

    setIsChecking(true)
    setError(null)

    try {
      const result = await viewTransferDetails(codeToCheck, network)

      if (!result.success || !result.details) {
        setError(result.error || 'Transfer not found')
        setTransferDetails(null)
        return
      }

      if (!result.details.isClaimable) {
        setError('This transfer is no longer claimable (may have expired or been claimed)')
        setTransferDetails(null)
        return
      }

      setTransferDetails(result.details)
      setError(null)
      setButtonMode('claim')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check transfer details')
      setTransferDetails(null)
    } finally {
      setIsChecking(false)
    }
  }

  const formatAmount = (amount: string, type: 'move' | 'fa') => {
    if (type === 'move') {
      const moveAmount = octasToMove(parseInt(amount))
      return `${moveAmount.toFixed(4)} MOVE`
    }
    // For FA, we'd need decimals from metadata, but for now just show the raw amount
    return `${amount} units`
  }

  const formatAddress = (address: string) => {
    if (!address) return 'Unknown'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (timestamp: string) => {
    try {
      // Timestamps from the contract are in seconds, convert to milliseconds for JS Date
      const date = new Date(parseInt(timestamp) * 1000)
      return date.toLocaleString()
    } catch {
      return 'Unknown'
    }
  }

  const handleClaim = () => {
    if (!transferDetails) {
      Alert.alert('Error', 'Please wait for transfer details to load')
      return
    }

    if (!transferDetails.isClaimable) {
      Alert.alert('Not Claimable', 'This transfer cannot be claimed')
      return
    }

    onSubmit(transferDetails.type)
  }

  const handlePrimaryAction = () => {
    if (buttonMode === 'check') {
      checkTransferDetails(trimmedCode)
    } else {
      handleClaim()
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.inputCard, transferDetails && styles.inputCardWithDetails]}>
        <Text style={styles.label}>Enter Claim Code</Text>
        <TextInput
          style={styles.input}
          placeholder="Paste or type the claim code"
          placeholderTextColor="#8B98A5"
          value={code}
          onChangeText={onChangeCode}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
        />

        {isChecking && (
          <View style={styles.checkingContainer}>
            <ActivityIndicator size="small" color="#ffda34" />
            <Text style={styles.checkingText}>Checking transfer details...</Text>
          </View>
        )}

        {error && !isChecking && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {transferDetails && !isChecking && (
          <View style={styles.detailsSection}>
            <View style={styles.detailsDivider} />

            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>You will receive</Text>
              <Text style={styles.amountDisplay}>
                {formatAmount(transferDetails.amount, transferDetails.type)}
              </Text>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>From</Text>
                <Text style={styles.detailValue}>{formatAddress(transferDetails.sender)}</Text>
              </View>

              {transferDetails.type === 'fa' && transferDetails.assetMetadata && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Asset</Text>
                  <Text style={styles.detailValue}>{formatAddress(transferDetails.assetMetadata)}</Text>
                </View>
              )}

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={styles.statusBadge}>
                  <View style={[styles.statusDot, transferDetails.isClaimable && styles.statusDotActive]} />
                  <Text style={[styles.statusText, transferDetails.isClaimable && styles.claimableStatus]}>
                    {transferDetails.isClaimable ? 'Ready' : 'Unavailable'}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.seeMoreButton}
              activeOpacity={0.7}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
                setShowMoreDetails(!showMoreDetails)
              }}
            >
              <View style={styles.seeMoreHeader}>
                <Text style={styles.seeMoreText}>See more details</Text>
                <Ionicons
                  name={showMoreDetails ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#ffda34"
                />
              </View>
            </TouchableOpacity>

            {showMoreDetails && (
              <View style={styles.moreDetailsContainer}>
                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>Created</Text>
                  <Text style={styles.timeValue}>{formatDate(transferDetails.createdAt)}</Text>
                </View>
                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>Expires</Text>
                  <Text style={styles.timeValue}>{formatDate(transferDetails.expiration)}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {!transferDetails && !isChecking && !error && (
          <Text style={styles.hint}>
            Claim codes are generated when someone sends tokens with a transfer code.
          </Text>
        )}

        <TouchableOpacity
          style={[styles.button, isButtonDisabled && styles.buttonDisabled]}
          activeOpacity={0.7}
          disabled={isButtonDisabled}
          onPress={handlePrimaryAction}
        >
          {buttonMode === 'check' ? (
            isChecking ? (
              <ActivityIndicator color="#121315" />
            ) : (
              <Text style={styles.buttonText}>Check Transfer</Text>
            )
          ) : isSubmitting ? (
            <ActivityIndicator color="#121315" />
          ) : (
            <Text style={styles.buttonText}>Claim Tokens</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  inputCard: {
    backgroundColor: '#222327',
    borderRadius: 16,
    padding: 24,
  },
  inputCardWithDetails: {
  },
  label: {
    color: '#8B98A5',
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#121315',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    minHeight: 100,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  hint: {
    color: '#8B98A5',
    fontSize: 12,
    marginTop: 16,
    lineHeight: 18,
    textAlign: 'center',
  },
  checkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  checkingText: {
    color: '#8B98A5',
    fontSize: 14,
    marginLeft: 8,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    textAlign: 'center',
  },
  detailsSection: {
    marginTop: 8,
  },
  detailsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 20,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: {
    color: '#8B98A5',
    fontSize: 13,
    marginBottom: 8,
  },
  amountDisplay: {
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
  },
  detailsGrid: {
    backgroundColor: '#121315',
    borderRadius: 12,
    padding: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B98A5',
  },
  statusDotActive: {
    backgroundColor: '#34C759',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  claimableStatus: {
    color: '#34C759',
  },
  seeMoreButton: {
    paddingTop: 16,
  },
  seeMoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  seeMoreText: {
    color: '#ffda34',
    fontSize: 13,
    fontWeight: '600',
  },
  moreDetailsContainer: {
    backgroundColor: '#121315',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  timeLabel: {
    color: '#8B98A5',
    fontSize: 13,
  },
  timeValue: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#ffda34',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#3A3F4A',
  },
  buttonText: {
    color: '#121315',
    fontSize: 16,
    fontWeight: '700',
  },
})
