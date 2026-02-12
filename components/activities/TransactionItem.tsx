import React from 'react'
import { View, Text, StyleSheet, Pressable, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Transaction } from '../../services/movement_service/transactionHistory'

interface TransactionItemProps {
    tx: Transaction
    onPress: () => void
}

export const TransactionItem = ({ tx, onPress }: TransactionItemProps) => {

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

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp * 1000)
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }

    const formatAddress = (address: string) => {
        if (!address) return ''
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    const isSuccess = tx.success !== false
    const isAssetTransaction = tx.type === 'send' || tx.type === 'receive' || tx.type === 'swap'
    const isSend = tx.type === 'send'
    const MOVE_ICON = 'https://gateway.pinata.cloud/ipfs/QmUv8RVdgo6cVQzh7kxerWLatDUt4rCEFoCTkCVLuMAa27'

    return (
        <Pressable
            style={({ pressed }) => [
                styles.transactionItem,
                pressed && styles.transactionItemPressed
            ]}
            onPress={onPress}
        >
            <View style={styles.iconContainer}>
                {tx.type === 'swap' && tx.swapData ? (
                    // For swap: Show overlapping token images
                    <>
                        <View style={styles.swapIconContainer}>
                            <View style={styles.swapIconLeft}>
                                {tx.swapData.fromTokenLogo ? (
                                    <Image
                                        source={{ uri: tx.swapData.fromTokenLogo }}
                                        style={styles.swapTokenImage}
                                    />
                                ) : (
                                    <View style={styles.swapTokenPlaceholder}>
                                        <Text style={styles.swapTokenPlaceholderText}>
                                            {tx.swapData.fromToken.substring(0, 2)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.swapIconRight}>
                                {tx.swapData.toTokenLogo ? (
                                    <Image
                                        source={{ uri: tx.swapData.toTokenLogo }}
                                        style={styles.swapTokenImage}
                                    />
                                ) : (
                                    <View style={styles.swapTokenPlaceholder}>
                                        <Text style={styles.swapTokenPlaceholderText}>
                                            {tx.swapData.toToken.substring(0, 2)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={[styles.statusBadge, isSuccess ? styles.successBadge : styles.failedBadge]}>
                            <Ionicons
                                name={isSuccess ? 'checkmark' : 'close'}
                                size={10}
                                color="white"
                            />
                        </View>
                    </>
                ) : isAssetTransaction ? (
                    // For send/receive: Show asset icon with badge
                    <>
                        <View style={styles.transactionIcon}>
                            <Image
                                source={{ uri: MOVE_ICON }}
                                style={styles.assetImage}
                            />
                        </View>
                        <View style={[styles.statusBadge, isSuccess ? styles.successBadge : styles.failedBadge]}>
                            <Ionicons
                                name={isSuccess ? 'checkmark' : 'close'}
                                size={10}
                                color="white"
                            />
                        </View>
                    </>
                ) : (
                    // For contract/interaction: Show full circle with checkmark or X
                    <View style={[styles.transactionIcon, isSuccess ? styles.successCircle : styles.failedCircle]}>
                        <Ionicons
                            name={isSuccess ? 'checkmark' : 'close'}
                            size={24}
                            color="white"
                        />
                    </View>
                )}
            </View>
            <View style={styles.transactionDetails}>
                <Text style={styles.transactionName}>{getTransactionName(tx)}</Text>
                <Text style={styles.transactionDate}>
                    {tx.to && tx.type === 'send' && `To ${formatAddress(tx.to)}`}
                    {tx.from && tx.type === 'receive' && `From ${formatAddress(tx.from)}`}
                    {tx.type === 'contract' && (tx.functionName || 'Unknown')}
                </Text>
            </View>
            <View style={styles.transactionRight}>
                {tx.amount && (
                    <Text style={isSend ? styles.transactionAmountNegative : styles.transactionAmount}>
                        {isSend ? '-' : '+'}{tx.amount} {tx.token || 'MOVE'}
                    </Text>
                )}
                <Text style={styles.transactionTime}>{formatTime(tx.timestamp)}</Text>
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#222327',
        borderRadius: 16,
        marginHorizontal: 20,
        marginBottom: 8,
    },
    transactionItemPressed: {
        backgroundColor: '#2A2F38',
        opacity: 0.8,
    },
    iconContainer: {
        position: 'relative',
        marginRight: 12,
    },
    transactionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(139, 152, 165, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    assetImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    swapIconContainer: {
        width: 56,
        height: 48,
        position: 'relative',
    },
    swapIconLeft: {
        width: 36,
        height: 36,
        borderRadius: 18,
        position: 'absolute',
        left: 0,
        top: 6,
        backgroundColor: '#222327',
        borderWidth: 2,
        borderColor: '#222327',
        overflow: 'hidden',
    },
    swapIconRight: {
        width: 36,
        height: 36,
        borderRadius: 18,
        position: 'absolute',
        right: 0,
        top: 6,
        backgroundColor: '#222327',
        borderWidth: 2,
        borderColor: '#222327',
        overflow: 'hidden',
    },
    swapTokenImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    swapTokenPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ffda34',
        justifyContent: 'center',
        alignItems: 'center',
    },
    swapTokenPlaceholderText: {
        color: '#121315',
        fontSize: 14,
        fontWeight: '700',
    },
    statusBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#222327',
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
    transactionDetails: {
        flex: 1,
    },
    transactionName: {
        color: 'white',
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 3,
    },
    transactionDate: {
        color: '#8B98A5',
        fontSize: 12,
    },
    transactionRight: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 3,
    },
    transactionAmountNegative: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 3,
    },
    transactionTime: {
        color: '#8B98A5',
        fontSize: 12,
        marginTop: 3,
    },
})
