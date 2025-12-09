import React, { useCallback, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert, RefreshControl } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { usePrivy } from '@privy-io/expo'
import { useNetwork } from '../context/NetworkContext'
import * as Clipboard from 'expo-clipboard'
import { PendingClaimWithStatus, fetchPendingClaims } from '../services/pendingClaims'
import AlertModal from '../components/AlertModal'

function SkeletonCard() {
    return (
        <View style={styles.claimCard}>
            <View style={styles.claimHeader}>
                <View style={[styles.claimIconContainer, styles.skeleton]} />
                <View style={styles.claimHeaderInfo}>
                    <View style={[styles.skeletonText, { width: '60%', height: 20, marginBottom: 8 }]} />
                    <View style={[styles.skeletonText, { width: '80%', height: 14 }]} />
                </View>
                <View style={[styles.skeletonText, { width: 80, height: 24, borderRadius: 12 }]} />
            </View>
            <View style={styles.claimDetails}>
                <View style={styles.detailRow}>
                    <View style={[styles.skeletonText, { width: 80, height: 14 }]} />
                    <View style={[styles.skeletonText, { width: 120, height: 14 }]} />
                </View>
                <View style={styles.detailRow}>
                    <View style={[styles.skeletonText, { width: 60, height: 14 }]} />
                    <View style={[styles.skeletonText, { width: 80, height: 14 }]} />
                </View>
                <View style={styles.detailRow}>
                    <View style={[styles.skeletonText, { width: 70, height: 14 }]} />
                    <View style={[styles.skeletonText, { width: 100, height: 14 }]} />
                </View>
                <View style={styles.detailRow}>
                    <View style={[styles.skeletonText, { width: 70, height: 14 }]} />
                    <View style={[styles.skeletonText, { width: 100, height: 14 }]} />
                </View>
            </View>
        </View>
    )
}

