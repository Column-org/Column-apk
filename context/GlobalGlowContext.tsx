import React, { createContext, useContext, useRef, useState, useCallback } from 'react'
import { Animated, View, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { usePreferences } from './PreferencesContext'

type GlowColor = 'positive' | 'negative'

interface GlobalGlowContextType {
    triggerGlow: (type: GlowColor) => void
}

const GlobalGlowContext = createContext<GlobalGlowContextType | undefined>(undefined)

const hexToRgba = (hex: string, alpha: number) => {
    try {
        let r = 0, g = 0, b = 0
        const sanitizedHex = hex.startsWith('#') ? hex : `#${hex}`

        if (sanitizedHex.length === 4) {
            r = parseInt(sanitizedHex[1] + sanitizedHex[1], 16)
            g = parseInt(sanitizedHex[2] + sanitizedHex[2], 16)
            b = parseInt(sanitizedHex[3] + sanitizedHex[3], 16)
        } else if (sanitizedHex.length === 7) {
            r = parseInt(sanitizedHex.substring(1, 3), 16)
            g = parseInt(sanitizedHex.substring(3, 5), 16)
            b = parseInt(sanitizedHex.substring(5, 7), 16)
        }

        if (isNaN(r) || isNaN(g) || isNaN(b)) throw new Error('Invalid color')
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
    } catch (e) {
        return `rgba(255, 255, 255, ${alpha})`
    }
}

export const GlobalGlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const {
        isPnlGlowEnabled,
        pnlGlowPulseCount,
        pnlGlowBlurSize,
        pnlGlowColorPositive,
        pnlGlowColorNegative
    } = usePreferences()

    const animatedValue = useRef(new Animated.Value(0)).current
    const [glowType, setGlowType] = useState<GlowColor>('positive')

    const triggerGlow = useCallback((type: GlowColor) => {
        if (!isPnlGlowEnabled) return

        setGlowType(type)

        const animations: Animated.CompositeAnimation[] = []

        if (pnlGlowPulseCount === 1) {
            animations.push(
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: false
                }),
                Animated.delay(2000),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: false
                })
            )
        } else {
            for (let i = 0; i < pnlGlowPulseCount; i++) {
                animations.push(
                    Animated.timing(animatedValue, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: false
                    }),
                    Animated.timing(animatedValue, {
                        toValue: 0.2,
                        duration: 400,
                        useNativeDriver: false
                    })
                )
            }
            animations.push(
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: false
                })
            )
        }

        Animated.sequence(animations).start()
    }, [isPnlGlowEnabled, pnlGlowPulseCount])

    const baseColor = glowType === 'positive' ? pnlGlowColorPositive : pnlGlowColorNegative

    // Fixed intensity now that it's removed from settings
    const intensity = 0.6

    // Using a more complex color stop array to make the falloff smoother and less "boxy"
    const gradientColors = [
        hexToRgba(baseColor, intensity),
        hexToRgba(baseColor, intensity * 0.4),
        hexToRgba(baseColor, intensity * 0.1),
        'transparent'
    ] as const

    const reverseGradientColors = [...gradientColors].reverse() as any

    return (
        <GlobalGlowContext.Provider value={{ triggerGlow }}>
            <View style={{ flex: 1 }}>
                {children}
                <Animated.View
                    style={[
                        styles.glowContainer,
                        { opacity: animatedValue }
                    ]}
                    pointerEvents="none"
                >
                    {/* Vertical Glow (Top & Bottom) */}
                    <View style={StyleSheet.absoluteFill}>
                        <LinearGradient
                            colors={gradientColors}
                            style={{ height: pnlGlowBlurSize, width: '100%' }}
                        />
                        <View style={{ flex: 1 }} />
                        <LinearGradient
                            colors={reverseGradientColors}
                            style={{ height: pnlGlowBlurSize, width: '100%' }}
                        />
                    </View>

                    {/* Horizontal Glow (Left & Right) */}
                    <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
                        <LinearGradient
                            colors={gradientColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ width: pnlGlowBlurSize, height: '100%' }}
                        />
                        <View style={{ flex: 1 }} />
                        <LinearGradient
                            colors={reverseGradientColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ width: pnlGlowBlurSize, height: '100%' }}
                        />
                    </View>
                </Animated.View>
            </View>
        </GlobalGlowContext.Provider>
    )
}

export const useGlobalGlow = () => {
    const context = useContext(GlobalGlowContext)
    if (!context) {
        throw new Error('useGlobalGlow must be used within GlobalGlowProvider')
    }
    return context
}

const styles = StyleSheet.create({
    glowContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
    },
})
