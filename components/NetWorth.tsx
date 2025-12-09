import React, { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { usePrivy } from '@privy-io/expo'
import { getFungibleAssets, formatAssetBalance } from '../services/movementAssets'
import { useNetwork } from '../context/NetworkContext'
import { getMovePrice } from '../services/pythOracle'
import { useBalanceVisibility } from '../context/BalanceVisibilityContext'
import { SkeletonLoader } from './SkeletonLoader'

interface NetWorthProps {
    refreshKey?: number
}

export const NetWorth = ({ refreshKey }: NetWorthProps) => {
    const { user } = usePrivy()
    const { network } = useNetwork()
    const { isHidden, toggleVisibility } = useBalanceVisibility()
    const [totalValue, setTotalValue] = useState<number>(0)
    const [displayValue, setDisplayValue] = useState<number>(0)
    const [change24h, setChange24h] = useState<{ amount: number; percentage: number }>({ amount: 0, percentage: 0 })
    const [isLoading, setIsLoading] = useState(true)
    const animatedValue = useRef(new Animated.Value(0)).current

    // Get Movement wallet address from Privy
    const movementWallet = user?.linked_accounts?.find(
        (account: any) => account.type === 'wallet' && account.chain_type === 'aptos'
    ) as any
    const walletAddress = movementWallet?.address

    const calculateNetWorth = useCallback(async () => {
        if (!walletAddress) {
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        try {
            const [assets, movePriceData] = await Promise.all([
                getFungibleAssets(walletAddress, network),
                getMovePrice()
            ])

            let totalUsdValue = 0

            // Calculate total value from all assets
            for (const asset of assets) {
                // Check if this is MOVE token (by asset type OR by name/symbol)
                const isMoveToken =
                    asset.asset_type === '0x1::aptos_coin::AptosCoin' ||
                    asset.metadata.symbol?.toUpperCase() === 'MOVE' ||
                    asset.metadata.name?.toLowerCase() === 'move coin' ||
                    asset.metadata.name?.toLowerCase() === 'movement'

                if (isMoveToken && movePriceData) {
                    // MOVE token - use CoinGecko price
                    const balance = parseFloat(formatAssetBalance(asset.amount, asset.metadata.decimals).replace(/,/g, ''))
                    totalUsdValue += balance * movePriceData.price
                }
                // Add other token price calculations here when needed
            }

            setTotalValue(totalUsdValue)

            // No 24h change data from Pyth (would need historical data)
            setChange24h({
                amount: 0,
                percentage: 0
            })
        } catch (error) {
            console.error('Error calculating net worth:', error)
        } finally {
            setIsLoading(false)
        }
    }, [walletAddress, network])

    useEffect(() => {
        calculateNetWorth()
    }, [calculateNetWorth])

    // Refresh when refreshKey changes (from pull-to-refresh)
    useEffect(() => {
        if (refreshKey && refreshKey > 0) {
            calculateNetWorth()
        }
    }, [refreshKey, calculateNetWorth])

    // Animate the value from current display to new total
    useEffect(() => {
        if (!isLoading && totalValue !== displayValue) {
            const startValue = displayValue
            const endValue = totalValue

            animatedValue.setValue(0)

            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 800,
                useNativeDriver: false,
            }).start()

            const listenerId = animatedValue.addListener(({ value }) => {
                const interpolatedValue = startValue + (endValue - startValue) * value
                setDisplayValue(interpolatedValue)
            })

            return () => {
                animatedValue.removeListener(listenerId)
            }
        }
    }, [totalValue, isLoading])

    const isPositive = change24h.percentage >= 0

    if (isLoading) {
        return (
            <View style={styles.netWorthSection}>
                <SkeletonLoader width={280} height={60} style={{ marginBottom: 12 }} />
                <SkeletonLoader width={140} height={14} />
            </View>
        )
    }

    return (
        <Pressable onLongPress={toggleVisibility} style={styles.netWorthSection}>
            <Text style={styles.netWorthAmount} selectable={false}>
                {isHidden ? '••••••' : `$${displayValue.toFixed(2)}`}
            </Text>
            <Text style={[styles.netWorthChange, !isPositive && styles.netWorthChangeNegative]} selectable={false}>
                {isHidden ? '••••' : `$${Math.abs(change24h.amount).toFixed(2)} ${isPositive ? '+' : '-'}${Math.abs(change24h.percentage).toFixed(2)}%`}
            </Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    netWorthSection: {
        alignItems: 'flex-start',
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    netWorthAmount: {
        color: 'white',
        fontSize: 60,
        fontWeight: '700',
        letterSpacing: -1,
        marginBottom: 6,
        ...Platform.select({
            ios: {
                fontFamily: 'System',
            },
            android: {
                fontFamily: 'sans-serif',
            },
        }),
    },
    netWorthChange: {
        color: '#ffda34',
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 0.2,
        ...Platform.select({
            ios: {
                fontFamily: 'System',
            },
            android: {
                fontFamily: 'sans-serif',
            },
        }),
    },
    netWorthChangeNegative: {
        color: '#EF4444',
    },
})
