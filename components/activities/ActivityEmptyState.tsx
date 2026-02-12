import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export const ActivityEmptyState = () => {
    return (
        <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#8B98A5" />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Your transaction history will appear here</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        color: '#8B98A5',
        fontSize: 14,
        marginTop: 8,
    },
})
