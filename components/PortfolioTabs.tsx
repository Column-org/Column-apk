import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PortfolioTabsProps {
    activeTab: 'tokens' | 'projects';
    onTabChange: (tab: 'tokens' | 'projects') => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export const PortfolioTabs = ({
    activeTab,
    onTabChange,
    onRefresh,
    isRefreshing
}: PortfolioTabsProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.contentRow}>
                <View style={styles.buttonsWrapper}>
                    {/* Tokens Button */}
                    <TouchableOpacity
                        style={[styles.button, activeTab === 'tokens' && styles.activeButton]}
                        onPress={() => onTabChange('tokens')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="layers" size={20} color={activeTab === 'tokens' ? '#ffda34' : '#8B98A5'} />
                        <Text style={[styles.buttonLabel, activeTab === 'tokens' && styles.activeLabel]}>Tokens</Text>
                    </TouchableOpacity>

                    {/* Projects Button */}
                    <TouchableOpacity
                        style={[styles.button, activeTab === 'projects' && styles.activeButton]}
                        onPress={() => onTabChange('projects')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="grid" size={20} color={activeTab === 'projects' ? '#ffda34' : '#8B98A5'} />
                        <Text style={[styles.buttonLabel, activeTab === 'projects' && styles.activeLabel]}>Projects</Text>
                    </TouchableOpacity>
                </View>

                {onRefresh && (
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={onRefresh}
                        disabled={isRefreshing}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="refresh"
                            size={18}
                            color="#8B98A5"
                            style={isRefreshing ? styles.rotating : undefined}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 28,
        marginTop: 12,
        marginBottom: 8,
    },
    buttonsWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    refreshButton: {
        padding: 4,
    },
    rotating: {
        // Rotation should be handled via Animation for better performance, 
        // but keeping it consistent with TokenList's style reference
        opacity: 0.5,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
    },
    activeButton: {
        // No specific container style needed for active text-only tab
    },
    buttonLabel: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    activeLabel: {
        color: '#ffda34',
    },
});
