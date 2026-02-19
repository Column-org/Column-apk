import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    Keyboard,
    ActivityIndicator,
    Image,
    Dimensions,
    AppState,
    Animated,
    Easing,
    ScrollView,
    TouchableOpacity,
    Share,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallet } from '../context/WalletContext';
import { APTOS_INJECTION_SCRIPT } from '../components/browser/AptosProviderScript';
import { StatusBar } from 'expo-status-bar';
import { BrowserApprovalModal, BrowserRequest, SimulationResult } from '../components/browser/BrowserApprovalModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BrowserHome } from '../components/browser/BrowserHome';
import { BrowserTabs, TabItem } from '../components/browser/BrowserTabs';
import { useBrowser } from '../context/BrowserContext';

const HOME_URL = ''; // Changed to empty string to represent the home dashboard
const STORAGE_KEY_PERMISSIONS = 'column_browser_permissions';
const STORAGE_KEY_TABS = 'column_browser_tabs';
const STORAGE_KEY_ACTIVE_TAB = 'column_browser_active_tab';

function normalizeUrl(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return '';

    // Already has a protocol
    if (/^https?:\/\//i.test(trimmed)) return trimmed;

    // Looks like a domain
    if (!trimmed.includes(' ') && trimmed.includes('.')) {
        return 'https://' + trimmed;
    }

    // Treat as search query
    return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

export default function BrowserScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {
        address,
        publicKey,
        signAndSubmitTransaction,
        signMessage,
        simulateTransaction: walletSimulate,
        network,
        switchNetwork
    } = useWallet();
    const webViewRef = useRef<WebView>(null);

    const [tabs, setTabs] = useState<TabItem[]>([
        { id: Math.random().toString(36).substr(2, 9), title: 'Home', url: null }
    ]);
    const [activeTabId, setActiveTabId] = useState(tabs[0].id);

    // Derived active tab and URL
    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
    const url = activeTab.url;

    // Set URL and title for active tab
    const setUrl = (newUrl: string | null) => {
        setTabs(prev => prev.map(t =>
            t.id === activeTabId ? { ...t, url: newUrl, title: newUrl ? getDisplayUrl(newUrl) : 'Home' } : t
        ));
    };

    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentUrl, setCurrentUrl] = useState<string>('');
    const [isFocused, setIsFocused] = useState(false);
    const [showTabs, setShowTabs] = useState(false);
    const [canGoBack, setCanGoBack] = useState(false);
    const [canGoForward, setCanGoForward] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Approval Flow State
    const [approvalModalVisible, setApprovalModalVisible] = useState(false);
    const [pendingRequest, setPendingRequest] = useState<BrowserRequest | null>(null);
    const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
    const {
        approvedOrigins,
        addApprovedOrigin,
        removeApprovedOrigin,
        addToHistory,
        toggleBookmark,
        isBookmarked,
        bookmarks
    } = useBrowser();
    // const [isFocused, setIsFocused] = useState(false); // This was duplicated and moved up

    // Animation states
    const exitProgress = useRef(new Animated.Value(1)).current;

    const handleBrowserClose = () => {
        Animated.timing(exitProgress, {
            toValue: 0,
            duration: 600,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: false, // Required for borderRadius and scale together in some environments
        }).start(() => {
            router.back();
        });
    };

    const suggestions = useMemo(() => {
        if (!isFocused || !inputValue) return [];
        const query = inputValue.toLowerCase().trim();
        if (!query) return [];

        const historyList = (useBrowser() as any).history || [];
        const historyMatches = historyList.filter((h: any) =>
            h.title?.toLowerCase().includes(query) || h.url?.toLowerCase().includes(query)
        );
        const bookmarkMatches = bookmarks.filter((b: any) =>
            b.title?.toLowerCase().includes(query) || b.url?.toLowerCase().includes(query)
        );

        const combined = [
            ...bookmarkMatches.map((b: any) => ({ ...b, type: 'bookmark' })),
            ...historyMatches.map((h: any) => ({ ...h, type: 'history' }))
        ];

        // Deduplicate
        const unique = combined.filter((v, i, a) => a.findIndex(t => t.url === v.url) === i);

        return unique.slice(0, 5);
    }, [isFocused, inputValue, bookmarks]);

    useEffect(() => {
        const runSimulation = async () => {
            if (!pendingRequest) {
                setSimulationResult(null);
                return;
            }

            if (pendingRequest.method === 'signAndSubmitTransaction' || pendingRequest.method === 'signTransaction') {
                setSimulationResult({ loading: true });
                try {
                    const result = await walletSimulate(pendingRequest.params);

                    // Basic balance change extraction
                    const balanceChanges: { asset: string, amount: string, isPositive: boolean }[] = [];
                    if (result.success && result.events) {
                        result.events.forEach((event: any) => {
                            const type = event.type as string;
                            const isWithdraw = type.includes('coin::WithdrawEvent') || type.includes('fungible_asset::WithdrawEvent');
                            const isDeposit = type.includes('coin::DepositEvent') || type.includes('fungible_asset::DepositEvent');

                            // Try to match the owner address
                            // For legacy events, it's in event.guid.account_address
                            // For FA events, it's usually in event.data.store or similar, but simulation often fills guid
                            const eventAddr = event.guid?.account_address || event.data?.owner;

                            if ((isWithdraw || isDeposit) && eventAddr === address) {
                                let assetName = 'MOVE';
                                let decimals = 8;

                                // Try to extract asset name from type if possible
                                if (type.includes('<')) {
                                    const match = type.match(/<(.*)>/);
                                    if (match && match[1]) {
                                        assetName = match[1].split('::').pop() || 'Asset';
                                    }
                                } else if (type.includes('fungible_asset')) {
                                    assetName = 'Asset'; // FA standard doesn't always put name in event type
                                }

                                const amount = (Number(event.data.amount) / Math.pow(10, decimals)).toString();
                                balanceChanges.push({
                                    asset: assetName,
                                    amount,
                                    isPositive: isDeposit
                                });
                            }
                        });
                    }

                    setSimulationResult({
                        loading: false,
                        success: result.success,
                        error: result.success ? undefined : (result as any).vm_status,
                        balanceChanges
                    });
                } catch (e: any) {
                    setSimulationResult({
                        loading: false,
                        error: e.message || 'Simulation failed'
                    });
                }
            } else {
                setSimulationResult(null);
            }
        };

        runSimulation();
    }, [pendingRequest, walletSimulate]);

    const animatedScreenStyle = {
        flex: 1,
        opacity: exitProgress.interpolate({
            inputRange: [0, 0.2, 1],
            outputRange: [0, 1, 1]
        }),
        borderRadius: exitProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [Dimensions.get('window').width / 2, 0]
        }),
        overflow: 'hidden' as const,
        backgroundColor: '#0E0F11',
        transform: [
            {
                // Keeping it stable and fixed
                scale: 1
            }
        ]
    };
    // Persist permissions and tabs
    useEffect(() => {
        const loadState = async () => {
            try {
                // Load tabs
                const storedTabs = await AsyncStorage.getItem(STORAGE_KEY_TABS);
                const storedActiveTabId = await AsyncStorage.getItem(STORAGE_KEY_ACTIVE_TAB);

                if (storedTabs) {
                    const parsedTabs = JSON.parse(storedTabs);
                    if (parsedTabs.length > 0) {
                        setTabs(parsedTabs);
                        if (storedActiveTabId) {
                            setActiveTabId(storedActiveTabId);
                        } else {
                            setActiveTabId(parsedTabs[0].id);
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to load browser state', e);
            } finally {
                setIsInitialized(true);
            }
        };
        loadState();
    }, []);

    // Save tabs on change
    useEffect(() => {
        if (!isInitialized) return;
        const saveTabs = async () => {
            try {
                await AsyncStorage.setItem(STORAGE_KEY_TABS, JSON.stringify(tabs));
            } catch (e) {
                console.error('Failed to save tabs', e);
            }
        };
        saveTabs();
    }, [tabs, isInitialized]);

    // Save active tab on change
    useEffect(() => {
        if (!isInitialized) return;
        const saveActiveTab = async () => {
            try {
                await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_TAB, activeTabId);
            } catch (e) {
                console.error('Failed to save active tab', e);
            }
        };
        saveActiveTab();
    }, [activeTabId, isInitialized]);

    // Save state on AppState change (background/inactive)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (isInitialized && nextAppState.match(/inactive|background/)) {
                AsyncStorage.setItem(STORAGE_KEY_TABS, JSON.stringify(tabs));
                AsyncStorage.setItem(STORAGE_KEY_ACTIVE_TAB, activeTabId);
            }
        });
        return () => subscription.remove();
    }, [tabs, activeTabId, isInitialized]);


    const sendResponse = useCallback((id: number | null, result: any, error?: string) => {
        const response = JSON.stringify({
            type: 'column:response',
            id,
            result,
            error
        }, (key, value) => typeof value === 'bigint' ? value.toString() : value);

        webViewRef.current?.injectJavaScript(`
            window.postMessage(${JSON.stringify(response)}, '*');
            true;
        `);
    }, []);

    const emitEvent = useCallback((event: string, data: any) => {
        const message = JSON.stringify({
            type: 'column:event',
            event,
            data
        }, (key, value) => typeof value === 'bigint' ? value.toString() : value);

        webViewRef.current?.injectJavaScript(`
            window.postMessage(${JSON.stringify(message)}, '*');
            true;
        `);
    }, []);

    // Live account & network switching
    useEffect(() => {
        if (address) {
            console.log('🌐 Browser: Notifying dApp of account change');
            emitEvent('accountChange', { address, publicKey });
        }
    }, [address, publicKey, emitEvent]);

    useEffect(() => {
        if (network) {
            console.log('🌐 Browser: Notifying dApp of network change');
            emitEvent('networkChange', {
                name: network.name,
                chainId: network.chainId,
                url: network.url
            });
        }
    }, [network.chainId, emitEvent]);

    const handleMessage = useCallback(async (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === 'column:log') {
                console.log('🌐 [BRIDGE LOG]:', data.message, data.data || '');
                return;
            }

            if (data.type !== 'column:request') return;

            const { id, method, params, origin } = data;
            console.log(`🌐 dApp Request [${method}] from ${origin}:`, params);

            const favicon = origin ? `https://www.google.com/s2/favicons?domain=${new URL(origin).hostname}&sz=128` : undefined;

            switch (method) {
                case 'connect':
                    if (approvedOrigins.has(origin)) {
                        sendResponse(id, { address, publicKey, status: 200 });
                    } else {
                        setPendingRequest({ id, method, params, origin, favicon });
                        setApprovalModalVisible(true);
                    }
                    break;

                case 'disconnect':
                    await removeApprovedOrigin(origin);
                    sendResponse(id, { status: 200 });
                    break;

                case 'account':
                    if (approvedOrigins.has(origin)) {
                        sendResponse(id, { address, publicKey, status: 200 });
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
                    setPendingRequest({ id, method, params, origin, favicon });
                    setApprovalModalVisible(true);
                    break;

                case 'getNetwork':
                    sendResponse(id, {
                        name: network.name,
                        chainId: network.chainId,
                        url: network.url
                    });
                    break;

                case 'changeNetwork':
                    // Map chain IDs or names back to internal network keys
                    const chainInput = params.chainId || params.name || params;
                    if (chainInput === 1 || chainInput === 'mainnet') {
                        switchNetwork('mainnet');
                    } else if (chainInput === 2 || chainInput === 'testnet') {
                        switchNetwork('testnet');
                    }
                    sendResponse(id, { status: 'Approved', args: params });
                    break;

                default:
                    sendResponse(id, null, 'Method not supported');
            }
        } catch (e) {
            console.warn('Failed to parse browser message:', e);
        }
    }, [approvedOrigins, address, publicKey, network, sendResponse, switchNetwork]);

    const handleApprove = async () => {
        if (!pendingRequest) return;
        const { id: rawId, method, params, origin } = pendingRequest;
        const id: number | null = rawId ?? null;

        try {
            switch (method) {
                case 'connect':
                    await addApprovedOrigin(origin);
                    sendResponse(id, { address, publicKey, status: 200 });
                    break;
                case 'signAndSubmitTransaction': {
                    const hash = await signAndSubmitTransaction(params);
                    sendResponse(id, { hash });
                    break;
                }
                case 'signTransaction': {
                    const txResult = await signAndSubmitTransaction(params);
                    sendResponse(id, { hash: txResult });
                    break;
                }
                case 'signMessage': {
                    const signature = await signMessage(params.message);
                    sendResponse(id, {
                        address,
                        fullMessage: params.message,
                        message: params.message,
                        nonce: params.nonce || '',
                        prefix: 'APTOS',
                        signature
                    });
                    break;
                }
            }
        } catch (error: any) {
            console.error('Wallet Request Error:', error);
            sendResponse(id, null, (error as any).message || 'Operation failed');
        } finally {
            setApprovalModalVisible(false);
            setPendingRequest(null);
            setSimulationResult(null);
        }
    };

    const handleDeny = () => {
        if (pendingRequest) {
            sendResponse(pendingRequest.id ?? null, null, 'User denied request');
        }
        setApprovalModalVisible(false);
        setPendingRequest(null);
        setSimulationResult(null);
    };

    const handleNavigationStateChange = (navState: any) => {
        setCanGoBack(navState.canGoBack);
        setCanGoForward(navState.canGoForward);
        setCurrentUrl(navState.url || '');
        if (!isFocused) {
            setInputValue('');
        }

        // Update tab info to keep it accurate
        if (navState.url && navState.url !== 'about:blank') {
            setTabs(prev => prev.map(t =>
                t.id === activeTabId ? {
                    ...t,
                    url: navState.url,
                    title: navState.title || getDisplayUrl(navState.url)
                } : t
            ));

            // Add to history
            addToHistory(navState.url, navState.title);
        }
    };

    const handleUrlSubmit = () => {
        const newUrl = normalizeUrl(inputValue);
        if (newUrl) {
            setUrl(newUrl);
        } else {
            setUrl(null);
        }
        setInputValue('');
        Keyboard.dismiss();
        setIsFocused(false);
    };

    const handleFocus = () => {
        setIsFocused(true);
        setInputValue(currentUrl);
    };

    const handleBlur = () => {
        setIsFocused(false);
        setInputValue('');
    };

    const handleHomePress = () => {
        setUrl(null);
        setCurrentUrl('');
        setInputValue('');
        setIsFocused(false);
        setShowTabs(false);
    };

    const addTab = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        const newTab = { id: newId, title: 'Home', url: null };
        setTabs([...tabs, newTab]);
        setActiveTabId(newId);
        setShowTabs(false);
    };

    const removeTab = (id: string) => {
        if (tabs.length === 1) {
            // Last tab - reset it to home
            const newId = Math.random().toString(36).substr(2, 9);
            setTabs([{ id: newId, title: 'Home', url: null }]);
            setActiveTabId(newId);
        } else {
            const index = tabs.findIndex(t => t.id === id);
            const newTabs = tabs.filter(t => t.id !== id);
            setTabs(newTabs);
            if (activeTabId === id) {
                const nextTab = newTabs[Math.min(index, newTabs.length - 1)];
                setActiveTabId(nextTab.id);
            }
        }
    };

    const selectTab = (id: string) => {
        setActiveTabId(id);
        setShowTabs(false);
    };

    const closeAllTabs = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        setTabs([{ id: newId, title: 'Home', url: null }]);
        setActiveTabId(newId);
        setShowTabs(false);
    };

    const displayValue = isFocused ? inputValue : getDisplayUrl(currentUrl);

    return (
        <Animated.View style={animatedScreenStyle}>
            <StatusBar style="light" />

            <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
                <View style={styles.headerRow}>
                    {!url ? (
                        <>
                            <View style={styles.iconButton} />

                            <View style={styles.addressBar}>
                                <Ionicons name="search" size={18} color="#8B98A5" style={{ marginRight: 10 }} />
                                <TextInput
                                    style={styles.urlInput}
                                    value={inputValue}
                                    onChangeText={setInputValue}
                                    onSubmitEditing={handleUrlSubmit}
                                    placeholder="Search or enter address"
                                    placeholderTextColor="#8B98A5"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    returnKeyType="search"
                                />
                            </View>

                            <Pressable onPress={handleBrowserClose} style={styles.iconButton} hitSlop={10}>
                                <Ionicons name="close" size={26} color="#ffffff" />
                            </Pressable>
                        </>
                    ) : (
                        <>
                            <Pressable
                                onPress={() => {
                                    webViewRef.current?.reload();
                                }}
                                style={styles.iconButton}
                                hitSlop={10}
                            >
                                <Ionicons name="refresh" size={20} color="#8B98A5" />
                            </Pressable>
                            <Pressable
                                style={styles.addressBar}
                                onPress={() => {
                                    setIsFocused(true);
                                    setInputValue(currentUrl);
                                }}
                            >
                                <Ionicons name="lock-closed" size={14} color="#4ADE80" style={{ marginRight: 8 }} />
                                <TextInput
                                    style={styles.urlInput}
                                    value={displayValue}
                                    onChangeText={setInputValue}
                                    onSubmitEditing={handleUrlSubmit}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="url"
                                    returnKeyType="go"
                                    placeholder="Search or enter address"
                                    placeholderTextColor="#8B98A5"
                                    editable={false}
                                    pointerEvents="none"
                                />
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#ffda34" style={{ marginLeft: 6 }} />
                                ) : (
                                    url && (
                                        <Pressable
                                            onPress={() => toggleBookmark(url, tabs.find(t => t.id === activeTabId)?.title || url)}
                                            hitSlop={10}
                                        >
                                            <Ionicons
                                                name={isBookmarked(url) ? "star" : "star-outline"}
                                                size={18}
                                                color={isBookmarked(url) ? "#ffda34" : "#8B98A5"}
                                            />
                                        </Pressable>
                                    )
                                )}
                            </Pressable>


                            <Pressable onPress={handleBrowserClose} style={styles.iconButton} hitSlop={10}>
                                <Ionicons name="close" size={26} color="#ffffff" />
                            </Pressable>
                        </>
                    )}
                </View>
            </View>

            {/* WebView or BrowserHome */}
            {!url ? (
                <BrowserHome
                    onSelectDApp={(selectedUrl) => {
                        setUrl(selectedUrl);
                        setShowTabs(false);
                    }}
                />
            ) : (
                <WebView
                    ref={webViewRef}
                    source={{ uri: url }}
                    injectedJavaScriptBeforeContentLoaded={APTOS_INJECTION_SCRIPT}
                    injectedJavaScript={`
                        // Re-announce wallet after page load for late-initializing dApps
                        (function() {
                            try {
                                var evt = new CustomEvent('wallet-standard:register-wallet', {
                                    detail: function(cb) { if (typeof cb === 'function' && window.column) cb(window.column); }
                                });
                                window.dispatchEvent(evt);
                            } catch(e) {}
                        })();
                        true;
                    `}
                    onMessage={handleMessage}
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
                    cacheEnabled={true}
                    renderToHardwareTextureAndroid={true}
                    mixedContentMode="always"
                    userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.warn('WebView error:', nativeEvent);
                        setIsLoading(false);
                    }}
                    onHttpError={(syntheticEvent) => {
                        console.warn('WebView HTTP error:', syntheticEvent.nativeEvent.statusCode);
                        setIsLoading(false);
                    }}
                />
            )}

            {/* Bottom Controls */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                <Pressable
                    onPress={() => webViewRef.current?.goBack()}
                    disabled={!canGoBack}
                    style={[styles.controlButton, !canGoBack && styles.disabledButton]}
                    hitSlop={8}
                >
                    <Ionicons name="chevron-back" size={24} color="#8B98A5" />
                </Pressable>

                <Pressable
                    onPress={() => webViewRef.current?.goForward()}
                    disabled={!canGoForward}
                    style={[styles.controlButton, !canGoForward && styles.disabledButton]}
                    hitSlop={8}
                >
                    <Ionicons name="chevron-forward" size={24} color="#8B98A5" />
                </Pressable>

                <View style={styles.spacer} />

                <View style={styles.centerControls}>
                    <Pressable
                        onPress={handleHomePress}
                        style={styles.controlButton}
                        hitSlop={8}
                    >
                        <Ionicons name="home-outline" size={24} color={!url ? '#ffda34' : '#8B98A5'} />
                    </Pressable>
                    <Pressable
                        onPress={() => Share.share({ url: currentUrl, message: `Check out this dApp on Column Wallet: ${currentUrl}` })}
                        style={styles.controlButton}
                        hitSlop={8}
                        disabled={!url}
                    >
                        <Ionicons name="share-outline" size={24} color={url ? "#8B98A5" : "rgba(139, 152, 165, 0.2)"} />
                    </Pressable>

                    <Pressable
                        style={styles.controlButton}
                        hitSlop={8}
                        onPress={() => setShowTabs(true)}
                    >
                        <View style={styles.tabCountControl}>
                            <Text style={styles.tabCountControlText}>{tabs.length}</Text>
                        </View>
                    </Pressable>
                </View>
                <View style={styles.spacer} />
                <View style={{ width: 88 }} />
            </View>

            {/* Search Suggestions Overlay */}
            {isFocused && suggestions.length > 0 && (
                <View style={[styles.suggestionsOverlay, { top: Math.max(insets.top, 10) + 60 }]}>
                    {suggestions.map((item: any) => (
                        <TouchableOpacity
                            key={item.url}
                            style={styles.suggestionItem}
                            onPress={() => {
                                setInputValue(item.url);
                                setUrl(item.url);
                                setIsFocused(false);
                                Keyboard.dismiss();
                            }}
                        >
                            <Ionicons
                                name={item.type === 'bookmark' ? 'star' : 'time-outline'}
                                size={18}
                                color="#8B98A5"
                                style={{ marginRight: 15 }}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.suggestionTitle} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.suggestionUrl} numberOfLines={1}>{item.url}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Tabs View Overlay */}
            {showTabs && (
                <View style={StyleSheet.absoluteFill}>
                    <BrowserTabs
                        tabs={tabs.map(t => ({
                            ...t,
                            isConnected: t.url ? approvedOrigins.has(new URL(t.url).origin) : false
                        }))}
                        activeTabId={activeTabId}
                        onClose={() => setShowTabs(false)}
                        onSelectTab={selectTab}
                        onAddTab={addTab}
                        onRemoveTab={removeTab}
                        onCloseAll={closeAllTabs}
                    />
                </View>
            )}

            {/* Approval Modal */}
            <BrowserApprovalModal
                visible={approvalModalVisible}
                request={pendingRequest}
                onApprove={handleApprove}
                onDecline={handleDeny}
                simulation={simulationResult}
            />
        </Animated.View>
    );
}

function getDisplayUrl(url: string): string {
    if (!url || url === 'about:blank') return '';
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^www\./, '');
        return host + (parsed.pathname !== '/' ? parsed.pathname : '');
    } catch {
        return url;
    }
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0E0F11',
    },
    header: {
        backgroundColor: '#0E0F11',
        paddingBottom: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    centerControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    addressBar: {
        flex: 1,
        height: 48,
        backgroundColor: '#1C1D21',
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    addressBarLogo: {
        width: 24,
        height: 24,
        marginRight: 10,
    },
    urlInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '500',
        height: '100%',
        padding: 0,
    },
    iconButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    webview: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    footer: {
        backgroundColor: '#161719',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.06)',
        paddingTop: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    controlButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabCountControl: {
        width: 20,
        height: 20,
        borderWidth: 1.5,
        borderColor: '#8B98A5',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabCountControlText: {
        color: '#8B98A5',
        fontSize: 10,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.4,
    },
    spacer: {
        flex: 1,
    },
    suggestionsOverlay: {
        position: 'absolute',
        left: 16,
        right: 16,
        backgroundColor: '#1C1D21',
        borderRadius: 20,
        padding: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
        zIndex: 1000,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
    },
    suggestionTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    suggestionUrl: {
        color: '#8B98A5',
        fontSize: 12,
        marginTop: 2,
    },
});
