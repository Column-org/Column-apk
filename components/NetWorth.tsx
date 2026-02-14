import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatAssetBalance } from '../services/movementAssets'
import { useBalanceVisibility } from '../context/BalanceVisibilityContext'
import { SkeletonLoader } from './SkeletonLoader'
import { useAssets } from '../hooks/useAssets'
import { SYMBOL_TO_ID } from '../services/coinGecko'

interface NetWorthProps {
    refreshKey?: number
}

export const NetWorth = ({ refreshKey }: NetWorthProps) => {
    const { isHidden, toggleVisibility } = useBalanceVisibility()
    const { assets, prices, isLoading } = useAssets(refreshKey)
    const [totalValue, setTotalValue] = useState<number>(0)
    const [displayValue, setDisplayValue] = useState<number>(0)
    const [change24h, setChange24h] = useState<{ amount: number; percentage: number }>({ amount: 0, percentage: 0 })
    const animatedValue = useRef(new Animated.Value(0)).current

    useEffect(() => {
        if (!assets || assets.length === 0) {
            setTotalValue(0)
            setChange24h({ amount: 0, percentage: 0 })
            return
        }

        let totalUsdValue = 0
        let totalOldUsdValue = 0

        for (const asset of assets) {
            const cgId = SYMBOL_TO_ID[asset.metadata.symbol.toUpperCase()]
            const priceData = cgId ? prices[cgId] : null

            if (priceData) {
                const balance = parseFloat(formatAssetBalance(asset.amount, asset.metadata.decimals).replace(/,/g, ''))
                const currentVal = balance * priceData.usd
                totalUsdValue += currentVal

                const oldPrice = priceData.usd / (1 + (priceData.usd_24h_change || 0) / 100)
                totalOldUsdValue += balance * oldPrice
            }
        }

        setTotalValue(totalUsdValue)

        const totalChangeAmount = totalUsdValue - totalOldUsdValue
        const totalChangePercentage = totalOldUsdValue > 0
            ? (totalChangeAmount / totalOldUsdValue) * 100
            : 0

        setChange24h({
            amount: totalChangeAmount,
            percentage: totalChangePercentage
        })
    }, [assets, prices])

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
        </Pressable>
    )
}

const styles = StyleSheet.create({
    netWorthSection: {
        alignItems: 'flex-start',
        paddingTop: 30,
        paddingBottom: 15,
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
