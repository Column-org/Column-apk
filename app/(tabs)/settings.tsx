import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Modal, Pressable, Alert, Dimensions } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { usePrivy } from '@privy-io/expo'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SwipeableTabWrapper } from '../../components/SwipeableTabWrapper'
import { useSecurity } from '../../context/SecurityContext'
import { usePreferences } from '../../context/PreferencesContext'
import { NetworkSelector } from '../../components/NetworkSelector'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 750

const Settings = () => {
    const { logout, user } = usePrivy()
    const router = useRouter()
    const { t, i18n } = useTranslation()
    const [logoutModalVisible, setLogoutModalVisible] = React.useState(false)
    const [profileExpanded, setProfileExpanded] = React.useState(false)
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
        if (minutes === 0) return 'Immediate'
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
            await logout()
            setLogoutModalVisible(false)
            router.replace('/')
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    return (
        <SwipeableTabWrapper>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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

                        {profileExpanded && user && (
                            <View style={styles.profileDropdown}>
                                {/* Email */}
                                {(user as any).email?.address && (
                                    <View style={styles.accountInfo}>
                                        <Text style={styles.accountValue}>{(user as any).email.address}</Text>
                                    </View>
                                )}
                                {user.linked_accounts?.find((acc: any) => acc.type === 'email') && (
                                    <View style={styles.accountInfo}>
                                        <Text style={styles.accountValue}>
                                            {(user.linked_accounts.find((acc: any) => acc.type === 'email') as any).address}
                                        </Text>
                                    </View>
                                )}

                                {/* Movement Wallet */}
                                {user.linked_accounts && user.linked_accounts
                                    .filter((account: any) => account.type === 'wallet' && (account as any).chain_type === 'aptos')
                                    .map((account: any, index: number) => (
                                        <View key={index} style={styles.accountInfo}>
                                            <Text style={styles.accountValue}>
                                                {(account as any).address}
                                            </Text>
                                        </View>
                                    ))
                                }
                            </View>
                        )}
                    </View>
                </View>

                {/* Security Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security</Text>
                    <View style={styles.sectionCard}>
                        <TouchableOpacity
                            style={styles.settingItem}
                            onPress={handleToggleBiometric}
                            disabled={!isBiometricAvailable}
                            activeOpacity={0.7}
                        >
                            <View style={styles.settingLeft}>
                                <Ionicons name="finger-print" size={22} color="#ffda34" />
                                <Text style={styles.settingText}>Biometric Lock</Text>
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
                                    <Text style={styles.settingText}>Passcode Lock</Text>
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
                                    <Text style={styles.settingText}>Auto-Lock Timeout</Text>
                                </View>
                                <View style={styles.settingRight}>
                                    <Text style={styles.settingValue}>{formatLockTimeout(lockTimeout)}</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#8B98A5" />
                                </View>
                            </TouchableOpacity>
                        )}
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
                                <Text style={styles.settingText}>App Theme</Text>
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
                                <Text style={styles.settingText}>Show NFT Collection</Text>
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
            </ScrollView>

            {/* Logout Modal */}
            <Modal
                visible={logoutModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setLogoutModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setLogoutModalVisible(false)}
                >
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalIconContainer}>
                            <View style={styles.modalIconCircle}>
                                <Ionicons name="log-out-outline" size={32} color="#EF4444" />
                            </View>
                        </View>

                        <Text style={styles.modalTitle}>{t('wallet.logout')}</Text>
                        <Text style={styles.modalMessage}>
                            {t('wallet.logoutConfirm')}
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setLogoutModalVisible(false)}
                            >
                                <Text style={styles.modalCancelText}>{t('wallet.cancel')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalLogoutButton}
                                onPress={handleLogout}
                            >
                                <Text style={styles.modalLogoutText}>{t('wallet.logout')}</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
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
        fontSize: 24,
        fontWeight: 'bold',
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
    },
    accountInfo: {
        marginBottom: 16,
    },
    accountValue: {
        color: 'white',
        fontSize: 13,
        fontWeight: '500',
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
})

export default Settings
