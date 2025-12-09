import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { FungibleAsset } from '../../services/movementAssets'

interface TokenSelectorProps {
    selectedToken: FungibleAsset | null
    onPress: () => void
}

export default function TokenSelector({ selectedToken, onPress }: TokenSelectorProps) {
    return (
        <View style={styles.topSection}>
            <TouchableOpacity
                style={styles.tokenSelector}
                activeOpacity={0.7}
                onPress={onPress}
            >
                {selectedToken?.metadata.icon_uri ? (
                    <Image
                        source={{ uri: selectedToken.metadata.icon_uri }}
                        style={styles.tokenIconImage}
                    />
                ) : (
                    <View style={styles.tokenIcon}>
                        <Ionicons name="logo-bitcoin" size={20} color="#ffda34" />
                    </View>
                )}
                <Text style={styles.tokenText}>
                    {selectedToken ? selectedToken.metadata.symbol : 'Select Token'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="white" />
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    topSection: {
        paddingHorizontal: 20,
        alignItems: 'center',
        paddingTop: 20,
    },
    tokenSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222327',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
        marginBottom: 30,
    },
    tokenIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 195, 13, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tokenIconImage: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    tokenText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
})
