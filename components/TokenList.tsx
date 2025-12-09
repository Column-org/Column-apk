import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, ActivityIndicator, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { usePrivy } from '@privy-io/expo'
import { useRouter } from 'expo-router'
import { getFungibleAssets, formatAssetBalance, FungibleAsset } from '../services/movementAssets'
import { useNetwork } from '../context/NetworkContext'
import { getMovePrice, TokenPriceData } from '../services/pythOracle'
import { useBalanceVisibility } from '../context/BalanceVisibilityContext'
import { SkeletonLoader } from './SkeletonLoader'

const SwipeableToken = ({ icon, name, amount, value, iconUri, priceHistory, tokenPrice, isOpen, onOpen, onClose, asset, isHidden }: any) => {
    const router = useRouter()
    const [translateX] = useState(new Animated.Value(0))
    const [imageError, setImageError] = useState(false)

    // Close this token when another opens
    useEffect(() => {
        if (!isOpen) {
            Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
            }).start()
        }
    }, [isOpen])

    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
            return Math.abs(gestureState.dx) > 5
        },
        onMoveShouldSetPanResponderCapture: (_, gestureState) => {
            // Capture the gesture if it's horizontal
            return Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        },
        onPanResponderMove: (_, gestureState) => {
            if (gestureState.dx < 0) {
                translateX.setValue(Math.max(gestureState.dx, -80))
            } else if (isOpen && gestureState.dx > 0) {
                // Allow swiping back when open
                translateX.setValue(Math.min(gestureState.dx - 80, 0))
            }
        },
        onPanResponderRelease: (_, gestureState) => {
            if (gestureState.dx < -30) {
                Animated.timing(translateX, {
                    toValue: -80,
                    duration: 200,
                    useNativeDriver: true,
                }).start()
                onOpen()
            } else {
                Animated.timing(translateX, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start()
                onClose()
            }
        },
    })

    const handleSend = () => {
        if (asset) {
            router.push({
                pathname: '/send',
                params: { token: JSON.stringify(asset) }
            })
        }
    }

    return (
        <View style={styles.swipeableContainer}>
            <View style={styles.sendButtonContainer}>
                <TouchableOpacity style={styles.sendButton} activeOpacity={1} onPress={handleSend}>
                    <Ionicons name="send" size={28} color="#ffda34" />
                </TouchableOpacity>
            </View>
            <Animated.View
                style={[
                    styles.watchlistItem,
                    { transform: [{ translateX }] }
                ]}
                {...panResponder.panHandlers}
            >
                {iconUri && !imageError ? (
                    <Image
                        source={{ uri: iconUri }}
                        style={styles.assetIcon}
                        onError={(e) => {
                            console.log('Image load error for:', iconUri, e.nativeEvent.error)
                            setImageError(true)
                        }}
                    />
                ) : (
                    <View style={[
                        styles.assetIconPlaceholder,
                        name?.toLowerCase().includes('move') && styles.moveIconStyle
                    ]}>
                        <Text style={styles.assetIconText}>{name?.charAt(0) || '?'}</Text>
                    </View>
                )}
                <View style={styles.watchlistDetails}>
                    <Text style={styles.watchlistName}>{name}</Text>
                    {(name?.toLowerCase() === 'move coin' || name?.toLowerCase() === 'movement') && tokenPrice && (
                        <Text style={styles.movePriceText}>{isHidden ? '••••' : `$${tokenPrice.toFixed(4)}`}</Text>
                    )}
                </View>
                <View style={styles.watchlistRight}>
                    {name?.toLowerCase() !== 'move coin' && name?.toLowerCase() !== 'movement' && (
                        <Text style={styles.watchlistValue}>{isHidden ? '••••' : value}</Text>
                    )}
                    {(name?.toLowerCase() === 'move coin' || name?.toLowerCase() === 'movement') && (
                        <View style={styles.moveRightSection}>
                            <Text style={styles.watchlistValue}>{isHidden ? '••••' : value}</Text>
                            <Text style={styles.moveBalanceText}>{isHidden ? '••••' : amount}</Text>
                        </View>
                    )}
                </View>
            </Animated.View>
        </View>
    )
}

interface TokenListProps {
    refreshKey?: number
    onRefreshRef?: (refreshFn: () => void) => void
}

