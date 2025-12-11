import React from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'

interface RecipientAddressInputProps {
    recipientAddress: string
    onChangeAddress: (text: string) => void
}

export default function RecipientAddressInput({ recipientAddress, onChangeAddress }: RecipientAddressInputProps) {
    const router = useRouter()
    const params = useLocalSearchParams()

    const handleScan = () => {
        // Pass current params to QR scanner so it can return with them
        router.push({
            pathname: '/qrScanner',
            params: {
                token: params.token,
                amount: params.amount,
            }
        })
    }

    const handleClear = () => {
        onChangeAddress('')
    }

    // Validate Movement/Aptos address format (0x followed by exactly 64 hex characters)
    const isValidAddress = (address: string): boolean => {
        if (!address) return false
        // Must be 0x followed by exactly 64 hexadecimal characters (total length 66)
        const hexRegex = /^0x[a-fA-F0-9]{64}$/
        return hexRegex.test(address)
    }

    const addressStatus = recipientAddress ? (isValidAddress(recipientAddress) ? 'valid' : 'invalid') : null

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
                    multiline={true}
                />
                {recipientAddress ? (
                    <TouchableOpacity style={styles.iconButton} onPress={handleClear} activeOpacity={0.7}>
                        <Ionicons name="close-circle" size={20} color="white" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.iconButton} onPress={handleScan} activeOpacity={0.7}>
                        <Ionicons name="scan" size={20} color="#ffda34" />
                    </TouchableOpacity>
                )}
            </View>
            {addressStatus && (
                <View style={styles.verificationContainer}>
                    <Ionicons
                        name={addressStatus === 'valid' ? 'checkmark-circle' : 'close-circle'}
                        size={16}
                        color={addressStatus === 'valid' ? '#10B981' : '#EF4444'}
                    />
                    <Text style={[styles.verificationText, addressStatus === 'valid' ? styles.validText : styles.invalidText]}>
                        {addressStatus === 'valid' ? 'Valid Movement address' : 'Invalid address format'}
                    </Text>
                </View>
            )}
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
        alignItems: 'flex-start',
        backgroundColor: '#222327',
        borderRadius: 12,
        paddingRight: 8,
    },
    addressInput: {
        flex: 1,
        color: 'white',
        fontSize: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
        minHeight: 48,
    },
    iconButton: {
        paddingHorizontal: 12,
        paddingVertical: 14,
        marginLeft: 4,
    },
    pasteText: {
        color: '#ffda34',
        fontSize: 14,
        fontWeight: '500',
    },
    verificationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 6,
    },
    verificationText: {
        fontSize: 12,
        fontWeight: '500',
    },
    validText: {
        color: '#10B981',
    },
    invalidText: {
        color: '#EF4444',
    },
})
