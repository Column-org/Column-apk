import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, StatusBar, Animated, Share, Alert, Modal, Dimensions } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { QrCodeSvg } from 'react-native-qr-svg'
import { BlurView } from 'expo-blur'
import { useTranslation } from 'react-i18next'
import * as Clipboard from 'expo-clipboard'
import { useWallet } from '../context/WalletContext'
import { useNetwork } from '../context/NetworkContext'
import { claimTransferWithCode } from '../services/movement_service/sendWithCode'
import { removePendingClaim } from '../services/pendingClaims'
import ClaimTransferForm from '../components/receive/ClaimTransferForm'
import { useToast } from '../context/ToastContext'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

export default function Receive() {
    const router = useRouter()
    const params = useLocalSearchParams<{ claimCode?: string }>()
    const { t } = useTranslation()
    const { address: walletAddress, signRawHash: web3SignRawHash, account: web3Account, walletPublicKey } = useWallet()
    const { network } = useNetwork()
    const [activeTab, setActiveTab] = useState<'qrcode' | 'code'>('qrcode')
    const [claimCode, setClaimCode] = useState('')
    const [isClaiming, setIsClaiming] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [successMessage, setSuccessMessage] = useState('Claim Successful!')
    const [lastClaimHash, setLastClaimHash] = useState<string | null>(null)
    const toast = useToast()

    // Public key handling

    // Format address for display
    const formatAddress = (address: string | null) => {
        if (!address) return 'No Wallet'
        return `${address.slice(0, 4)}...${address.slice(-4)}`
    }

    const showSuccessMessage = (message: string, txHash?: string | null) => {
        setSuccessMessage(message)
        setLastClaimHash(txHash ?? null)
        setShowSuccess(true)
    }

    const hideSuccessMessage = () => {
        setShowSuccess(false)
    }

    const handleCopy = async () => {
        if (walletAddress) {
            await Clipboard.setStringAsync(walletAddress)
            toast.show('Copied!', { type: 'success' })
        } else {
            toast.show('No wallet address to copy', { type: 'error' })
        }
    }

    const handleShare = async () => {
        if (walletAddress) {
            try {
                await Share.share({
                    message: `My Movement Wallet Address: ${walletAddress}`,
                    title: 'Movement Wallet Address',
                })
            } catch (error) {
                console.error('Error sharing:', error)
            }
        } else {
            toast.show('No wallet address to share', { type: 'error' })
        }
    }

    const buildSignHash = useCallback(() => {
        if (!walletPublicKey) {
            throw new Error('Wallet public key not available')
        }

        return async (address: string, hash: string) => {
            const { signature } = await web3SignRawHash(hash as any)

            if (!signature) {
                throw new Error('No signature returned from signing function')
            }

            return {
                data: {
                    signature,
                    public_key: walletPublicKey,
                },
            }
        }
    }, [web3SignRawHash, walletPublicKey])

    const handleClaimTransfer = useCallback(
        async (transferType: 'move' | 'fa') => {
            const trimmed = claimCode.trim()
            if (!walletAddress) {
                toast.show('No Wallet', { data: { message: 'Connect your Movement wallet before claiming.' }, type: 'error' })
                return
            }
            if (!trimmed) {
                toast.show('Invalid code', { data: { message: 'Enter a valid claim code.' }, type: 'error' })
                return
            }

            try {
                setIsClaiming(true)
                const signHash = buildSignHash()
                const result = await claimTransferWithCode(
                    {
                        senderAddress: walletAddress,
                        code: trimmed,
                    },
                    signHash,
                    network,
                    transferType
                )

                if (!result.success || !result.transactionHash) {
                    throw new Error(result.error || 'Claim failed')
                }

                if (walletAddress) {
                    await removePendingClaim(walletAddress, trimmed)
                }
                setClaimCode('')
                showSuccessMessage('Claim Successful!', result.transactionHash)
            } catch (error) {
                toast.show('Claim Failed', { data: { message: error instanceof Error ? error.message : 'Unable to claim transfer.' }, type: 'error' })
            } finally {
                setIsClaiming(false)
            }
        },
        [walletAddress, claimCode, network, buildSignHash]
    )

    useEffect(() => {
        const incoming = params.claimCode
        if (!incoming) return
        const claimValue = Array.isArray(incoming) ? incoming[0] : incoming
        if (typeof claimValue === 'string' && claimValue.length > 0) {
            setActiveTab('code')
            setClaimCode(claimValue)
        }
    }, [params.claimCode])

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <Modal
                visible={showSuccess}
                transparent={true}
                animationType="fade"
                onRequestClose={hideSuccessMessage}
                statusBarTranslucent
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={40} style={StyleSheet.absoluteFill} tint="dark" />
                    <TouchableOpacity
                        style={styles.modalDismiss}
                        activeOpacity={1}
                        onPress={hideSuccessMessage}
                    >
                        <View style={styles.modalContent}>
                            <View style={styles.successIcon}>
                                <Ionicons name="checkmark-circle" size={80} color="#34C759" />
                            </View>
                            <Text style={styles.successText}>{successMessage}</Text>
                            {lastClaimHash && (
                                <Text style={styles.successSubtext}>
                                    Tx: {lastClaimHash.slice(0, 6)}...{lastClaimHash.slice(-6)}
                                </Text>
                            )}
                            <TouchableOpacity
                                style={styles.dismissButton}
                                onPress={hideSuccessMessage}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.dismissButtonText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </View>
            </Modal>



            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
                removeClippedSubviews={true}
                overScrollMode="never"
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                        <Ionicons name="close" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('receive.title')}</Text>
                    <View style={{ width: 28 }} />
                </View>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'qrcode' && styles.activeTab]}
                        onPress={() => setActiveTab('qrcode')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabText, activeTab === 'qrcode' && styles.activeTabText]}>
                            QR Code
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'code' && styles.activeTab]}
                        onPress={() => setActiveTab('code')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabText, activeTab === 'code' && styles.activeTabText]}>
                            Code
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {activeTab === 'qrcode' ? (
                        <View style={styles.qrContainer}>
                            <View style={styles.qrCodePlaceholder}>
                                <QrCodeSvg
                                    value={walletAddress || 'No wallet connected'}
                                    frameSize={240}
                                    dotColor='#ffffff'
                                    backgroundColor='transparent'
                                />
                            </View>

                            <View style={styles.walletInfo}>
                                <View style={styles.walletTextContainer}>
                                    <Text style={styles.walletTitle}>Movement Wallet</Text>
                                    <Text style={styles.walletAddress}>{formatAddress(walletAddress)}</Text>
                                </View>
                                <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                                    <MaterialCommunityIcons name="wallet-outline" size={24} color="#ffda34" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <ClaimTransferForm
                            code={claimCode}
                            onChangeCode={setClaimCode}
                            onSubmit={handleClaimTransfer}
                            isSubmitting={isClaiming}
                        />
                    )}

                    {activeTab === 'qrcode' && (
                        <Text style={styles.warningText}>
                            This address is for receiving Movement assets only.
                        </Text>
                    )}
                </View>

                <View style={{ flex: 1 }} />

                {activeTab === 'qrcode' && (
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.copyButton} activeOpacity={0.7} onPress={handleCopy}>
                            <Ionicons name="copy-outline" size={20} color="white" />
                            <Text style={styles.buttonText}>Copy</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.shareButton} activeOpacity={0.7} onPress={handleShare}>
                            <Ionicons name="share-outline" size={20} color="white" />
                            <Text style={styles.buttonText}>Share</Text>
                        </TouchableOpacity>
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
    scrollView: {
        flex: 1,
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: IS_SMALL_SCREEN ? 16 : 50,
        paddingBottom: 10,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    qrContainer: {
        backgroundColor: '#222327',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
    },
    qrCodePlaceholder: {
        width: 280,
        height: 280,
        backgroundColor: '#222327',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        padding: 20,
    },
    walletInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    walletTextContainer: {
        flex: 1,
    },
    walletTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    walletAddress: {
        color: '#8B98A5',
        fontSize: 14,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    warningText: {
        color: '#8B98A5',
        fontSize: 14,
        textAlign: 'center',
        marginVertical: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    copyButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#222327',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    shareButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#222327',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 80,
        marginTop: 20,
        marginBottom: 20,
        backgroundColor: '#222327',
        borderRadius: 10,
        padding: 3,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    activeTab: {
        backgroundColor: '#121315',
    },
    tabText: {
        color: '#8B98A5',
        fontSize: 13,
        fontWeight: '600',
    },
    activeTabText: {
        color: 'white',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalDismiss: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    successIcon: {
        marginBottom: 24,
    },
    successText: {
        color: 'white',
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    successSubtext: {
        color: '#8B98A5',
        fontSize: 14,
        marginBottom: 32,
    },
    dismissButton: {
        backgroundColor: '#ffda34',
        paddingVertical: 14,
        paddingHorizontal: 48,
        borderRadius: 12,
    },
    dismissButtonText: {
        color: '#121315',
        fontSize: 16,
        fontWeight: '700',
    },
})
