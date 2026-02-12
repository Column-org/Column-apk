import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, Dimensions, FlatList, Platform } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getEnrichedUserNFTs, UserNFT, NFTMetadata } from '../../../services/movement_service/nftService'
import { useNetwork } from '../../../context/NetworkContext'
import { useWallet } from '../../../context/WalletContext'
import { SkeletonLoader } from '../../../components/SkeletonLoader'

const { width } = Dimensions.get('window')
const COLUMN_WIDTH = (width - 48) / 2

export default function CollectionDetail() {
    const router = useRouter()
    const { name } = useLocalSearchParams<{ name: string }>()
    const { network } = useNetwork()
    const { address: walletAddress } = useWallet()
    const [nfts, setNfts] = useState<Array<UserNFT & { metadata?: NFTMetadata }>>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadNFTs()
    }, [walletAddress, network, name])

    const loadNFTs = async () => {
        if (!walletAddress) {
            setLoading(false)
            return
        }

        setLoading(true)
        try {
            const userNFTs = await getEnrichedUserNFTs(walletAddress, network)
            const collectionNfts = userNFTs.filter(nft =>
                (nft.current_token_data?.current_collection?.collection_name || 'Unknown Collection') === name
            )
            setNfts(collectionNfts)
        } catch (err) {
            console.error('Failed to load collection NFTs:', err)
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

    const handleNFTPress = (nft: UserNFT & { metadata?: NFTMetadata }) => {
        router.push({
            pathname: "/nft/nft-details",
            params: {
                tokenId: nft.token_data_id,
                collectionName: name
            }
        })
    }

    const renderNFTItem = ({ item }: { item: typeof nfts[0] }) => {
        const imageUrl = getImageUrl(item)
        return (
            <TouchableOpacity
                style={styles.nftCard}
                onPress={() => handleNFTPress(item)}
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
                    {parseInt(item.amount) > 1 && (
                        <View style={styles.amountBadge}>
                            <Text style={styles.amountText}>×{item.amount}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.nftInfo}>
                    <Text style={styles.nftName} numberOfLines={1}>
                        {item.current_token_data?.token_name || 'Unnamed NFT'}
                    </Text>
                </View>
            </TouchableOpacity>
        )
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={26} color="white" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
                    <Text style={styles.headerSubtitle}>{nfts.length} Items</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <FlatList
                        data={[...Array(6)]}
                        numColumns={2}
                        renderItem={() => (
                            <View style={[styles.nftCard, { opacity: 0.5 }]}>
                                <SkeletonLoader width={COLUMN_WIDTH} height={COLUMN_WIDTH} borderRadius={20} />
                                <SkeletonLoader width={COLUMN_WIDTH * 0.7} height={14} style={{ marginTop: 8 }} />
                            </View>
                        )}
                        keyExtractor={(_, i) => i.toString()}
                        columnWrapperStyle={styles.columnWrapper}
                        contentContainerStyle={styles.listContent}
                    />
                </View>
            ) : (
                <FlatList
                    data={nfts}
                    numColumns={2}
                    renderItem={renderNFTItem}
                    keyExtractor={(item, index) => `${item.token_data_id}-${index}`}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No NFTs found in this collection</Text>
                        </View>
                    }
                />
            )}
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
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 60, // Increased for Android to avoid collision
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    headerSubtitle: {
        color: '#8B98A5',
        fontSize: 12,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    nftCard: {
        width: COLUMN_WIDTH,
    },
    imageContainer: {
        width: COLUMN_WIDTH,
        height: COLUMN_WIDTH,
        backgroundColor: '#1A1F28',
        borderRadius: 20,
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
        fontSize: 14,
        fontWeight: '600',
    },
    amountBadge: {
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
    amountText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
    },
    nftInfo: {
        marginTop: 8,
        paddingHorizontal: 4,
    },
    nftName: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: '#8B98A5',
        fontSize: 16,
        fontWeight: '600',
    },
})
