import React, { useMemo } from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAssets } from '../hooks/useAssets'
import { useGlobalGlow } from '../context/GlobalGlowContext'
import { usePreferences } from '../context/PreferencesContext'
import { SYMBOL_TO_ID } from '../services/coinGecko'
import { formatAssetBalance } from '../services/movementAssets'
import { useBalanceVisibility } from '../context/BalanceVisibilityContext'

// Persistent session flag to prevent re-triggering on tab switches
let hasTriggeredThisSessionGlobal = false

export const PNLSummary = () => {
    const { isHidden } = useBalanceVisibility()
    const { assets, prices, isLoading } = useAssets()
    const { triggerGlow } = useGlobalGlow()
    const { pnlGlowFrequency, lastPnlGlowShown, setLastPnlGlowShown } = usePreferences()

    const pnlData = useMemo(() => {
        if (!assets || assets.length === 0 || !prices) {
            return { amount: 0, percentage: 0 }
        }

        let totalUsdValue = 0
        let totalOldUsdValue = 0

        for (const asset of assets) {
            const symbol = asset.metadata.symbol.toUpperCase()
            const cgId = SYMBOL_TO_ID[symbol]
            const priceData = cgId ? prices[cgId] : null

            if (priceData) {
                const balance = parseFloat(formatAssetBalance(asset.amount, asset.metadata.decimals).replace(/,/g, ''))
                const currentVal = balance * priceData.usd
                totalUsdValue += currentVal

                const oldPrice = priceData.usd / (1 + (priceData.usd_24h_change || 0) / 100)
                totalOldUsdValue += balance * oldPrice
            }
        }

        const amount = totalUsdValue - totalOldUsdValue
        const percentage = totalOldUsdValue > 0 ? (amount / totalOldUsdValue) * 100 : 0

        return { amount, percentage }
    }, [assets, prices])

    const lastLoadingRef = React.useRef(isLoading)

    React.useEffect(() => {
        // Condition: Transitions from loading to NOT loading.
        // Also allow the very first load of the app session even if cached.
        const justFinished = !isLoading && lastLoadingRef.current
        const isInitialSessionLoad = !isLoading && !hasTriggeredThisSessionGlobal

        if ((justFinished || isInitialSessionLoad) && pnlData.amount !== 0) {
            const now = Date.now()
            const oneDayInMs = 24 * 60 * 60 * 1000

            const isTimeToShow = pnlGlowFrequency === 'always' || (now - lastPnlGlowShown > oneDayInMs)

            if (isTimeToShow) {
                triggerGlow(pnlData.amount > 0 ? 'positive' : 'negative')
                hasTriggeredThisSessionGlobal = true

                // Only write back to global state if we are in daily mode
                if (pnlGlowFrequency === 'daily') {
                    setLastPnlGlowShown(now)
                }
            }
        }
        lastLoadingRef.current = isLoading
    }, [isLoading, triggerGlow, pnlGlowFrequency, lastPnlGlowShown, pnlData.amount, setLastPnlGlowShown])

    if (isLoading) return null

    const isPositive = pnlData.amount >= 0

    return (
        <View style={styles.container}>
            <View style={styles.pnlCard}>
                <View style={styles.pnlHeader}>
                    <Text style={styles.pnlTitle}>24h Profit & Loss</Text>
                    <Ionicons
                        name={isPositive ? "trending-up" : "trending-down"}
                        size={14}
                        color={isPositive ? "#ffda34" : "#EF4444"}
                    />
                </View>
                <View style={styles.pnlContent}>
                    <Text style={[styles.pnlAmount, !isPositive && styles.pnlAmountNegative]}>
                        {isHidden ? '••••' : `${isPositive ? '+' : '-'}$${Math.abs(pnlData.amount).toFixed(2)}`}
                    </Text>
                    <View style={isPositive ? styles.badgePositive : styles.badgeNegative}>
                        <Text style={[styles.badgeText, isPositive ? styles.badgeTextPositive : styles.badgeTextNegative]}>
                            {isPositive ? '+' : ''}{pnlData.percentage.toFixed(2)}%
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginBottom: 5,
    },
    pnlCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    pnlHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    pnlTitle: {
        color: '#8B98A5',
        fontSize: 10,
        fontWeight: '500',
    },
    pnlContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pnlAmount: {
        color: '#ffda34',
        fontSize: 18,
        fontWeight: '700',
    },
    pnlAmountNegative: {
        color: '#EF4444',
    },
    badgePositive: {
        backgroundColor: 'rgba(255, 218, 52, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    badgeNegative: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    badgeTextPositive: {
        color: '#ffda34',
    },
    badgeTextNegative: {
        color: '#EF4444',
    },
})