export default function PendingClaims() {
    const router = useRouter()
    const { user } = usePrivy()
    const { network } = useNetwork()
    const [claims, setClaims] = useState<PendingClaimWithStatus[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [alertModal, setAlertModal] = useState<{
        visible: boolean
        type: 'success' | 'error' | 'info'
        title: string
        message: string
    }>({
        visible: false,
        type: 'success',
        title: '',
        message: '',
    })

    const walletAddress = user?.linked_accounts?.find(
        (account: any) => account.type === 'wallet' && account.chain_type === 'aptos'
    )?.address || ''

    const showLoadError = useCallback((error: unknown) => {
        Alert.alert(
            'Pending Claims',
            error instanceof Error ? error.message : 'Unable to load pending claims.'
        )
    }, [])

    const loadClaims = useCallback(async () => {
        const result = await fetchPendingClaims(network)
        setClaims(result)
    }, [network])

    const handleRefresh = useCallback(async () => {
        try {
            setIsRefreshing(true)
            await loadClaims()
        } catch (error) {
            showLoadError(error)
        } finally {
            setIsRefreshing(false)
        }
    }, [loadClaims, showLoadError])

    useFocusEffect(
        useCallback(() => {
            let isMounted = true
            const run = async () => {
                try {
                    setIsLoading(true)
                    await loadClaims()
                } catch (error) {
                    if (isMounted) {
                        showLoadError(error)
                    }
                } finally {
                    if (isMounted) {
                        setIsLoading(false)
                    }
                }
            }
            run()
            return () => {
                isMounted = false
            }
        }, [loadClaims, showLoadError])
    )

    const formatDate = (timestamp?: number) => {
        if (!timestamp) return 'Unknown'
        const date = new Date(timestamp * 1000)
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
    }

    const getTimeRemaining = (claim: PendingClaimWithStatus) => {
        const expiration = claim.chainExpiration ?? claim.expiration
        if (!expiration) return 'Unknown'
        const now = Date.now() / 1000
        const remaining = expiration - now

        if (remaining < 0) return 'Expired'

        const hours = Math.floor(remaining / 3600)
        const days = Math.floor(hours / 24)

        if (days > 0) return `${days}d remaining`
        if (hours > 0) return `${hours}h remaining`
        return 'Expiring soon'
    }

    const copyCode = async (code: string) => {
        await Clipboard.setStringAsync(code)
        setAlertModal({
            visible: true,
            type: 'success',
            title: 'Copied',
            message: 'Claim code copied to clipboard',
        })
    }

    const formatAddress = (address?: string) => {
        if (!address) return 'Unknown'
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    const readyCount = claims.filter((claim) => claim.status === 'ready').length

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#121315" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pending Claims</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor="#ffda34"
                        colors={['#ffda34']}
                    />
                }
            >
                {isLoading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : claims.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="gift-outline" size={64} color="#8B98A5" />
                        <Text style={styles.emptyTitle}>No Pending Claims</Text>
                        <Text style={styles.emptySubtitle}>
                            Codes you create on the Send screen will be saved here until they are claimed or expire.
                        </Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.summaryCard}>
                            <Ionicons name="gift" size={24} color="#ffda34" />
                            <View style={styles.summaryText}>
                                <Text style={styles.summaryTitle}>
                                    {readyCount} {readyCount === 1 ? 'Transfer' : 'Transfers'} Ready to Claim
                                </Text>
                                <Text style={styles.summarySubtitle}>
                                    {readyCount === claims.length
                                        ? 'All codes are ready to redeem'
                                        : 'Some codes are still syncing on-chain'}
                                </Text>
                            </View>
                        </View>

                        {claims.map((claim) => {
                            const claimAmount =
                                claim.chainAmountDisplay || `+${claim.amountDisplay} ${claim.tokenSymbol}`
                            const badgeText =
                                claim.status === 'ready'
                                    ? getTimeRemaining(claim)
                                    : claim.status === 'unknown'
                                    ? 'Verifying...'
                                    : 'Unavailable'
                            const createdAt = formatDate(claim.chainCreatedAt ?? claim.createdAt)
                            const expiresAt = formatDate(claim.chainExpiration ?? claim.expiration)

                            return (
                                <View key={claim.code} style={styles.claimCard}>
                                <View style={styles.claimHeader}>
                                    <View style={styles.claimIconContainer}>
                                        <Ionicons name="arrow-down" size={24} color="#ffda34" />
                                    </View>
                                    <View style={styles.claimHeaderInfo}>
                                        <Text style={styles.claimAmount}>
                                                {claimAmount}
                                            </Text>
                                            <Text style={styles.claimSender}>
                                                Created from {formatAddress(claim.sender)}
                                            </Text>
                                        </View>
                                        <View style={styles.claimBadge}>
                                            <Text style={styles.claimBadgeText}>{badgeText}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.claimDetails}>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Claim Code</Text>
                                            <View style={styles.codeContainer}>
                                                <Text style={styles.codeText}>{claim.code}</Text>
                                                <TouchableOpacity
                                                    onPress={() => copyCode(claim.code)}
                                                    style={styles.copyButton}
                                                >
                                                    <Ionicons name="copy-outline" size={18} color="#ffda34" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Type</Text>
                                            <Text style={styles.detailValue}>{claim.type.toUpperCase()}</Text>
                                        </View>

                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Created</Text>
                                            <Text style={styles.detailValue}>{createdAt}</Text>
                                        </View>

                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Expires</Text>
                                            <Text style={styles.detailValue}>{expiresAt}</Text>
                                        </View>
                                    </View>
                                </View>
                            )
                        })}
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            <AlertModal
                visible={alertModal.visible}
                type={alertModal.type}
                title={alertModal.title}
                message={alertModal.message}
                onClose={() => setAlertModal({ ...alertModal, visible: false })}
            />
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#8B98A5',
        fontSize: 14,
        marginTop: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 8,
    },
    emptySubtitle: {
        color: '#8B98A5',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 195, 13, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 195, 13, 0.3)',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 16,
    },
    summaryText: {
        flex: 1,
        marginLeft: 12,
    },
    summaryTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    summarySubtitle: {
        color: '#8B98A5',
        fontSize: 13,
    },
    claimCard: {
        backgroundColor: '#222327',
        borderRadius: 16,
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 16,
    },
    skeleton: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    skeletonText: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 4,
    },
    claimHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    claimIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 195, 13, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    claimHeaderInfo: {
        flex: 1,
    },
    claimAmount: {
        color: '#10B981',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    claimSender: {
        color: '#8B98A5',
        fontSize: 13,
    },
    claimBadge: {
        backgroundColor: 'rgba(255, 195, 13, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    claimBadgeText: {
        color: '#ffda34',
        fontSize: 12,
        fontWeight: '600',
    },
    claimDetails: {
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    detailLabel: {
        color: '#8B98A5',
        fontSize: 14,
    },
    detailValue: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    codeText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'monospace',
    },
    copyButton: {
        padding: 4,
    },
})
