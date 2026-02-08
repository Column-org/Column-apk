import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { BlurView } from 'expo-blur'
import { AddressBookService, Contact } from '../../services/AddressBookService'

interface RecipientAddressInputProps {
    recipientAddress: string
    onChangeAddress: (text: string) => void
}

export default function RecipientAddressInput({ recipientAddress, onChangeAddress }: RecipientAddressInputProps) {
    const router = useRouter()
    const params = useLocalSearchParams()
    const [isContactModalVisible, setIsContactModalVisible] = useState(false)
    const [contacts, setContacts] = useState<Contact[]>([])

    useEffect(() => {
        loadContacts()
    }, [])

    const loadContacts = async () => {
        const loaded = await AddressBookService.getContacts()
        setContacts(loaded)
    }

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
                <View style={styles.inputActions}>
                    {recipientAddress ? (
                        <TouchableOpacity style={styles.iconButton} onPress={handleClear} activeOpacity={0.7}>
                            <Ionicons name="close-circle" size={20} color="white" />
                        </TouchableOpacity>
                    ) : (
                        <>
                            <TouchableOpacity style={styles.iconButton} onPress={() => setIsContactModalVisible(true)} activeOpacity={0.7}>
                                <Ionicons name="people-outline" size={20} color="#ffda34" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton} onPress={handleScan} activeOpacity={0.7}>
                                <Ionicons name="scan" size={20} color="#ffda34" />
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                <Modal
                    visible={isContactModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setIsContactModalVisible(false)}
                >
                    <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
                        <Pressable style={styles.modalBackdrop} onPress={() => setIsContactModalVisible(false)} />
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Choose Contact</Text>
                                <TouchableOpacity onPress={() => setIsContactModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.contactList}>
                                {contacts.length === 0 ? (
                                    <View style={styles.emptyContacts}>
                                        <Text style={styles.emptyText}>No contacts found</Text>
                                    </View>
                                ) : (
                                    contacts.map(contact => (
                                        <TouchableOpacity
                                            key={contact.address}
                                            style={styles.contactItem}
                                            onPress={() => {
                                                onChangeAddress(contact.address);
                                                setIsContactModalVisible(false);
                                            }}
                                        >
                                            <View style={styles.contactAvatar}>
                                                <Text style={styles.avatarText}>{contact.emoji}</Text>
                                            </View>
                                            <View>
                                                <Text style={styles.contactName}>{contact.name}</Text>
                                                <Text style={styles.contactAddress}>{contact.address.slice(0, 10)}...{contact.address.slice(-6)}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </ScrollView>
                        </View>
                    </BlurView>
                </Modal>
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
    inputActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        paddingHorizontal: 8,
        paddingVertical: 14,
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
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
    },
    contactList: {
        marginTop: 10,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
        gap: 12,
    },
    contactAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 20,
    },
    contactName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    contactAddress: {
        color: '#8B98A5',
        fontSize: 12,
    },
    emptyContacts: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        color: '#8B98A5',
        fontSize: 14,
    },
})
