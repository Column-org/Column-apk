import React, { useState, useMemo } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Platform,
    ImageBackground,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useWallet } from '../context/WalletContext'
import { useTheme } from '../hooks/useTheme'
import { Modal, TextInput, Pressable } from 'react-native'
import { BlurView } from 'expo-blur'

const EMOJIS = ['💰', '🚀', '🌟', '💎', '🦊', '🐻', '🐼', '🐱', '🐶', '🦄']

const AccountCenter = () => {
    const { address: activeAddress, allWallets, switchWallet, updateWallet, isLoading } = useWallet()
    const { getThemeImage } = useTheme()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'Type' | 'Recent' | 'Value'>('Type')

    // Edit State
    const [isEditModalVisible, setIsEditModalVisible] = useState(false)
    const [editingWallet, setEditingWallet] = useState<any>(null)
    const [editName, setEditName] = useState('')
    const [editEmoji, setEditEmoji] = useState('💰')

    // In a real app, we'd group by actual source. 
    // Here we'll simulate the grouping as seen in the image for demonstration,
    // or logically group by type.
    const groupedWallets = useMemo(() => {
        const mnemonics = allWallets.filter(w => w.type === 'mnemonic')
        const privateKeys = allWallets.filter(w => w.type === 'privateKey')

        // For demo purposes and to match the image, we might split mnemonics if there's more than one
        // or just label them "Recovery Phrase".
        return [
            {
                title: 'Recovery Phrase 1',
                data: mnemonics.slice(0, 1)
            },
            {
                title: 'Recovery Phrase 2',
                data: mnemonics.slice(1)
            },
            {
                title: 'Private Key',
                data: privateKeys
            }
        ].filter(group => group.data.length > 0)
    }, [allWallets])

    const formatAddress = (address: string) => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`
    }

    const openEditModal = (wallet: any) => {
        setEditingWallet(wallet)
        setEditName(wallet.name)
        setEditEmoji(wallet.emoji || '💰')
        setIsEditModalVisible(true)
    }

    const handleSaveEdit = async () => {
        if (editingWallet) {
            await updateWallet(editingWallet.address, {
                name: editName,
                emoji: editEmoji
            })
            setIsEditModalVisible(false)
            setEditingWallet(null)
        }
    }

    const handleSwitchWallet = async (address: string) => {
        if (address === activeAddress) return
        await switchWallet(address)
    }

    const renderWalletItem = (wallet: any) => {
        const isActive = wallet.address === activeAddress

        return (
            <TouchableOpacity
                key={wallet.address}
                style={[styles.walletItem, isActive && styles.activeWalletItem]}
                onPress={() => handleSwitchWallet(wallet.address)}
                disabled={isLoading}
            >
                <View style={styles.walletItemLeft}>
                    <View style={styles.avatarContainer}>
                        {wallet.emoji ? (
                            <View style={styles.emojiAvatar}>
                                <Text style={styles.emojiText}>{wallet.emoji}</Text>
                            </View>
                        ) : (
                            <Ionicons name="person-circle" size={44} color={isActive ? "#FFFFFF" : "#8B98A5"} />
                        )}
                    </View>
                    <View style={styles.walletDetails}>
                        <Text style={styles.walletName}>{wallet.name}</Text>
                        <Text style={[styles.walletAddress, isActive && styles.activeText]}>{formatAddress(wallet.address)}</Text>
                    </View>
                </View>
                <View style={styles.walletRight}>
                    <TouchableOpacity
                        style={styles.editIcon}
                        onPress={(e) => {
                            e.stopPropagation();
                            openEditModal(wallet);
                        }}
                    >
                        <Ionicons name="settings-outline" size={20} color="#8B98A5" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        )
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Account Center</Text>
                    <View style={{ width: 42 }} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {groupedWallets.map((group, index) => (
                        <View key={index} style={styles.groupContainer}>
                            <TouchableOpacity style={styles.groupHeader}>
                                <Text style={styles.groupTitle}>{group.title}</Text>
                                <Ionicons name="chevron-up" size={18} color="#FFFFFF" />
                            </TouchableOpacity>

                            <View style={styles.walletList}>
                                {group.data.map(renderWalletItem)}
                            </View>
                        </View>
                    ))}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Footer Action */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => {
                            router.push('/web3-setup' as any)
                        }}
                    >
                        <Ionicons name="add" size={24} color="#ffda34" />
                        <Text style={styles.addButtonText}>Add Account</Text>
                    </TouchableOpacity>
                </View>

                {/* Edit Modal */}
                <Modal
                    visible={isEditModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setIsEditModalVisible(false)}
                >
                    <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
                        <Pressable style={styles.modalBackdrop} onPress={() => setIsEditModalVisible(false)} />
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Edit Wallet</Text>
                                <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="white" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.editSection}>
                                <Text style={styles.inputLabel}>Wallet Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editName}
                                    onChangeText={setEditName}
                                    placeholder="Enter wallet name"
                                    placeholderTextColor="#8B98A5"
                                />
                            </View>

                            <View style={styles.editSection}>
                                <Text style={styles.inputLabel}>Wallet Icon</Text>
                                <View style={styles.emojiGrid}>
                                    {EMOJIS.map(emoji => (
                                        <TouchableOpacity
                                            key={emoji}
                                            style={[styles.emojiItem, editEmoji === emoji && styles.selectedEmoji]}
                                            onPress={() => setEditEmoji(emoji)}
                                        >
                                            <Text style={styles.emojiLarge}>{emoji}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </Modal>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121315',
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50, // Match Header.tsx for large screens, moves it up compared to SafeAreaView + padding
        paddingBottom: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginVertical: 16,
        gap: 8,
    },
    tab: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    activeTab: {
        backgroundColor: 'rgba(255, 218, 52, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 218, 52, 0.3)',
    },
    tabText: {
        color: '#8B98A5',
        fontSize: 15,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#ffda34',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    groupContainer: {
        marginBottom: 32,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    groupTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    walletList: {
        gap: 16,
    },
    walletItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeWalletItem: {
        borderColor: '#FFFFFF',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    walletItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
    },
    emojiAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emojiText: {
        fontSize: 24,
    },
    avatarContainer: {},
    walletDetails: {
        flex: 1,
        gap: 2,
    },
    walletName: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    walletAddress: {
        color: '#8B98A5',
        fontSize: 15,
    },
    activeText: {
        color: '#FFFFFF',
    },
    walletRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    editIcon: {
        padding: 4,
    },
    walletValue: {},
    valueText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#121315',
        paddingBottom: Platform.OS === 'ios' ? 34 : 24,
        paddingTop: 16,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffda34',
        paddingVertical: 18,
        borderRadius: 20,
        gap: 8,
    },
    addButtonText: {
        color: '#000000',
        fontSize: 18,
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
        marginBottom: 32,
    },
    modalTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
    },
    editSection: {
        marginBottom: 24,
    },
    inputLabel: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        marginLeft: 4,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 18,
        color: 'white',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    emojiItem: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedEmoji: {
        borderColor: '#ffda34',
        backgroundColor: 'rgba(255, 218, 52, 0.1)',
    },
    emojiLarge: {
        fontSize: 32,
    },
    saveButton: {
        backgroundColor: '#ffda34',
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 16,
    },
    saveButtonText: {
        color: '#000000',
        fontSize: 18,
        fontWeight: '700',
    },
})

export default AccountCenter
