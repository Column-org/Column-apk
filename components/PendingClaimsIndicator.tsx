import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

interface PendingClaimsIndicatorProps {
    count: number
}

export default function PendingClaimsIndicator({ count }: PendingClaimsIndicatorProps) {
    const router = useRouter()
    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        if (count > 0) {
            setDismissed(false)
        }
    }, [count])

    if (count === 0 || dismissed) return null

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <TouchableOpacity
                    style={styles.cancelBadge}
                    onPress={() => setDismissed(true)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="close-outline" size={12} color="#8B98A5" />
                </TouchableOpacity>

                <Ionicons name="time-outline" size={24} color="#ffda34" />

                <View style={styles.textContainer}>
                    <Text style={styles.titleText}>Pending Claims</Text>
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{count}</Text>
                    </View>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.moreContainer}
                        onPress={() => router.push('/pendingClaims')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.moreText}>View more</Text>
                        <Ionicons name="chevron-forward" size={16} color="#8B98A5" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginLeft: 20,
        marginRight: 20,
        marginVertical: 6,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 20,
        paddingHorizontal: 16,
        backgroundColor: '#222327',
        borderRadius: 16,
        position: 'relative',
    },
    textContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    titleText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
    },
    countBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        backgroundColor: 'rgba(255, 195, 13, 0.2)',
    },
    countText: {
        color: '#ffda34',
        fontSize: 12,
        fontWeight: '700',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    moreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    moreText: {
        color: '#8B98A5',
        fontSize: 13,
    },
    cancelBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(139, 152, 165, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
})
