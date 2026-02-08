import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Modal, Pressable, Alert, Dimensions, Animated } from 'react-native'
import React, { useRef } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SwipeableTabWrapper } from '../../components/SwipeableTabWrapper'
import { useSecurity } from '../../context/SecurityContext'
import { usePreferences } from '../../context/PreferencesContext'
import { NetworkSelector } from '../../components/NetworkSelector'
import { useWallet } from '../../context/WalletContext'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

const Settings = () => {
    const { logout: unifiedLogout, address, publicKey } = useWallet()
    const router = useRouter()
    const { t, i18n } = useTranslation()
    const [logoutModalVisible, setLogoutModalVisible] = React.useState(false)
    const [profileExpanded, setProfileExpanded] = React.useState(false)
    const scrollY = useRef(new Animated.Value(0)).current
    const {
        isSecurityEnabled,
        isBiometricEnabled,
        isBiometricAvailable,
        isPasscodeSet,
        enableBiometric,
        disableBiometric,
        removePasscode,
        disableSecurity,
        clearAllSecurity,
        lockTimeout,
    } = useSecurity()
    const { isNFTCollectionEnabled, setNFTCollectionEnabled } = usePreferences()

    const formatLockTimeout = (minutes: number) => {
        if (minutes <= 0) return '1 minute'
        if (minutes === 1) return '1 minute'
        if (minutes < 60) return `${minutes} minutes`
        const hours = minutes / 60
        return hours === 1 ? '1 hour' : `${hours} hours`
    }


    const handleToggleSecurity = () => {
        if (isSecurityEnabled) {
            Alert.alert(
                'Disable Security',
                'Are you sure you want to disable passcode protection?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Disable',
                        style: 'destructive',
                        onPress: async () => {
                            await disableSecurity()
                            await removePasscode()
                        },
                    },
                ]
            )
        } else {
            router.push('/passcode-setup')
        }
    }

    const handleToggleBiometric = async () => {
        if (isBiometricEnabled) {
            Alert.alert(
                'Disable Biometric',
                'Are you sure you want to disable biometric authentication?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Disable',
                        style: 'destructive',
                        onPress: async () => {
                            await disableBiometric()
                            await disableSecurity()
                        },
                    },
                ]
            )
        } else {
            const success = await enableBiometric()
            if (!success) {
                Alert.alert('Failed', 'Could not enable biometric authentication.')
            }
        }
    }

    const handleLogout = async () => {
        try {
            await clearAllSecurity()
            await unifiedLogout()
            setLogoutModalVisible(false)
            router.replace('/')
        } catch (error) {
            console.error('Logout error:', error)
            // Still try to navigate to home/entry to reset state
            router.replace('/')
        }
    }

    const handleExportPrivateKey = () => {
        router.push('/private-key')
    }

    const handleExportSeedphrase = () => {
        router.push('/recovery-phrase')
    }

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    })

    const headerTranslateY = scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: [10, 0],
        extrapolate: 'clamp',
    })

    return (
        <SwipeableTabWrapper>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />

                {/* Sticky Header Background */}
                <Animated.View style={[
                    styles.stickyHeader,
                    {
                        opacity: headerOpacity,
                        paddingTop: IS_SMALL_SCREEN ? 16 : 50,
                    }
                ]}>
                    <LinearGradient
                        colors={['#121315', 'rgba(18, 19, 21, 0.95)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <Animated.Text style={[
                        styles.stickyHeaderTitle,
                        { transform: [{ translateY: headerTranslateY }] }
                    ]}>
                        {t('settings.title')}
                    </Animated.Text>
                    <View style={styles.headerSeparator} />
                </Animated.View>

                <Animated.ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )}
                    scrollEventThrottle={16}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
                    </View>

                    {/* Account Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
                        <View style={styles.sectionCard}>
                            <TouchableOpacity
                                style={styles.settingItem}
                                onPress={() => setProfileExpanded(!profileExpanded)}
                            >
                                <View style={styles.settingLeft}>
                                    <Ionicons name="person-outline" size={22} color="#ffda34" />
                                    <Text style={styles.settingText}>{t('settings.profile')}</Text>
                                </View>
                                <Ionicons
                                    name={profileExpanded ? "chevron-up" : "chevron-down"}
                                    size={20}
                                    color="#8B98A5"
                                />
                            </TouchableOpacity>

                            {profileExpanded && (
                                <View style={styles.profileDropdown}>
                                    <View style={styles.accountInfo}>
                                        <Text style={styles.accountLabel}>Wallet Address</Text>
                                        <Text style={styles.accountValue}>{address || 'No address connected'}</Text>
                                    </View>
                                    <View style={styles.accountInfo}>
                                        <Text style={styles.accountLabel}>Public Key</Text>
                                        <Text style={styles.accountValue}>
                                            {publicKey ? `${publicKey.slice(0, 16)}...${publicKey.slice(-16)}` : 'N/A'}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Security Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('settings.security')}</Text>
                        <View style={styles.sectionCard}>
                            <TouchableOpacity
                                style={styles.settingItem}
                                onPress={handleToggleBiometric}
                                disabled={!isBiometricAvailable}
                                activeOpacity={0.7}
                            >
                                <View style={styles.settingLeft}>
                                    <Ionicons name="finger-print" size={22} color="#ffda34" />
                                    <Text style={styles.settingText}>{t('settings.biometricLock')}</Text>
                                </View>
                                <View style={[styles.toggle, isBiometricEnabled && styles.toggleActive]}>
                                    <View style={[styles.toggleDot, isBiometricEnabled && styles.toggleDotActive]} />
                                </View>
                            </TouchableOpacity>

                            {!isBiometricAvailable && (
                                <Text style={styles.securityNote}>
                                    Biometric authentication is not available on this device
                                </Text>
                            )}

                            {isPasscodeSet && (
                                <TouchableOpacity
                                    style={[styles.settingItem, { paddingTop: 4 }]}
                                    onPress={handleToggleSecurity}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.settingLeft}>
                                        <Ionicons name="lock-closed-outline" size={22} color="#ffda34" />
                                        <Text style={styles.settingText}>{t('settings.passcodeLock')}</Text>
                                    </View>
                                    <View style={[styles.toggle, isSecurityEnabled && isPasscodeSet && styles.toggleActive]}>
                                        <View style={[styles.toggleDot, isSecurityEnabled && isPasscodeSet && styles.toggleDotActive]} />
                                    </View>
                                </TouchableOpacity>
                            )}

                            {(isSecurityEnabled || isBiometricEnabled) && (
                                <TouchableOpacity
                                    style={[styles.settingItem, { paddingTop: 4 }]}
                                    onPress={() => router.push('/lockTimeout')}
                                >
                                    <View style={styles.settingLeft}>
                                        <Ionicons name="timer-outline" size={22} color="#ffda34" />
                                        <Text style={styles.settingText}>{t('settings.autoLockTimeout')}</Text>
                                    </View>
                                    <View style={styles.settingRight}>
                                        <Text style={styles.settingValue}>{formatLockTimeout(lockTimeout)}</Text>
                                        <Ionicons name="chevron-forward" size={20} color="#8B98A5" />
                                    </View>
                                </TouchableOpacity>
                            )}

                            <View style={styles.separator} />
                            <TouchableOpacity
                                style={styles.settingItem}
                                onPress={handleExportSeedphrase}
                            >
                                <View style={styles.settingLeft}>
                                    <Ionicons name="key-outline" size={22} color="#ffda34" />
                                    <Text style={styles.settingText}>{t('settings.recoveryPhrase')}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#8B98A5" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.settingItem}
                                onPress={handleExportPrivateKey}
                            >
                                <View style={styles.settingLeft}>
                                    <Ionicons name="shield-checkmark-outline" size={22} color="#ffda34" />
                                    <Text style={styles.settingText}>{t('settings.privateKey')}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#8B98A5" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Preferences Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>
                        <View style={styles.sectionCard}>
                            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/language')}>
                                <View style={styles.settingLeft}>
                                    <Ionicons name="globe-outline" size={22} color="#ffda34" />
                                    <Text style={styles.settingText}>{t('settings.language')}</Text>
                                </View>
                                <View style={styles.settingRight}>
                                    <Text style={styles.settingValue}>
                                        {i18n.language === 'es'
                                            ? 'Español'
                                            : i18n.language === 'zh'
                                                ? '中文'
                                                : 'English'}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={20} color="#8B98A5" />
                                </View>
                            </TouchableOpacity>

                            <NetworkSelector />

                            <TouchableOpacity
                                style={styles.settingItem}
                                onPress={() => router.push('/theme')}
                            >
                                <View style={styles.settingLeft}>
                                    <Ionicons name="color-palette-outline" size={22} color="#ffda34" />
                                    <Text style={styles.settingText}>{t('settings.appTheme')}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#8B98A5" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.settingItem}
                                onPress={() => setNFTCollectionEnabled(!isNFTCollectionEnabled)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.settingLeft}>
                                    <Ionicons name="images-outline" size={22} color="#ffda34" />
                                    <Text style={styles.settingText}>{t('settings.showNFTCollection')}</Text>
                                </View>
                                <View style={[styles.toggle, isNFTCollectionEnabled && styles.toggleActive]}>
                                    <View style={[styles.toggleDot, isNFTCollectionEnabled && styles.toggleDotActive]} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Support Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('settings.support')}</Text>
                        <View style={styles.sectionCard}>
                            <TouchableOpacity style={styles.settingItem}>
                                <View style={styles.settingLeft}>
                                    <Ionicons name="help-circle-outline" size={22} color="#ffda34" />
                                    <Text style={styles.settingText}>{t('settings.helpCenter')}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#8B98A5" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.settingItem}>
                                <View style={styles.settingLeft}>
                                    <Ionicons name="document-text-outline" size={22} color="#ffda34" />
                                    <Text style={styles.settingText}>{t('settings.termsPrivacy')}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#8B98A5" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </Animated.ScrollView>
            </View>
        </SwipeableTabWrapper>
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
        paddingHorizontal: 20,
        paddingTop: IS_SMALL_SCREEN ? 16 : 50,
        paddingBottom: IS_SMALL_SCREEN ? 8 : 20,
    },
    headerTitle: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
    },
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: '#121315',
        paddingBottom: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stickyHeaderTitle: {
        color: 'white',
        fontSize: 17,
        fontWeight: '700',
    },
    headerSeparator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        color: '#8B98A5',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 12,
    },
    sectionCard: {
        backgroundColor: '#222327',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 15,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    settingValue: {
        color: '#8B98A5',
        fontSize: 13,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginTop: 20,
        paddingVertical: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    logoutText: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 20, 25, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContent: {
        backgroundColor: '#1A1F28',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalIconContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    modalIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    modalMessage: {
        color: '#8B98A5',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 28,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancelButton: {
        flex: 1,
        paddingVertical: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
    },
    modalCancelText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    modalLogoutButton: {
        flex: 1,
        paddingVertical: 14,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        alignItems: 'center',
    },
    modalLogoutText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    profileDropdown: {
        marginTop: 12,
        gap: 12,
    },
    accountInfo: {
        marginBottom: 8,
    },
    accountLabel: {
        color: '#8B98A5',
        fontSize: 11,
        marginBottom: 4,
    },
    accountValue: {
        color: 'white',
        fontSize: 13,
        fontWeight: '500',
    },
    badgeRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    modeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    modeBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    web3Actions: {
        marginTop: 8,
        gap: 8,
    },
    dropdownLogoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        gap: 8,
    },
    dropdownLogoutText: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '600',
    },
    languageDropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        marginBottom: 8,
    },
    languageDropdownItemActive: {
        backgroundColor: 'rgba(255, 195, 13, 0.05)',
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    languageDropdownText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '500',
    },
    languageDropdownTextActive: {
        color: '#ffda34',
        fontWeight: '600',
    },
    networkDetailText: {
        color: '#8B98A5',
        fontSize: 12,
        marginTop: 4,
    },
    securityNote: {
        color: '#8B98A5',
        fontSize: 12,
        paddingLeft: 37,
        marginTop: -4,
        marginBottom: 4,
    },
    toggle: {
        width: 40,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#121315',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingHorizontal: 2,
    },
    toggleActive: {
        backgroundColor: '#ffda34',
        alignItems: 'flex-end',
    },
    toggleDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#ffda34',
    },
    toggleDotActive: {
        backgroundColor: '#121315',
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginVertical: 4,
    },
})

export default Settings
