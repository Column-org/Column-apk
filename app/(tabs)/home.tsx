import { View, ScrollView, StyleSheet, StatusBar, Animated, RefreshControl, Dimensions, Image, TouchableOpacity, Pressable, Text, PanResponder } from 'react-native'
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Header } from '../../components/Header'
import { Ionicons } from '@expo/vector-icons'
import { NetWorth } from '../../components/NetWorth'
import { ActionButtons } from '../../components/ActionButtons'
import { PortfolioTabs } from '../../components/PortfolioTabs'
import { TokenList } from '../../components/TokenList'
import { NFTList } from '../../components/NFTList'
import { PNLSummary } from '../../components/PNLSummary'
import { useTheme } from '../../hooks/useTheme'
import { useNetwork } from '../../context/NetworkContext'
import { usePreferences } from '../../context/PreferencesContext'
import { useWallet } from '../../context/WalletContext'
import { fetchPendingClaims, getPendingClaimsCount } from '../../services/pendingClaims'
import { getFungibleAssets, formatAssetBalance, FungibleAsset } from '../../services/movementAssets'
import { useFocusEffect } from 'expo-router'
import { useAssets } from '../../hooks/useAssets'
import { useSecurity } from '../../context/SecurityContext'
import { SYMBOL_TO_ID } from '../../services/coinGecko'
import { useRouter } from 'expo-router'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

const NotificationStack = ({ pendingClaimsCount }: { pendingClaimsCount: number }) => {
    const { isPasscodeSet, isBiometricEnabled } = useSecurity()
    const [securityDismissed, setSecurityDismissed] = useState(false)
    const [claimsDismissed, setClaimsDismissed] = useState(false)
    const router = useRouter()

    const alerts = useMemo(() => {
        const list = []
        if (!isPasscodeSet && !securityDismissed) {
            list.push({
                id: 'security',
                title: 'Secure Your Wallet',
                subtitle: 'Set a passcode and enable biometrics to protect your assets.',
                icon: 'shield-checkmark',
                onPress: () => router.push('/settings'),
                onDismiss: () => setSecurityDismissed(true)
            })
        }
        if (pendingClaimsCount > 0 && !claimsDismissed) {
            list.push({
                id: 'claims',
                title: 'Pending Claims',
                subtitle: `You have ${pendingClaimsCount} claims waiting for you.`,
                icon: 'time-outline',
                onPress: () => router.push('/pendingClaims'),
                onDismiss: () => setClaimsDismissed(true)
            })
        }
        return list
    }, [isPasscodeSet, isBiometricEnabled, securityDismissed, pendingClaimsCount, claimsDismissed, router])

    const translateX = useRef(new Animated.Value(0)).current
    const opacity = useRef(new Animated.Value(1)).current

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 10
            },
            onPanResponderMove: (_, gestureState) => {
                translateX.setValue(gestureState.dx)
            },
            onPanResponderRelease: (_, gestureState) => {
                const topAlert = alerts[0]
                if (Math.abs(gestureState.dx) > 120 || Math.abs(gestureState.vx) > 0.8) {
                    const toValue = gestureState.dx > 0 ? 500 : -500
                    Animated.parallel([
                        Animated.timing(translateX, {
                            toValue,
                            duration: 250,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacity, {
                            toValue: 0,
                            duration: 250,
                            useNativeDriver: true,
                        }),
                    ]).start(() => {
                        if (topAlert.onDismiss) topAlert.onDismiss()
                        translateX.setValue(0)
                        opacity.setValue(1)
                    })
                } else {
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                        friction: 8,
                        tension: 40,
                    }).start()
                }
            },
        })
    ).current

    if (alerts.length === 0) return null

    const topAlert = alerts[0]

    return (
        <View style={styles.alertStackContainer}>
            {/* Background elements to create "stack" effect */}
            {alerts.length > 1 && <View style={styles.stackCardBehind} />}
            {alerts.length > 2 && <View style={styles.stackCardBehind2} />}

            <Animated.View
                style={{
                    opacity,
                    transform: [{ translateX }],
                    zIndex: 10,
                }}
                {...panResponder.panHandlers}
            >
                <TouchableOpacity
                    style={styles.alertCard}
                    activeOpacity={0.8}
                    onPress={topAlert.onPress}
                >
                    <View style={styles.alertContent}>
                        <View style={styles.alertIconContainer}>
                            <Ionicons name={topAlert.icon as any} size={24} color="#ffda34" />
                        </View>
                        <View style={styles.alertTextContent}>
                            <Text style={styles.alertTitle}>{topAlert.title}</Text>
                            <Text style={styles.alertSubtitle}>{topAlert.subtitle}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#ffda34" style={styles.alertChevron} />
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    )
}

