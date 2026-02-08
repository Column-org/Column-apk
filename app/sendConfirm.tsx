import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, StatusBar, Image, Dimensions, Modal, Pressable, Platform, Alert } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { FungibleAsset, formatAssetBalance } from '../services/movementAssets'
import RecipientAddressInput from '../components/send/RecipientAddressInput'
import TransactionSummary from '../components/send/TransactionSummary'
import { AddressBookService, Contact } from '../services/AddressBookService'
import { BlurView } from 'expo-blur'

const EMOJIS = ['👤', '💼', '🏠', '🏦', '🦊', '🐼', '🐱', '🐶', '🦄', '🌟'];

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

export default function SendConfirm() {
    const router = useRouter()
    const params = useLocalSearchParams()
    const [recipientAddress, setRecipientAddress] = useState('')
    const [selectedToken, setSelectedToken] = useState<FungibleAsset | null>(null)
    const [amount, setAmount] = useState('')
    const [isSaved, setIsSaved] = useState(false)
    const [isSaveModalVisible, setIsSaveModalVisible] = useState(false)
    const [contactName, setContactName] = useState('')
    const [contactEmoji, setContactEmoji] = useState('👤')

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
        if (params.scannedAddress) {
            const addr = params.scannedAddress as string
            setRecipientAddress(addr)
            checkIfSaved(addr)
        }
    }, [params.token, params.amount, params.scannedAddress])

    const checkIfSaved = async (addr: string) => {
        if (!addr) return
        const contact = await AddressBookService.getContactByAddress(addr)
        setIsSaved(!!contact)
    }

    const handleSaveContact = async () => {
        if (!contactName.trim()) {
            Alert.alert('Error', 'Please enter a name');
            return;
        }
        await AddressBookService.addContact({
            name: contactName,
            address: recipientAddress,
            emoji: contactEmoji
        });
        setIsSaved(true);
        setIsSaveModalVisible(false);
    }

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

                    {!isSaved && recipientAddress && (
                        <TouchableOpacity
                            style={styles.addContactPrompt}
                            onPress={() => setIsSaveModalVisible(true)}
                        >
                            <Ionicons name="person-add-outline" size={20} color="#ffda34" />
                            <Text style={styles.addContactText}>Add recipient to Address Book</Text>
                        </TouchableOpacity>
                    )}

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

                <Modal
                    visible={isSaveModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setIsSaveModalVisible(false)}
                >
                    <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
                        <Pressable style={styles.modalBackdrop} onPress={() => setIsSaveModalVisible(false)} />
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Add to Contacts</Text>
                                <TouchableOpacity onPress={() => setIsSaveModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="white" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputSection}>
                                <Text style={styles.inputLabel}>Recipient Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={contactName}
                                    onChangeText={setContactName}
                                    placeholder="Enter contact name"
                                    placeholderTextColor="#8B98A5"
                                />
                            </View>

                            <View style={styles.inputSection}>
                                <Text style={styles.inputLabel}>Select Icon</Text>
                                <View style={styles.emojiGrid}>
                                    {EMOJIS.map(e => (
                                        <TouchableOpacity
                                            key={e}
                                            style={[styles.emojiItem, contactEmoji === e && styles.selectedEmoji]}
                                            onPress={() => setContactEmoji(e)}
                                        >
                                            <Text style={styles.emojiLarge}>{e}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveContact}>
                                <Text style={styles.saveButtonText}>Save Contact</Text>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </Modal>
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
    addContactPrompt: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(255, 218, 52, 0.1)',
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 218, 52, 0.2)',
    },
    addContactText: {
        color: '#ffda34',
        fontSize: 14,
        fontWeight: '600',
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
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
        backgroundColor: '#121315',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
    },
    inputSection: {
        marginBottom: 20,
    },
    inputLabel: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: 'white',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    emojiItem: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedEmoji: {
        borderColor: '#ffda34',
        backgroundColor: 'rgba(255, 218, 52, 0.1)',
    },
    emojiLarge: {
        fontSize: 28,
    },
    saveButton: {
        backgroundColor: '#ffda34',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: 'black',
        fontSize: 16,
        fontWeight: '700',
    },
})
