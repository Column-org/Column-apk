import React from 'react'
import { View, StyleSheet } from 'react-native'
import { SkeletonLoader } from '../SkeletonLoader'

export const ActivitySkeleton = () => {
    return (
        <View style={styles.skeletonContainer}>
            {[...Array(6)].map((_, index) => (
                <View key={index} style={styles.skeletonItem}>
                    <SkeletonLoader width={48} height={48} borderRadius={24} />
                    <View style={styles.skeletonContent}>
                        <SkeletonLoader width="60%" height={16} style={{ marginBottom: 8 }} />
                        <SkeletonLoader width="40%" height={12} />
                    </View>
                    <View style={styles.skeletonRight}>
                        <SkeletonLoader width={60} height={14} style={{ marginBottom: 8 }} />
                        <SkeletonLoader width={50} height={12} />
                    </View>
                </View>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    skeletonContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    skeletonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222327',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
    },
    skeletonContent: {
        flex: 1,
        marginLeft: 12,
    },
    skeletonRight: {
        alignItems: 'flex-end',
    },
})
