import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, ActivityIndicator, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useWallet } from '../context/WalletContext'
import { useRouter } from 'expo-router'
import { formatAssetBalance, FungibleAsset } from '../services/movementAssets'
import { useNetwork } from '../context/NetworkContext'
import { useBalanceVisibility } from '../context/BalanceVisibilityContext'
import { SkeletonLoader } from './SkeletonLoader'
import { EmptyWalletState } from './EmptyWalletState'
import { ProjectItem } from './ProjectItem'
import { useAssets } from '../hooks/useAssets'
import { SYMBOL_TO_ID } from '../services/coinGecko'
import { usePreferences } from '../context/PreferencesContext'

const SwipeableToken = ({ name, amount, value, iconUri, tokenPrice, isOpen, onOpen, onClose, asset, isHidden }: any) => {
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
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <View style={[
                        styles.assetIconPlaceholder,
                        (name?.toLowerCase().includes('move') || name?.toLowerCase() === 'movement') && styles.moveIconStyle
                    ]}>
                        <Text style={styles.assetIconText}>{name?.charAt(0) || '?'}</Text>
                    </View>
                )}
                <View style={styles.watchlistDetails}>
                    <Text style={styles.watchlistName} numberOfLines={1}>{name}</Text>
                    <Text style={styles.movePriceText}>{isHidden ? '••••' : `$${(tokenPrice || 0).toFixed(4)}`}</Text>
                </View>
                <View style={styles.watchlistRight}>
                    <View style={styles.moveRightSection}>
                        <Text style={styles.watchlistValue}>{isHidden ? '••••' : value}</Text>
                        <Text style={styles.moveBalanceText}>{isHidden ? '••••' : amount}</Text>
                    </View>
                </View>
            </Animated.View>
        </View>
    )
}

interface TokenListProps {
    refreshKey?: number
    onRefreshRef?: (refreshFn: () => void) => void
    onLoadingChange?: (loading: boolean) => void
    filterMode?: 'tokens' | 'projects'
}

