import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Pressable, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { AddressBookService, Contact } from '../../services/AddressBookService';

const EMOJIS = ['👤', '💼', '🏠', '🏦', '🦊', '🐼', '🐱', '🐶', '🦄', '🌟'];

export default function AddressBook() {
    const router = useRouter();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [emoji, setEmoji] = useState('👤');
    const [isTrusted, setIsTrusted] = useState(false);

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        const loaded = await AddressBookService.getContacts();
        setContacts(loaded);
    };

    const handleSave = async () => {
        if (!name.trim() || !address.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        await AddressBookService.addContact({ name, address, emoji, isTrusted });
        setIsAddModalVisible(false);
        setEditingContact(null);
        setName('');
        setAddress('');
        setEmoji('👤');
        setIsTrusted(false);
        loadContacts();
    };

    const handleEdit = (contact: Contact) => {
        setEditingContact(contact);
        setName(contact.name);
        setAddress(contact.address);
        setEmoji(contact.emoji);
        setIsTrusted(contact.isTrusted || false);
        setIsAddModalVisible(true);
    };

    const handleDelete = async (address: string) => {
        Alert.alert(
            'Delete Contact',
            'Are you sure you want to remove this contact?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await AddressBookService.removeContact(address);
                        loadContacts();
                    }
                }
            ]
        );
    };

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Address Book</Text>
                    <TouchableOpacity
                        onPress={() => {
                            setEditingContact(null);
                            setName('');
                            setAddress('');
                            setEmoji('👤');
                            setIsTrusted(false);
                            setIsAddModalVisible(true);
                        }}
                        style={styles.addButton}
                    >
                        <Ionicons name="add" size={26} color="#ffda34" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {contacts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="book-outline" size={64} color="rgba(255, 218, 52, 0.2)" />
                            <Text style={styles.emptyText}>Your address book is empty</Text>
                            <Text style={styles.emptySubtext}>Add contacts to easily send funds later.</Text>
                        </View>
                    ) : (
                        contacts.map((contact) => (
                            <View key={contact.address} style={styles.contactItem}>
                                <View style={styles.contactLeft}>
                                    <View style={styles.avatarContainer}>
                                        <Text style={styles.avatarText}>{contact.emoji}</Text>
                                    </View>
                                    <View style={styles.contactDetails}>
                                        <View style={styles.nameRow}>
                                            <Text style={styles.contactName}>{contact.name}</Text>
                                            {contact.isTrusted && (
                                                <View style={styles.safeBadge}>
                                                    <Ionicons name="shield-checkmark" size={10} color="#00FFA3" />
                                                    <Text style={styles.safeBadgeText}>SAFE</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.contactAddress}>{formatAddress(contact.address)}</Text>
                                    </View>
                                </View>
                                <View style={styles.contactActions}>
                                    <TouchableOpacity onPress={() => handleEdit(contact)} style={styles.actionIcon}>
                                        <Ionicons name="pencil" size={18} color="#8B98A5" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(contact.address)} style={styles.actionIcon}>
                                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                    <View style={{ height: 100 }} />
                </ScrollView>

                <Modal
                    visible={isAddModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setIsAddModalVisible(false)}
                >
                    <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
                        <Pressable style={styles.modalBackdrop} onPress={() => setIsAddModalVisible(false)} />
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{editingContact ? 'Edit Contact' : 'New Contact'}</Text>
                                <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="white" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.formContent}>
                                <View style={styles.inputSection}>
                                    <Text style={styles.inputLabel}>Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Contact Name"
                                        placeholderTextColor="#8B98A5"
                                    />
                                </View>

                                <View style={styles.inputSection}>
                                    <Text style={styles.inputLabel}>Wallet Address</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={address}
                                        onChangeText={setAddress}
                                        placeholder="0x..."
                                        placeholderTextColor="#8B98A5"
                                        autoCapitalize="none"
                                    />
                                </View>

                                <View style={styles.inputSection}>
                                    <Text style={styles.inputLabel}>Icon</Text>
                                    <View style={styles.emojiGrid}>
                                        {EMOJIS.map(e => (
                                            <TouchableOpacity
                                                key={e}
                                                style={[styles.emojiItem, emoji === e && styles.selectedEmoji]}
                                                onPress={() => setEmoji(e)}
                                            >
                                                <Text style={styles.emojiLarge}>{e}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.inputSection}>
                                    <View style={styles.trustedRow}>
                                        <View>
                                            <Text style={styles.inputLabel}>Safe Label</Text>
                                            <Text style={styles.inputSublabel}>Mark as trusted address</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => setIsTrusted(!isTrusted)}
                                            style={[styles.toggle, isTrusted && styles.toggleActive]}
                                        >
                                            <View style={[styles.toggleDot, isTrusted && styles.toggleDotActive]} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                    <Text style={styles.saveButtonText}>Save Contact</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </BlurView>
                </Modal>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121315',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    backButton: {
        padding: 4,
    },
    addButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 20,
    },
    emptySubtext: {
        color: '#8B98A5',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    contactLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 24,
    },
    contactDetails: {
        gap: 2,
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    contactName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    safeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 255, 163, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 2,
    },
    safeBadgeText: {
        color: '#00FFA3',
        fontSize: 9,
        fontWeight: '800',
    },
    contactAddress: {
        color: '#8B98A5',
        fontSize: 13,
    },
    trustedRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 16,
        borderRadius: 16,
    },
    inputSublabel: {
        color: '#8B98A5',
        fontSize: 12,
        marginTop: 2,
    },
    toggle: {
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#2A2F3A',
        padding: 2,
    },
    toggleActive: {
        backgroundColor: '#ffda34',
    },
    toggleDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#8B98A5',
    },
    toggleDotActive: {
        transform: [{ translateX: 20 }],
        backgroundColor: '#121315',
    },
    contactActions: {
        flexDirection: 'row',
        gap: 16,
    },
    actionIcon: {
        padding: 4,
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
        maxHeight: '80%',
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
    formContent: {
        gap: 20,
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
});


