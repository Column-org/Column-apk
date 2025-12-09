import React, { useRef } from 'react'
import { View, StyleSheet, PanResponder } from 'react-native'
import { useRouter, usePathname } from 'expo-router'

const TAB_ORDER = ['/(tabs)/home', '/(tabs)/nft', '/(tabs)/activities', '/(tabs)/settings']

export const SwipeableTabWrapper = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter()
    const pathname = usePathname()

    const getCurrentTabIndex = () => {
        const currentTab = TAB_ORDER.find(tab => pathname.includes(tab.split('/').pop() || ''))
        return currentTab ? TAB_ORDER.indexOf(currentTab) : 0
    }

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                // Only activate for swipes that start from the edge of the screen (first 50px or last 50px)
                const touchX = evt.nativeEvent.pageX
                const screenWidth = 400 // Approximate, can use Dimensions.get('window').width
                const isFromEdge = touchX < 50 || touchX > screenWidth - 50

                // Only activate for large horizontal swipes
                const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 3
                const isLargeSwipe = Math.abs(gestureState.dx) > 150

                return isFromEdge && isHorizontal && isLargeSwipe
            },
            onPanResponderTerminationRequest: () => true,
            onPanResponderRelease: (_, gestureState) => {
                const currentIndex = getCurrentTabIndex()

                // Swipe left (next tab) - require 200px swipe
                if (gestureState.dx < -200 && currentIndex < TAB_ORDER.length - 1) {
                    router.push(TAB_ORDER[currentIndex + 1])
                }
                // Swipe right (previous tab) - require 200px swipe
                else if (gestureState.dx > 200 && currentIndex > 0) {
                    router.push(TAB_ORDER[currentIndex - 1])
                }
            },
        })
    ).current

    return (
        <View style={styles.container} {...panResponder.panHandlers}>
            {children}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
})