const Home = () => {
    const scrollY = useRef(new Animated.Value(0)).current
    const scaleAnim = useRef(new Animated.Value(1)).current
    const { getThemeImage } = useTheme()
    const { network } = useNetwork()
    const { address: walletAddress } = useWallet()
    const { isNFTCollectionEnabled, isSpamFilterEnabled } = usePreferences()
    const [refreshing, setRefreshing] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const [pendingClaimsCount, setPendingClaimsCount] = useState(0)
    const [activeTab, setActiveTab] = useState<'tokens' | 'projects'>('tokens')
    const [isTokenRefreshing, setIsTokenRefreshing] = useState(false)
    const tokenListRefreshRef = useRef<(() => void) | null>(null)
    const { assets, prices, isLoading: isAssetsLoading, refetch } = useAssets(refreshKey)

    const { tokens, projects } = useMemo(() => {
        const t: FungibleAsset[] = []
        const p: FungibleAsset[] = []

        assets.forEach(asset => {
            const name = asset.metadata.name?.toLowerCase() || ''
            const symbol = asset.metadata.symbol?.toLowerCase() || ''
            const type = asset.asset_type?.toLowerCase() || ''

            const isProject = name.includes('podium') || symbol.includes('podium') ||
                name.includes('pass') || symbol.includes('pass') ||
                name.includes('nexus') || symbol.includes('nexus') ||
                type.includes('podium') || type.includes('pass') || type.includes('nexus') ||
                name.includes('bonk') || name.includes('hawk') || name.includes('moonwalk') || name.includes('kamino')

            if (isSpamFilterEnabled && asset.metadata.isSpam) return

            if (isProject) p.push(asset)
            else t.push(asset)
        })

        return { tokens: t, projects: p }
    }, [assets])

    const calculateValues = useCallback((assetList: FungibleAsset[]) => {
        if (!prices) return 0
        return assetList.reduce((sum, asset) => {
            const cgId = SYMBOL_TO_ID[asset.metadata.symbol.toUpperCase()]
            const priceData = cgId ? prices[cgId] : null

            if (priceData) {
                const balance = parseFloat(formatAssetBalance(asset.amount, asset.metadata.decimals).replace(/,/g, ''))
                return sum + balance * priceData.usd
            }
            return sum
        }, 0)
    }, [prices])

    const tokenBalanceSum = useMemo(() => {
        const val = calculateValues(tokens)
        return val > 0 ? `$ ${val.toFixed(2)}` : '$ 0.00'
    }, [tokens, calculateValues])

    const projectBalanceSum = useMemo(() => {
        const val = calculateValues(projects)
        return val > 0 ? `$ ${val.toFixed(2)}` : '$ 0.00'
    }, [projects, calculateValues])

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

    const onTabRefresh = () => {
        refetch()
        if (tokenListRefreshRef.current) {
            tokenListRefreshRef.current()
        }
    }

    const onRefresh = async () => {
        setRefreshing(true)
        setRefreshKey(prev => prev + 1)
        onTabRefresh()

        setTimeout(() => {
            setRefreshing(false)
        }, 1000)
    }

    useEffect(() => {
        loadPendingClaims()
    }, [loadPendingClaims, refreshKey])



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
                <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
                    <LinearGradient
                        colors={['#121315', 'rgba(15, 20, 25, 0.95)', 'rgba(15, 20, 25, 0)']}
                        style={styles.headerGradient}
                    />
                </Animated.View>

                <View style={styles.stickyHeaderContent}>
                    <Header />
                </View>

                {getThemeImage() && (
                    <View style={styles.fixedBackgroundContainer}>
                        <Image
                            source={getThemeImage()}
                            style={styles.fixedBackgroundImage}
                            resizeMode="cover"
                        />
                        <LinearGradient
                            colors={['rgba(18, 19, 21, 0)', 'rgba(15, 20, 25, 0.5)', '#121315']}
                            style={styles.fixedGradientOverlay}
                            locations={[0.0, 0.6, 1.0]}
                        />
                    </View>
                )}

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
                    <View style={styles.headerSpacer} />
                    <NetWorth refreshKey={refreshKey} />
                    <PNLSummary />
                    <NotificationStack pendingClaimsCount={pendingClaimsCount} />
                    <ActionButtons />
                    <PortfolioTabs
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        onRefresh={onTabRefresh}
                        isRefreshing={isTokenRefreshing}
                    />


                    <TokenList
                        refreshKey={refreshKey}
                        onRefreshRef={(refreshFn) => { tokenListRefreshRef.current = refreshFn }}
                        onLoadingChange={setIsTokenRefreshing}
                        filterMode={activeTab}
                    />

                    {/* NFT Collection Section - Only show in Tokens tab */}
                    {isNFTCollectionEnabled && walletAddress && activeTab === 'tokens' && (
                        <NFTList walletAddress={walletAddress} />
                    )}

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
    fixedBackgroundContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT * 0.45,
        zIndex: -1,
    },
    fixedBackgroundImage: {
        width: '100%',
        height: '100%',
        opacity: 0.3,
    },
    fixedGradientOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '50%',
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
    alertStackContainer: {
        paddingHorizontal: 20,
        marginTop: 10,
        marginBottom: 16,
        position: 'relative',
    },
    stackCardBehind: {
        position: 'absolute',
        top: 6,
        left: 28,
        right: 28,
        bottom: -6,
        borderRadius: 20,
        backgroundColor: '#1E1F23',
        zIndex: -1,
        opacity: 0.6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    stackCardBehind2: {
        position: 'absolute',
        top: 12,
        left: 36,
        right: 36,
        bottom: -12,
        borderRadius: 20,
        backgroundColor: '#1E1F23',
        zIndex: -2,
        opacity: 0.3,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.03)',
    },
    alertCardContainer: {
        width: '100%',
    },
    alertCard: {
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#1E1F23', // Dark solid background
    },
    alertContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    alertIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 218, 52, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    alertTextContent: {
        flex: 1,
        marginRight: 8,
    },
    alertTitle: {
        color: '#ffda34',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    alertSubtitle: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        lineHeight: 16,
    },
    alertChevron: {
        marginLeft: 4,
    },
});

export default Home
