import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import GeneratedCodeCard from '../components/send/GeneratedCodeCard'
// import EmailCodeSender from '../components/email/EmailCodeSender'
import AlertModal from '../components/AlertModal'

export default function ClaimCode() {
    const router = useRouter()
    const params = useLocalSearchParams()
    // const [showEmailForm, setShowEmailForm] = React.useState(false)
    const [alertModal, setAlertModal] = React.useState<{
        visible: boolean
        type: 'success' | 'error' | 'info'
        title: string
        message: string
    }>({
        visible: false,
        type: 'success',
        title: '',
        message: '',
    })

    const code = params.code as string
    const tokenName = params.tokenName as string
    const amount = params.amount as string
    const tokenSymbol = params.tokenSymbol as string

    if (!code || !tokenName) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#121315" />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>No claim code found</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#121315" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                    <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 30 }}
            >
                <View style={styles.successIconContainer}>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark" size={48} color="#10B981" />
                    </View>
                </View>

                <Text style={styles.title}>Transfer Created Successfully!</Text>
                <Text style={styles.subtitle}>
                    {amount} {tokenSymbol} ready to be claimed
                </Text>

                <GeneratedCodeCard
                    code={code}
                    tokenName={tokenName}
                    onCopySuccess={() => {
                        setAlertModal({
                            visible: true,
                            type: 'success',
                            title: 'Copied',
                            message: 'Copied to clipboard',
                        })
                    }}
                // onEmailShare={() => setShowEmailForm(!showEmailForm)}
                />

                {/* showEmailForm && (
                    <EmailCodeSender code={code} tokenName={tokenName} tokenSymbol={tokenSymbol} amount={amount} />
                ) */}

                <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => router.replace('/(tabs)/home')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
            </ScrollView>

            <AlertModal
                visible={alertModal.visible}
                type={alertModal.type}
                title={alertModal.title}
                message={alertModal.message}
                onClose={() => setAlertModal({ ...alertModal, visible: false })}
            />
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
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    successIconContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    title: {
        color: 'white',
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        color: '#8B98A5',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
    },
    doneButton: {
        backgroundColor: '#ffda34',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 30,
    },
    doneButtonText: {
        color: '#121315',
        fontSize: 16,
        fontWeight: '700',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 16,
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: '#1A1F28',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    backButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
})
