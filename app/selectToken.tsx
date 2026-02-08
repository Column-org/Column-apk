import React, { useMemo, useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Image, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useWallet } from '../context/WalletContext'
import { getFungibleAssets, formatAssetBalance, FungibleAsset } from '../services/movementAssets'
import { useNetwork } from '../context/NetworkContext'
import { SkeletonLoader } from '../components/SkeletonLoader'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

export default function SelectToken() {
    const router = useRouter()
    const { address: walletAddress } = useWallet()
    const { network } = useNetwork()
    const [assets, setAssets] = useState<FungibleAsset[]>([])
    const [loading, setLoading] = useState(true)
    const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({})

    useEffect(() => {
        const fetchAssets = async () => {
            if (walletAddress) {
                setLoading(true)
                try {
                    const fetchedAssets = await getFungibleAssets(walletAddress, network)
                    setAssets(fetchedAssets)
                } catch (error) {
                    console.error('Error fetching assets:', error)
                } finally {
                    setLoading(false)
                }
            }
        }
        fetchAssets()
    }, [walletAddress, network])

    const handleTokenSelect = (token: FungibleAsset) => {
        // Navigate back to send page with selected token
        router.replace({
            pathname: '/send',
            params: { token: JSON.stringify(token) }
        })
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Select Token</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                overScrollMode="never"
            >
                {loading ? (
                    <View style={styles.tokenList}>
                        {[...Array(6)].map((_, index) => (
                            <View key={index} style={styles.skeletonItem}>
                                <SkeletonLoader width={40} height={40} borderRadius={20} />
                                <View style={styles.skeletonInfo}>
                                    <SkeletonLoader width="60%" height={16} style={{ marginBottom: 8 }} />
                                    <SkeletonLoader width="40%" height={12} />
                                </View>
                                <SkeletonLoader width={60} height={16} />
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.tokenList}>
                        {assets.map((asset, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.tokenItem}
                                onPress={() => handleTokenSelect(asset)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.tokenLeft}>
                                    {asset.metadata.icon_uri && !imageErrors[index] ? (
                                        <Image
                                            source={{ uri: asset.metadata.icon_uri }}
                                            style={styles.tokenIcon}
                                            onError={() => {
                                                console.log('Image load error for:', asset.metadata.name, asset.metadata.icon_uri)
                                                setImageErrors(prev => ({ ...prev, [index]: true }))
                                            }}
                                        />
                                    ) : (
                                        <View style={[styles.tokenIcon, styles.tokenIconPlaceholder]}>
                                            <Ionicons name="wallet-outline" size={20} color="#ffda34" />
                                        </View>
                                    )}
                                    <View style={styles.tokenInfo}>
                                        <Text style={styles.tokenName}>{asset.metadata.name}</Text>
                                        <Text style={styles.tokenSymbol}>{asset.metadata.symbol}</Text>
                                    </View>
                                </View>
                                <View style={styles.tokenRight}>
                                    <Text style={styles.tokenBalance}>
                                        {formatAssetBalance(asset.amount, asset.metadata.decimals)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}

                        {assets.length === 0 && !loading && (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="wallet-outline" size={64} color="#8B98A5" />
                                <Text style={styles.emptyText}>No tokens found</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121315',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: IS_SMALL_SCREEN ? 16 : 50,
        paddingBottom: IS_SMALL_SCREEN ? 8 : 20,
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    loadingText: {
        color: '#8B98A5',
        fontSize: 16,
    },
    tokenList: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    tokenItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#222327',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    tokenLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    tokenIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    tokenIconPlaceholder: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tokenInfo: {
        flex: 1,
    },
    tokenName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    tokenSymbol: {
        color: '#8B98A5',
        fontSize: 14,
    },
    tokenRight: {
        alignItems: 'flex-end',
    },
    tokenBalance: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    tokenValue: {
        color: '#8B98A5',
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: '#8B98A5',
        fontSize: 16,
        marginTop: 16,
    },
    skeletonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222327',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    skeletonInfo: {
        flex: 1,
        marginLeft: 12,
    },
})
