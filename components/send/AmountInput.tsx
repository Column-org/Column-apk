import React from 'react'
import { View, Text, StyleSheet, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { FungibleAsset, formatAssetBalance } from '../../services/movementAssets'

interface AmountInputProps {
    displayAmount: string
    selectedToken: FungibleAsset | null
    onChangeAmount: (text: string) => void
}

export default function AmountInput({ displayAmount, selectedToken, onChangeAmount }: AmountInputProps) {
    return (
        <View style={styles.amountDisplay}>
            <TextInput
                style={styles.amountText}
                value={displayAmount}
                onChangeText={onChangeAmount}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#8B98A5"
                textAlign="center"
            />
            <View style={styles.balanceContainer}>
                <Ionicons name="wallet-outline" size={16} color="#8B98A5" />
                <Text style={styles.balanceText}>
                    {selectedToken
                        ? `${formatAssetBalance(selectedToken.amount, selectedToken.metadata.decimals)} ${selectedToken.metadata.symbol}`
                        : '0.00 MOVE'
                    }
                </Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    amountDisplay: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginTop: 80,
        flex: 1,
    },
    amountText: {
        color: 'white',
        fontSize: 64,
        fontWeight: '700',
        marginBottom: 8,
        backgroundColor: 'transparent',
        minWidth: 150,
    },
    usdValue: {
        color: '#8B98A5',
        fontSize: 18,
    },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#222327',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginTop: 20,
    },
    balanceText: {
        color: '#8B98A5',
        fontSize: 13,
    },
})
