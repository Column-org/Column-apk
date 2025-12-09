import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import CancelTransferForm from '../components/send/CancelTransferForm'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

export default function CancelTransfer() {
    const router = useRouter()

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#121315" />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                        <Ionicons name="arrow-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Cancel Transfer</Text>
                    <View style={{ width: 28 }} />
                </View>

                <CancelTransferForm />
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121315',
    },
    scrollView: {
        flex: 1,
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
})
