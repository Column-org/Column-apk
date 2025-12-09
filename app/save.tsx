import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SavingsGoals } from '../components/SavingsGoals'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

export default function Save() {
    const router = useRouter()

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                    <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Savings & Goals</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <SavingsGoals />
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121315',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: IS_SMALL_SCREEN ? 16 : 50,
        paddingBottom: IS_SMALL_SCREEN ? 8 : 20,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
})
