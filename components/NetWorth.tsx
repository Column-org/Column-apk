import React, { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useWallet } from '../context/WalletContext'
import { getFungibleAssets, formatAssetBalance } from '../services/movementAssets'
import { useNetwork } from '../context/NetworkContext'
import { getMovePrice } from '../services/pythOracle'
import { useBalanceVisibility } from '../context/BalanceVisibilityContext'
import { SkeletonLoader } from './SkeletonLoader'
import { useAssets } from '../hooks/useAssets'

interface NetWorthProps {
    refreshKey?: number
}

export const NetWorth = ({ refreshKey }: NetWorthProps) => {
    const { isHidden, toggleVisibility } = useBalanceVisibility()
    const { assets, movePrice, isLoading } = useAssets(refreshKey)
    const [totalValue, setTotalValue] = useState<number>(0)
    const [displayValue, setDisplayValue] = useState<number>(0)
    const [change24h, setChange24h] = useState<{ amount: number; percentage: number }>({ amount: 0, percentage: 0 })
    const animatedValue = useRef(new Animated.Value(0)).current

    useEffect(() => {
        if (!assets || assets.length === 0) {
            setTotalValue(0)
            return
        }

        let totalUsdValue = 0

        for (const asset of assets) {
            const isMoveToken =
                asset.asset_type === '0x1::aptos_coin::AptosCoin' ||
                asset.metadata.symbol?.toUpperCase() === 'MOVE' ||
                asset.metadata.name?.toLowerCase() === 'move coin' ||
                asset.metadata.name?.toLowerCase() === 'movement'

            if (isMoveToken && movePrice) {
                const balance = parseFloat(formatAssetBalance(asset.amount, asset.metadata.decimals).replace(/,/g, ''))
                totalUsdValue += balance * movePrice.price
            }
        }

        setTotalValue(totalUsdValue)

        if (movePrice?.priceChange24h) {
            // For now, only MOVE contributes to 24h change
            const moveBalance = assets
                .filter((a: any) => a.metadata.symbol?.toUpperCase() === 'MOVE')
                .reduce((acc: number, a: any) => acc + parseFloat(formatAssetBalance(a.amount, a.metadata.decimals).replace(/,/g, '')), 0)

            const oldPrice = movePrice.price / (1 + movePrice.priceChange24h / 100)
            const changeAmount = (movePrice.price - oldPrice) * moveBalance
            setChange24h({
                amount: changeAmount,
                percentage: movePrice.priceChange24h
            })
        }
    }, [assets, movePrice])

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
