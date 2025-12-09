import React from 'react'
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native'
import { FungibleAsset } from '../../services/movementAssets'
import TokenSelector from './TokenSelector'
import AmountInput from './AmountInput'

interface CodeTransferFormProps {
    selectedToken: FungibleAsset | null
    onSelectToken: () => void
    displayAmount: string
    onChangeAmount: (value: string) => void
    expirationHours: string
    onChangeExpiration: (value: string) => void
    onSubmit: () => void
    isSubmitting: boolean
    generatedCode: string | null
}

export default function CodeTransferForm({
    selectedToken,
    onSelectToken,
    displayAmount,
    onChangeAmount,
    expirationHours,
    onChangeExpiration,
    onSubmit,
    isSubmitting,
    generatedCode,
}: CodeTransferFormProps) {
    const isDisabled = !selectedToken || !displayAmount || parseFloat(displayAmount) <= 0 || isSubmitting

    return (
        <>
            <TokenSelector selectedToken={selectedToken} onPress={onSelectToken} />

            <AmountInput
                displayAmount={displayAmount}
                selectedToken={selectedToken}
                onChangeAmount={onChangeAmount}
            />

            <View style={styles.expirationContainer}>
                <Text style={styles.expirationLabel}>Expiration (hours)</Text>
                <TextInput
                    style={styles.expirationInput}
                    placeholder="24"
                    placeholderTextColor="#8B98A5"
                    keyboardType="numeric"
                    value={expirationHours}
                    onChangeText={onChangeExpiration}
                />
                <Text style={styles.expirationHint}>
                    Recipients can claim the assets up until this time. After expiration, claiming refunds the funds.
                </Text>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.sendButton, isDisabled && styles.sendButtonDisabled]}
                    activeOpacity={0.7}
                    disabled={isDisabled}
                    onPress={onSubmit}
                >
                    <Text style={styles.sendButtonText}>{isSubmitting ? 'Creating Transfer...' : 'Create Transfer Code'}</Text>
                </TouchableOpacity>
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    expirationContainer: {
        marginHorizontal: 20,
        marginTop: 20,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#222327',
    },
    expirationLabel: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    expirationInput: {
        backgroundColor: '#1a1d22',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: 'white',
        fontSize: 16,
    },
    expirationHint: {
        color: '#8B98A5',
        fontSize: 12,
        marginTop: 8,
        lineHeight: 18,
    },
    buttonContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 24,
    },
    sendButton: {
        backgroundColor: '#ffda34',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#3A3F4A',
    },
    sendButtonText: {
        color: '#121315',
        fontSize: 16,
        fontWeight: '700',
    },
})

