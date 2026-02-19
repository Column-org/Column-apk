import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity, Dimensions, Image, Platform } from 'react-native'
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
}

export const DeepLinkApprovalModal: React.FC<DeepLinkApprovalModalProps> = ({
    visible,
    request,
    onApprove,
    onDecline,
}) => {
    const { network: currentNetwork, setNetwork } = useNetwork()
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
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Action</Text>
                                        <View style={styles.summaryValueContainer}>
                                            {request.assetMetadata?.logoURI && (
                                                <Image
                                                    source={{ uri: request.assetMetadata.logoURI }}
                                                    style={styles.summaryIcon}
                                                />
                                            )}
                                            <Text style={styles.summaryValue} numberOfLines={1}>
                                                {request.payload.transaction.function?.includes('transfer')
                                                    ? `${request.assetMetadata?.symbol || 'Asset'} Transfer`
                                                    : 'Contract Interaction'}
                                            </Text>
                                        </View>
                                    </View>
                                    {request.payload.transaction.function?.includes('transfer') && (
                                        <>
                                            <View style={styles.summaryRow}>
                                                <Text style={styles.summaryLabel}>Amount</Text>
                                                <Text style={[styles.summaryValue, { color: '#EF4444', fontWeight: '800' }]} numberOfLines={1}>
                                                    -{parseFloat(request.payload.transaction.functionArguments?.[1] || '0') / Math.pow(10, request.assetMetadata?.decimals || 8)} {request.assetMetadata?.symbol || 'MOVE'}
                                                </Text>
                                            </View>
                                            <View style={styles.summaryRow}>
                                                <Text style={styles.summaryLabel}>To</Text>
                                                <Text style={styles.summaryValue} numberOfLines={1} ellipsizeMode="middle">
                                                    {request.payload.transaction.functionArguments?.[0]}
                                                </Text>
                                            </View>
                                        </>
                                    )}
                                </View>
                            )}
                        </View>

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
