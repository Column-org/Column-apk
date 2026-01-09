import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, TextInput, Modal, Dimensions } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { usePrivy } from '@privy-io/expo'
import { useSignRawHash } from '@privy-io/expo/extended-chains'
import { useNetwork } from '../context/NetworkContext'
import { getCycle, fromBaseUnit, toBaseUnit, SavingCycle } from '../services/movement_service/savingCycleService'
import { topUpCycle, earlyWithdrawCycle, closeCycle } from '../services/movement_service/savingCycleFunctions'
import { getFungibleAssets } from '../services/movementAssets'
import AlertModal from '../components/AlertModal'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

export default function SavingDetails() {
    const router = useRouter()
    const params = useLocalSearchParams()
    const { user } = usePrivy()
    const { signRawHash } = useSignRawHash()
    const { network } = useNetwork()
    const [loading, setLoading] = useState(true)
    const [cycle, setCycle] = useState<SavingCycle | null>(null)
    const [showAddFunds, setShowAddFunds] = useState(false)
    const [showWithdraw, setShowWithdraw] = useState(false)
    const [amount, setAmount] = useState('')
    const [processing, setProcessing] = useState(false)
    const [showAlert, setShowAlert] = useState(false)
    const [alertType, setAlertType] = useState<'success' | 'error'>('success')
    const [alertMessage, setAlertMessage] = useState('')
    const [availableBalance, setAvailableBalance] = useState<number>(0)
    const [decimals, setDecimals] = useState<number>(8)
    const [assetSymbol, setAssetSymbol] = useState<string>('MOVE')
    const [currentTime, setCurrentTime] = useState(Date.now())

    const cycleId = params.cycleId !== undefined ? Number(params.cycleId) : null
    const walletAddress = (user?.linked_accounts?.find((account: any) =>
        account.type === 'wallet' && (account as any).chain_type === 'aptos'
    ) as any)?.address || ''

    useEffect(() => {
        loadCycleData()
    }, [cycleId, walletAddress])

    // Load balance after cycle data is loaded
    useEffect(() => {
        if (cycle) {
            loadBalance()
        }
    }, [cycle, walletAddress])

    // Update time every second for real-time progress tracking
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now())
        }, 1000) // Update every second

        return () => clearInterval(interval)
    }, [])

    const loadCycleData = async () => {
        if (cycleId === null || !walletAddress || network !== 'testnet') {
            console.log('Skipping load:', { cycleId, walletAddress, network })
            setLoading(false)
            return
        }

        try {
            console.log('Loading cycle:', { cycleId, walletAddress, network })
            const data = await getCycle(walletAddress, cycleId, network)
            console.log('Cycle data:', data)

            if (data && data.assetAddress.toLowerCase() === '0xb89077cfd2a82a0c1450534d49cfd5f2707643155273069bc23a912bcfefdee7') {
                setDecimals(6)
            }

            setCycle(data)
        } catch (error) {
            console.error('Error loading cycle:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadBalance = async () => {
        if (!walletAddress || !cycle) return

        try {
            const assets = await getFungibleAssets(walletAddress, network)
            // Find the asset that matches the cycle's whitelisted asset address
            const cycleAsset = assets.find(asset =>
                asset.asset_type.toLowerCase() === cycle.assetAddress.toLowerCase()
            )

            if (cycleAsset) {
                const balance = parseFloat(cycleAsset.amount) / Math.pow(10, cycleAsset.metadata.decimals)
                setAvailableBalance(balance)
                setDecimals(cycleAsset.metadata.decimals)
                setAssetSymbol(cycleAsset.metadata.symbol)
            } else {
                setAvailableBalance(0)
                // Fallback to USDC symbol if address matches, otherwise MOVE/GMOON
                if (cycle.assetAddress.toLowerCase() === '0xb89077cfd2a82a0c1450534d49cfd5f2707643155273069bc23a912bcfefdee7') {
                    setAssetSymbol('USDC.e')
                } else {
                    setAssetSymbol('GMOON')
                }
            }
        } catch (error) {
            console.error('Error loading balance:', error)
            setAvailableBalance(0)
        }
    }

    const getCountdownTime = () => {
        if (!cycle) return { days: 0, hours: 0, minutes: 0, seconds: 0 }

        const now = currentTime / 1000 // Convert to seconds
        const hasStarted = now >= cycle.startTime
        const targetTime = hasStarted ? cycle.endTime : cycle.startTime
        const diff = Math.max(0, targetTime - now)

        const days = Math.floor(diff / 86400)
        const hours = Math.floor((diff % 86400) / 3600)
        const minutes = Math.floor((diff % 3600) / 60)
        const seconds = Math.floor(diff % 60)

        return { days, hours, minutes, seconds }
    }

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#ffda34" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        )
    }

    if (!cycle) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Ionicons name="alert-circle-outline" size={64} color="#8B98A5" />
                <Text style={styles.errorText}>Cycle not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        )
    }

    const current = fromBaseUnit(cycle.amount, decimals)
    const target = cycle.goalAmount > 0 ? fromBaseUnit(cycle.goalAmount, decimals) : current

    // Determine cycle type
    const isTimeBased = cycle.goalAmount === 0

    // Calculate percentage based on cycle type (uses currentTime for real-time updates)
    const now = currentTime / 1000
    const hasStarted = now >= cycle.startTime
    let percentage = 0

    if (isTimeBased) {
        // For time-based: calculate time progress
        if (hasStarted) {
            const totalDuration = cycle.endTime - cycle.startTime
            const elapsed = now - cycle.startTime
            percentage = Math.min(Math.max(Math.round((elapsed / totalDuration) * 100), 0), 100)
        } else {
            // Cycle hasn't started yet
            percentage = 0
        }
    } else {
        // For goal-based: calculate amount progress
        percentage = target > 0 ? Math.round((current / target) * 100) : 100
    }

    const remaining = target - current

    const startDate = new Date(cycle.startTime * 1000).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    })
    const endDate = new Date(cycle.endTime * 1000).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    })

    const isGoalReached = cycle.goalAmount > 0 && cycle.amount >= cycle.goalAmount
    const isExpired = Date.now() / 1000 > cycle.endTime

    const buildSignHash = () => {
        return async (address: string, hash: string) => {
            const { signature } = await signRawHash({
                address,
                chainType: 'aptos' as any,
                hash: hash as `0x${string}`,
            })
            const publicKey = (user as any)?.linked_accounts?.find((account: any) =>
                account.type === 'wallet' && account.chain_type === 'aptos'
            )?.public_key || ''
            return { data: { signature, public_key: publicKey } }
        }
    }

    const handleAddFunds = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount')
            return
        }

        const amountToAdd = parseFloat(amount)

        // Check actual wallet balance
        if (amountToAdd > availableBalance) {
            alert(`Insufficient balance. You have ${availableBalance.toFixed(2)} ${assetSymbol} available.`)
            return
        }

        setProcessing(true)
        console.log('Adding funds:', {
            amount: amountToAdd,
            inBaseUnits: toBaseUnit(amountToAdd, decimals),
            cycleId: cycleId
        })

        const result = await topUpCycle(
            walletAddress,
            cycleId!,
            toBaseUnit(amountToAdd, decimals),
            buildSignHash(),
            network
        )

        setProcessing(false)
        setShowAddFunds(false)
        setAmount('')

        if (result.success) {
            setAlertType('success')
            setAlertMessage('Funds added successfully!')
            setShowAlert(true)
            loadCycleData()
        } else {
            setAlertType('error')
            setAlertMessage(result.error || 'Failed to add funds')
            setShowAlert(true)
        }
    }

    const handleWithdraw = async (early: boolean) => {
        setProcessing(true)
        const result = early
            ? await earlyWithdrawCycle(walletAddress, cycleId!, buildSignHash(), network)
            : await closeCycle(walletAddress, cycleId!, buildSignHash(), network)

        setProcessing(false)
        setShowWithdraw(false)

        if (result.success) {
            setAlertType('success')
            setAlertMessage('Withdrawal successful!')
            setShowAlert(true)
            setTimeout(() => router.back(), 2000)
        } else {
            setAlertType('error')
            setAlertMessage(result.error || 'Failed to withdraw')
            setShowAlert(true)
        }
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Goal Details</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Goal Card */}
                <View style={styles.goalCard}>
                    <View style={styles.cardContent}>
                        {/* Header */}
                        <View style={styles.cardHeader}>
                            <Text style={styles.goalTitle}>{cycle.name}</Text>
                            {cycle.description && (
                                <Text style={styles.goalDescription}>{cycle.description}</Text>
                            )}
                        </View>

                        {/* Amount */}
                        <View style={styles.amountSection}>
                            <Text style={styles.currentAmount}>${current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                            {!isTimeBased && (
                                <Text style={styles.targetAmount}> / ${target.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                            )}
                        </View>

                        {/* Badges */}
                        <View style={styles.badgesRow}>
                            {isTimeBased && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>Time Based</Text>
                                </View>
                            )}
                            {isGoalReached && (
                                <View style={[styles.badge, styles.successBadge]}>
                                    <Text style={[styles.badgeText, styles.successBadgeText]}>Goal Reached</Text>
                                </View>
                            )}
                            {isExpired && (
                                <View style={[styles.badge, styles.errorBadge]}>
                                    <Text style={[styles.badgeText, styles.errorBadgeText]}>Expired</Text>
                                </View>
                            )}
                        </View>

                        {/* Time Info */}
                        <View style={styles.timeInfo}>
                            <Text style={styles.timeInfoText}>
                                {hasStarted
                                    ? `${Math.max(0, Math.ceil((cycle.endTime - currentTime / 1000) / 86400))}d left`
                                    : `Starts in ${Math.ceil((cycle.startTime - currentTime / 1000) / 3600)}h`
                                }
                            </Text>
                        </View>
                    </View>

                    {/* Time Remaining Banner */}
                    {!isExpired && (
                        <View style={styles.bannerSection}>
                            <Text style={styles.bannerLabel}>
                                {hasStarted ? 'Time Remaining' : 'Starts In'}
                            </Text>
                            <Text style={styles.bannerTime}>
                                {String(getCountdownTime().days).padStart(2, '0')}:
                                {String(getCountdownTime().hours).padStart(2, '0')}:
                                {String(getCountdownTime().minutes).padStart(2, '0')}:
                                {String(getCountdownTime().seconds).padStart(2, '0')}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Start Date</Text>
                        <Text style={styles.statValue}>{startDate}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>End Date</Text>
                        <Text style={styles.statValue}>{endDate}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>{isTimeBased ? 'Time Progress' : 'Goal Progress'}</Text>
                        <Text style={styles.statValue}>{percentage}%</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Penalty</Text>
                        <Text style={styles.statValue}>{cycle.penaltyPercentage}%</Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
                <TouchableOpacity style={styles.addButton} activeOpacity={0.8} onPress={() => setShowAddFunds(true)}>
                    <Ionicons name="add" size={24} color="white" />
                    <Text style={styles.addButtonText}>Add Funds</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.withdrawButton} activeOpacity={0.8} onPress={() => setShowWithdraw(true)}>
                    <Ionicons name="remove" size={24} color="white" />
                    <Text style={styles.withdrawButtonText}>Withdraw</Text>
                </TouchableOpacity>
            </View>

            {/* Add Funds Modal */}
            <Modal visible={showAddFunds} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Funds</Text>
                        <Text style={styles.modalSubtitle}>Available: {availableBalance.toFixed(2)} {assetSymbol}</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="Enter amount (e.g., 100)"
                            placeholderTextColor="#8B98A5"
                            keyboardType="decimal-pad"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowAddFunds(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalConfirmButton} onPress={handleAddFunds} disabled={processing}>
                                {processing ? <ActivityIndicator color="#121315" /> : <Text style={styles.modalConfirmText}>Add</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Withdraw Modal */}
            <Modal visible={showWithdraw} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Withdraw Funds</Text>
                        <Text style={styles.modalSubtitle}>Balance: ${fromBaseUnit(cycle.amount, decimals).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                        {!isExpired && !isGoalReached && (
                            <Text style={styles.warningText}>⚠️ Early withdrawal penalty: {cycle.penaltyPercentage}%</Text>
                        )}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowWithdraw(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalConfirmButton}
                                onPress={() => handleWithdraw(!isExpired && !isGoalReached)}
                                disabled={processing}
                            >
                                {processing ? <ActivityIndicator color="#121315" /> : <Text style={styles.modalConfirmText}>Confirm</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <AlertModal
                visible={showAlert}
                type={alertType}
                title={alertMessage}
                message=""
                onClose={() => setShowAlert(false)}
            />
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
        paddingTop: IS_SMALL_SCREEN ? 16 : 50,
        paddingBottom: IS_SMALL_SCREEN ? 8 : 20,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    goalCard: {
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 20,
        overflow: 'hidden',
    },
    cardContent: {
        backgroundColor: '#1a1b1f',
        padding: 24,
        alignItems: 'center',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    cardHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    goalTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 6,
        textAlign: 'center',
    },
    goalDescription: {
        color: '#8B98A5',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
    },
    amountSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    currentAmount: {
        color: 'white',
        fontSize: 56,
        fontWeight: '700',
        letterSpacing: -2,
    },
    targetAmount: {
        color: '#8B98A5',
        fontSize: 24,
        fontWeight: '600',
    },
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        justifyContent: 'center',
        marginBottom: 12,
    },
    timeInfo: {
        marginTop: 6,
    },
    timeInfoText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    progressBarContainer: {
        width: '100%',
        marginBottom: 12,
    },
    progressBarBackground: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#ffda34',
        borderRadius: 4,
    },
    percentageContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 4,
    },
    percentageText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    remainingText: {
        color: '#8B98A5',
        fontSize: 13,
        fontWeight: '500',
        letterSpacing: 0.2,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        marginTop: 20,
        justifyContent: 'space-between',
    },
    statCard: {
        width: '48%',
        padding: 16,
        marginBottom: 12,
    },
    statLabel: {
        color: '#8B98A5',
        fontSize: 12,
        marginBottom: 8,
    },
    statValue: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222327',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: 12,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    transactionDate: {
        color: '#8B98A5',
        fontSize: 12,
    },
    transactionAmount: {
        color: '#34C759',
        fontSize: 16,
        fontWeight: '700',
    },
    actionContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingBottom: 40,
        backgroundColor: '#121315',
    },
    addButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffda34',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    addButtonText: {
        color: '#121315',
        fontSize: 16,
        fontWeight: '700',
    },
    withdrawButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#222327',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    withdrawButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#8B98A5',
        fontSize: 14,
        marginTop: 12,
    },
    errorText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 24,
    },
    backButton: {
        backgroundColor: '#ffda34',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#121315',
        fontSize: 16,
        fontWeight: '700',
    },
    badge: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    successBadge: {
        backgroundColor: 'rgba(52, 199, 89, 0.15)',
    },
    successBadgeText: {
        color: '#34C759',
    },
    errorBadge: {
        backgroundColor: 'rgba(255, 107, 107, 0.15)',
    },
    errorBadgeText: {
        color: '#ff6b6b',
    },
    bannerSection: {
        backgroundColor: '#ffda34',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        marginTop: -12,
        paddingTop: 20,
    },
    bannerLabel: {
        color: '#121315',
        fontSize: 14,
        fontWeight: '700',
    },
    bannerTime: {
        color: '#121315',
        fontSize: 14,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#222327',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    modalSubtitle: {
        color: '#8B98A5',
        fontSize: 14,
        marginBottom: 12,
    },
    modalInput: {
        backgroundColor: '#121315',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        color: 'white',
        fontSize: 16,
        marginBottom: 20,
    },
    warningText: {
        color: '#ff6b6b',
        fontSize: 14,
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancelButton: {
        flex: 1,
        backgroundColor: '#121315',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#8B98A5',
        fontSize: 16,
        fontWeight: '600',
    },
    modalConfirmButton: {
        flex: 1,
        backgroundColor: '#ffda34',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalConfirmText: {
        color: '#121315',
        fontSize: 16,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        marginTop: 20,
        marginBottom: 16,
    },
    countdownSection: {
        alignItems: 'center',
        paddingBottom: 4,
    },
    countdownLabel: {
        color: '#8B98A5',
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 10,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    countdownContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: 8,
    },
    timeUnit: {
        alignItems: 'center',
        minWidth: 50,
    },
    timeValue: {
        color: '#ffda34',
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 28,
        fontVariant: ['tabular-nums'],
    },
    timeLabel: {
        color: '#8B98A5',
        fontSize: 9,
        fontWeight: '600',
        marginTop: 4,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    timeSeparator: {
        color: '#ffda34',
        fontSize: 20,
        fontWeight: '700',
        lineHeight: 28,
        paddingHorizontal: 2,
    },
})
