import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, TextInput, ActivityIndicator, Alert, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { SwipeableTabWrapper } from '../../components/SwipeableTabWrapper'
import { useNetwork } from '../../context/NetworkContext'
import {
    checkCodeExists,
    checkFACodeExists,
    getTransferDetails,
    getFATransferDetails,
    isTransferClaimable,
    isFATransferClaimable,
    getTotalTransfers,
    getResourceEscrowAddress
} from '../../services/movement_service/transferCodeChecker'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

export default function Checker() {
    const { t } = useTranslation()
    const { network } = useNetwork()

    // Transfer code checker states
    const [codeInput, setCodeInput] = useState('')
    const [checking, setChecking] = useState(false)
    const [totalTransfers, setTotalTransfers] = useState(0)
    const [escrowAddress, setEscrowAddress] = useState('')
    const [featuresExpanded, setFeaturesExpanded] = useState(false)

    useEffect(() => {
        loadStats()
    }, [network])

    const loadStats = async () => {
        try {
            const total = await getTotalTransfers(network)
            const escrow = await getResourceEscrowAddress(network)
            setTotalTransfers(total)
            setEscrowAddress(escrow || '')
        } catch (err) {
            console.error('Failed to load stats:', err)
        }
    }

    const handleCheckCode = async () => {
        if (!codeInput.trim()) {
            Alert.alert('Error', 'Please enter a transfer code')
            return
        }

        setChecking(true)
        try {
            // Check both MOVE and FA codes
            const moveExists = await checkCodeExists(codeInput, network)
            const faExists = await checkFACodeExists(codeInput, network)

            if (!moveExists && !faExists) {
                Alert.alert('Invalid Code', 'This transfer code does not exist')
                setChecking(false)
                return
            }

            // Get details and claimability
            if (moveExists) {
                const details = await getTransferDetails(codeInput, network)
                const claimable = await isTransferClaimable(codeInput, network)

                if (details) {
                    const amount = (parseInt(details.amount) / 100000000).toFixed(8)
                    Alert.alert(
                        'Transfer Details (MOVE)',
                        `Sender: ${details.sender.slice(0, 10)}...${details.sender.slice(-8)}\n` +
                        `Amount: ${amount} MOVE\n` +
                        `Claimable: ${claimable ? 'Yes' : 'No (expired or claimed)'}\n` +
                        `Created: ${new Date(parseInt(details.created_at) / 1000).toLocaleString()}\n` +
                        `Expires: ${new Date(parseInt(details.expiration) / 1000).toLocaleString()}`
                    )
                }
            } else if (faExists) {
                const details = await getFATransferDetails(codeInput, network)
                const claimable = await isFATransferClaimable(codeInput, network)

                if (details) {
                    const amount = (parseInt(details.amount) / 100000000).toFixed(8)
                    Alert.alert(
                        'Transfer Details (FA)',
                        `Sender: ${details.sender.slice(0, 10)}...${details.sender.slice(-8)}\n` +
                        `Amount: ${amount}\n` +
                        `Claimable: ${claimable ? 'Yes' : 'No (expired or claimed)'}\n` +
                        `Created: ${new Date(parseInt(details.created_at) / 1000).toLocaleString()}\n` +
                        `Expires: ${new Date(parseInt(details.expiration) / 1000).toLocaleString()}`
                    )
                }
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to check code')
        } finally {
            setChecking(false)
        }
    }

    return (
        <SwipeableTabWrapper>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Transfer Checker</Text>
                    </View>

                    {/* Stats Section - Only show if data is available (testnet) */}
                    {(totalTransfers > 0 || escrowAddress) && (
                        <View style={styles.statsContainer}>
                            {totalTransfers > 0 && (
                                <View style={styles.statCard}>
                                    <Text style={styles.statValue}>{totalTransfers}</Text>
                                    <Text style={styles.statLabel}>Total Transfers</Text>
                                </View>
                            )}
                            {escrowAddress && (
                                <View style={[styles.statCard, styles.statCardWide]}>
                                    <Text style={styles.statValueSmall} numberOfLines={1} ellipsizeMode="middle">
                                        {escrowAddress.slice(0, 8)}...{escrowAddress.slice(-6)}
                                    </Text>
                                    <Text style={styles.statLabel}>Escrow Address</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Code Checker */}
                    <View style={styles.codeCheckerCard}>
                        <Text style={styles.codeCheckerTitle}>Check Transfer Code</Text>
                        <Text style={styles.codeCheckerSubtitle}>
                            Enter any transfer code to check its validity and details
                        </Text>
                        <View style={styles.codeInputContainer}>
                            <TextInput
                                style={styles.codeInput}
                                placeholder="Enter transfer code"
                                placeholderTextColor="#8B98A5"
                                value={codeInput}
                                onChangeText={setCodeInput}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <TouchableOpacity
                                style={styles.checkButton}
                                onPress={handleCheckCode}
                                disabled={checking}
                            >
                                {checking ? (
                                    <ActivityIndicator size="small" color="black" />
                                ) : (
                                    <Text style={styles.checkButtonText}>Check</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Features Info */}
                    <View style={styles.featuresContainer}>
                        <TouchableOpacity
                            style={styles.featuresTitleContainer}
                            onPress={() => setFeaturesExpanded(!featuresExpanded)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.featuresTitle}>What you can check:</Text>
                            <Ionicons
                                name={featuresExpanded ? "chevron-up" : "chevron-down"}
                                size={20}
                                color="white"
                            />
                        </TouchableOpacity>

                        {featuresExpanded && (
                            <>
                                <View style={styles.featureItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#ffda34" />
                                    <Text style={styles.featureText}>Code validity (exists or not)</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#ffda34" />
                                    <Text style={styles.featureText}>Transfer amount and sender</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#ffda34" />
                                    <Text style={styles.featureText}>Claimability status</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#ffda34" />
                                    <Text style={styles.featureText}>Creation and expiration dates</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#ffda34" />
                                    <Text style={styles.featureText}>Supports both MOVE and FA tokens</Text>
                                </View>
                            </>
                        )}
                    </View>
                </ScrollView>
            </View>
        </SwipeableTabWrapper>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: IS_SMALL_SCREEN ? 16 : 50,
        paddingBottom: IS_SMALL_SCREEN ? 8 : 20,
    },
    headerTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 20,
        flexWrap: 'wrap',
    },
    statCard: {
        minWidth: 100,
        height: 80,
        backgroundColor: '#222327',
        padding: 12,
        borderRadius: 12,
        borderWidth: 0,
        borderColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statCardWide: {
        flex: 1,
        minWidth: 150,
    },
    statValue: {
        color: '#ffda34',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 4,
    },
    statValueSmall: {
        color: '#ffda34',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    statLabel: {
        color: '#8B98A5',
        fontSize: 12,
    },
    codeCheckerCard: {
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: '#222327',
        padding: 16,
        borderRadius: 12,
        borderWidth: 0,
        borderColor: 'transparent',
    },
    codeCheckerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    codeCheckerSubtitle: {
        color: '#8B98A5',
        fontSize: 14,
        marginBottom: 16,
    },
    codeInputContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    codeInput: {
        flex: 1,
        backgroundColor: '#121315',
        color: 'white',
        padding: 12,
        borderRadius: 8,
        borderWidth: 0,
        borderColor: 'transparent',
    },
    checkButton: {
        backgroundColor: '#ffda34',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
        minWidth: 80,
        alignItems: 'center',
    },
    checkButtonText: {
        color: 'black',
        fontSize: 14,
        fontWeight: '600',
    },
    featuresContainer: {
        marginHorizontal: 20,
        padding: 20,
    },
    featuresTitleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    featuresTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    featureText: {
        color: '#8B98A5',
        fontSize: 14,
        flex: 1,
    },
})