export const TokenList = ({ refreshKey, onRefreshRef, onLoadingChange, filterMode = 'tokens' }: TokenListProps) => {
    const router = useRouter()
    const { isHidden } = useBalanceVisibility()
    const { isSpamFilterEnabled, hiddenTokens } = usePreferences()
    const { assets, prices, isLoading, refetch } = useAssets(refreshKey)
    const [openTokenIndex, setOpenTokenIndex] = useState<number | null>(null)

    // Sync refetch function with parent
    useEffect(() => {
        if (onRefreshRef) {
            onRefreshRef(refetch)
        }
    }, [onRefreshRef, refetch])

    // Sync loading state with parent
    useEffect(() => {
        if (onLoadingChange) {
            onLoadingChange(isLoading)
        }
    }, [isLoading, onLoadingChange])

    return (
        <View style={styles.watchlistSection}>

            {isLoading ? (
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
                <EmptyWalletState />
            ) : filterMode === 'projects' ? (
                (() => {
                    // Dynamic Grouping Logic
                    const groups: { [key: string]: FungibleAsset[] } = {};

                    assets.forEach(asset => {
                        const name = asset.metadata.name?.toLowerCase() || ''
                        const symbol = asset.metadata.symbol?.toLowerCase() || ''
                        const type = asset.asset_type?.toLowerCase() || ''

                        let groupName = '';
                        if (name.includes('podium') || symbol.includes('podium') || name.includes('pass') || symbol.includes('pass')) groupName = 'Podium';
                        else if (name.includes('nexus') || symbol.includes('nexus')) groupName = 'Nexus';
                        else if (name.includes('bonk') || symbol.includes('bonk')) groupName = 'Bonk Rewards';
                        else if (name.includes('hawk') || symbol.includes('hawk')) groupName = 'HawkFi';
                        else if (name.includes('moonwalk')) groupName = 'Moonwalk';
                        else if (name.includes('kamino')) groupName = 'Kamino';

                        // If no specific group matches but it's clearly a "Project" asset
                        if (!groupName && (name.includes('project') || symbol.includes('receipt') || type.includes('::position'))) {
                            groupName = asset.metadata.name;
                        }

                        if (groupName) {
                            if (!groups[groupName]) groups[groupName] = [];
                            groups[groupName].push(asset);
                        }
                    });

                    if (Object.keys(groups).length === 0) {
                        return (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="briefcase-outline" size={48} color="rgba(255, 218, 52, 0.2)" />
                                <Text style={styles.emptyText}>No Projects Found</Text>
                                <Text style={styles.emptySubtext}>Tokens found: {assets.map(a => a.metadata.symbol).join(', ') || 'none'}</Text>
                            </View>
                        );
                    }

                    return Object.entries(groups).map(([groupName, groupAssets]) => (
                        <ProjectItem
                            key={groupName}
                            name={groupName}
                            iconUri={groupName === 'Nexus' || groupName === 'Podium'
                                ? "https://nexus-five-gold.vercel.app/_next/image?url=%2Flogo.png&w=48&q=75"
                                : groupAssets[0]?.metadata.icon_uri || ""}
                            appUrl={groupName === 'Nexus' || groupName === 'Podium'
                                ? "https://nexus-five-gold.vercel.app/dashboard"
                                : "https://movement.market"} // Fallback
                            assets={groupAssets}
                            isHidden={isHidden}
                        />
                    ));
                })()
            ) : (
                assets
                    .filter(asset => {
                        const name = asset.metadata.name?.toLowerCase() || ''
                        const symbol = asset.metadata.symbol?.toLowerCase() || ''
                        const type = asset.asset_type?.toLowerCase() || ''

                        const isProject = name.includes('podium') || symbol.includes('podium') ||
                            name.includes('pass') || symbol.includes('pass') ||
                            name.includes('nexus') || symbol.includes('nexus') ||
                            type.includes('podium') || type.includes('pass') || type.includes('nexus');

                        if (isProject) return false;
                        if (isSpamFilterEnabled && asset.metadata.isSpam) return false;
                        if (hiddenTokens.includes(asset.asset_type)) return false;

                        return true
                    })
                    .map((asset, index) => {
                        const formattedBalance = formatAssetBalance(asset.amount, asset.metadata.decimals)
                        const symbol = asset.metadata.symbol.toUpperCase()
                        const cgId = SYMBOL_TO_ID[symbol]
                        const priceData = cgId ? prices[cgId] : null

                        const balanceNum = parseFloat(formattedBalance.replace(/,/g, ''))
                        const unitPrice = priceData?.usd || 0
                        const usdValue = balanceNum * unitPrice

                        const isMoveToken = symbol === 'MOVE' || symbol === 'MOVEMENT'

                        return (
                            <SwipeableToken
                                key={`${asset.asset_type}-${index}`}
                                name={asset.metadata.name}
                                amount={isMoveToken ? formattedBalance : `${formattedBalance} ${symbol}`}
                                asset={asset}
                                value={`$${usdValue.toFixed(2)}`}
                                iconUri={asset.metadata.icon_uri}
                                tokenPrice={unitPrice}
                                isOpen={openTokenIndex === index}
                                onOpen={() => setOpenTokenIndex(index)}
                                onClose={() => setOpenTokenIndex(null)}
                                isHidden={isHidden}
                            />
                        )
                    })
            )}

            {!isLoading && assets.length > 0 && filterMode === 'tokens' && (
                <View style={styles.manageFooter}>
                    <TouchableOpacity
                        onPress={() => router.push('/manage-tokens')}
                        style={styles.manageTokenButton}
                    >
                        <Text style={styles.manageTokenText}>Manage token</Text>
                    </TouchableOpacity>
                </View>
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
        fontSize: 14,
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
        borderRadius: 14,
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
    manageFooter: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    manageTokenButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    manageTokenText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 13,
        fontWeight: '500',
    },
})
