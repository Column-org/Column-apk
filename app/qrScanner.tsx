import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Camera, CameraView } from 'expo-camera'

export default function QRScanner() {
    const router = useRouter()
    const params = useLocalSearchParams()
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)
    const [scanned, setScanned] = useState(false)

    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync()
            setHasPermission(status === 'granted')
        }

        getCameraPermissions()
    }, [])

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        setScanned(true)

        // 1. Detect Column SDK Deep Links
        if (data.startsWith('column://')) {
            console.log('QR Scanner: Detected Column Deep Link:', data)
            Linking.openURL(data).catch(err => {
                console.error('QR Scanner: Failed to open deep link:', err)
                Alert.alert('Error', 'Failed to handle the scanned deep link.')
            })
            router.back()
            return
        }

        // 2. Fallback: standard address scanning for transfers
        // Navigate back to sendConfirm with the scanned address and preserve other params
        router.push({
            pathname: '/sendConfirm',
            params: {
                token: params.token,
                amount: params.amount,
                scannedAddress: data
            }
        })
    }

    const openSettings = () => {
        Linking.openSettings()
    }

    if (hasPermission === null) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Requesting camera permission...</Text>
            </View>
        )
    }

    if (hasPermission === false) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                        <Ionicons name="arrow-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>QR Scanner</Text>
                    <View style={{ width: 28 }} />
                </View>

                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={80} color="#8B98A5" />
                    <Text style={styles.permissionText}>Camera permission denied</Text>
                    <Text style={styles.permissionSubtext}>
                        Please enable camera access in settings to scan QR codes
                    </Text>
                    <TouchableOpacity style={styles.settingsButton} onPress={openSettings} activeOpacity={0.7}>
                        <Text style={styles.settingsButtonText}>Open Settings</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Scan QR Code</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.camera}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                    }}
                >
                    <View style={styles.overlay}>
                        <View style={styles.scanArea}>
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                        </View>
                    </View>
                </CameraView>
            </View>

            <View style={styles.instructionContainer}>
                <Text style={styles.instructionText}>
                    Position the QR code within the frame
                </Text>
            </View>

            {scanned && (
                <TouchableOpacity
                    style={styles.scanAgainButton}
                    onPress={() => setScanned(false)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.scanAgainText}>Tap to Scan Again</Text>
                </TouchableOpacity>
            )}
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
        paddingTop: 50,
        paddingBottom: 20,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    text: {
        color: 'white',
        fontSize: 16,
    },
    cameraContainer: {
        flex: 1,
        overflow: 'hidden',
        borderRadius: 20,
        marginHorizontal: 20,
        marginBottom: 20,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanArea: {
        width: 280,
        height: 280,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#ffda34',
        borderWidth: 4,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderBottomWidth: 0,
        borderRightWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderTopWidth: 0,
        borderRightWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderTopWidth: 0,
        borderLeftWidth: 0,
    },
    instructionContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        alignItems: 'center',
    },
    instructionText: {
        color: '#8B98A5',
        fontSize: 14,
        textAlign: 'center',
    },
    scanAgainButton: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        backgroundColor: '#ffda34',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    scanAgainText: {
        color: '#121315',
        fontSize: 16,
        fontWeight: '600',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    permissionText: {
        color: 'white',
        fontSize: 20,
        fontWeight: '600',
        marginTop: 24,
        marginBottom: 12,
    },
    permissionSubtext: {
        color: '#8B98A5',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 32,
    },
    settingsButton: {
        backgroundColor: '#ffda34',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    settingsButtonText: {
        color: '#121315',
        fontSize: 16,
        fontWeight: '600',
    },
})
