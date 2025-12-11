import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { getEnrichedUserNFTs, UserNFT, NFTMetadata } from '../services/movement_service/nftService'
import { useNetwork } from '../context/NetworkContext'
import { SkeletonLoader } from './SkeletonLoader'

interface NFTListProps {
    walletAddress: string
}

export const NFTList: React.FC<NFTListProps> = ({ walletAddress }) => {
    const router = useRouter()
    const { network } = useNetwork()
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
            // Silently handle errors - just show empty state
            setNfts([])
            setError(null) // Don't show error to user
        } finally {
            setLoading(false)
        }
    }

    const getImageUrl = (nft: UserNFT & { metadata?: NFTMetadata }) => {
        // Try metadata image first
        if (nft.metadata?.image) {
            return nft.metadata.image
        }
        // Fallback to token URI if it's an image
        if (nft.current_token_data?.token_uri) {
            const uri = nft.current_token_data.token_uri
            if (uri.match(/\.(jpg|jpeg|png|gif|webp)$/i) || uri.includes('ipfs://')) {
                const imageUrl = uri.startsWith('ipfs://')
                    ? uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
                    : uri
                return imageUrl
            }
        }
        return null
    }

    const handleNFTPress = (nft: UserNFT & { metadata?: NFTMetadata }) => {
        // TODO: Navigate to NFT details page
    }

    if (!walletAddress) {
        return null
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>NFT Collection</Text>
                {nfts.length > 0 && (
                    <Text style={styles.count}>{nfts.length}</Text>
                )}
            </View>

            {loading ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {[...Array(3)].map((_, index) => (
                        <View key={index} style={styles.nftSkeletonCard}>
                            <SkeletonLoader width={160} height={160} borderRadius={12} />
                        </View>
                    ))}
                </ScrollView>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadNFTs}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : nfts.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No NFTs Found</Text>
                </View>
            ) : (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {nfts.map((nft, index) => {
                        const imageUrl = getImageUrl(nft)
                        const nftName = nft.metadata?.name || nft.current_token_data?.token_name || 'Unnamed NFT'
                        const collectionName = nft.current_token_data?.current_collection?.collection_name || 'Unknown Collection'

                        return (
                            <TouchableOpacity
                                key={`${nft.token_data_id}-${index}`}
                                style={styles.nftCard}
                                onPress={() => handleNFTPress(nft)}
                                activeOpacity={0.7}
                            >
                                {imageUrl ? (
                                    <Image
                                        source={{ uri: imageUrl }}
                                        style={styles.nftImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.nftImagePlaceholder}>
                                        <Text style={styles.placeholderText}>NFT</Text>
                                    </View>
                                )}

                                {parseInt(nft.amount) > 1 && (
                                    <View style={styles.amountBadge}>
                                        <Text style={styles.amountText}>×{nft.amount}</Text>
                                    </View>
                                )}
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
        marginTop: 20,
        marginBottom: 20,
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
        fontSize: 16,
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 12,
    },
    nftCard: {
        width: 160,
        height: 160,
        backgroundColor: '#1A1F28',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        position: 'relative',
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
        fontSize: 16,
        fontWeight: '600',
    },
    nftOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: 40,
        paddingBottom: 8,
    },
    nftInfo: {
        padding: 12,
    },
    nftName: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    nftCollection: {
        color: '#8B98A5',
        fontSize: 12,
    },
    amountBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#ffda34',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    amountText: {
        color: '#000',
        fontSize: 11,
        fontWeight: '700',
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    loadingText: {
        color: '#8B98A5',
        fontSize: 14,
        marginTop: 12,
    },
    errorContainer: {
        paddingVertical: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#1A1F28',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    retryButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        paddingVertical: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: '#8B98A5',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtext: {
        color: '#8B98A5',
        fontSize: 14,
        textAlign: 'center',
    },
    nftSkeletonCard: {
        width: 160,
        marginRight: 12,
    },
})
