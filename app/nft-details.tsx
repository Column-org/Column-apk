import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, StatusBar, Dimensions, TextInput, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getEnrichedUserNFTs, UserNFT, NFTMetadata } from '../services/movement_service/nftService'
import { useNetwork } from '../context/NetworkContext'
import { useWallet } from '../context/WalletContext'

const { width } = Dimensions.get('window')

export default function NFTDetails() {
    const router = useRouter()
    const { tokenId, collectionName } = useLocalSearchParams<{ tokenId: string, collectionName: string }>()
    const { network } = useNetwork()
    const { address: walletAddress, signAndSubmitTransaction } = useWallet()
    const insets = useSafeAreaInsets()

    const [nft, setNft] = useState<(UserNFT & { metadata?: NFTMetadata }) | null>(null)
    const [loading, setLoading] = useState(true)
    const [sendModalVisible, setSendModalVisible] = useState(false)
    const [recipient, setRecipient] = useState('')
    const [amount, setAmount] = useState('1')
    const [isSending, setIsSending] = useState(false)

    useEffect(() => {
        loadNFT()
    }, [tokenId, walletAddress, network])

    const loadNFT = async () => {
        if (!walletAddress) return
        setLoading(true)
        try {
            const userNFTs = await getEnrichedUserNFTs(walletAddress, network)
            const foundNft = userNFTs.find(n => n.token_data_id === tokenId)
            if (foundNft) {
                setNft(foundNft)
            }
        } catch (err) {
            console.error('Failed to load NFT details:', err)
        } finally {
            setLoading(false)
        }
    }

    const getImageUrl = () => {
        if (nft?.metadata?.image) return nft.metadata.image
        if (nft?.current_token_data?.token_uri) {
            const uri = nft.current_token_data.token_uri
            if (uri.match(/\.(jpg|jpeg|png|gif|webp)$/i) || uri.includes('ipfs://')) {
                return uri.startsWith('ipfs://')
                    ? uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
                    : uri
            }
        }
        return null
    }

    const handleSendMax = () => {
        if (nft) {
            setAmount(nft.amount)
        }
    }

    const handleSendNFT = async () => {
        if (!recipient.startsWith('0x') || recipient.length < 60) {
            Alert.alert('Invalid Address', 'Please enter a valid wallet address.')
            return
        }

        const sendAmount = parseInt(amount)
        if (isNaN(sendAmount) || sendAmount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount.')
            return
        }

        if (nft && sendAmount > parseInt(nft.amount)) {
            Alert.alert('Insufficient Balance', `You only own ${nft.amount} units of this NFT.`)
            return
        }

        setIsSending(true)
        try {
            // Determine if it's V2 or V1 transfer
            // For Movement/Aptos V2 (Digital Asset Standard), we use object::transfer
            // Many modern NFTs are objects
            const payload = {
                function: '0x1::object::transfer',
                typeArguments: [],
                functionArguments: [nft?.token_data_id, recipient]
            }

            const txHash = await signAndSubmitTransaction(payload)
            Alert.alert('Success', `NFT transfer submitted successfully!\n\nTransaction: ${txHash.slice(0, 10)}...`, [
                {
                    text: 'OK', onPress: () => {
                        setSendModalVisible(false)
                        router.back()
                    }
                }
            ])
        } catch (error: any) {
            console.error('Transfer failed:', error)
            Alert.alert('Transfer Failed', error.message || 'An unknown error occurred.')
        } finally {
            setIsSending(false)
        }
    }

    const imageUrl = getImageUrl()

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ffda34" />
                </View>
            </View>
        )
    }

    if (!nft) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>NFT not found</Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backLink}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={26} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>NFT Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.imageSection}>
                    {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.mainImage} resizeMode="contain" />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="image-outline" size={64} color="#8B98A5" />
                        </View>
                    )}
                </View>

                <View style={styles.detailsSection}>
                    <Text style={styles.collectionName}>{collectionName}</Text>
                    <Text style={styles.tokenName}>{nft.current_token_data?.token_name}</Text>

                    <View style={styles.ownedBadge}>
                        <Text style={styles.ownedText}>You own {nft.amount} units</Text>
                    </View>

                    {nft.metadata?.description && (
                        <View style={styles.infoBox}>
                            <Text style={styles.infoTitle}>Description</Text>
                            <Text style={styles.infoContent}>{nft.metadata.description}</Text>
                        </View>
                    )}

                    {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
                        <View style={styles.infoBox}>
                            <Text style={styles.infoTitle}>Attributes</Text>
                            <View style={styles.attributesGrid}>
                                {nft.metadata.attributes.map((attr, i) => (
                                    <View key={i} style={styles.attributeCard}>
                                        <Text style={styles.attrType}>{attr.trait_type}</Text>
                                        <Text style={styles.attrValue}>{attr.value}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    <View style={styles.infoBox}>
                        <Text style={styles.infoTitle}>Details</Text>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Token ID</Text>
                            <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">
                                {nft.token_data_id}
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.sendButton}
                    onPress={() => setSendModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="send" size={20} color="#121315" />
                    <Text style={styles.sendButtonText}>Send NFT</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal
                visible={sendModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSendModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Send NFT</Text>
                            <TouchableOpacity onPress={() => setSendModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#8B98A5" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Recipient Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0x..."
                                placeholderTextColor="#4A4D51"
                                value={recipient}
                                onChangeText={setRecipient}
                                autoCapitalize="none"
                            />
                        </View>

                        {parseInt(nft.amount) > 1 && (
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <Text style={styles.inputLabel}>Amount</Text>
                                    <TouchableOpacity onPress={handleSendMax}>
                                        <Text style={styles.maxLink}>Send Max ({nft.amount})</Text>
                                    </TouchableOpacity>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={setAmount}
                                />
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.confirmButton, isSending && styles.buttonDisabled]}
                            onPress={handleSendNFT}
                            disabled={isSending}
                        >
                            {isSending ? (
                                <ActivityIndicator color="#121315" />
                            ) : (
                                <Text style={styles.confirmButtonText}>Confirm Send</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121315',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: 'white',
        fontSize: 18,
        marginBottom: 10,
    },
    backLink: {
        color: '#ffda34',
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 60, // Match collection detail padding
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
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    imageSection: {
        width: width,
        height: width,
        backgroundColor: '#1A1F28',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1A1F28',
    },
    detailsSection: {
        padding: 20,
    },
    collectionName: {
        color: '#ffda34',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    tokenName: {
        color: 'white',
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 12,
    },
    ownedBadge: {
        backgroundColor: 'rgba(255, 218, 52, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 24,
    },
    ownedText: {
        color: '#ffda34',
        fontSize: 13,
        fontWeight: '700',
    },
    infoBox: {
        marginBottom: 24,
    },
    infoTitle: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    infoContent: {
        color: 'white',
        fontSize: 15,
        lineHeight: 22,
    },
    attributesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    attributeCard: {
        backgroundColor: '#1E242E',
        padding: 12,
        borderRadius: 12,
        width: (width - 52) / 2,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    attrType: {
        color: '#8B98A5',
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    attrValue: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#1E242E',
        padding: 16,
        borderRadius: 12,
    },
    detailLabel: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '600',
    },
    detailValue: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        width: '60%',
        textAlign: 'right',
    },
    sendButton: {
        backgroundColor: '#ffda34',
        marginHorizontal: 20,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    sendButtonText: {
        color: '#121315',
        fontSize: 18,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1A1F28',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    maxLink: {
        color: '#ffda34',
        fontSize: 13,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#1E242E',
        borderRadius: 12,
        padding: 16,
        color: 'white',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    confirmButton: {
        backgroundColor: '#ffda34',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    confirmButtonText: {
        color: '#121315',
        fontSize: 18,
        fontWeight: '700',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
})
