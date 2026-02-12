import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getEnrichedUserNFTs, UserNFT, NFTMetadata } from '../services/movement_service/nftService'
import { useNetwork } from '../context/NetworkContext'
import { SkeletonLoader } from './SkeletonLoader'
import { usePreferences } from '../context/PreferencesContext'

interface NFTListProps {
    walletAddress: string
}

export const NFTList: React.FC<NFTListProps> = ({ walletAddress }) => {
    const router = useRouter()
    const { network } = useNetwork()
    const { isSpamFilterEnabled } = usePreferences()
    const [nfts, setNfts] = useState<Array<UserNFT & { metadata?: NFTMetadata }>>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadNFTs()
    }, [walletAddress, network])

    const loadNFTs = async () => {
        if (!walletAddress) {
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)
        try {
            const userNFTs = await getEnrichedUserNFTs(walletAddress, network)
            setNfts(userNFTs)
        } catch (err: any) {
            setNfts([])
            setError(null)
        } finally {
            setLoading(false)
        }
    }

    const getImageUrl = (nft: UserNFT & { metadata?: NFTMetadata }) => {
        if (nft.metadata?.image) return nft.metadata.image
        if (nft.current_token_data?.token_uri) {
            const uri = nft.current_token_data.token_uri
            if (uri.match(/\.(jpg|jpeg|png|gif|webp)$/i) || uri.includes('ipfs://')) {
                return uri.startsWith('ipfs://')
                    ? uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
                    : uri
            }
        }
        return null
    }

    const collections = useMemo(() => {
        const groups: { [key: string]: { name: string, items: typeof nfts, representative: typeof nfts[0] } } = {}
        nfts.forEach(nft => {
            if (isSpamFilterEnabled && nft.metadata?.isSpam) return

            const collectionName = nft.current_token_data?.current_collection?.collection_name || 'Unknown Collection'
            if (!groups[collectionName]) {
                groups[collectionName] = {
                    name: collectionName,
                    items: [],
                    representative: nft
                }
            }
            groups[collectionName].items.push(nft)
        })
        return Object.values(groups)
    }, [nfts])

    const handleCollectionPress = (collectionName: string) => {
        router.push({
            pathname: "/nft/collection/[name]",
            params: { name: collectionName }
        })
    }

    if (!walletAddress) return null

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>NFT Collections</Text>
                {collections.length > 0 && <Text style={styles.count}>{collections.length}</Text>}
            </View>

            {loading ? (
                <View style={styles.skeletonList}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {[...Array(3)].map((_, i) => (
                            <View key={i} style={styles.collectionSkeleton}>
                                <SkeletonLoader width={140} height={140} borderRadius={20} />
                                <SkeletonLoader width={80} height={12} style={{ marginTop: 8 }} />
                            </View>
                        ))}
                    </ScrollView>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadNFTs}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : collections.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No NFTs Found</Text>
                </View>
            ) : (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {collections.map((collection) => {
                        const imageUrl = getImageUrl(collection.representative)
                        return (
                            <TouchableOpacity
                                key={collection.name}
                                style={styles.collectionCard}
                                onPress={() => handleCollectionPress(collection.name)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.imageContainer}>
                                    {imageUrl ? (
                                        <Image source={{ uri: imageUrl }} style={styles.nftImage} resizeMode="cover" />
                                    ) : (
                                        <View style={styles.nftImagePlaceholder}>
                                            <Text style={styles.placeholderText}>NFT</Text>
                                        </View>
                                    )}
                                    <View style={styles.itemCountBadge}>
                                        <Text style={styles.itemCountText}>{collection.items.length}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    title: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    count: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 16,
    },
    collectionCard: {
        width: 140,
    },
    imageContainer: {
        width: 140,
        height: 140,
        backgroundColor: '#1A1F28',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        position: 'relative',
        marginBottom: 8,
    },
    nftImage: {
        width: '100%',
        height: '100%',
    },
    nftImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2A2F3A',
    },
    placeholderText: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '600',
    },
    itemCountBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    itemCountText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
    },
    collectionName: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
        paddingHorizontal: 4,
    },
    skeletonList: {
        flexDirection: 'row',
    },
    collectionSkeleton: {
        width: 140,
        marginRight: 16,
    },
    errorContainer: {
        paddingVertical: 20,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 12,
    },
    retryButton: {
        backgroundColor: '#1A1F28',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    retryButtonText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
    },
    emptyContainer: {
        paddingVertical: 20,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: '#8B98A5',
        fontSize: 13,
        fontWeight: '600',
    },
})
