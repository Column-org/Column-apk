import React, { useState } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    StatusBar,
    TextInput,
    ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { usePreferences } from '../context/PreferencesContext'
import { useAssets } from '../hooks/useAssets'
import { formatAssetBalance } from '../services/movementAssets'

export default function ManageTokensScreen() {
    const router = useRouter()
    const { t } = useTranslation()
    const { hiddenTokens, toggleTokenVisibility } = usePreferences()
    const { assets, isLoading } = useAssets()
    const [searchQuery, setSearchQuery] = useState('')

    // Filter tokens based on search query and type
    const tokens = assets.filter(asset => {
        const name = asset.metadata.name?.toLowerCase() || ''
        const symbol = asset.metadata.symbol?.toLowerCase() || ''
        const type = asset.asset_type?.toLowerCase() || ''

        const isProject = name.includes('podium') || symbol.includes('podium') ||
            name.includes('pass') || symbol.includes('pass') ||
            name.includes('nexus') || symbol.includes('nexus') ||
            type.includes('podium') || type.includes('pass') || type.includes('nexus')

        if (isProject) return false

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            return name.includes(query) || symbol.includes(query)
        }

        return true
    })

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('settings.manageTokens') || 'Manage Tokens'}</Text>
                    <View style={styles.headerRight} />
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color="#8B98A5" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('search.placeholder') || "Search tokens"}
                            placeholderTextColor="#8B98A5"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color="#8B98A5" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('settings.yourAssets') || 'Your Assets'}</Text>
                        <Text style={styles.sectionSubtitle}>{t('settings.manageTokensSubtitle') || 'Hide tokens to remove them from your main dashboard'}</Text>

                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#ffda34" />
                            </View>
                        ) : (
                            <>
                                {tokens.map((asset, index) => {
                                    const isHidden = hiddenTokens.includes(asset.asset_type)
                                    const formattedBalance = formatAssetBalance(asset.amount, asset.metadata.decimals)

                                    return (
                                        <View key={`${asset.asset_type}-${index}`} style={styles.tokenItem}>
                                            <View style={styles.tokenLeft}>
                                                {asset.metadata.icon_uri ? (
                                                    <Image source={{ uri: asset.metadata.icon_uri }} style={styles.tokenIcon} />
                                                ) : (
                                                    <View style={styles.tokenIconPlaceholder}>
                                                        <Text style={styles.tokenIconText}>{asset.metadata.symbol.charAt(0)}</Text>
                                                    </View>
                                                )}
                                                <View>
                                                    <Text style={styles.tokenName}>{asset.metadata.name}</Text>
                                                    <Text style={styles.tokenBalance}>{formattedBalance} {asset.metadata.symbol}</Text>
                                                </View>
                                            </View>

                                            <TouchableOpacity
                                                onPress={() => toggleTokenVisibility(asset.asset_type)}
                                                style={styles.visibilityToggle}
                                            >
                                                <Ionicons
                                                    name={isHidden ? "eye-off-outline" : "eye-outline"}
                                                    size={24}
                                                    color={isHidden ? "#8B98A5" : "#ffda34"}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    )
                                })}

                                {tokens.length === 0 && (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>{t('search.noResults') || 'No tokens found'}</Text>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    )
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
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    headerRight: {
        width: 44,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1D21',
        borderRadius: 14,
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        color: 'white',
        fontSize: 15,
        marginLeft: 8,
        height: '100%',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    section: {
        paddingTop: 20,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    sectionSubtitle: {
        color: '#8B98A5',
        fontSize: 13,
        marginBottom: 24,
    },
    tokenItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#222327',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
    },
    tokenLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    tokenIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
    },
    tokenIconPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 195, 13, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    tokenIconText: {
        color: '#ffda34',
        fontSize: 18,
        fontWeight: 'bold',
    },
    tokenName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    tokenBalance: {
        color: '#8B98A5',
        fontSize: 12,
        marginTop: 4,
    },
    visibilityToggle: {
        padding: 8,
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#8B98A5',
        fontSize: 14,
    },
    loadingContainer: {
        paddingVertical: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
})
