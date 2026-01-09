import { View, ScrollView, StyleSheet, StatusBar, ImageBackground, Animated, RefreshControl, Dimensions } from 'react-native'
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Header } from '../../components/Header'
import { NetWorth } from '../../components/NetWorth'
import { ActionButtons } from '../../components/ActionButtons'
import { TokenList } from '../../components/TokenList'
import { NFTList } from '../../components/NFTList'
import PendingClaimsIndicator from '../../components/PendingClaimsIndicator'
import { useTheme } from '../../hooks/useTheme'
import { useNetwork } from '../../context/NetworkContext'
import { usePreferences } from '../../context/PreferencesContext'
import { fetchPendingClaims, getPendingClaimsCount } from '../../services/pendingClaims'
import { useFocusEffect } from 'expo-router'
import { usePrivy } from '@privy-io/expo'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

const Home = () => {
    const scrollY = useRef(new Animated.Value(0)).current
    const scaleAnim = useRef(new Animated.Value(1)).current
    const { getThemeImage } = useTheme()
    const { network } = useNetwork()
    const { user } = usePrivy()
    const { isNFTCollectionEnabled } = usePreferences()
    const [refreshing, setRefreshing] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const [pendingClaimsCount, setPendingClaimsCount] = useState(0)
    const tokenListRefreshRef = useRef<(() => void) | null>(null)

    const movementWallets = useMemo(() => {
        if (!user?.linked_accounts) return []
        return user.linked_accounts.filter(
            (account: any) => account.type === 'wallet' && account.chain_type === 'aptos'
        )
    }, [user?.linked_accounts])

    const walletAddress = (movementWallets[0] as any)?.address || ''

    const loadPendingClaims = useCallback(async () => {
        if (!walletAddress) return
        try {
            await fetchPendingClaims(walletAddress, network)
            const count = await getPendingClaimsCount(walletAddress, network)
            setPendingClaimsCount(count)
        } catch (error) {
            console.warn('Failed to load pending claims count', error)
            try {
                const fallbackCount = await getPendingClaimsCount(walletAddress, network)
                setPendingClaimsCount(fallbackCount)
            } catch {
                setPendingClaimsCount(0)
            }
        }
    }, [network, walletAddress])

    const onRefresh = async () => {
        setRefreshing(true)
        // Trigger refresh by updating refresh key and calling TokenList refresh
        setRefreshKey(prev => prev + 1)
        if (tokenListRefreshRef.current) {
            tokenListRefreshRef.current()
        }
        // Keep refreshing state for at least 1 second for better UX
        setTimeout(() => {
            setRefreshing(false)
        }, 1000)
    }

    useEffect(() => {
        loadPendingClaims()
    }, [loadPendingClaims, refreshKey])

    useFocusEffect(
        useCallback(() => {
            let isActive = true
            const run = async () => {
                if (!isActive) return
                await loadPendingClaims()
            }
            run()
            return () => {
                isActive = false
            }
        }, [loadPendingClaims])
    )

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    })

    const handleModalStateChange = (isOpen: boolean) => {
        Animated.timing(scaleAnim, {
            toValue: isOpen ? 0.95 : 1,
            duration: 300,
            useNativeDriver: true,
        }).start()
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#121315" />

            <Animated.View style={[
                styles.contentWrapper,
                {
                    transform: [{ scale: scaleAnim }],
                }
            ]}>
                {/* Sticky Header with Gradient */}
                <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
                    <LinearGradient
                        colors={['#121315', 'rgba(15, 20, 25, 0.95)', 'rgba(15, 20, 25, 0)']}
                        style={styles.headerGradient}
                    />
                </Animated.View>

                <View style={styles.stickyHeaderContent}>
                    <Header onModalStateChange={handleModalStateChange} />
                </View>

                <Animated.ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollViewContent}
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews={true}
                    overScrollMode="never"
                    alwaysBounceVertical={true}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )}
                    scrollEventThrottle={16}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#ffda34"
                            colors={["#ffda34"]}
                        />
                    }
                >
                    {/* Background Image Section */}
                    {getThemeImage() ? (
                        <ImageBackground
                            source={getThemeImage()}
                            style={styles.backgroundImageContainer}
                            imageStyle={styles.backgroundImage}
                        >
                            {/* Dark Gradient Overlay at Bottom */}
                            <LinearGradient
                                colors={['transparent', 'rgba(15, 20, 25, 0.5)', '#121315']}
                                style={styles.gradientOverlay}
                                locations={[0, 0.6, 1]}
                            />

                            <View style={styles.headerSpacer} />
                            <NetWorth refreshKey={refreshKey} />
                        </ImageBackground>
                    ) : (
                        <View style={styles.backgroundImageContainer}>
                            <View style={styles.headerSpacer} />
                            <NetWorth refreshKey={refreshKey} />
                        </View>
                    )}

                    <ActionButtons />

                    {/* Pending Claims Indicator */}
                    <PendingClaimsIndicator count={pendingClaimsCount} />

                    <TokenList refreshKey={refreshKey} onRefreshRef={(refreshFn) => { tokenListRefreshRef.current = refreshFn }} />

                    {/* NFT Collection Section */}
                    {isNFTCollectionEnabled && <NFTList walletAddress={walletAddress} />}

                    <View style={{ height: 20 }} />
                </Animated.ScrollView>
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121315',
    },
    contentWrapper: {
        flex: 1,
    },
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        height: IS_SMALL_SCREEN ? 70 : 100,
    },
    headerGradient: {
        flex: 1,
    },
    stickyHeaderContent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 11,
    },
    headerSpacer: {
        height: IS_SMALL_SCREEN ? 80 : 120,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
        minHeight: '110%',
    },
    backgroundImageContainer: {
        width: '100%',
    },
    backgroundImage: {
        opacity: 0.3,
        resizeMode: 'cover',
    },
    gradientOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '50%',
    },
})

export default Home