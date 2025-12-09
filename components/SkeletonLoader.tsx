import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated } from 'react-native'

interface SkeletonLoaderProps {
    width?: number | string
    height?: number
    borderRadius?: number
    style?: object
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style,
}) => {
    const opacity = useRef(new Animated.Value(0.3)).current

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start()
    }, [opacity])

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                    opacity,
                },
                style,
            ]}
        />
    )
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#2A2F38',
    },
})
