import React from 'react'
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Dimensions, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useNetwork } from '../../context/NetworkContext'
import { MovementNetwork, NETWORK_CONFIGS } from '../../constants/networkConfig'

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
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

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
                    {networkOptions.map((option, index) => {
                        const optionConfig = NETWORK_CONFIGS[option]
                        const isActive = network === option

                        // Determine position
                        let positionStyle = styles.cardMiddle;
                        if (networkOptions.length === 1) positionStyle = styles.cardSingle;
                        else if (index === 0) positionStyle = styles.cardTop;
                        else if (index === networkOptions.length - 1) positionStyle = styles.cardBottom;

                        return (
                            <TouchableOpacity
                                key={option}
                                style={[styles.networkItem, positionStyle]}
                                onPress={() => handleNetworkChange(option)}
                                activeOpacity={0.7}
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
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 60,
        paddingBottom: Platform.OS === 'ios' ? 12 : 24,
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
        marginTop: 8,
    },
    networkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#222327',
        borderRadius: 4,
        marginBottom: 2,
    },
    cardTop: {
        borderRadius: 4,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
    },
    cardMiddle: {
        borderRadius: 4,
    },
    cardBottom: {
        borderRadius: 4,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        marginBottom: 0,
    },
    cardSingle: {
        borderRadius: 20,
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


