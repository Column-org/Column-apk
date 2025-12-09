import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Linking, Image, Clipboard, Alert, Dimensions } from 'react-native'
import React from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Transaction } from '../services/movement_service/transactionHistory'
import { useNetwork } from '../context/NetworkContext'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

const TransactionDetails = () => {
    const router = useRouter()
    const params = useLocalSearchParams()
    const { network } = useNetwork()
    const transaction: Transaction | null = params.transaction ? JSON.parse(params.transaction as string) : null

    if (!transaction) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <Text style={styles.errorText}>Transaction not found</Text>
            </View>
        )
    }

    const getTransactionIcon = (type: Transaction['type']) => {
        switch (type) {
            case 'send':
                return { name: 'arrow-up', color: '#8B98A5' }
            case 'receive':
                return { name: 'arrow-down', color: '#ffda34' }
            case 'swap':
                return { name: 'swap-horizontal', color: '#8B98A5' }
            case 'contract':
                return { name: 'apps', color: '#8B98A5' }
            default:
                return { name: 'help-circle', color: '#8B98A5' }
        }
    }

    const getTransactionName = (tx: Transaction) => {
        switch (tx.type) {
            case 'send':
                return `Sent ${tx.token || 'MOVE'}`
            case 'receive':
                return `Received ${tx.token || 'MOVE'}`
            case 'swap':
                return 'Swap'
            case 'contract':
                return tx.functionName || 'Contract Call'
            default:
                return 'Transaction'
        }
    }

    const formatFullDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000)
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }

    const formatAddress = (address: string, truncate: boolean = false) => {
        if (!address) return ''
        if (truncate) {
            return `${address.slice(0, 10)}...${address.slice(-8)}`
        }
        return address
    }

    const copyToClipboard = (text: string, label: string) => {
        Clipboard.setString(text)
        Alert.alert('Copied!', `${label} copied to clipboard`)
    }

    const openExplorer = (hash: string) => {
        // Movement Network explorer URL format for transactions
        // Testnet uses 'testnet' parameter, not 'bardock testnet'
        const explorerUrl = network === 'testnet'
            ? `https://explorer.movementnetwork.xyz/txn/${hash}?network=testnet`
            : `https://explorer.movementnetwork.xyz/txn/${hash}?network=mainnet`
        Linking.openURL(explorerUrl)
    }

    const getNetworkName = () => {
        switch (network) {
            case 'testnet':
                return 'Movement Testnet'
            case 'mainnet':
                return 'Movement Mainnet'
            case 'devnet':
                return 'Movement Devnet'
            default:
                return 'Movement'
        }
    }

    const icon = getTransactionIcon(transaction.type)
    const isSuccess = transaction.success !== false
    const isSend = transaction.type === 'send'
    const isAssetTransaction = transaction.type === 'send' || transaction.type === 'receive' || transaction.type === 'swap'
    const MOVE_ICON = 'https://gateway.pinata.cloud/ipfs/QmUv8RVdgo6cVQzh7kxerWLatDUt4rCEFoCTkCVLuMAa27'

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{getTransactionName(transaction)}</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Transaction Icons */}
                <View style={styles.iconContainer}>
                    {transaction.type === 'swap' && transaction.swapData ? (
                        // For swap: Show overlapping token images
                        <View style={styles.iconWrapper}>
                            <View style={styles.swapIconContainer}>
                                <View style={styles.swapIconLeft}>
                                    {transaction.swapData.fromTokenLogo ? (
                                        <Image
                                            source={{ uri: transaction.swapData.fromTokenLogo }}
                                            style={styles.assetImage}
                                        />
                                    ) : (
                                        <View style={styles.tokenPlaceholder}>
                                            <Text style={styles.tokenPlaceholderText}>
                                                {transaction.swapData.fromToken.substring(0, 2)}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.swapIconRight}>
                                    {transaction.swapData.toTokenLogo ? (
                                        <Image
                                            source={{ uri: transaction.swapData.toTokenLogo }}
                                            style={styles.assetImage}
                                        />
                                    ) : (
                                        <View style={styles.tokenPlaceholder}>
                                            <Text style={styles.tokenPlaceholderText}>
                                                {transaction.swapData.toToken.substring(0, 2)}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <View style={[styles.statusBadge, isSuccess ? styles.successBadge : styles.failedBadge]}>
                                <Ionicons
                                    name={isSuccess ? 'checkmark' : 'close'}
                                    size={14}
                                    color="white"
                                />
                            </View>
                        </View>
                    ) : isAssetTransaction ? (
                        // For send/receive: Show asset icon with badge
                        <View style={styles.iconWrapper}>
                            <View style={styles.transactionIcon}>
                                <Image
                                    source={{ uri: MOVE_ICON }}
                                    style={styles.assetImage}
                                />
                            </View>
                            <View style={[styles.statusBadge, isSuccess ? styles.successBadge : styles.failedBadge]}>
                                <Ionicons
                                    name={isSuccess ? 'checkmark' : 'close'}
                                    size={14}
                                    color="white"
                                />
                            </View>
                        </View>
                    ) : (
                        // For contract/interaction: Show full circle with checkmark or X
                        <View style={[styles.transactionIcon, isSuccess ? styles.successCircle : styles.failedCircle]}>
                            <Ionicons
                                name={isSuccess ? 'checkmark' : 'close'}
                                size={50}
                                color="white"
                            />
                        </View>
                    )}
                </View>

                {/* Transaction Type Display */}
                <Text style={styles.typeText}>
                    {transaction.type === 'swap' && transaction.swapData
                        ? `${transaction.swapData.fromToken} → ${transaction.swapData.toToken}`
                        : getTransactionName(transaction)}
                </Text>

                {/* Main Details Card */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Date</Text>
                        <Text style={styles.detailValue}>
                            {formatFullDate(transaction.timestamp)}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Status</Text>
                        <Text style={[styles.detailValue, isSuccess ? styles.statusSuccess : styles.statusFailed]}>
                            {isSuccess ? 'Succeeded' : 'Failed'}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Network</Text>
                        <Text style={styles.detailValue}>{getNetworkName()}</Text>
                    </View>
                </View>

                {/* Transaction Details */}
                <View style={styles.detailsCard}>
                    <Text style={styles.sectionTitle}>Transaction Details</Text>

                    {transaction.type === 'send' && transaction.amount && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>You Paid</Text>
                            <Text style={styles.detailValueNegative}>
                                -{transaction.amount} {transaction.token || 'MOVE'}
                            </Text>
                        </View>
                    )}

                    {transaction.type === 'receive' && transaction.amount && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>You Received</Text>
                            <Text style={styles.detailValuePositive}>
                                +{transaction.amount} {transaction.token || 'MOVE'}
                            </Text>
                        </View>
                    )}

                    {transaction.type === 'swap' && transaction.swapData && (
                        <>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>You Paid</Text>
                                <Text style={styles.detailValueNegative}>
                                    -{transaction.swapData.fromAmount} {transaction.swapData.fromToken}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>You Received</Text>
                                <Text style={styles.detailValuePositive}>
                                    +{transaction.swapData.toAmount} {transaction.swapData.toToken}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Provider</Text>
                                <Text style={styles.detailValue}>Mosaic</Text>
                            </View>
                        </>
                    )}

                    {transaction.type === 'contract' && transaction.functionName && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Function</Text>
                            <Text style={styles.detailValue}>{transaction.functionName}</Text>
                        </View>
                    )}

                    {transaction.gasUsed && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Gas Used</Text>
                            <Text style={styles.detailValue}>{transaction.gasUsed}</Text>
                        </View>
                    )}
                </View>

                {/* Blockchain Details */}
                <View style={styles.detailsCard}>
                    <Text style={styles.sectionTitle}>Blockchain Details</Text>

                    {transaction.to && (
                        <View style={styles.detailRowWithCopy}>
                            <View style={styles.detailRowContent}>
                                <Text style={styles.detailLabel}>To</Text>
                                <Text style={[styles.detailValue, styles.addressText]}>
                                    {formatAddress(transaction.to, true)}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => copyToClipboard(transaction.to!, 'Address')}
                                style={styles.copyButton}
                            >
                                <Ionicons name="copy-outline" size={18} color="#8B98A5" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {transaction.from && (
                        <View style={styles.detailRowWithCopy}>
                            <View style={styles.detailRowContent}>
                                <Text style={styles.detailLabel}>From</Text>
                                <Text style={[styles.detailValue, styles.addressText]}>
                                    {formatAddress(transaction.from, true)}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => copyToClipboard(transaction.from!, 'Address')}
                                style={styles.copyButton}
                            >
                                <Ionicons name="copy-outline" size={18} color="#8B98A5" />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.detailRowWithCopy}>
                        <View style={styles.detailRowContent}>
                            <Text style={styles.detailLabel}>Transaction Hash</Text>
                            <Text style={[styles.detailValue, styles.addressText]}>
                                {formatAddress(transaction.hash, true)}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => copyToClipboard(transaction.hash, 'Transaction Hash')}
                            style={styles.copyButton}
                        >
                            <Ionicons name="copy-outline" size={18} color="#8B98A5" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Timestamp</Text>
                        <Text style={styles.detailValue}>
                            {new Date(transaction.timestamp * 1000).toISOString()}
                        </Text>
                    </View>

                    {transaction.version && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Block Number</Text>
                            <Text style={styles.detailValue}>{transaction.version}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.explorerButton}
                        onPress={() => openExplorer(transaction.hash)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.explorerButtonText}>View on Explorer</Text>
                        <Ionicons name="open-outline" size={18} color="#6B7CFF" />
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: IS_SMALL_SCREEN ? 16 : 50,
        paddingBottom: IS_SMALL_SCREEN ? 8 : 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    iconContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    iconWrapper: {
        position: 'relative',
    },
    transactionIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 195, 13, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    assetImage: {
        width: '100%',
        height: '100%',
    },
    swapIconContainer: {
        flexDirection: 'row',
        width: 80,
        height: 100,
        position: 'relative',
    },
    swapIconLeft: {
        width: 60,
        height: 60,
        borderRadius: 30,
        position: 'absolute',
        left: 0,
        top: 20,
        backgroundColor: '#121315',
        borderWidth: 3,
        borderColor: '#121315',
        overflow: 'hidden',
    },
    swapIconRight: {
        width: 60,
        height: 60,
        borderRadius: 30,
        position: 'absolute',
        right: 0,
        top: 20,
        backgroundColor: '#121315',
        borderWidth: 3,
        borderColor: '#121315',
        overflow: 'hidden',
    },
    tokenPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#ffda34',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tokenPlaceholderText: {
        color: '#121315',
        fontSize: 20,
        fontWeight: '700',
    },
    statusBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#121315',
    },
    successBadge: {
        backgroundColor: '#10B981',
    },
    failedBadge: {
        backgroundColor: '#EF4444',
    },
    successCircle: {
        backgroundColor: '#10B981',
    },
    failedCircle: {
        backgroundColor: '#EF4444',
    },
    typeText: {
        color: 'white',
        fontSize: 36,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
    },
    detailsCard: {
        backgroundColor: '#222327',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    detailRowWithCopy: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    detailRowContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    copyButton: {
        padding: 4,
    },
    detailLabel: {
        color: '#8B98A5',
        fontSize: 15,
        flex: 1,
    },
    detailValue: {
        color: 'white',
        fontSize: 15,
        fontWeight: '500',
        flex: 2,
        textAlign: 'right',
    },
    addressText: {
        fontSize: 13,
    },
    detailValuePositive: {
        color: '#10B981',
        fontSize: 15,
        fontWeight: '600',
    },
    detailValueNegative: {
        color: '#8B98A5',
        fontSize: 15,
        fontWeight: '600',
    },
    statusSuccess: {
        color: '#10B981',
    },
    statusFailed: {
        color: '#EF4444',
    },
    explorerButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        paddingVertical: 8,
    },
    explorerButtonText: {
        color: '#6B7CFF',
        fontSize: 15,
        fontWeight: '500',
    },
    errorText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 40,
    },
})

export default TransactionDetails
