import React, { useEffect, useMemo, useRef } from 'react'
import { View, StyleSheet, Animated, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAssets } from '../hooks/useAssets'
import { SYMBOL_TO_ID } from '../services/coinGecko'
import { formatAssetBalance } from '../services/movementAssets'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

/**
 * Portfolio Aura: A dynamic, animated background that reflects your wealth's composition.
 * Lime Green = Native (MOVE)
 * Electric Blue = Stability (Stables)
 * Purple = Ecosystem (Others)
 */
export const AuraBackground = () => {
    const { assets, prices, isLoading } = useAssets()
    const pulseAnim = useRef(new Animated.Value(0)).current

    // Calculate colors based on portfolio dominant assets
    const auraColors = useMemo(() => {
        if (!assets || assets.length === 0 || isLoading) {
            return ['#121315', '#1A1F28'] as const // Default dark
        }

        let moveValue = 0
        let stableValue = 0
        let otherValue = 0

        assets.forEach(asset => {
            const symbol = asset.metadata.symbol.toUpperCase()
            const cgId = SYMBOL_TO_ID[symbol]
            const priceData = cgId ? prices[cgId] : null
            const balance = parseFloat(formatAssetBalance(asset.amount, asset.metadata.decimals).replace(/,/g, ''))
            const usdValue = balance * (priceData?.usd || 0)

            if (symbol === 'MOVE' || symbol === 'MOVEMENT') moveValue += usdValue
            else if (symbol.includes('USD')) stableValue += usdValue
            else otherValue += usdValue
        })

        const total = moveValue + stableValue + otherValue
        if (total === 0) return ['#121315', '#1A1F28'] as const

        // Ratio-based color mixing
        const moveRatio = moveValue / total
        const stableRatio = stableValue / total
        const otherRatio = otherValue / total

        // Define base aesthetic colors
        // Native MOVE: #00FFA3 (Lime/Cyan)
        // Stables: #0085FF (Electric Blue)
        // Others: #A855F7 (Purple)

        // We'll blend these based on ratios
        // For a more sophisticated look, we use them as key colors in a gradient
        const colors = []
        if (moveRatio > 0.3) colors.push('rgba(0, 255, 163, 0.08)')
        if (stableRatio > 0.3) colors.push('rgba(0, 133, 255, 0.08)')
        if (otherRatio > 0.3) colors.push('rgba(168, 85, 247, 0.08)')

        // Ensure we always have 2 colors for the gradient
        if (colors.length === 0) return ['rgba(255, 218, 52, 0.03)', 'rgba(18, 19, 21, 0)'] as const
        if (colors.length === 1) return [colors[0], 'rgba(18, 19, 21, 0)'] as const

        return colors as unknown as readonly [string, string, ...string[]]
    }, [assets, prices, isLoading])

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 8000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0,
                    duration: 8000,
                    useNativeDriver: true,
                })
            ])
        ).start()
    }, [])

    const animatedStyle = {
        opacity: pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.7]
        }),
        transform: [{
            scale: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.2]
            })
        }, {
            rotate: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '15deg']
            })
        }]
    }

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Animated.View style={[styles.auraContainer, animatedStyle]}>
                <LinearGradient
                    colors={auraColors}
                    start={{ x: 0.0, y: 0.0 }}
                    end={{ x: 1.0, y: 1.0 }}
                    style={styles.gradient}
                />
            </Animated.View>
            <View style={styles.vignette} />
        </View>
    )
}

const styles = StyleSheet.create({
    auraContainer: {
        position: 'absolute',
        top: -SCREEN_HEIGHT * 0.2,
        left: -SCREEN_WIDTH * 0.2,
        width: SCREEN_WIDTH * 1.4,
        height: SCREEN_HEIGHT * 1.4,
    },
    gradient: {
        flex: 1,
        borderRadius: SCREEN_HEIGHT,
    },
    vignette: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(18, 19, 21, 0.2)', // Subtle darken
    }
})
