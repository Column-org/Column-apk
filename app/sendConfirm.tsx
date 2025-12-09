import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, StatusBar, Image, Dimensions } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { FungibleAsset, formatAssetBalance } from '../services/movementAssets'
import RecipientAddressInput from '../components/send/RecipientAddressInput'
import TransactionSummary from '../components/send/TransactionSummary'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

export default function SendConfirm() {
    const router = useRouter()
    const params = useLocalSearchParams()
    const [recipientAddress, setRecipientAddress] = useState('')
    const [selectedToken, setSelectedToken] = useState<FungibleAsset | null>(null)
    const [amount, setAmount] = useState('')

    React.useEffect(() => {
        if (params.token) {
            try {
                const token = JSON.parse(params.token as string)
                setSelectedToken(token)
            } catch (error) {
                console.error('Error parsing token:', error)
            }
        }
        if (params.amount) {
            setAmount(params.amount as string)
        }
    }, [params.token, params.amount])

    const handleScan = () => {
        // TODO: Implement QR code scanner
        console.log('Open QR scanner')
    }

    const handleConfirm = () => {
        router.push({
            pathname: '/sendStatus',
            params: {
                token: params.token,
                amount: params.amount,
                recipient: recipientAddress
            }
        })
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                        <Ionicons name="arrow-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Confirm Send</Text>
                    <View style={{ width: 28 }} />
                </View>

                <View style={styles.content}>
                    <RecipientAddressInput
                        recipientAddress={recipientAddress}
                        onChangeAddress={setRecipientAddress}
                    />

                    <TransactionSummary
                        selectedToken={selectedToken}
                        amount={amount}
                    />

                    <Text style={styles.warningText}>
                        Please verify the recipient address before confirming the transaction.
                    </Text>
                </View>

                <View style={{ flex: 1 }} />

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.confirmButton, !recipientAddress && styles.confirmButtonDisabled]}
                        activeOpacity={0.7}
                        onPress={handleConfirm}
                        disabled={!recipientAddress}
                    >
                        <Text style={styles.confirmButtonText}>Confirm & Send</Text>
                    </TouchableOpacity>
                </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: IS_SMALL_SCREEN ? 16 : 50,
        paddingBottom: IS_SMALL_SCREEN ? 8 : 20,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        paddingHorizontal: 20,
    },
    warningText: {
        color: '#8B98A5',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
    },
    buttonContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    confirmButton: {
        backgroundColor: '#ffda34',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: '#3A3F4A',
    },
    confirmButtonText: {
        color: '#121315',
        fontSize: 16,
        fontWeight: '700',
    },
})
