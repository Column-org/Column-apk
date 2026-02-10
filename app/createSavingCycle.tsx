import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Switch, ActivityIndicator, Dimensions, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useWallet } from '../context/WalletContext'
import { useNetwork } from '../context/NetworkContext'
import { toBaseUnit, fromBaseUnit, createCycle, getFABalance } from '../services/movement_service/savingCycleService'
import { useToast } from '../context/ToastContext'
import { DateRangePicker } from '../components/DateRangePicker'
import { TOKEN_METADATA } from '../constants/tokenMetadata'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

interface AllowedAsset {
    address: string
    name: string
    symbol: string
    decimals: number
    logoUrl?: string
    amount?: string
}

export default function CreateSavingCycle() {
    const router = useRouter()
    const { address: walletAddress, signRawHash: web3SignRawHash, account: web3Account, walletPublicKey } = useWallet()
    const { network } = useNetwork()

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [initialDeposit, setInitialDeposit] = useState('')
    const [isGoalBased, setIsGoalBased] = useState(true)
    const [goalAmount, setGoalAmount] = useState('')
    const [startDateTime, setStartDateTime] = useState(new Date())
    const [endDateTime, setEndDateTime] = useState(() => {
        const future = new Date()
        future.setDate(future.getDate() + 30)
        return future
    })
    const [creating, setCreating] = useState(false)
    const [penaltyPercentage, setPenaltyPercentage] = useState(5) // Default 5%
    const toast = useToast()
    const [allowedAssets, setAllowedAssets] = useState<AllowedAsset[]>([])
    const [selectedAsset, setSelectedAsset] = useState<AllowedAsset | null>(null)
    const [loadingAssets, setLoadingAssets] = useState(true)



    // Hardcoded USDC asset logic
    useEffect(() => {
        const loadBalance = async () => {
            if (!walletAddress) return
            setLoadingAssets(true)

            try {
                // USDC address from contract: 0xb89077cfd2a82a0c1450534d49cfd5f2707643155273069bc23a912bcfefdee7
                const usdcMetadata = '0xb89077cfd2a82a0c1450534d49cfd5f2707643155273069bc23a912bcfefdee7'
                console.log('Fetching USDC balance for:', walletAddress)
                const balance = await getFABalance(walletAddress, usdcMetadata, network)
                console.log('USDC balance raw:', balance)

                const usdcAsset: AllowedAsset = {
                    address: usdcMetadata,
                    name: 'USDC.e',
                    symbol: 'USDC.e',
                    decimals: 6, // Standard USDC decimals
                    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
                    amount: balance
                }

                setAllowedAssets([usdcAsset])
                setSelectedAsset(usdcAsset)
            } catch (error) {
                console.error('Failed to load USDC balance:', error)
            } finally {
                setLoadingAssets(false)
            }
        }

        loadBalance()
    }, [walletAddress, network])

    const buildSignHash = () => {
        return async (address: string, hash: string) => {
            const { signature } = await web3SignRawHash(hash as any)

            if (!signature) {
                throw new Error('No signature returned from signing function')
            }

            return {
                data: {
                    signature,
                    public_key: walletPublicKey,
                },
            }
        }
    }

    const handleCreate = async () => {
        // Validation
        if (!name.trim()) {
            toast.show('Error', { data: { message: 'Please enter a name for your saving goal' }, type: 'error' })
            return
        }

        if (!initialDeposit || parseFloat(initialDeposit) <= 0) {
            toast.show('Error', { data: { message: 'Please enter a valid initial deposit' }, type: 'error' })
            return
        }

        if (isGoalBased && (!goalAmount || parseFloat(goalAmount) <= parseFloat(initialDeposit))) {
            toast.show('Error', { data: { message: 'Goal amount must be greater than initial deposit' }, type: 'error' })
            return
        }

        const startTimestamp = Math.floor(startDateTime.getTime() / 1000)
        const endTimestamp = Math.floor(endDateTime.getTime() / 1000)

        if (startTimestamp >= endTimestamp) {
            toast.show('Error', { data: { message: 'End date must be after start date' }, type: 'error' })
            return
        }

        if (startTimestamp < Math.floor(Date.now() / 1000)) {
            toast.show('Error', { data: { message: 'Start date cannot be in the past' }, type: 'error' })
            return
        }

        if (network !== 'testnet') {
            toast.show('Notice', { data: { message: 'Saving cycles are only available on testnet' }, type: 'info' })
            return
        }

        setCreating(true)

        if (!selectedAsset) {
            toast.show('Error', { data: { message: 'No asset selected' }, type: 'error' })
            return
        }

        try {
            const result = await createCycle(
                walletAddress || '',
                name,
                description,
                startTimestamp,
                endTimestamp,
                selectedAsset.address,
                toBaseUnit(parseFloat(initialDeposit), selectedAsset.decimals),
                isGoalBased ? toBaseUnit(parseFloat(goalAmount), selectedAsset.decimals) : 0,
                penaltyPercentage,
                buildSignHash(),
                network
            )

            if (result.success) {
                toast.show('Success', { data: { message: 'Saving cycle created successfully!' }, type: 'success' })

                // Navigate back after a short delay
                setTimeout(() => {
                    router.back()
                }, 2000)
            } else {
                toast.show('Failed', { data: { message: result.error || 'Failed to create saving cycle' }, type: 'error' })
            }
        } catch (error: any) {
            console.error('Error creating cycle:', error)
            toast.show('Error', { data: { message: error.message || 'Failed to create saving cycle' }, type: 'error' })
        } finally {
            setCreating(false)
        }
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />



            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                    <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Saving Plan</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Form */}
                <View style={styles.formContainer}>
                    {/* Asset Info */}
                    {selectedAsset && (
                        <View style={styles.assetInfoCard}>
                            <View style={styles.assetContent}>
                                {selectedAsset.logoUrl && (
                                    <Image
                                        source={{ uri: selectedAsset.logoUrl }}
                                        style={styles.assetLogo}
                                    />
                                )}
                                <View style={styles.assetInfo}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={styles.assetName}>{selectedAsset.name}</Text>
                                    </View>
                                    <Text style={styles.assetSymbol}>{selectedAsset.symbol}</Text>
                                    <Text style={styles.assetBalance}>
                                        Balance: {selectedAsset.amount ? fromBaseUnit(selectedAsset.amount, selectedAsset.decimals).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Goal Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Buy a house"
                            placeholderTextColor="#8B98A5"
                            value={name}
                            onChangeText={setName}
                            maxLength={50}
                        />
                    </View>

                    {/* Description */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Add details about your goal"
                            placeholderTextColor="#8B98A5"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                            maxLength={200}
                        />
                    </View>

                    {/* Initial Deposit */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Initial Deposit ({selectedAsset?.symbol || 'MOVE'})</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            placeholderTextColor="#8B98A5"
                            value={initialDeposit}
                            onChangeText={setInitialDeposit}
                            keyboardType="decimal-pad"
                        />
                    </View>

                    {/* Goal-based Toggle */}
                    <View style={styles.switchGroup}>
                        <View>
                            <Text style={styles.label}>Goal-based Savings</Text>
                            <Text style={styles.switchSubtext}>
                                Set a target amount to reach
                            </Text>
                        </View>
                        <Switch
                            value={isGoalBased}
                            onValueChange={setIsGoalBased}
                            trackColor={{ false: '#3A3F4A', true: 'rgba(255, 195, 13, 0.3)' }}
                            thumbColor={isGoalBased ? '#ffda34' : '#8B98A5'}
                        />
                    </View>

                    {/* Goal Amount (conditional) */}
                    {isGoalBased && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Goal Amount ({selectedAsset?.symbol || 'MOVE'})</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0.00"
                                placeholderTextColor="#8B98A5"
                                value={goalAmount}
                                onChangeText={setGoalAmount}
                                keyboardType="decimal-pad"
                            />
                        </View>
                    )}

                    {/* Date Range Picker */}
                    <DateRangePicker
                        startDate={startDateTime}
                        endDate={endDateTime}
                        onStartDateChange={setStartDateTime}
                        onEndDateChange={setEndDateTime}
                    />

                    {/* Penalty Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Early Withdrawal Penalty</Text>
                        <View style={styles.penaltyContainer}>
                            {[3, 5, 10, 20].map((percent) => (
                                <TouchableOpacity
                                    key={percent}
                                    style={[
                                        styles.penaltyButton,
                                        penaltyPercentage === percent && styles.penaltyButtonActive
                                    ]}
                                    onPress={() => setPenaltyPercentage(percent)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.penaltyText,
                                        penaltyPercentage === percent && styles.penaltyTextActive
                                    ]}>
                                        {percent}%
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Info Card */}
                    <View style={styles.infoCard}>
                        <Ionicons name="information-circle" size={24} color="#ffda34" />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoTitle}>Creation Fee & Penalty</Text>
                            <Text style={styles.infoText}>
                                A creation fee will be deducted from your initial deposit.
                                Early withdrawals will incur a {penaltyPercentage}% penalty ({Math.floor(penaltyPercentage * 0.6 * 10) / 10}% to protocol, {Math.floor(penaltyPercentage * 0.4 * 10) / 10}% burned).
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Create Button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.createButton, creating && styles.createButtonDisabled]}
                    activeOpacity={0.8}
                    onPress={handleCreate}
                    disabled={creating}
                >
                    {creating ? (
                        <>
                            <ActivityIndicator size="small" color="#121315" />
                            <Text style={styles.createButtonText}>Creating...</Text>
                        </>
                    ) : (
                        <Text style={styles.createButtonText}>Create Saving Plan</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121315',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: IS_SMALL_SCREEN ? 16 : 50,
        paddingBottom: IS_SMALL_SCREEN ? 12 : 20,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    formContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    inputGroup: {
        marginBottom: IS_SMALL_SCREEN ? 16 : 24,
    },
    label: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#222327',
        borderWidth: 0,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: IS_SMALL_SCREEN ? 12 : 14,
        color: 'white',
        fontSize: 16,
    },
    textArea: {
        minHeight: IS_SMALL_SCREEN ? 70 : 80,
        textAlignVertical: 'top',
    },
    switchGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingVertical: 12,
    },
    switchSubtext: {
        color: '#8B98A5',
        fontSize: 12,
        marginTop: 4,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#222327',
        padding: 16,
        borderRadius: 12,
        borderWidth: 0,
        gap: 12,
        marginTop: IS_SMALL_SCREEN ? 16 : 20,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoTitle: {
        color: '#ffda34',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    infoText: {
        color: '#8B98A5',
        fontSize: 12,
        lineHeight: 18,
    },
    buttonContainer: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingBottom: 40,
        backgroundColor: '#121315',
    },
    createButton: {
        backgroundColor: '#ffda34',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    createButtonDisabled: {
        opacity: 0.6,
    },
    createButtonText: {
        color: '#121315',
        fontSize: 16,
        fontWeight: '700',
    },
    assetInfoCard: {
        backgroundColor: '#222327',
        padding: 20,
        borderRadius: 16,
        marginBottom: IS_SMALL_SCREEN ? 16 : 24,
        borderWidth: 0,
    },
    assetContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    assetLogo: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255, 195, 13, 0.1)',
    },
    assetInfo: {
        flex: 1,
    },
    assetName: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    assetSymbol: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '500',
    },
    assetBalance: {
        color: '#ffda34',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    penaltyContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    penaltyButton: {
        flex: 1,
        backgroundColor: '#222327',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#222327',
    },
    penaltyButtonActive: {
        backgroundColor: 'rgba(255, 218, 52, 0.1)',
        borderColor: '#ffda34',
    },
    penaltyText: {
        color: '#8B98A5',
        fontSize: 16,
        fontWeight: '600',
    },
    penaltyTextActive: {
        color: '#ffda34',
        fontWeight: '700',
    },
})
