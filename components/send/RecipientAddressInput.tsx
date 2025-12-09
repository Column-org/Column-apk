import React from 'react'
import { View, Text, StyleSheet, TextInput } from 'react-native'

interface RecipientAddressInputProps {
    recipientAddress: string
    onChangeAddress: (text: string) => void
}

export default function RecipientAddressInput({ recipientAddress, onChangeAddress }: RecipientAddressInputProps) {
    return (
        <View style={styles.addressContainer}>
            <Text style={styles.label}>Recipient Address</Text>
            <View style={styles.addressInputWrapper}>
                <TextInput
                    style={styles.addressInput}
                    placeholder="Enter wallet address..."
                    placeholderTextColor="#8B98A5"
                    value={recipientAddress}
                    onChangeText={onChangeAddress}
                    multiline
                />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    addressContainer: {
        marginBottom: 30,
    },
    label: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 12,
    },
    addressInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222327',
        borderRadius: 12,
    },
    addressInput: {
        flex: 1,
        color: 'white',
        fontSize: 14,
        padding: 16,
        minHeight: 80,
        textAlignVertical: 'top',
    },
})
