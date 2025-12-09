import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface DateRangePickerProps {
    startDate: Date
    endDate: Date
    onStartDateChange: (date: Date) => void
    onEndDateChange: (date: Date) => void
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
}) => {
    const [showStartPicker, setShowStartPicker] = useState(false)
    const [showEndPicker, setShowEndPicker] = useState(false)
    const [tempStartDate, setTempStartDate] = useState(startDate)
    const [tempEndDate, setTempEndDate] = useState(endDate)

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    const formatTime = (date: Date) => {
        const hours = date.getHours()
        const minutes = date.getMinutes()
        const ampm = hours >= 12 ? 'PM' : 'AM'
        const displayHours = hours % 12 || 12
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`
    }

    const renderDatePicker = (
        date: Date,
        onDateChange: (date: Date) => void,
        onClose: () => void,
        title: string
    ) => {
        const [hourInput, setHourInput] = useState((date.getHours() % 12 || 12).toString())
        const [minuteInput, setMinuteInput] = useState(date.getMinutes().toString().padStart(2, '0'))

        const currentMonth = date.getMonth()
        const currentYear = date.getFullYear()
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ]

        const goToPrevMonth = () => {
            const newDate = new Date(date)
            newDate.setMonth(newDate.getMonth() - 1)
            onDateChange(newDate)
        }

        const goToNextMonth = () => {
            const newDate = new Date(date)
            newDate.setMonth(newDate.getMonth() + 1)
            onDateChange(newDate)
        }

        const selectDay = (day: number) => {
            const newDate = new Date(date)
            newDate.setDate(day)
            onDateChange(newDate)
        }

        const selectHour = (hour: number) => {
            const newDate = new Date(date)
            newDate.setHours(hour)
            onDateChange(newDate)
            setHourInput((hour % 12 || 12).toString())
        }

        const selectMinute = (minute: number) => {
            const newDate = new Date(date)
            newDate.setMinutes(minute)
            onDateChange(newDate)
            setMinuteInput(minute.toString().padStart(2, '0'))
        }

        const handleHourChange = (text: string) => {
            setHourInput(text)
            if (text === '') return

            const hour = parseInt(text)
            if (!isNaN(hour) && hour >= 1 && hour <= 12) {
                const newHour = date.getHours() >= 12 ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour)
                selectHour(newHour)
            }
        }

        const handleMinuteChange = (text: string) => {
            setMinuteInput(text)
            if (text === '') return

            const minute = parseInt(text)
            if (!isNaN(minute) && minute >= 0 && minute <= 59) {
                selectMinute(minute)
            }
        }

        return (
            <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                    <Text style={styles.pickerTitle}>{title}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Month Navigation */}
                    <View style={styles.monthNav}>
                        <TouchableOpacity onPress={goToPrevMonth}>
                            <Ionicons name="chevron-back" size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.monthText}>
                            {months[currentMonth]} {currentYear}
                        </Text>
                        <TouchableOpacity onPress={goToNextMonth}>
                            <Ionicons name="chevron-forward" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Day headers */}
                    <View style={styles.daysHeader}>
                        {days.map((day) => (
                            <Text key={day} style={styles.dayHeaderText}>
                                {day}
                            </Text>
                        ))}
                    </View>

                    {/* Calendar grid */}
                    <View style={styles.calendarGrid}>
                        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                            <View key={`empty-${index}`} style={styles.dayCell} />
                        ))}
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                            const isSelected = day === date.getDate()
                            return (
                                <TouchableOpacity
                                    key={day}
                                    style={[styles.dayCell, isSelected && styles.selectedDay]}
                                    onPress={() => selectDay(day)}
                                >
                                    <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
                                        {day}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>

                    {/* Time picker */}
                    <View style={styles.timeSection}>
                        <Text style={styles.sectionTitle}>Time</Text>

                        {/* Time Input Row */}
                        <View style={styles.timeInputRow}>
                            {/* Hour Input */}
                            <View style={styles.timeInputGroup}>
                                <Text style={styles.timeInputLabel}>Hour</Text>
                                <TextInput
                                    style={styles.timeInput}
                                    value={hourInput}
                                    onChangeText={handleHourChange}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                    placeholder="12"
                                    placeholderTextColor="#8B98A5"
                                />
                            </View>

                            <Text style={styles.timeSeparator}>:</Text>

                            {/* Minute Input */}
                            <View style={styles.timeInputGroup}>
                                <Text style={styles.timeInputLabel}>Minute</Text>
                                <TextInput
                                    style={styles.timeInput}
                                    value={minuteInput}
                                    onChangeText={handleMinuteChange}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                    placeholder="00"
                                    placeholderTextColor="#8B98A5"
                                />
                            </View>

                            {/* AM/PM Toggle */}
                            <View style={styles.ampmContainer}>
                                <TouchableOpacity
                                    style={[styles.ampmButton, date.getHours() < 12 && styles.ampmButtonActive]}
                                    onPress={() => {
                                        if (date.getHours() >= 12) {
                                            selectHour(date.getHours() - 12)
                                        }
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.ampmText, date.getHours() < 12 && styles.ampmTextActive]}>
                                        AM
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.ampmButton, date.getHours() >= 12 && styles.ampmButtonActive]}
                                    onPress={() => {
                                        if (date.getHours() < 12) {
                                            selectHour(date.getHours() + 12)
                                        }
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.ampmText, date.getHours() >= 12 && styles.ampmTextActive]}>
                                        PM
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={{ height: 20 }} />
                </ScrollView>

                {/* Done button */}
                <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                    <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {/* Start Date */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Start Date & Time</Text>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                        setTempStartDate(startDate)
                        setShowStartPicker(true)
                    }}
                >
                    <Ionicons name="calendar-outline" size={20} color="#ffda34" />
                    <View style={styles.dateInfo}>
                        <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                        <Text style={styles.timeText}>{formatTime(startDate)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#8B98A5" />
                </TouchableOpacity>
            </View>

            {/* End Date */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>End Date & Time</Text>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                        setTempEndDate(endDate)
                        setShowEndPicker(true)
                    }}
                >
                    <Ionicons name="calendar-outline" size={20} color="#ffda34" />
                    <View style={styles.dateInfo}>
                        <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                        <Text style={styles.timeText}>{formatTime(endDate)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#8B98A5" />
                </TouchableOpacity>
            </View>

            {/* Start Date Picker Modal */}
            <Modal
                visible={showStartPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowStartPicker(false)}
                statusBarTranslucent
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => {
                        onStartDateChange(tempStartDate)
                        setShowStartPicker(false)
                    }}
                >
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        {renderDatePicker(
                            tempStartDate,
                            setTempStartDate,
                            () => {
                                onStartDateChange(tempStartDate)
                                setShowStartPicker(false)
                            },
                            'Select Start Date & Time'
                        )}
                    </Pressable>
                </Pressable>
            </Modal>

            {/* End Date Picker Modal */}
            <Modal
                visible={showEndPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowEndPicker(false)}
                statusBarTranslucent
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => {
                        onEndDateChange(tempEndDate)
                        setShowEndPicker(false)
                    }}
                >
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        {renderDatePicker(
                            tempEndDate,
                            setTempEndDate,
                            () => {
                                onEndDateChange(tempEndDate)
                                setShowEndPicker(false)
                            },
                            'Select End Date & Time'
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222327',
        borderWidth: 0,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    dateInfo: {
        flex: 1,
    },
    dateText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    timeText: {
        color: '#8B98A5',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    pickerContainer: {
        backgroundColor: '#121315',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        paddingBottom: 40,
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    pickerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    monthNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    monthText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    daysHeader: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    dayHeaderText: {
        flex: 1,
        color: '#8B98A5',
        fontSize: 12,
        textAlign: 'center',
        fontWeight: '600',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    selectedDay: {
        backgroundColor: '#ffda34',
        borderRadius: 8,
    },
    dayText: {
        color: 'white',
        fontSize: 16,
    },
    selectedDayText: {
        color: '#121315',
        fontWeight: '700',
    },
    timeSection: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        marginTop: 10,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    timeInputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12,
    },
    timeInputGroup: {
        flex: 1,
    },
    timeInputLabel: {
        color: '#8B98A5',
        fontSize: 12,
        marginBottom: 8,
        fontWeight: '600',
    },
    timeInput: {
        backgroundColor: '#222327',
        borderWidth: 0,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 16,
        color: 'white',
        fontSize: 24,
        fontWeight: '600',
        textAlign: 'center',
    },
    timeSeparator: {
        color: 'white',
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 16,
    },
    ampmContainer: {
        flexDirection: 'column',
        gap: 8,
    },
    ampmButton: {
        backgroundColor: '#222327',
        borderWidth: 0,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        minWidth: 60,
        alignItems: 'center',
    },
    ampmButtonActive: {
        backgroundColor: '#ffda34',
        borderColor: '#ffda34',
    },
    ampmText: {
        color: '#8B98A5',
        fontSize: 14,
        fontWeight: '700',
    },
    ampmTextActive: {
        color: '#121315',
    },
    doneButton: {
        backgroundColor: '#ffda34',
        marginHorizontal: 20,
        marginTop: 20,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    doneButtonText: {
        color: '#121315',
        fontSize: 16,
        fontWeight: '700',
    },
})
