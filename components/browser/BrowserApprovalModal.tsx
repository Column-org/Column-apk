import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity, Dimensions, ScrollView, Platform, Image, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useNetwork } from '../../context/NetworkContext'
import { useWallet } from '../../context/WalletContext'

const { width, height } = Dimensions.get('window')

export interface BrowserRequest {
    method: 'connect' | 'signAndSubmitTransaction' | 'signTransaction' | 'signMessage'
    origin: string
    params?: any
    id?: number
    favicon?: string
}

export interface SimulationResult {
    loading: boolean
    success?: boolean
    error?: string
    balanceChanges?: {
        asset: string
        amount: string
        isPositive: boolean
    }[]
}

interface BrowserApprovalModalProps {
    visible: boolean
    request: BrowserRequest | null
    onApprove: () => void
    onDecline: () => void
    simulation?: SimulationResult | null
}

export const BrowserApprovalModal: React.FC<BrowserApprovalModalProps> = ({
    visible,
    request,
    onApprove,
    onDecline,
    simulation,
}) => {
    const { network: currentNetwork } = useNetwork()
    const { address: currentAddress, allWallets } = useWallet()
    const slideAnim = useRef(new Animated.Value(height)).current
    const opacityAnim = useRef(new Animated.Value(0)).current

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 40,
                    friction: 8,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start()
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: height,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start()
        }
    }, [visible])

    if (!request && !visible) return null

    const getIconInfo = () => {
        switch (request?.method) {
            case 'connect':
                return { name: 'link-outline' as const, color: '#ffda34', title: 'Connection Request' }
            case 'signAndSubmitTransaction':
                return { name: 'send-outline' as const, color: '#ffda34', title: 'Transaction Request' }
            case 'signTransaction':
                return { name: 'pencil-outline' as const, color: '#ffda34', title: 'Signature Request' }
            case 'signMessage':
                return { name: 'chatbox-outline' as const, color: '#ffda34', title: 'Message Signature' }
            default:
                return { name: 'help-circle-outline' as const, color: '#8B98A5', title: 'Request' }
        }
    }

    const { name: iconName, color: iconColor, title: actionTitle } = getIconInfo()

    const getDomainName = (origin: string) => {
        try {
            const url = new URL(origin)
            return url.hostname.replace('www.', '')
        } catch {
            return origin
        }
    }

    const domainName = request?.origin ? getDomainName(request.origin) : ''

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onDecline}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />

                <Animated.View
                    style={[
                        styles.content,
                        {
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <View style={styles.header}>
                        <View style={styles.handle} />
                    </View>

                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                        <View style={styles.projectHeaderRow}>
                            <View style={styles.appIconPlaceholder}>
                                {request?.favicon ? (
                                    <Image
                                        source={{ uri: request.favicon }}
                                        style={styles.faviconImage}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <Text style={styles.appIconInitial}>
                                        {domainName.charAt(0).toUpperCase()}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.projectInfoText}>
                                <Text style={styles.appName}>{domainName}</Text>
                                <Text style={styles.permissionText}>wants to interact with your wallet</Text>
                            </View>
                        </View>


                        <View style={styles.divider} />

                        <View style={styles.detailsContainer}>
                            <Text style={styles.detailsTitle}>Details</Text>
                            <Text style={styles.detailsText}>
                                {request?.method === 'connect'
                                    ? 'By connecting, the dApp will be able to see your wallet address. It cannot move funds without your permission.'
                                    : request?.method === 'signMessage'
                                        ? 'You are about to sign a message. Make sure you trust this request.'
                                        : 'Review the transaction details carefully before signing. This action cannot be undone.'}
                            </Text>

                            <View style={styles.walletInlineInfo}>
                                <Text style={styles.walletInlineLabel}>Wallet</Text>
                                <Text style={styles.walletInlineValue}>
                                    {allWallets.find(w => w.address === currentAddress)?.name || 'Main Wallet'}{' '}
                                    <Text style={styles.walletInlineAddress}>
                                        • {currentAddress ? `${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}` : ''}
                                    </Text>
                                </Text>
                            </View>

                            {request?.method === 'connect' && (
                                <View style={styles.permissionList}>
                                    <View style={styles.permissionItem}>
                                        <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                                        <Text style={styles.permissionText}>View your wallet address</Text>
                                    </View>
                                    <View style={styles.permissionItem}>
                                        <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                                        <Text style={styles.permissionText}>Request transactions for approval</Text>
                                    </View>
                                </View>
                            )}

                            {(request?.method === 'signAndSubmitTransaction' || request?.method === 'signTransaction') && (
                                <View style={styles.payloadSummary}>
                                    <Text style={styles.summaryLabel}>Transaction Data</Text>
                                    <View style={styles.codeBlock}>
                                        <Text style={styles.codeText}>
                                            {JSON.stringify(request.params, null, 2)}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {request?.method === 'signMessage' && (
                                <View style={styles.payloadSummary}>
                                    <Text style={styles.summaryLabel}>Message to Sign</Text>
                                    <View style={styles.codeBlock}>
                                        <Text style={styles.codeText}>
                                            {request.params?.message || JSON.stringify(request.params, null, 2)}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {(request?.method === 'signAndSubmitTransaction' || request?.method === 'signTransaction') && simulation && (
                            <View style={styles.simulationContainer}>
                                <Text style={styles.detailsTitle}>Transaction Simulation</Text>

                                {simulation.loading ? (
                                    <View style={styles.simulationPlaceholder}>
                                        <ActivityIndicator size="small" color="#ffda34" />
                                        <Text style={styles.simulationText}>Simulating execution...</Text>
                                    </View>
                                ) : simulation.error ? (
                                    <View style={[styles.warningBox, { marginTop: 8 }]}>
                                        <Ionicons name="alert-circle-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                                        <Text style={styles.warningText}>Simulation failed: {simulation.error}</Text>
                                    </View>
                                ) : (
                                    <View style={styles.balanceChangesList}>
                                        {simulation.balanceChanges && simulation.balanceChanges.length > 0 ? (
                                            simulation.balanceChanges.map((change, idx) => (
                                                <View key={idx} style={styles.balanceChangeItem}>
                                                    <View style={[styles.changeIndicator, { backgroundColor: change.isPositive ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                                                        <Ionicons
                                                            name={change.isPositive ? "add-outline" : "remove-outline"}
                                                            size={14}
                                                            color={change.isPositive ? "#4ADE80" : "#EF4444"}
                                                        />
                                                    </View>
                                                    <Text style={styles.changeLabel}>
                                                        {change.isPositive ? 'You will gain' : 'You will lose'}
                                                    </Text>
                                                    <Text style={[styles.changeValue, { color: change.isPositive ? "#4ADE80" : "#EF4444" }]}>
                                                        {change.amount} {change.asset}
                                                    </Text>
                                                </View>
                                            ))
                                        ) : (
                                            <View style={styles.balanceChangeItem}>
                                                <Ionicons name="information-circle-outline" size={18} color="#8B98A5" style={{ marginRight: 8 }} />
                                                <Text style={styles.simulationText}>No significant balance changes detected.</Text>
                                            </View>
                                        )}

                                        {!simulation.success && (
                                            <View style={[styles.warningBox, { marginTop: 12 }]}>
                                                <Ionicons name="warning-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                                                <Text style={styles.warningText}>This transaction will likely fail during execution.</Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        )}

                        {(request?.method === 'signAndSubmitTransaction' || request?.method === 'signTransaction') && (
                            <View style={styles.warningBox}>
                                <Ionicons name="warning-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                                <Text style={styles.warningText}>This will move real assets on the network.</Text>
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.declineButton}
                            onPress={onDecline}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.declineText}>Decline</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.approveButton}
                            onPress={onApprove}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#ffda34', '#ffd000']}
                                style={styles.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.approveText}>Approve</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },
    content: {
        backgroundColor: '#121315',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        paddingHorizontal: 24,
        maxHeight: height * 0.85,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 20,
    },
    header: {
        marginBottom: 12,
    },
    body: {
        marginBottom: 32,
    },
    connectVisual: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 24,
        paddingHorizontal: 20,
    },
    appIconPlaceholder: {
        width: 72,
        height: 72,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appIconInitial: {
        color: 'white',
        fontSize: 40,
        fontWeight: '700',
    },
    faviconImage: {
        width: 56,
        height: 56,
        borderRadius: 14,
    },
    projectHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    projectInfoText: {
        marginLeft: 16,
        flex: 1,
    },
    walletInlineInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    walletInlineLabel: {
        color: '#8B98A5',
        fontSize: 13,
        fontWeight: '500',
    },
    walletInlineValue: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
    },
    walletInlineAddress: {
        color: '#8B98A5',
        fontWeight: 'normal',
    },
    appName: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    permissionText: {
        color: '#8B98A5',
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: 24,
    },
    detailsContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    detailsTitle: {
        color: '#8B98A5',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    detailsText: {
        color: 'white',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    permissionList: {
        gap: 12,
        marginTop: 8,
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    payloadSummary: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        gap: 12,
    },
    summaryLabel: {
        color: '#8B98A5',
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 8,
    },
    codeBlock: {
        backgroundColor: '#121315',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    codeText: {
        color: '#8B98A5',
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        marginTop: 16,
    },
    warningText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
    },
    declineButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    declineText: {
        color: '#8B98A5',
        fontSize: 16,
        fontWeight: '600',
    },
    approveButton: {
        flex: 2,
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    approveText: {
        color: '#121315',
        fontSize: 16,
        fontWeight: '700',
    },
    simulationContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    simulationPlaceholder: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 8,
    },
    simulationText: {
        color: '#8B98A5',
        fontSize: 13,
    },
    balanceChangesList: {
        marginTop: 8,
        gap: 10,
    },
    balanceChangeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    changeIndicator: {
        width: 24,
        height: 24,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    changeLabel: {
        color: 'white',
        fontSize: 13,
        flex: 1,
    },
    changeValue: {
        fontSize: 13,
        fontWeight: '700',
    },
})
