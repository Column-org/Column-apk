import React from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { FungibleAsset, formatAssetBalance } from '../../services/movementAssets'

interface TransactionSummaryProps {
    selectedToken: FungibleAsset | null
    amount: string
}

export default function TransactionSummary({ selectedToken, amount }: TransactionSummaryProps) {
    return (
        <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Transaction Summary</Text>

            {selectedToken && (
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Token</Text>
                    <View style={styles.tokenInfo}>
                        {selectedToken.metadata.icon_uri && (
                            <Image
                                source={{ uri: selectedToken.metadata.icon_uri }}
                                style={styles.tokenIcon}
                            />
                        )}
                        <Text style={styles.summaryValue}>{selectedToken.metadata.symbol}</Text>
                    </View>
                </View>
            )}

            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount</Text>
                <Text style={styles.summaryValue}>{amount || '0'} {selectedToken?.metadata.symbol}</Text>
            </View>

            {selectedToken && (
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Available Balance</Text>
                    <Text style={styles.summaryValueSecondary}>
                        {formatAssetBalance(selectedToken.amount, selectedToken.metadata.decimals)}
                    </Text>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    summaryCard: {
        backgroundColor: '#222327',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    summaryTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryLabel: {
        color: '#8B98A5',
        fontSize: 14,
    },
    summaryValue: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    summaryValueSecondary: {
        color: '#8B98A5',
        fontSize: 14,
    },
    tokenInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tokenIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
})
