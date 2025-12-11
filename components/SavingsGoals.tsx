import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useFocusEffect } from 'expo-router'
import { usePrivy } from '@privy-io/expo'
import { useNetwork } from '../context/NetworkContext'
import { getAllCycles, getTotalSavedAllAssets, octasToMove } from '../services/movement_service/savingCycleService'

interface Goal {
    id: string
    title: string
    current: number
    target: number
    color: string
    isTimeBased?: boolean
    startTime?: number
    endTime?: number
}

export const SavingsGoals: React.FC = () => {
    const router = useRouter()
    const { user } = usePrivy()
    const { network } = useNetwork()
    const [goals, setGoals] = useState<Goal[]>([])
    const [loading, setLoading] = useState(true)
    const [totalSavings, setTotalSavings] = useState(0)
    const [currentTime, setCurrentTime] = useState(Date.now())

    const walletAddress = (user?.linked_accounts?.find((account: any) =>
        account.type === 'wallet' && (account as any).chain_type === 'aptos'
    ) as any)?.address || ''

    const colors = ['#FF9500', '#007AFF', '#FF2D55', '#34C759', '#5856D6', '#FF2D55']

    // Refresh when screen comes into focus (after creating a cycle)
    useFocusEffect(
        React.useCallback(() => {
            loadSavingCycles()
        }, [walletAddress, network])
    )

    // Update time every second for real-time progress tracking
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now())
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const loadSavingCycles = async () => {
        if (!walletAddress || network !== 'testnet') {
            setLoading(false)
            return
        }

        try {
            setLoading(true)

            // Fetch all cycles from the smart contract
            const cycles = await getAllCycles(walletAddress, network)
            const total = await getTotalSavedAllAssets(walletAddress, network)

            // Convert cycles to goals format
            const formattedGoals: Goal[] = cycles.map((cycle, index) => {
                const isTimeBased = cycle.goalAmount === 0
                const current = octasToMove(cycle.amount)

                let target = current
                if (!isTimeBased) {
                    // Goal-based: use goal amount
                    target = octasToMove(cycle.goalAmount)
                }

                return {
                    id: cycle.id.toString(),
                    title: cycle.name,
                    current,
                    target,
                    color: colors[index % colors.length],
                    isTimeBased,
                    startTime: cycle.startTime,
                    endTime: cycle.endTime,
                }
            })

            setGoals(formattedGoals)
            setTotalSavings(octasToMove(total))
        } catch (error) {
            console.warn('Error loading saving cycles:', error)
            setGoals([])
            setTotalSavings(0)
        } finally {
            setLoading(false)
        }
    }

    const renderProgressBar = (goal: Goal) => {
        let percentage = 0
        let label = ''

        if (goal.isTimeBased && goal.startTime && goal.endTime) {
            // Time-based: calculate time progress (use currentTime for real-time updates)
            const now = currentTime / 1000
            const hasStarted = now >= goal.startTime

            if (hasStarted) {
                const totalDuration = goal.endTime - goal.startTime
                const elapsed = now - goal.startTime
                percentage = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100)

                const daysRemaining = Math.max(0, Math.ceil((goal.endTime - now) / 86400))
                label = daysRemaining > 0 ? `${daysRemaining}d left` : 'Completed'
            } else {
                // Cycle hasn't started yet
                percentage = 0
                const hoursUntilStart = Math.ceil((goal.startTime - now) / 3600)
                label = `Starts in ${hoursUntilStart}h`
            }
        } else {
            // Goal-based: calculate amount progress
            percentage = Math.min((goal.current / goal.target) * 100, 100)
            label = `${Math.round(percentage)}%`
        }

        const filledBars = Math.round((percentage / 100) * 10)

        return (
            <View style={styles.progressContainer}>
                <View style={styles.progressBarContainer}>
                    {[...Array(10)].map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.progressBar,
                                {
                                    backgroundColor: index < filledBars ? goal.color : 'rgba(139, 152, 165, 0.2)',
                                },
                            ]}
                        />
                    ))}
                </View>
                <Text style={styles.percentageText}>{label}</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {/* Total Savings Card */}
            <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Total Savings</Text>
                <Text style={styles.totalAmount}>${totalSavings.toLocaleString()}.00</Text>
                <Text style={styles.encouragement}>You are doing great!</Text>
            </View>

            {/* Goals Section */}
            <View style={styles.goalsHeader}>
                <Text style={styles.sectionTitle}>My Goals</Text>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push('/createSavingCycle')}
                >
                    <Text style={styles.createButton}>Create</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ffda34" />
                    <Text style={styles.loadingText}>Loading savings...</Text>
                </View>
            ) : goals.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="wallet-outline" size={48} color="#8B98A5" />
                    <Text style={styles.emptyText}>No savings yet</Text>
                    <Text style={styles.emptySubtext}>Create your first saving goal to get started</Text>
                </View>
            ) : (
                <View style={styles.goalsGrid}>
                {goals.map((goal) => (
                    <TouchableOpacity
                        key={goal.id}
                        style={styles.goalCard}
                        activeOpacity={0.7}
                        onPress={() =>
                            router.push({
                                pathname: '/savingDetails',
                                params: {
                                    cycleId: goal.id,
                                },
                            })
                        }
                    >
                        <Text style={styles.goalTitle} numberOfLines={1}>
                            {goal.title}
                        </Text>
                        <Text style={styles.goalAmount}>
                            <Text style={styles.currentAmount}>
                                ${goal.current.toLocaleString()}
                            </Text>
                            {!goal.isTimeBased && (
                                <Text style={styles.targetAmount}>
                                    /${goal.target.toLocaleString()}
                                </Text>
                            )}
                        </Text>
                        {renderProgressBar(goal)}
                    </TouchableOpacity>
                ))}
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        marginBottom: 20,
    },
    totalCard: {
        backgroundColor: '#222327',
        marginHorizontal: 20,
        padding: 24,
        borderRadius: 16,
        borderWidth: 0,
        borderColor: 'transparent',
        marginBottom: 24,
    },
    totalLabel: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 12,
    },
    totalAmount: {
        color: 'white',
        fontSize: 36,
        fontWeight: '700',
        marginBottom: 8,
    },
    encouragement: {
        color: '#8B98A5',
        fontSize: 14,
    },
    goalsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    createButton: {
        color: '#ffda34',
        fontSize: 16,
        fontWeight: '600',
    },
    goalsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        justifyContent: 'space-between',
    },
    goalCard: {
        width: '48%',
        backgroundColor: '#222327',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: 12,
    },
    goalTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    goalAmount: {
        marginBottom: 12,
    },
    currentAmount: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    targetAmount: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '500',
    },
    progressContainer: {
        gap: 8,
    },
    progressBarContainer: {
        flexDirection: 'row',
        gap: 4,
        height: 24,
    },
    progressBar: {
        flex: 1,
        borderRadius: 4,
    },
    percentageText: {
        color: '#8B98A5',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'right',
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    loadingText: {
        color: '#8B98A5',
        fontSize: 14,
        marginTop: 12,
    },
    emptyContainer: {
        paddingVertical: 60,
        paddingHorizontal: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        color: '#8B98A5',
        fontSize: 14,
        textAlign: 'center',
    },
})
