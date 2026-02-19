import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Image,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dapps from './dapps.json';
import { useBrowser } from '../../context/BrowserContext';

const { width } = Dimensions.get('window');

interface BrowserHomeProps {
    onSelectDApp: (url: string) => void;
}

export const BrowserHome: React.FC<BrowserHomeProps> = ({ onSelectDApp }) => {
    const { history, clearHistory, bookmarks } = useBrowser();
    const featuredDApps = dapps.filter(d => d.featured);

    const getLogoSource = (logo: string) => {
        if (logo === 'stake.png') {
            return require('../../assets/stake.png');
        }
        return { uri: logo };
    };

    const getFavicon = (url: string) => {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        } catch (e) {
            return `https://www.google.com/s2/favicons?domain=${url}&sz=128`;
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Featured Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Featured</Text>
                    <View style={styles.grid}>
                        {featuredDApps.map((dapp) => (
                            <Pressable
                                key={dapp.id}
                                style={styles.gridItem}
                                onPress={() => onSelectDApp(dapp.url)}
                            >
                                <View style={[styles.iconBox, { backgroundColor: '#1C1D21' }]}>
                                    <Image
                                        source={getLogoSource(dapp.logo)}
                                        style={{ width: 32, height: 32, borderRadius: 8 }}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={styles.iconLabel} numberOfLines={1}>{dapp.name}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Bookmarks Section */}
                {bookmarks.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Bookmarks</Text>
                        <View style={styles.grid}>
                            {bookmarks.map((bookmark) => (
                                <Pressable
                                    key={bookmark.url}
                                    style={styles.gridItem}
                                    onPress={() => onSelectDApp(bookmark.url)}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: '#1C1D21' }]}>
                                        <Image
                                            source={{ uri: getFavicon(bookmark.url) }}
                                            style={{ width: 32, height: 32, borderRadius: 8 }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <Text style={styles.iconLabel} numberOfLines={1}>{bookmark.title}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                )}

                {/* History Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{history.length > 0 ? 'History' : 'Explore'}</Text>
                    {history.length > 0 && (
                        <TouchableOpacity onPress={clearHistory}>
                            <Text style={styles.clearText}>Clear</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.historyList}>
                    {history.length > 0 ? (
                        history.map((item) => (
                            <Pressable
                                key={item.timestamp}
                                style={styles.historyItem}
                                onPress={() => onSelectDApp(item.url)}
                            >
                                <View style={styles.historyIconContainer}>
                                    <Image
                                        source={{ uri: getFavicon(item.url) }}
                                        style={styles.historyIconSmall}
                                        resizeMode="contain"
                                    />
                                </View>
                                <View style={styles.historyText}>
                                    <Text style={styles.historyName} numberOfLines={1}>{item.title}</Text>
                                    <Text style={styles.historyUrl} numberOfLines={1}>
                                        {item.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                    </Text>
                                </View>
                            </Pressable>
                        ))
                    ) : (
                        dapps.map((dapp) => (
                            <Pressable
                                key={dapp.id}
                                style={styles.historyItem}
                                onPress={() => onSelectDApp(dapp.url)}
                            >
                                <Image source={getLogoSource(dapp.logo)} style={styles.historyIcon} resizeMode="contain" />
                                <View style={styles.historyText}>
                                    <Text style={styles.historyName}>{dapp.name}</Text>
                                    <Text style={styles.historyUrl} numberOfLines={1}>{dapp.url.replace('https://', '')}</Text>
                                </View>
                            </Pressable>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0E0F11',
        paddingTop: 20,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
    },
    clearText: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '500',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginTop: 16,
        gap: 12,
    },
    gridItem: {
        width: (width - 40) / 4 - 10,
        alignItems: 'center',
        marginBottom: 20,
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: '#1C1D21',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    iconLabel: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },
    historyList: {
        gap: 8,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        paddingHorizontal: 12,
        borderRadius: 16,
        marginBottom: 8,
    },
    historyIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    historyIconSmall: {
        width: 24,
        height: 24,
        borderRadius: 4,
    },
    historyIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        marginRight: 12,
    },
    historyText: {
        flex: 1,
    },
    historyName: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    historyUrl: {
        color: '#8B98A5',
        fontSize: 12,
        marginTop: 2,
    },
});
