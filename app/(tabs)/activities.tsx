import { View, Text, ScrollView, StyleSheet, StatusBar, ActivityIndicator, RefreshControl, TouchableOpacity, Animated, Image, Pressable, Dimensions } from 'react-native'
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Ionicons, FontAwesome5 } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { usePrivy } from '@privy-io/expo'
import { useRouter } from 'expo-router'
import { SwipeableTabWrapper } from '../../components/SwipeableTabWrapper'
import { useNetwork } from '../../context/NetworkContext'
import { getTransactionHistory, Transaction } from '../../services/movement_service/transactionHistory'
import { SkeletonLoader } from '../../components/SkeletonLoader'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

const Activities = () => {
    const { t } = useTranslation()
    const { user } = usePrivy()
    const { network } = useNetwork()
    const router = useRouter()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showFilterMenu, setShowFilterMenu] = useState(false)
    const [hideFailedTx, setHideFailedTx] = useState(false)
    const [filterType, setFilterType] = useState<'all' | 'send' | 'receive' | 'swap' | 'contract'>('all')
    const scrollY = useRef(new Animated.Value(0)).current

    const walletAddress = useMemo(() => {
        if (!user?.linked_accounts) return ''
        const movementWallet = user.linked_accounts.find(
            (account: any) => account.type === 'wallet' && account.chain_type === 'aptos'
        )
        return (movementWallet as any)?.address || ''
    }, [user?.linked_accounts])

    const fetchTransactions = useCallback(async (showRefresh = false) => {
        if (!walletAddress) {
            setIsLoading(false)
            return
        }

        if (showRefresh) {
            setIsRefreshing(true)
        } else {
            setIsLoading(true)
        }
        setError(null)

        try {
            const result = await getTransactionHistory(walletAddress, network, { limit: 50 })
            if (result.success) {
                setTransactions(result.transactions)
            } else {
                setError(result.error || 'Failed to load transactions')
            }
        } catch (err) {
            setError('Failed to load transactions')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [walletAddress, network])

    useEffect(() => {
        fetchTransactions()
    }, [fetchTransactions])

    const groupTransactionsByDate = useCallback((txs: Transaction[]) => {
        const groups: { [key: string]: Transaction[] } = {}
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        txs.forEach((tx) => {
            const txDate = new Date(tx.timestamp * 1000)
            let dateKey: string

            if (txDate.toDateString() === today.toDateString()) {
                dateKey = 'today'
            } else if (txDate.toDateString() === yesterday.toDateString()) {
                dateKey = 'yesterday'
            } else {
                dateKey = txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }

            if (!groups[dateKey]) {
                groups[dateKey] = []
            }
            groups[dateKey].push(tx)
        })

        return groups
    }, [])

    const getTransactionIcon = (type: Transaction['type']) => {
        switch (type) {
            case 'send':
                return { name: 'arrow-up', color: '#8B98A5' }
            case 'receive':
                return { name: 'arrow-down', color: '#ffda34' }
            case 'swap':
                return { name: 'swap-horizontal', color: '#8B98A5' }
            case 'contract':
                return { name: 'apps', color: '#8B98A5' }
            default:
                return { name: 'help-circle', color: '#8B98A5' }
        }
    }


    const getTransactionName = (tx: Transaction) => {
        switch (tx.type) {
            case 'send':
                return `Sent ${tx.token || 'MOVE'}`
            case 'receive':
                return `Received ${tx.token || 'MOVE'}`
            case 'swap':
                return 'Swap'
            case 'contract':
                return tx.functionName || 'Contract Call'
            default:
                return 'Transaction'
        }
    }

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp * 1000)
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }

    const formatAddress = (address: string) => {
        if (!address) return ''
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            // Filter by success status
            if (hideFailedTx && tx.success === false) return false

            // Filter by transaction type
            if (filterType !== 'all' && tx.type !== filterType) return false

            return true
        })
    }, [transactions, hideFailedTx, filterType])

    const groupedTransactions = useMemo(() => groupTransactionsByDate(filteredTransactions), [filteredTransactions, groupTransactionsByDate])

    const headerShadow = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 0.3],
        extrapolate: 'clamp',
    })

    const renderTransactionItem = (tx: Transaction) => {
        const icon = getTransactionIcon(tx.type)
        const isSend = tx.type === 'send'
        const isSuccess = tx.success !== false
        const isAssetTransaction = tx.type === 'send' || tx.type === 'receive' || tx.type === 'swap'
        const MOVE_ICON = 'https://gateway.pinata.cloud/ipfs/QmUv8RVdgo6cVQzh7kxerWLatDUt4rCEFoCTkCVLuMAa27'

        return (
            <Pressable
                key={tx.hash}
                style={({ pressed }) => [
                    styles.transactionItem,
                    pressed && styles.transactionItemPressed
                ]}
                onPress={() => router.push({
                    pathname: '/transactionDetails',
                    params: { transaction: JSON.stringify(tx) }
                })}
            >
                <View style={styles.iconContainer}>
                    {tx.type === 'swap' && tx.swapData ? (
                        // For swap: Show overlapping token images
                        <>
                            <View style={styles.swapIconContainer}>
                                <View style={styles.swapIconLeft}>
                                    {tx.swapData.fromTokenLogo ? (
                                        <Image
                                            source={{ uri: tx.swapData.fromTokenLogo }}
                                            style={styles.swapTokenImage}
                                        />
                                    ) : (
                                        <View style={styles.swapTokenPlaceholder}>
                                            <Text style={styles.swapTokenPlaceholderText}>
                                                {tx.swapData.fromToken.substring(0, 2)}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.swapIconRight}>
                                    {tx.swapData.toTokenLogo ? (
                                        <Image
                                            source={{ uri: tx.swapData.toTokenLogo }}
                                            style={styles.swapTokenImage}
                                        />
                                    ) : (
                                        <View style={styles.swapTokenPlaceholder}>
                                            <Text style={styles.swapTokenPlaceholderText}>
                                                {tx.swapData.toToken.substring(0, 2)}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <View style={[styles.statusBadge, isSuccess ? styles.successBadge : styles.failedBadge]}>
                                <Ionicons
                                    name={isSuccess ? 'checkmark' : 'close'}
                                    size={10}
                                    color="white"
                                />
                            </View>
                        </>
                    ) : isAssetTransaction ? (
                        // For send/receive: Show asset icon with badge
                        <>
                            <View style={styles.transactionIcon}>
                                <Image
                                    source={{ uri: MOVE_ICON }}
                                    style={styles.assetImage}
                                />
                            </View>
                            <View style={[styles.statusBadge, isSuccess ? styles.successBadge : styles.failedBadge]}>
                                <Ionicons
                                    name={isSuccess ? 'checkmark' : 'close'}
                                    size={10}
                                    color="white"
                                />
                            </View>
                        </>
                    ) : (
                        // For contract/interaction: Show full circle with checkmark or X
                        <View style={[styles.transactionIcon, isSuccess ? styles.successCircle : styles.failedCircle]}>
                            <Ionicons
                                name={isSuccess ? 'checkmark' : 'close'}
                                size={24}
                                color="white"
                            />
                        </View>
                    )}
                </View>
                <View style={styles.transactionDetails}>
                    <Text style={styles.transactionName}>{getTransactionName(tx)}</Text>
                    <Text style={styles.transactionDate}>
                        {tx.to && tx.type === 'send' && `To ${formatAddress(tx.to)}`}
                        {tx.from && tx.type === 'receive' && `From ${formatAddress(tx.from)}`}
                        {tx.type === 'contract' && (tx.functionName || 'Unknown')}
                    </Text>
                </View>
                <View style={styles.transactionRight}>
                    {tx.amount && (
                        <Text style={isSend ? styles.transactionAmountNegative : styles.transactionAmount}>
                            {isSend ? '-' : '+'}{tx.amount} {tx.token || 'MOVE'}
                        </Text>
                    )}
                    <Text style={styles.transactionTime}>{formatTime(tx.timestamp)}</Text>
                </View>
            </Pressable>
        )
    }

    return (
        <SwipeableTabWrapper>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />

                <Animated.View style={[styles.header, {
                    shadowOpacity: headerShadow,
                    elevation: scrollY.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, 8],
                        extrapolate: 'clamp',
                    })
                }]}>
                    <Text style={styles.headerTitle}>{t('activities.title')}</Text>
                    <TouchableOpacity onPress={() => setShowFilterMenu(!showFilterMenu)} activeOpacity={0.7}>
                        <Ionicons name="filter" size={24} color={(hideFailedTx || filterType !== 'all') ? "#ffda34" : "white"} />
                    </TouchableOpacity>
                </Animated.View>

                {showFilterMenu && (
                    <View style={styles.filterMenu}>
                        <View style={styles.filterSection}>
                            <Text style={styles.filterLabel}>Transaction Type</Text>
                            <View style={styles.filterOptions}>
                                <TouchableOpacity
                                    style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
                                    onPress={() => setFilterType('all')}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>All</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.filterChip, filterType === 'send' && styles.filterChipActive]}
                                    onPress={() => setFilterType('send')}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.filterChipText, filterType === 'send' && styles.filterChipTextActive]}>Send</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.filterChip, filterType === 'receive' && styles.filterChipActive]}
                                    onPress={() => setFilterType('receive')}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.filterChipText, filterType === 'receive' && styles.filterChipTextActive]}>Receive</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.filterChip, filterType === 'swap' && styles.filterChipActive]}
                                    onPress={() => setFilterType('swap')}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.filterChipText, filterType === 'swap' && styles.filterChipTextActive]}>Swap</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.filterChip, filterType === 'contract' && styles.filterChipActive]}
                                    onPress={() => setFilterType('contract')}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.filterChipText, filterType === 'contract' && styles.filterChipTextActive]}>Contract</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.filterDivider} />

                        <TouchableOpacity
                            style={styles.filterToggle}
                            onPress={() => setHideFailedTx(!hideFailedTx)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.filterToggleText}>Hide Failed Transactions</Text>
                            <View style={[styles.toggle, hideFailedTx && styles.toggleActive]}>
                                <View style={[styles.toggleDot, hideFailedTx && styles.toggleDotActive]} />
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                <Animated.ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={() => fetchTransactions(true)}
                            tintColor="#ffda34"
                        />
                    }
                >

                    {isLoading && !isRefreshing && (
                        <View style={styles.skeletonContainer}>
                            {[...Array(6)].map((_, index) => (
                                <View key={index} style={styles.skeletonItem}>
                                    <SkeletonLoader width={48} height={48} borderRadius={24} />
                                    <View style={styles.skeletonContent}>
                                        <SkeletonLoader width="60%" height={16} style={{ marginBottom: 8 }} />
                                        <SkeletonLoader width="40%" height={12} />
                                    </View>
                                    <View style={styles.skeletonRight}>
                                        <SkeletonLoader width={60} height={14} style={{ marginBottom: 8 }} />
                                        <SkeletonLoader width={50} height={12} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={() => fetchTransactions()}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.retryButtonText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {!isLoading && !error && transactions.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={48} color="#8B98A5" />
                            <Text style={styles.emptyText}>No transactions yet</Text>
                            <Text style={styles.emptySubtext}>Your transaction history will appear here</Text>
                        </View>
                    )}

                    {!isLoading && !error && Object.entries(groupedTransactions).map(([dateKey, txs]) => (
                        <View key={dateKey}>
                            <View style={styles.dateSection}>
                                <Text style={styles.dateLabel}>
                                    {dateKey === 'today'
                                        ? t('activities.today')
                                        : dateKey === 'yesterday'
                                        ? t('activities.yesterday')
                                        : dateKey}
                                </Text>
                            </View>
                            {txs.map(renderTransactionItem)}
                        </View>
                    ))}

                    <View style={{ height: 20 }} />
                </Animated.ScrollView>
            </View>
        </SwipeableTabWrapper>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: IS_SMALL_SCREEN ? 16 : 50,
        paddingBottom: IS_SMALL_SCREEN ? 8 : 20,
        backgroundColor: '#121315',
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    headerTitle: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
    },
    dateSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    dateLabel: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#222327',
        borderRadius: 12,
        marginHorizontal: 20,
        marginBottom: 8,
    },
    transactionItemPressed: {
        backgroundColor: '#2A2F38',
        opacity: 0.8,
    },
    iconContainer: {
        position: 'relative',
        marginRight: 12,
    },
    transactionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(139, 152, 165, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    assetImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    swapIconContainer: {
        width: 56,
        height: 48,
        position: 'relative',
    },
    swapIconLeft: {
        width: 36,
        height: 36,
        borderRadius: 18,
        position: 'absolute',
        left: 0,
        top: 6,
        backgroundColor: '#222327',
        borderWidth: 2,
        borderColor: '#222327',
        overflow: 'hidden',
    },
    swapIconRight: {
        width: 36,
        height: 36,
        borderRadius: 18,
        position: 'absolute',
        right: 0,
        top: 6,
        backgroundColor: '#222327',
        borderWidth: 2,
        borderColor: '#222327',
        overflow: 'hidden',
    },
    swapTokenImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    swapTokenPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ffda34',
        justifyContent: 'center',
        alignItems: 'center',
    },
    swapTokenPlaceholderText: {
        color: '#121315',
        fontSize: 14,
        fontWeight: '700',
    },
    statusBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#222327',
    },
    successBadge: {
        backgroundColor: '#10B981',
    },
    failedBadge: {
        backgroundColor: '#EF4444',
    },
    successCircle: {
        backgroundColor: '#10B981',
    },
    failedCircle: {
        backgroundColor: '#EF4444',
    },
    transactionDetails: {
        flex: 1,
    },
    transactionName: {
        color: 'white',
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 3,
    },
    transactionDate: {
        color: '#8B98A5',
        fontSize: 12,
    },
    transactionRight: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 3,
    },
    transactionAmountNegative: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 3,
    },
    transactionValue: {
        color: '#8B98A5',
        fontSize: 12,
    },
    transactionTime: {
        color: '#8B98A5',
        fontSize: 12,
        marginTop: 3,
    },
    skeletonContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    skeletonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222327',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
    },
    skeletonContent: {
        flex: 1,
        marginLeft: 12,
    },
    skeletonRight: {
        alignItems: 'flex-end',
    },
    errorContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#ffda34',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#121315',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        color: '#8B98A5',
        fontSize: 14,
        marginTop: 8,
    },
    filterMenu: {
        backgroundColor: '#222327',
        marginHorizontal: 20,
        marginTop: 8,
        borderRadius: 12,
        padding: 12,
    },
    filterSection: {
        marginBottom: 8,
    },
    filterLabel: {
        color: '#8B98A5',
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#121315',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    filterChipActive: {
        backgroundColor: '#ffda34',
        borderColor: '#ffda34',
    },
    filterChipText: {
        color: '#8B98A5',
        fontSize: 11,
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#121315',
    },
    filterDivider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: 8,
    },
    filterToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    filterToggleText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    toggle: {
        width: 40,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#121315',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingHorizontal: 2,
    },
    toggleActive: {
        backgroundColor: '#ffda34',
        alignItems: 'flex-end',
    },
    toggleDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#ffda34',
    },
    toggleDotActive: {
        backgroundColor: '#121315',
    },
})

export default Activities
