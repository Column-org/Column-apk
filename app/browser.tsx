import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, Keyboard, Platform, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallet } from '../context/WalletContext';
import { APTOS_INJECTION_SCRIPT } from '../services/browser/AptosProviderScript';
import { StatusBar } from 'expo-status-bar';

const DEFAULT_URL = 'https://movement.liquidswap.com/';

export default function BrowserScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { address, publicKey, signAndSubmitTransaction, signMessage, network, switchNetwork } = useWallet();
    const webViewRef = useRef<WebView>(null);

    const [url, setUrl] = useState(DEFAULT_URL);
    const [inputValue, setInputValue] = useState(DEFAULT_URL);
    const [isLoading, setIsLoading] = useState(false);
    const [isWalletInjected, setIsWalletInjected] = useState(false);
    const [canGoBack, setCanGoBack] = useState(false);
    const [canGoForward, setCanGoForward] = useState(false);
    const [title, setTitle] = useState('Browser');

    // Approval Flow State
    const [approvalModalVisible, setApprovalModalVisible] = useState(false);
    const [pendingRequest, setPendingRequest] = useState<any>(null);
    const [approvedOrigins, setApprovedOrigins] = useState<Set<string>>(new Set());

    // Bridge Logic
    const handleMessage = async (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type !== 'column:request') return;

            const { id, method, params, origin } = data;
            console.log(`🌐 dApp Request [${method}] from ${origin}:`, params);

            switch (method) {
                case 'connect':
                    if (approvedOrigins.has(origin)) {
                        sendResponse(id, {
                            address: address,
                            publicKey: publicKey,
                            status: 200
                        });
                    } else {
                        setPendingRequest({ id, method, params, origin });
                        setApprovalModalVisible(true);
                    }
                    break;

                case 'disconnect':
                    // Just acknowledge
                    sendResponse(id, { status: 200 });
                    break;

                case 'account':
                    if (approvedOrigins.has(origin)) {
                        sendResponse(id, {
                            address: address,
                            publicKey: publicKey,
                            status: 200
                        });
                    } else {
                        sendResponse(id, null, 'Not connected');
                    }
                    break;

                case 'signAndSubmitTransaction':
                case 'signTransaction':
                case 'signMessage':
                    if (!approvedOrigins.has(origin)) {
                        sendResponse(id, null, 'Wallet not connected');
                        return;
                    }
                    setPendingRequest({ id, method, params, origin });
                    setApprovalModalVisible(true);
                    break;

                case 'getNetwork':
                    sendResponse(id, {
                        name: network.name,
                        chainId: network.chainId,
                        url: network.url
                    });
                    break;

                default:
                    sendResponse(id, null, 'Method not supported');
            }
        } catch (e) {
            console.error('Failed to parse browser message', e);
        }
    };

    const handleApprove = async () => {
        if (!pendingRequest) return;
        const { id, method, params, origin } = pendingRequest;

        try {
            switch (method) {
                case 'connect':
                    setApprovedOrigins(prev => new Set(prev).add(origin));
                    sendResponse(id, {
                        address: address,
                        publicKey: publicKey,
                        status: 200
                    });
                    break;
                case 'signAndSubmitTransaction':
                    const hash = await signAndSubmitTransaction(params);
                    sendResponse(id, { hash });
                    break;
                case 'signTransaction':
                    // We don't have separate signTransaction in context yet, 
                    // for now we use signAndSubmitTransaction format but it might not be perfect
                    // Real implementation should just sign and return bytes
                    const txResult = await signAndSubmitTransaction(params);
                    sendResponse(id, { hash: txResult });
                    break;
                case 'signMessage':
                    const signature = await signMessage(params.message);
                    sendResponse(id, {
                        address: address,
                        fullMessage: params.message,
                        message: params.message,
                        nonce: params.nonce || '',
                        prefix: 'APTOS',
                        signature: signature
                    });
                    break;
            }
        } catch (error: any) {
            console.error('Wallet Request Error:', error);
            sendResponse(id, null, error.message || 'Operation failed');
        } finally {
            setApprovalModalVisible(false);
            setPendingRequest(null);
        }
    };

    const handleInternalMessage = (data: any) => {
        if (data.type === 'column:log') {
            console.log('🌐 [BRIDGE LOG]:', data.message, data.data || '');
            if (data.message.includes('Injected Successfully')) {
                setIsWalletInjected(true);
            }
        }
    };

    const handleMessageWrapper = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'column:log') {
                handleInternalMessage(data);
                return;
            }
            handleMessage(event);
        } catch (e) {
            console.warn('Failed to parse WebView message:', e);
        }
    };

    const handleDeny = () => {
        if (pendingRequest) {
            sendResponse(pendingRequest.id, null, 'User denied request');
        }
        setApprovalModalVisible(false);
        setPendingRequest(null);
    };

    const sendResponse = (id: number | null, result: any, error?: string) => {
        const response = JSON.stringify({
            type: 'column:response',
            id,
            result,
            error
        }, (key, value) => typeof value === 'bigint' ? value.toString() : value);

        webViewRef.current?.injectJavaScript(`
            window.postMessage(${JSON.stringify(response)}, '*');
        `);
    };

    const emitEvent = (event: string, data: any) => {
        const message = JSON.stringify({
            type: 'column:event',
            event,
            data
        }, (key, value) => typeof value === 'bigint' ? value.toString() : value);

        webViewRef.current?.injectJavaScript(`
            window.postMessage(${JSON.stringify(message)}, '*');
        `);
    };

    // Notify dApp when network changes
    useEffect(() => {
        if (network) {
            emitEvent('networkChange', {
                name: network.name,
                chainId: network.chainId,
                url: network.url
            });
        }
    }, [network.chainId]);

    const handleNavigationStateChange = (navState: any) => {
        setCanGoBack(navState.canGoBack);
        setCanGoForward(navState.canGoForward);
        setTitle(navState.title);
        // Only update URL display if not currently editing
        if (!Keyboard.isVisible()) {
            setInputValue(navState.url);
        }
    };

    const handleUrlSubmit = () => {
        let newUrl = inputValue.trim();
        if (!newUrl.startsWith('http')) {
            newUrl = 'https://' + newUrl;
        }
        setUrl(newUrl);
        setInputValue(newUrl);
        Keyboard.dismiss();
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Browser Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
                <View style={styles.headerTop}>
                    <Pressable onPress={() => router.back()} style={styles.iconButton}>
                        <Ionicons name="close" size={26} color="#ffffff" />
                    </Pressable>
                    <View style={styles.addressBar}>
                        <Ionicons name="lock-closed" size={14} color="#4CAF50" style={{ marginRight: 6 }} />
                        <TextInput
                            style={styles.urlInput}
                            value={inputValue}
                            onChangeText={setInputValue}
                            onSubmitEditing={handleUrlSubmit}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="url"
                            selectTextOnFocus
                        />
                    </View>
                    <Pressable
                        onPress={() => switchNetwork(network.chainId === 250 ? 'mainnet' : 'testnet')}
                        style={[styles.networkBadge, { backgroundColor: network.chainId === 250 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 218, 52, 0.1)' }]}
                    >
                        <Text style={[styles.networkText, { color: network.chainId === 250 ? '#4CAF50' : '#ffda34' }]}>
                            {network.chainId === 250 ? 'Testnet' : 'Mainnet'}
                        </Text>
                    </Pressable>
                    <View style={[styles.statusIndicator, { backgroundColor: isWalletInjected ? '#4CAF50' : '#FF5252' }]}>
                        <Ionicons name={isWalletInjected ? "checkmark-circle" : "alert-circle"} size={14} color="#ffffff" />
                    </View>
                    <Pressable onPress={() => {
                        setIsWalletInjected(false);
                        webViewRef.current?.reload();
                    }} style={styles.iconButton}>
                        <Ionicons name="refresh" size={22} color="#8B98A5" />
                    </Pressable>
                </View>
            </View>

            {/* WebView */}
            <View style={styles.browserContainer}>
                <WebView
                    ref={webViewRef}
                    source={{ uri: url }}
                    injectedJavaScriptBeforeContentLoaded={APTOS_INJECTION_SCRIPT}
                    onMessage={handleMessageWrapper}
                    onNavigationStateChange={handleNavigationStateChange}
                    onLoadStart={() => setIsLoading(true)}
                    onLoadEnd={() => setIsLoading(false)}
                    style={styles.webview}
                    domStorageEnabled={true}
                    javaScriptEnabled={true}
                    originWhitelist={['*']}
                    sharedCookiesEnabled={true}
                    javaScriptCanOpenWindowsAutomatically={true}
                    allowsInlineMediaPlayback={true}
                    userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.warn('WebView error: ', nativeEvent);
                    }}
                />
                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#ffda34" />
                    </View>
                )}
            </View>

            {/* Bottom Controls */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                <View style={styles.controls}>
                    <Pressable
                        onPress={() => webViewRef.current?.goBack()}
                        disabled={!canGoBack}
                        style={[styles.controlButton, !canGoBack && styles.disabledButton]}
                    >
                        <Ionicons name="chevron-back" size={28} color={canGoBack ? '#ffffff' : '#4A4D51'} />
                    </Pressable>
                    <Pressable
                        onPress={() => webViewRef.current?.goForward()}
                        disabled={!canGoForward}
                        style={[styles.controlButton, !canGoForward && styles.disabledButton]}
                    >
                        <Ionicons name="chevron-forward" size={28} color={canGoForward ? '#ffffff' : '#4A4D51'} />
                    </Pressable>
                    <View style={styles.spacer} />
                    <Pressable style={styles.controlButton}>
                        <Ionicons name="share-outline" size={24} color="#ffffff" />
                    </Pressable>
                    <Pressable style={styles.controlButton}>
                        <Ionicons name="bookmarks-outline" size={24} color="#ffffff" />
                    </Pressable>
                </View>
            </View>

            {/* Approval Modal */}
            <Modal
                visible={approvalModalVisible}
                transparent
                animationType="slide"
                onRequestClose={handleDeny}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalIndicator} />
                            <Text style={styles.modalTitle}>
                                {pendingRequest?.method === 'connect' ? 'Connect Wallet' :
                                    pendingRequest?.method === 'signMessage' ? 'Sign Message' : 'Approve Transaction'}
                            </Text>
                            <Text style={styles.modalOrigin}>{pendingRequest?.origin}</Text>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {pendingRequest?.method === 'connect' && (
                                <View style={styles.connectInfo}>
                                    <View style={styles.walletPreview}>
                                        <View style={styles.walletIcon}>
                                            <Ionicons name="wallet" size={32} color="#ffda34" />
                                        </View>
                                        <View>
                                            <Text style={styles.walletName}>Column Wallet</Text>
                                            <Text style={styles.walletAddress}>
                                                {address?.slice(0, 6)}...{address?.slice(-4)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.permissionList}>
                                        <Text style={styles.permissionTitle}>The site will be able to:</Text>
                                        <View style={styles.permissionItem}>
                                            <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                                            <Text style={styles.permissionText}>View your wallet address</Text>
                                        </View>
                                        <View style={styles.permissionItem}>
                                            <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                                            <Text style={styles.permissionText}>Request transactions for approval</Text>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {pendingRequest?.method === 'signAndSubmitTransaction' && (
                                <View style={styles.txInfo}>
                                    <Text style={styles.txLabel}>Transaction Request</Text>
                                    <View style={styles.codeBlock}>
                                        <Text style={styles.codeText}>
                                            {JSON.stringify(pendingRequest.params, null, 2)}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {pendingRequest?.method === 'signMessage' && (
                                <View style={styles.txInfo}>
                                    <Text style={styles.txLabel}>Message to Sign</Text>
                                    <View style={styles.codeBlock}>
                                        <Text style={styles.codeText}>
                                            {pendingRequest.params.message}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <Pressable style={styles.denyButton} onPress={handleDeny}>
                                <Text style={styles.denyButtonText}>Deny</Text>
                            </Pressable>
                            <Pressable style={styles.approveButton} onPress={handleApprove}>
                                <Text style={styles.approveButtonText}>Approve</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121315',
    },
    header: {
        backgroundColor: '#1E2022',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        paddingBottom: 12,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 12,
    },
    iconButton: {
        padding: 4,
    },
    addressBar: {
        flex: 1,
        height: 40,
        backgroundColor: '#121315',
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    urlInput: {
        flex: 1,
        color: '#ffffff',
        fontSize: 14,
        padding: 0,
    },
    networkBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginRight: 4,
    },
    networkText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    statusIndicator: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    browserContainer: {
        flex: 1,
        position: 'relative',
    },
    webview: {
        flex: 1,
        backgroundColor: '#121315',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#121315',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        backgroundColor: '#1E2022',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        paddingTop: 12,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        justifyContent: 'space-between',
    },
    controlButton: {
        padding: 8,
    },
    disabledButton: {
        opacity: 0.3,
    },
    spacer: {
        flex: 1,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1E2022',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingBottom: 40,
    },
    modalHeader: {
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    modalIndicator: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        marginBottom: 16,
    },
    modalTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    modalOrigin: {
        color: '#8B98A5',
        fontSize: 13,
    },
    modalBody: {
        padding: 24,
    },
    connectInfo: {
        gap: 24,
    },
    walletPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    walletIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,218,52,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    walletName: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    walletAddress: {
        color: '#8B98A5',
        fontSize: 14,
    },
    permissionList: {
        gap: 12,
    },
    permissionTitle: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    permissionText: {
        color: '#8B98A5',
        fontSize: 14,
    },
    txInfo: {
        gap: 12,
    },
    txLabel: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
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
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 24,
        marginTop: 24,
    },
    denyButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    denyButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    approveButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#ffda34',
        justifyContent: 'center',
        alignItems: 'center',
    },
    approveButtonText: {
        color: '#121315',
        fontSize: 16,
        fontWeight: '600',
    },
});