export const TokenList = ({ refreshKey, onRefreshRef }: TokenListProps) => {
    const { user } = usePrivy()
    const { network } = useNetwork()
    const { isHidden } = useBalanceVisibility()
    const [assets, setAssets] = useState<FungibleAsset[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [movePrice, setMovePrice] = useState<TokenPriceData | null>(null)
    const [movePriceHistory, setMovePriceHistory] = useState<number[]>([])
    const [openTokenIndex, setOpenTokenIndex] = useState<number | null>(null)

    // Get Movement wallet address from Privy
    const movementWallet = user?.linked_accounts?.find(
        (account: any) => account.type === 'wallet' && account.chain_type === 'aptos'
    ) as any
    const walletAddress = movementWallet?.address

    const fetchAssets = useCallback(async (showRefreshing = false) => {
        if (!walletAddress) {
            setIsLoading(false)
            return
        }

        if (showRefreshing) {
            setIsRefreshing(true)
        } else {
            setIsLoading(true)
        }

        try {
            const [fetchedAssets, movePriceData] = await Promise.all([
                getFungibleAssets(walletAddress, network),
                getMovePrice()
            ])
            setAssets(fetchedAssets)
            setMovePrice(movePriceData)
            setMovePriceHistory([])
        } catch (error) {
            console.error('Error fetching assets:', error)
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [walletAddress, network])

    // Expose refresh function to parent
    useEffect(() => {
        if (onRefreshRef) {
            onRefreshRef(() => fetchAssets(true))
        }
    }, [onRefreshRef, walletAddress, fetchAssets])

    useEffect(() => {
        fetchAssets()
    }, [fetchAssets])

    // Refresh when refreshKey changes (from pull-to-refresh)
    useEffect(() => {
        if (refreshKey && refreshKey > 0) {
            fetchAssets(true)
        }
    }, [refreshKey, fetchAssets])

    return (
        <View style={styles.watchlistSection}>
            <View style={styles.watchlistHeader}>
                <View style={styles.titleContainer}>
                    <Text style={styles.watchlistTitle}>Tokens</Text>
                </View>
                <TouchableOpacity
                    style={styles.manageButton}
                    onPress={() => fetchAssets(true)}
                    disabled={isRefreshing}
                >
                    <Ionicons
                        name="refresh"
                        size={16}
                        color="white"
                        style={isRefreshing ? styles.rotating : undefined}
                    />
                    <Text style={styles.manageText}>Refresh</Text>
                </TouchableOpacity>
            </View>

            {isLoading && !isRefreshing ? (
                <View style={styles.skeletonContainer}>
                    {[...Array(3)].map((_, index) => (
                        <View key={index} style={styles.skeletonItem}>
                            <SkeletonLoader width={42} height={42} borderRadius={21} />
                            <View style={styles.skeletonContent}>
                                <SkeletonLoader width="50%" height={16} style={{ marginBottom: 6 }} />
                                <SkeletonLoader width="30%" height={13} />
                            </View>
                            <View style={styles.skeletonRight}>
                                <SkeletonLoader width={80} height={15} style={{ marginBottom: 6 }} />
                                <SkeletonLoader width={60} height={13} />
                            </View>
                        </View>
                    ))}
                </View>
            ) : assets.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="wallet-outline" size={48} color="#8B98A5" />
                    <Text style={styles.emptyText}>No assets found</Text>
                    <Text style={styles.emptySubtext}>
                        {network === 'testnet'
                            ? 'Get testnet tokens from the faucet'
                            : 'Deposit assets to this wallet to see them here'}
                    </Text>
                </View>
            ) : (
                assets.map((asset, index) => {
                    const formattedBalance = formatAssetBalance(asset.amount, asset.metadata.decimals)

                    // Check if this is MOVE token (by asset type OR by name/symbol)
                    const isMoveToken =
                        asset.asset_type === '0x1::aptos_coin::AptosCoin' ||
                        asset.metadata.symbol?.toUpperCase() === 'MOVE' ||
                        asset.metadata.name?.toLowerCase() === 'move coin' ||
                        asset.metadata.name?.toLowerCase() === 'movement'

                    // Calculate USD value for MOVE token
                    let displayValue = formattedBalance
                    let displayAmount = `${formattedBalance} ${asset.metadata.symbol}`

                    if (isMoveToken && movePrice) {
                        const usdValue = parseFloat(formattedBalance.replace(/,/g, '')) * movePrice.price
                        displayValue = `$${usdValue.toFixed(2)}`
                        displayAmount = formattedBalance // Remove "MOVE" text for Move Coin
                    }

                    return (
                        <SwipeableToken
                            key={`${asset.asset_type}-${index}`}
                            name={asset.metadata.name}
                            amount={displayAmount}
                            asset={asset}
                            value={displayValue}
                            iconUri={asset.metadata.icon_uri}
                            priceHistory={isMoveToken ? movePriceHistory : null}
                            tokenPrice={isMoveToken && movePrice ? movePrice.price : null}
                            isOpen={openTokenIndex === index}
                            onOpen={() => setOpenTokenIndex(index)}
                            onClose={() => setOpenTokenIndex(null)}
                            isHidden={isHidden}
                        />
                    )
                })
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    watchlistSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    watchlistHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    titleContainer: {
        flex: 1,
        alignItems: 'flex-start',
    },
    watchlistTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    manageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    manageText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '500',
    },
    swipeableContainer: {
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 8,
    },
    sendButtonContainer: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 80,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 0,
    },
    sendButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 195, 13, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    watchlistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 80,
        paddingHorizontal: 12,
        backgroundColor: '#222327',
        borderRadius: 12,
        zIndex: 1,
    },
    watchlistDetails: {
        flex: 1,
    },
    watchlistName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 3,
    },
    watchlistAmount: {
        color: '#8B98A5',
        fontSize: 13,
    },
    watchlistRight: {
        alignItems: 'flex-end',
    },
    watchlistValue: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 3,
    },
    watchlistChangePositive: {
        color: '#ffda34',
        fontSize: 13,
        fontWeight: '500',
    },
    watchlistChangeNegative: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '500',
    },
    assetIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        marginRight: 12,
    },
    assetIconPlaceholder: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255, 195, 13, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    moveIconStyle: {
        backgroundColor: 'rgba(255, 195, 13, 0.3)',
        borderWidth: 2,
        borderColor: '#ffda34',
    },
    assetIconText: {
        color: '#ffda34',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        color: '#8B98A5',
        fontSize: 14,
        marginTop: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        color: '#8B98A5',
        fontSize: 13,
        marginTop: 8,
    },
    rotating: {
        transform: [{ rotate: '360deg' }],
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    movePriceText: {
        color: '#ffda34',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 2,
    },
    moveRightSection: {
        alignItems: 'flex-end',
    },
    moveBalanceText: {
        color: '#8B98A5',
        fontSize: 13,
        marginTop: 3,
    },
    skeletonContainer: {
        gap: 8,
    },
    skeletonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 80,
        paddingHorizontal: 12,
        backgroundColor: '#222327',
        borderRadius: 12,
    },
    skeletonContent: {
        flex: 1,
        marginLeft: 12,
    },
    skeletonRight: {
        alignItems: 'flex-end',
    },
})
