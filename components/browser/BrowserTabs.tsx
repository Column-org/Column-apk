import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Image,
    AppState,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export interface TabItem {
    id: string;
    title: string;
    url: string | null;
    screenshot?: string;
    isConnected?: boolean;
}

interface BrowserTabsProps {
    tabs: TabItem[];
    activeTabId: string;
    onClose: () => void;
    onSelectTab: (id: string) => void;
    onAddTab: () => void;
    onRemoveTab: (id: string) => void;
    onCloseAll: () => void;
}

export const BrowserTabs: React.FC<BrowserTabsProps> = ({
    tabs,
    activeTabId,
    onClose,
    onSelectTab,
    onAddTab,
    onRemoveTab,
    onCloseAll
}) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <Text style={styles.headerTitle}>Tabs</Text>
                <Pressable onPress={onCloseAll} style={styles.closeAllBtn}>
                    <Text style={styles.closeAllText}>Close All</Text>
                </Pressable>
            </View>

            <View style={styles.mainContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsScrollContent}
                    pagingEnabled={false}
                    decelerationRate="fast"
                    snapToInterval={width * 0.7 + 20}>{tabs.length > 0 ? tabs.map((tab) => (
                        <Pressable
                            key={tab.id}
                            style={[
                                styles.tabCard,
                                tab.id === activeTabId && styles.activeTabCard
                            ]}
                            onPress={() => onSelectTab(tab.id)}
                        >
                            <View style={styles.cardHeader}>
                                <View style={styles.titleRow}>
                                    <Text style={styles.cardTitle} numberOfLines={1}>{tab.title}</Text>
                                    {tab.isConnected && (
                                        <View style={styles.connectedBadge}>
                                            <View style={styles.connectedDot} />
                                            <Text style={styles.connectedText}>Connected</Text>
                                        </View>
                                    )}
                                </View>
                                <Pressable
                                    style={styles.cardCloseBtn}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        onRemoveTab(tab.id);
                                    }}
                                >
                                    <Ionicons name="close-circle" size={24} color="#8B98A5" />
                                </Pressable>
                            </View>
                            <View style={styles.cardPreview}>
                                {tab.url ? (
                                    <View style={styles.webviewContainer}>
                                        <WebView
                                            source={{ uri: tab.url }}
                                            style={styles.cardWebview}
                                            scrollEnabled={false}
                                            pointerEvents="none"
                                        />
                                        <View style={styles.previewOverlay} />
                                    </View>
                                ) : (
                                    <View style={styles.homePreview}>
                                        <Image
                                            source={require('../../assets/column-3d.png')}
                                            style={styles.homePreviewLogo}
                                            resizeMode="contain"
                                        />
                                        <Text style={styles.homePreviewText}>Browser Home</Text>
                                    </View>
                                )}
                            </View>
                        </Pressable>
                    )) : (
                        <View style={[styles.tabCard, styles.emptyCard]}>
                            <Image
                                source={require('../../assets/column-3d.png')}
                                style={styles.emptyLogo}
                                resizeMode="contain"
                            />
                            <Text style={styles.emptyText}>No tabs open</Text>
                        </View>
                    )}
                    <Pressable style={[styles.tabCard, styles.addTabCard]} onPress={onAddTab}>
                        <View style={styles.addTabInner}>
                            <Ionicons name="add-circle-outline" size={48} color="rgba(255, 255, 255, 0.2)" />
                            <Text style={styles.addTabText}>New Tab</Text>
                        </View>
                    </Pressable>
                </ScrollView>
            </View>
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <View style={styles.footerIcon} />
                <Pressable style={styles.mainAddBtn} onPress={onAddTab}>
                    <View style={styles.addBtnCircle}>
                        <Ionicons name="add" size={32} color="#000000" />
                    </View>
                </Pressable>
                <Pressable style={styles.footerIcon} onPress={onClose}>
                    <View style={styles.tabCountIndicator}>
                        <Text style={styles.tabCountText}>{tabs.length}</Text>
                    </View>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0E0F11', // Your app's dark theme
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
    },
    closeAllText: {
        color: '#C43B4E',
        fontSize: 14,
        fontWeight: '600',
    },
    closeAllBtn: {
        padding: 5,
    },
    mainContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    speedDialText: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 18,
        letterSpacing: 1,
        marginBottom: 30,
        textTransform: 'uppercase',
    },
    tabsScrollContent: {
        paddingHorizontal: 20,
        height: 480,
    },
    tabCard: {
        width: width * 0.7,
        height: 440,
        backgroundColor: '#1C1D21',
        borderRadius: 24,
        marginRight: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    activeTabCard: {
        borderColor: '#ffda34',
        borderWidth: 2,
    },
    addTabCard: {
        backgroundColor: 'transparent',
        borderStyle: 'dashed',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addTabInner: {
        alignItems: 'center',
    },
    addTabText: {
        color: 'rgba(255, 255, 255, 0.2)',
        fontSize: 16,
        marginTop: 10,
        fontWeight: '500',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    cardTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginRight: 8,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    connectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(74, 222, 128, 0.2)',
    },
    connectedDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#4ADE80',
        marginRight: 4,
    },
    connectedText: {
        color: '#4ADE80',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    cardCloseBtn: {

    },
    cardPreview: {
        flex: 1,
        backgroundColor: '#111214',
    },
    webviewContainer: {
        flex: 1,
        overflow: 'hidden',
    },
    cardWebview: {
        flex: 1,
        opacity: 0.6,
        backgroundColor: '#111214',
    },
    previewOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    homePreview: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#18191B',
    },
    homePreviewLogo: {
        width: 140,
        height: 140,
        marginBottom: 16,
        opacity: 0.8,
    },
    homePreviewText: {
        color: 'rgba(255, 255, 255, 0.15)',
        fontSize: 18,
        fontWeight: '600',
    },
    previewImage: {
        width: '60%',
        height: '60%',
        opacity: 0.8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingTop: 15,
        backgroundColor: '#0E0F11',
    },
    footerIcon: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainAddBtn: {

    },
    addBtnCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#ffda34', // Your accent color
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#ffda34',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    tabCountIndicator: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#8B98A5',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabCountText: {
        color: '#8B98A5',
        fontSize: 11,
        fontWeight: '700',
    },
    emptyCard: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderStyle: 'dashed',
    },
    emptyLogo: {
        width: 120,
        height: 120,
        opacity: 0.3,
        marginBottom: 20,
    },
    emptyText: {
        color: 'rgba(255, 255, 255, 0.2)',
        fontSize: 16,
        fontWeight: '600',
    },
});
