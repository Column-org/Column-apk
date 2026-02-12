import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface ActivityFilterProps {
    filterType: 'all' | 'send' | 'receive' | 'swap' | 'contract'
    setFilterType: (type: 'all' | 'send' | 'receive' | 'swap' | 'contract') => void
    hideFailedTx: boolean
    setHideFailedTx: (hide: boolean) => void
}

export const ActivityFilter = ({ filterType, setFilterType, hideFailedTx, setHideFailedTx }: ActivityFilterProps) => {
    return (
        <View style={styles.filterMenu}>
            <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Transaction Type</Text>
                <View style={styles.filterOptions}>
                    <TouchableOpacity
                        style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
                        onPress={() => setFilterType('all')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, filterType === 'send' && styles.filterChipActive]}
                        onPress={() => setFilterType('send')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.filterChipText, filterType === 'send' && styles.filterChipTextActive]}>Send</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, filterType === 'receive' && styles.filterChipActive]}
                        onPress={() => setFilterType('receive')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.filterChipText, filterType === 'receive' && styles.filterChipTextActive]}>Receive</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, filterType === 'swap' && styles.filterChipActive]}
                        onPress={() => setFilterType('swap')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.filterChipText, filterType === 'swap' && styles.filterChipTextActive]}>Swap</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, filterType === 'contract' && styles.filterChipActive]}
                        onPress={() => setFilterType('contract')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.filterChipText, filterType === 'contract' && styles.filterChipTextActive]}>Contract</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.filterDivider} />

            <TouchableOpacity
                style={styles.filterToggle}
                onPress={() => setHideFailedTx(!hideFailedTx)}
                activeOpacity={0.7}
            >
                <Text style={styles.filterToggleText}>Hide Failed Transactions</Text>
                <View style={[styles.toggle, hideFailedTx && styles.toggleActive]}>
                    <View style={[styles.toggleDot, hideFailedTx && styles.toggleDotActive]} />
                </View>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    filterMenu: {
        backgroundColor: '#222327',
        marginHorizontal: 20,
        marginTop: 8,
        borderRadius: 12,
        padding: 12,
    },
    filterSection: {
        marginBottom: 8,
    },
    filterLabel: {
        color: '#8B98A5',
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#121315',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    filterChipActive: {
        backgroundColor: '#ffda34',
        borderColor: '#ffda34',
    },
    filterChipText: {
        color: '#8B98A5',
        fontSize: 11,
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#121315',
    },
    filterDivider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: 8,
    },
    filterToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    filterToggleText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    toggle: {
        width: 40,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#121315',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingHorizontal: 2,
    },
    toggleActive: {
        backgroundColor: '#ffda34',
        alignItems: 'flex-end',
    },
    toggleDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#ffda34',
    },
    toggleDotActive: {
        backgroundColor: '#121315',
    },
})
