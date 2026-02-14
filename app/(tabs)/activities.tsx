import { View, Text, StyleSheet, StatusBar, RefreshControl, TouchableOpacity, Animated, Dimensions } from 'react-native'
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import { useWallet } from '../../context/WalletContext'
import { SwipeableTabWrapper } from '../../components/SwipeableTabWrapper'
import { useNetwork } from '../../context/NetworkContext'
import { getTransactionHistory, Transaction, getCachedTransactions } from '../../services/movement_service/transactionHistory'
import { TransactionItem } from '../../components/activities/TransactionItem'
import { ActivityFilter } from '../../components/activities/ActivityFilter'
import { ActivityEmptyState } from '../../components/activities/ActivityEmptyState'
import { ActivitySkeleton } from '../../components/activities/ActivitySkeleton'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

import { useTransactions } from '../../hooks/useTransactions'

const Activities = () => {
    const { t } = useTranslation()
    const { address: walletAddress } = useWallet()
    const { network } = useNetwork()
    const router = useRouter()

    const { transactions, isLoading, error: fetchError, refetch } = useTransactions()
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [filterType, setFilterType] = useState<'all' | 'send' | 'receive' | 'swap' | 'contract'>('all')
    const [hideFailedTx, setHideFailedTx] = useState(false)
    const [showFilterMenu, setShowFilterMenu] = useState(false)
    const scrollY = useRef(new Animated.Value(0)).current

    useEffect(() => {

        if (fetchError) setError(fetchError)
    }, [fetchError])

    const fetchTransactions = useCallback(async (showRefresh = false) => {
        if (showRefresh) {
            setIsRefreshing(true)
            await refetch()
            setIsRefreshing(false)
        } else {
            await refetch()
        }
    }, [refetch])


    useEffect(() => {
        // Only fetch if we don't have transactions yet
        if (transactions.length === 0) {
            fetchTransactions()
        }
    }, [fetchTransactions, transactions.length])

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

    const handleTransactionPress = (tx: Transaction) => {
        router.push({
            pathname: '/transactionDetails',
            params: { transaction: JSON.stringify(tx) }
        })
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
                    <ActivityFilter
                        filterType={filterType}
                        setFilterType={setFilterType}
                        hideFailedTx={hideFailedTx}
                        setHideFailedTx={setHideFailedTx}
                    />
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
                        <ActivitySkeleton />
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
                        <ActivityEmptyState />
                    )}

                    {!isLoading && !error && Object.entries(groupedTransactions).map(([dateKey, txs]: [string, any]) => (
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
                            {txs.map((tx: Transaction) => (
                                <TransactionItem
                                    key={tx.hash}
                                    tx={tx}
                                    onPress={() => handleTransactionPress(tx)}
                                />
                            ))}
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
})

export default Activities
