import React from 'react'
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useNetwork } from '../context/NetworkContext'
import { MovementNetwork, NETWORK_CONFIGS } from '../constants/networkConfig'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

const NetworkPage = () => {
    const router = useRouter()
    const { network, setNetwork } = useNetwork()

    const networkOptions: MovementNetwork[] = ['mainnet', 'testnet']

    const handleNetworkChange = (value: MovementNetwork) => {
        setNetwork(value)
        router.back()
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={26} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Network</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.description}>
                    Select which network to connect to
                </Text>

                <View style={styles.networkList}>
                    {networkOptions.map((option) => {
                        const optionConfig = NETWORK_CONFIGS[option]
                        const isActive = network === option
                        return (
                            <TouchableOpacity
                                key={option}
                                style={styles.networkItem}
                                onPress={() => handleNetworkChange(option)}
                            >
                                <View style={styles.networkInfo}>
                                    <View style={[
                                        styles.radioOuter,
                                        isActive && styles.radioOuterActive,
                                    ]}>
                                        {isActive && <View style={styles.radioInner} />}
                                    </View>
                                    <View>
                                        <Text style={styles.networkName}>
                                            {optionConfig.displayName}
                                        </Text>
                                        <Text style={styles.networkDescription}>
                                            {option === 'mainnet'
                                                ? 'Production network with real assets'
                                                : 'Test network for development'}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )
                    })}
                </View>
            </View>
        </SafeAreaView>
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
        paddingHorizontal: 20,
        paddingTop: IS_SMALL_SCREEN ? 16 : 50,
        paddingBottom: IS_SMALL_SCREEN ? 12 : 24,
        gap: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    description: {
        color: '#8B98A5',
        fontSize: 14,
        marginBottom: 24,
    },
    networkList: {
        gap: 16,
    },
    networkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    networkInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#8B98A5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterActive: {
        borderColor: '#ffda34',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#ffda34',
    },
    networkName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    networkDescription: {
        color: '#8B98A5',
        fontSize: 13,
    },
})

export default NetworkPage
