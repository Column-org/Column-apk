import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity, Dimensions, Image, Platform, ActivityIndicator, StatusBar } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { SvgUri } from 'react-native-svg'
import { useNetwork } from '../../context/NetworkContext'

const { width, height } = Dimensions.get('window')

export interface DeepLinkRequest {
    type: 'connect' | 'signAndSubmitTransaction' | 'signTransaction' | 'signMessage'
    appName: string
    appUrl: string
    appIcon?: string
    details?: string
    payload?: any
    network?: string
    assetMetadata?: {
        symbol: string
        logoURI?: string
        decimals: number
    }
}

interface DeepLinkApprovalModalProps {
    visible: boolean
    request: DeepLinkRequest | null
    onApprove: () => void
    onDecline: () => void
    simulation?: {
        loading: boolean
        success?: boolean
        error?: string
        gasFee?: string
        balanceChanges?: {
            asset: string
            amount: string
            isPositive: boolean
            logoURI?: string
        }[]
    } | null
}

export const DeepLinkApprovalModal: React.FC<DeepLinkApprovalModalProps> = ({
    visible,
    request,
    onApprove,
    onDecline,
    simulation,
}) => {
    const { network: currentNetwork, setNetwork } = useNetwork()
    const insets = useSafeAreaInsets()
    const slideAnim = useRef(new Animated.Value(height)).current
    const opacityAnim = useRef(new Animated.Value(0)).current
    const [isDataExpanded, setIsDataExpanded] = React.useState(false)

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
        switch (request?.type) {
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

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onDecline}
            statusBarTranslucent
        >
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <View style={styles.overlay}>
                <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />

                <Animated.View
                    style={[
                        styles.content,
                        {
                            transform: [{ translateY: slideAnim }],
                            paddingBottom: Math.max(insets.bottom, 24) + 10,
                        },
                    ]}
                >
                    <View style={styles.header}>
                        <View style={styles.handle} />
                        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
                            <Ionicons name={iconName} size={30} color={iconColor} />
                        </View>
                        <Text style={styles.actionTitle}>{actionTitle}</Text>
                        <Text style={styles.appUrl}>{request?.appUrl}</Text>

                        {request?.network && (
                            <View style={[
                                styles.networkBadge,
                                { backgroundColor: (request.network.toLowerCase() === currentNetwork.toLowerCase()) ? 'rgba(76, 175, 80, 0.1)' : 'rgba(239, 44, 44, 0.1)' }
                            ]}>
                                <Text style={[
                                    styles.networkBadgeText,
                                    { color: (request.network.toLowerCase() === currentNetwork.toLowerCase()) ? '#4CAF50' : '#EF4444' }
                                ]}>
                                    {request.network.toUpperCase()} {(request.network.toLowerCase() !== currentNetwork.toLowerCase()) ? '(MISMATCH)' : ''}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.body}>
                        <View style={styles.appInfoRow}>
                            {request?.appIcon ? (
                                request.appIcon.toLowerCase().endsWith('.svg') ? (
                                    <View style={styles.appIcon}>
                                        <SvgUri
                                            uri={request.appIcon}
                                            width="100%"
                                            height="100%"
                                        />
                                    </View>
                                ) : (
                                    <Image source={{ uri: request.appIcon }} style={styles.appIcon} />
                                )
                            ) : (
                                <View style={styles.appIconPlaceholder}>
                                    <Text style={styles.appIconInitial}>
                                        {request?.appName?.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.appTextContainer}>
                                <Text style={styles.appName}>{request?.appName}</Text>
                                <Text style={styles.permissionText}>wants to interact with your wallet</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailsContainer}>
                            <Text style={styles.detailsTitle}>Details</Text>
                            <Text style={styles.detailsText}>
                                {request?.details ||
                                    (request?.type === 'connect'
                                        ? 'By connecting, the dApp will be able to see your wallet address. It cannot move funds without your permission.'
                                        : 'Review the transaction details carefully before signing. This action cannot be undone.')}
                            </Text>

                            {request?.type === 'signAndSubmitTransaction' && request.payload?.transaction && (
                                <View style={styles.payloadSummary}>
                                    <TouchableOpacity
                                        style={styles.expandHeader}
                                        onPress={() => setIsDataExpanded(!isDataExpanded)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.detailsTitle}>Transaction Data</Text>
                                        <Ionicons
                                            name={isDataExpanded ? "chevron-up" : "chevron-down"}
                                            size={18}
                                            color="#8B98A5"
                                        />
                                    </TouchableOpacity>

                                    {isDataExpanded && (
                                        <View style={styles.codeBlock}>
                                            <Text style={styles.codeText}>
                                                {JSON.stringify(request.payload.transaction, null, 2)}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>

                        {/* Transaction Simulation Section */}
                        {(request?.type === 'signAndSubmitTransaction' || request?.type === 'signTransaction') && simulation && (
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
                                        {/* Show incoming and outgoing assets based on simulation */}
                                        {simulation.balanceChanges && simulation.balanceChanges.length > 0 ? (
                                            simulation.balanceChanges.map((change, idx) => (
                                                <View key={idx} style={styles.balanceChangeItem}>
                                                    <View style={[styles.changeIndicator, { backgroundColor: change.isPositive ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)', overflow: 'hidden' }]}>
                                                        {change.logoURI ? (
                                                            <Image
                                                                source={{ uri: change.logoURI }}
                                                                style={{ width: 24, height: 24 }}
                                                                resizeMode="cover"
                                                            />
                                                        ) : (
                                                            <Ionicons
                                                                name={change.isPositive ? "add-outline" : "remove-outline"}
                                                                size={14}
                                                                color={change.isPositive ? "#4ADE80" : "#EF4444"}
                                                            />
                                                        )}
                                                    </View>
                                                    <Text style={styles.changeLabel}>
                                                        {change.asset}
                                                    </Text>
                                                    <Text style={[styles.changeValue, { color: change.isPositive ? "#4ADE80" : "#EF4444" }]}>
                                                        {change.isPositive ? '+' : '-'}{parseFloat(change.amount).toFixed(4)}
                                                    </Text>
                                                </View>
                                            ))
                                        ) : (
                                            <View style={styles.balanceChangeItem}>
                                                <Ionicons name="information-circle-outline" size={18} color="#8B98A5" style={{ marginRight: 8 }} />
                                                <Text style={styles.simulationText}>No significant balance changes detected.</Text>
                                            </View>
                                        )}

                                        {/* Network Fee (Gas) */}
                                        {simulation.gasFee && (
                                            <View style={styles.balanceChangeItem}>
                                                <View style={[styles.changeIndicator, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                                                    <Ionicons name="speedometer-outline" size={14} color="#8B98A5" />
                                                </View>
                                                <Text style={styles.changeLabel}>Network Fee</Text>
                                                <Text style={[styles.changeValue, { color: '#8B98A5' }]}>
                                                    -{simulation.gasFee}
                                                </Text>
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

                        {request?.type === 'signAndSubmitTransaction' && (
                            <View style={styles.warningBox}>
                                <Ionicons name="warning-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                                <Text style={styles.warningText}>This will move real assets on the Movement network.</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.declineButton}
                            onPress={onDecline}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.declineText}>Decline</Text>
                        </TouchableOpacity>

                        {(() => {
                            const isMismatch = request?.network &&
                                request.network.toLowerCase() !== currentNetwork.toLowerCase() &&
                                (request.network.toLowerCase() === 'mainnet' || request.network.toLowerCase() === 'testnet');

                            return (
                                <TouchableOpacity
                                    style={styles.approveButton}
                                    onPress={() => {
                                        if (isMismatch) {
                                            setNetwork(request.network!.toLowerCase() as any);
                                        } else {
                                            onApprove();
                                        }
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={isMismatch ? ['#EF4444', '#D91717'] : ['#ffda34', '#ffd000']}
                                        style={styles.gradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.approveText}>
                                            {isMismatch ? `Switch to ${request.network!.toUpperCase()}` : 'Approve'}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            );
                        })()}
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
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    content: {
        backgroundColor: '#121315',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 12,
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
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    appUrl: {
        color: '#8B98A5',
        fontSize: 14,
    },
    body: {
        marginBottom: 32,
    },
    appInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    appIcon: {
        width: 50,
        height: 50,
        borderRadius: 12,
        marginRight: 16,
    },
    appIconPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#222327',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    appIconInitial: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
    },
    appTextContainer: {
        flex: 1,
    },
    appName: {
        color: 'white',
        fontSize: 17,
        fontWeight: '600',
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
    payloadSummary: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        gap: 12,
    },
    expandHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 4,
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
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 2,
    },
    summaryLabel: {
        color: '#8B98A5',
        fontSize: 13,
        fontWeight: '500',
        width: 70, // Fixed width for labels to prevent squishing
    },
    summaryValueContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    summaryIcon: {
        width: 22,
        height: 22,
        borderRadius: 11,
        marginRight: 8,
    },
    summaryValue: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'right',
        flexShrink: 1, // Allow truncation
    },
    networkBadge: {
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    networkBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    simulationContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
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
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
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
})
