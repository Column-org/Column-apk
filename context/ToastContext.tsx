import React from 'react'
import { ToastProvider as OriginalToastProvider, useToast as useOriginalToast } from 'react-native-toast-notifications'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AudioService from '../services/audio/AudioService'

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const insets = useSafeAreaInsets()

    return (
        <OriginalToastProvider
            placement="top"
            duration={4000}
            animationType='slide-in'
            animationDuration={250}
            offsetTop={insets.top + (Platform.OS === 'ios' ? 0 : 10)}
            renderType={{
                success: (toast) => (
                    <View style={[styles.toastContainer, styles.successToast]}>
                        <View style={[styles.iconContainer, styles.successIcon]}>
                            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>{toast.message}</Text>
                            {toast.data?.message && <Text style={styles.message}>{toast.data.message}</Text>}
                        </View>
                    </View>
                ),
                error: (toast) => (
                    <View style={[styles.toastContainer, styles.errorToast]}>
                        <View style={[styles.iconContainer, styles.errorIcon]}>
                            <Ionicons name="close-circle" size={24} color="#EF4444" />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>{toast.message}</Text>
                            {toast.data?.message && <Text style={styles.message}>{toast.data.message}</Text>}
                        </View>
                    </View>
                ),
                warning: (toast) => (
                    <View style={[styles.toastContainer, styles.warningToast]}>
                        <View style={[styles.iconContainer, styles.warningIcon]}>
                            <Ionicons name="warning" size={24} color="#ffda34" />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>{toast.message}</Text>
                            {toast.data?.message && <Text style={styles.message}>{toast.data.message}</Text>}
                        </View>
                    </View>
                ),
                info: (toast) => (
                    <View style={[styles.toastContainer, styles.infoToast]}>
                        <View style={[styles.iconContainer, styles.infoIcon]}>
                            <Ionicons name="information-circle" size={24} color="#ffda34" />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>{toast.message}</Text>
                            {toast.data?.message && <Text style={styles.message}>{toast.data.message}</Text>}
                        </View>
                    </View>
                ),
            }}
        >
            {children}
        </OriginalToastProvider>
    )
}

// Re-export the hook with audio feedback
export const useToast = () => {
    const toast = useOriginalToast()

    const show = React.useCallback((message: string | React.ReactNode, options?: any) => {
        const type = options?.type || 'normal'

        // Trigger feedback based on type
        if (type === 'success') {
            AudioService.feedback('success')
        } else if (type === 'error' || type === 'danger') {
            AudioService.feedback('error')
        } else if (type === 'warning') {
            AudioService.feedback('error') // Use error sound for warning for now
        }

        return toast.show(message, options)
    }, [toast])

    return React.useMemo(() => ({
        ...toast,
        show
    }), [toast, show])
}

const styles = StyleSheet.create({
    toastContainer: {
        width: '92%',
        backgroundColor: '#121315',
        borderRadius: 20,
        padding: 16,
        paddingRight: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    successToast: {
        borderColor: 'rgba(52, 199, 89, 0.2)',
    },
    errorToast: {
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    warningToast: {
        borderColor: 'rgba(255, 218, 52, 0.2)',
    },
    infoToast: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    successIcon: { backgroundColor: 'rgba(52, 199, 89, 0.1)' },
    errorIcon: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
    warningIcon: { backgroundColor: 'rgba(255, 218, 52, 0.1)' },
    infoIcon: { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
    textContainer: {
        flex: 1,
    },
    title: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    message: {
        color: '#8B98A5',
        fontSize: 13,
        marginTop: 2,
        lineHeight: 18,
    },
})
