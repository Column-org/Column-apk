import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Platform,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBrowser } from '../../context/BrowserContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function ConnectedAppsScreen() {
    const router = useRouter();
    const { approvedOrigins, removeApprovedOrigin, clearAllPermissions } = useBrowser();

    const connections = useMemo(() => Array.from(approvedOrigins), [approvedOrigins]);

    const getDomain = (url: string) => {
        try {
            return new URL(url).hostname;
        } catch (e) {
            return url;
        }
    };

    const handleDisconnect = (origin: string) => {
        Alert.alert(
            'Disconnect Application',
            `Are you sure you want to disconnect from ${getDomain(origin)}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Disconnect',
                    style: 'destructive',
                    onPress: () => removeApprovedOrigin(origin),
                }
            ]
        );
    };

    const handleClearAll = () => {
        if (connections.length === 0) return;

        Alert.alert(
            'Clear All Connections',
            'This will disconnect all applications from your wallet. You will need to re-approve them next time you use them.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: () => clearAllPermissions(),
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Connected Apps</Text>
                    <TouchableOpacity
                        onPress={handleClearAll}
                        style={[styles.clearButton, connections.length === 0 && { opacity: 0.3 }]}
                        disabled={connections.length === 0}
                    >
                        <Text style={styles.clearButtonText}>Clear All</Text>
                    </TouchableOpacity>
                </View>

                {connections.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="link-outline" size={40} color="rgba(255, 255, 255, 0.2)" />
                        </View>
                        <Text style={styles.emptyTitle}>No Connected Apps</Text>
                        <Text style={styles.emptySubtitle}>
                            Apps you connect to via the Web3 browser will appear here.
                        </Text>
                    </View>
                ) : (
                    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                        <View style={styles.infoBox}>
                            <Ionicons name="shield-checkmark" size={20} color="#4ADE80" />
                            <Text style={styles.infoText}>
                                These applications can see your wallet address but cannot move funds without your approval.
                            </Text>
                        </View>

                        <View style={styles.list}>
                            {connections.map((origin, index) => {
                                const domain = getDomain(origin);
                                const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

                                return (
                                    <View
                                        key={origin}
                                        style={[
                                            styles.connectionItem,
                                            index === 0 && styles.itemTop,
                                            index === connections.length - 1 && styles.itemBottom,
                                            connections.length === 1 && styles.itemSingle
                                        ]}
                                    >
                                        <View style={styles.itemLeft}>
                                            <View style={styles.faviconContainer}>
                                                <Image
                                                    source={{ uri: favicon }}
                                                    style={styles.favicon}
                                                    resizeMode="contain"
                                                />
                                            </View>
                                            <View style={styles.itemInfo}>
                                                <Text style={styles.domainText}>{domain}</Text>
                                                <Text style={styles.statusText}>Connected</Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.disconnectButton}
                                            onPress={() => handleDisconnect(origin)}
                                        >
                                            <Text style={styles.disconnectText}>Disconnect</Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    </ScrollView>
                )}
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
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    clearButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
    },
    clearButtonText: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(74, 222, 128, 0.05)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(74, 222, 128, 0.1)',
    },
    infoText: {
        color: '#8B98A5',
        fontSize: 13,
        marginLeft: 12,
        flex: 1,
        lineHeight: 18,
    },
    list: {
        gap: 2,
    },
    connectionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#222327',
        padding: 16,
    },
    itemTop: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    itemBottom: {
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    itemSingle: {
        borderRadius: 20,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    faviconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    favicon: {
        width: 28,
        height: 28,
        borderRadius: 6,
    },
    itemInfo: {
        flex: 1,
    },
    domainText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    statusText: {
        color: '#4ADE80',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    disconnectButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 10,
    },
    disconnectText: {
        color: '#8B98A5',
        fontSize: 13,
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        marginTop: -50,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: '#8B98A5',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});
