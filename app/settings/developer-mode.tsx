import React from 'react'
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Platform, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { usePreferences } from '../../context/PreferencesContext'
import AudioService from '../../services/audio/AudioService'

export default function DeveloperModeScreen() {
    const router = useRouter()
    const {
        isSoundEnabled,
        setSoundEnabled,
        isHapticEnabled,
        setHapticEnabled,
        isSpamFilterEnabled,
        setSpamFilterEnabled,
        isPnlGlowEnabled,
        setPnlGlowEnabled,
        pnlGlowPulseCount,
        setPnlGlowPulseCount,
        pnlGlowFrequency,
        setPnlGlowFrequency,
        pnlGlowBlurSize,
        setPnlGlowBlurSize,
        pnlGlowColorPositive,
        setPnlGlowColorPositive,
        pnlGlowColorNegative,
        setPnlGlowColorNegative
    } = usePreferences()

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Developer Settings</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView style={styles.content}>
                <Text style={styles.sectionTitle}>SOUNDS & HAPTICS</Text>

                <View style={styles.section}>
                    <TouchableOpacity
                        style={[styles.settingItem, styles.cardTop]}
                        onPress={() => {
                            AudioService.feedback('click')
                            setSoundEnabled(!isSoundEnabled)
                        }}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingMainRow}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="volume-medium-outline" size={22} color="#ffda34" />
                                <Text style={styles.settingText}>App Sounds</Text>
                            </View>
                            <View style={[styles.toggle, isSoundEnabled && styles.toggleActive]}>
                                <View style={[styles.toggleDot, isSoundEnabled && styles.toggleDotActive]} />
                            </View>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.settingItem, styles.cardBottom]}
                        onPress={() => {
                            AudioService.feedback('click')
                            setHapticEnabled(!isHapticEnabled)
                        }}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingMainRow}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="hand-left-outline" size={22} color="#ffda34" />
                                <Text style={styles.settingText}>Haptic Feedback</Text>
                            </View>
                            <View style={[styles.toggle, isHapticEnabled && styles.toggleActive]}>
                                <View style={[styles.toggleDot, isHapticEnabled && styles.toggleDotActive]} />
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>SECURITY & ASSETS</Text>

                <View style={styles.section}>
                    <TouchableOpacity
                        style={[styles.settingItem, styles.cardSingle]}
                        onPress={() => {
                            AudioService.feedback('click')
                            setSpamFilterEnabled(!isSpamFilterEnabled)
                        }}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingMainRow}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="shield-outline" size={22} color="#ffda34" />
                                <View>
                                    <Text style={styles.settingText}>Spam Filter</Text>
                                    <Text style={styles.settingSubtext}>Hide suspicious tokens & NFTs</Text>
                                </View>
                            </View>
                            <View style={[styles.toggle, isSpamFilterEnabled && styles.toggleActive]}>
                                <View style={[styles.toggleDot, isSpamFilterEnabled && styles.toggleDotActive]} />
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>GLOW EFFECTS</Text>

                <View style={styles.section}>
                    <TouchableOpacity
                        style={[styles.settingItem, styles.cardTop]}
                        onPress={() => {
                            AudioService.feedback('click')
                            setPnlGlowEnabled(!isPnlGlowEnabled)
                        }}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingMainRow}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="sparkles-outline" size={22} color="#ffda34" />
                                <View>
                                    <Text style={styles.settingText}>PNL Notification Glow</Text>
                                    <Text style={styles.settingSubtext}>Flash amber/red on profit changes</Text>
                                </View>
                            </View>
                            <View style={[styles.toggle, isPnlGlowEnabled && styles.toggleActive]}>
                                <View style={[styles.toggleDot, isPnlGlowEnabled && styles.toggleDotActive]} />
                            </View>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.settingItem, styles.cardMiddle]}
                        onPress={() => {
                            AudioService.feedback('click')
                            setPnlGlowFrequency(pnlGlowFrequency === 'always' ? 'daily' : 'always')
                        }}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingMainRow}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="time-outline" size={22} color="#ffda34" />
                                <Text style={styles.settingText}>Show Once Per Day</Text>
                            </View>
                            <View style={[styles.toggle, pnlGlowFrequency === 'daily' && styles.toggleActive]}>
                                <View style={[styles.toggleDot, pnlGlowFrequency === 'daily' && styles.toggleDotActive]} />
                            </View>
                        </View>
                    </TouchableOpacity>

                    <View style={[styles.settingItem, styles.cardMiddle]}>
                        <View style={styles.settingMainRow}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="repeat-outline" size={22} color="#ffda34" />
                                <Text style={styles.settingText}>Pulse Count</Text>
                            </View>
                            <View style={styles.countControls}>
                                <TouchableOpacity
                                    onPress={() => {
                                        AudioService.feedback('click')
                                        setPnlGlowPulseCount(Math.max(1, pnlGlowPulseCount - 1))
                                    }}
                                    style={styles.countButton}
                                >
                                    <Ionicons name="remove" size={18} color="white" />
                                </TouchableOpacity>
                                <Text style={styles.countText}>{pnlGlowPulseCount}</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        AudioService.feedback('click')
                                        setPnlGlowPulseCount(Math.min(5, pnlGlowPulseCount + 1))
                                    }}
                                    style={styles.countButton}
                                >
                                    <Ionicons name="add" size={18} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>


                    <View style={[styles.settingItem, styles.cardMiddle]}>
                        <View style={styles.settingMainRow}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="expand-outline" size={22} color="#ffda34" />
                                <Text style={styles.settingText}>Blur Size</Text>
                            </View>
                            <View style={styles.countControls}>
                                <TouchableOpacity
                                    onPress={() => {
                                        AudioService.feedback('click')
                                        setPnlGlowBlurSize(Math.max(10, pnlGlowBlurSize - 10))
                                    }}
                                    style={styles.countButton}
                                >
                                    <Ionicons name="remove" size={18} color="white" />
                                </TouchableOpacity>
                                <Text style={styles.countText}>{pnlGlowBlurSize}px</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        AudioService.feedback('click')
                                        setPnlGlowBlurSize(Math.min(300, pnlGlowBlurSize + 10))
                                    }}
                                    style={styles.countButton}
                                >
                                    <Ionicons name="add" size={18} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.settingItem, styles.cardMiddle]}>
                        <View style={styles.settingMainRow}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="color-palette-outline" size={22} color="#ffda34" />
                                <Text style={styles.settingText}>Positive Color</Text>
                            </View>
                            <View style={styles.colorInputContainer}>
                                <View style={[styles.colorPreview, { backgroundColor: pnlGlowColorPositive }]} />
                                <TextInput
                                    style={styles.hexInput}
                                    value={pnlGlowColorPositive}
                                    onChangeText={setPnlGlowColorPositive}
                                    placeholder="#Hex"
                                    placeholderTextColor="#555"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>
                    </View>

                    <View style={[styles.settingItem, styles.cardBottom]}>
                        <View style={styles.settingMainRow}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="color-palette-outline" size={22} color="#ef4444" />
                                <Text style={styles.settingText}>Negative Color</Text>
                            </View>
                            <View style={styles.colorInputContainer}>
                                <View style={[styles.colorPreview, { backgroundColor: pnlGlowColorNegative }]} />
                                <TextInput
                                    style={styles.hexInput}
                                    value={pnlGlowColorNegative}
                                    onChangeText={setPnlGlowColorNegative}
                                    placeholder="#Hex"
                                    placeholderTextColor="#555"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color="#8B98A5" />
                    <Text style={styles.infoText}>
                        These settings are for development and testing purposes.
                        They allow you to toggle feedback mechanisms globally.
                    </Text>
                </View>
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
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        color: '#8B98A5',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 12,
        marginTop: 10,
        letterSpacing: 1,
    },
    section: {
        marginBottom: 24,
    },
    settingItem: {
        backgroundColor: '#222327',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginBottom: 2,
    },
    cardTop: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
    },
    cardMiddle: {
        borderRadius: 4,
    },
    cardBottom: {
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        marginBottom: 0,
    },
    cardSingle: {
        borderRadius: 20,
    },
    settingMainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 12,
    },
    settingSubtext: {
        color: '#8B98A5',
        fontSize: 12,
        marginLeft: 12,
        marginTop: 2,
    },
    toggle: {
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#2A2F3A',
        padding: 2,
    },
    toggleActive: {
        backgroundColor: '#ffda34',
    },
    toggleDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#8B98A5',
    },
    toggleDotActive: {
        transform: [{ translateX: 20 }],
        backgroundColor: '#121315',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(139, 152, 165, 0.1)',
        padding: 16,
        borderRadius: 12,
        alignItems: 'flex-start',
        gap: 12,
    },
    infoText: {
        color: '#8B98A5',
        fontSize: 13,
        lineHeight: 18,
        flex: 1,
    },
    countControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 4,
    },
    countButton: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    countText: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
        minWidth: 15,
        textAlign: 'center',
    },
    colorInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    colorPreview: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    hexInput: {
        color: 'white',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        fontSize: 13,
        width: 80,
        textAlign: 'center',
    }
})
