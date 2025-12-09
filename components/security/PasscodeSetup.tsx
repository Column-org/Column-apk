import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Vibration, StatusBar, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSecurity } from '../../context/SecurityContext'

interface PasscodeSetupProps {
  onComplete: () => void
  onCancel: () => void
}

export default function PasscodeSetup({ onComplete, onCancel }: PasscodeSetupProps) {
  const { setPasscode, enableSecurity } = useSecurity()
  const [step, setStep] = useState<'create' | 'confirm'>('create')
  const [passcode, setPasscodeValue] = useState('')
  const [firstPasscode, setFirstPasscode] = useState('')
  const [error, setError] = useState('')

  const handleNumberPress = async (num: string) => {
    if (passcode.length >= 6) return

    const newPasscode = passcode + num
    setPasscodeValue(newPasscode)
    setError('')

    if (newPasscode.length === 6) {
      if (step === 'create') {
        setFirstPasscode(newPasscode)
        setPasscodeValue('')
        setStep('confirm')
      } else {
        // Confirm step
        if (newPasscode === firstPasscode) {
          try {
            await setPasscode(newPasscode)
            await enableSecurity()
            Alert.alert('Success', 'Passcode has been set successfully', [{ text: 'OK', onPress: onComplete }])
          } catch (err) {
            setError('Failed to save passcode')
            setPasscodeValue('')
          }
        } else {
          Vibration.vibrate(200)
          setError('Passcodes do not match')
          setTimeout(() => {
            setPasscodeValue('')
            setStep('create')
            setFirstPasscode('')
            setError('')
          }, 1500)
        }
      }
    }
  }

  const handleDelete = () => {
    setPasscodeValue((prev) => prev.slice(0, -1))
    setError('')
  }

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[styles.dot, i < passcode.length && styles.dotFilled]} />
        ))}
      </View>
    )
  }

  const renderNumberPad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'delete'],
    ]

    return (
      <View style={styles.numberPad}>
        {numbers.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.numberRow}>
            {row.map((item, index) => {
              if (item === '') {
                return <View key={`empty-${index}`} style={styles.numberButton} />
              }
              if (item === 'delete') {
                return (
                  <TouchableOpacity
                    key={item}
                    style={styles.numberButton}
                    onPress={handleDelete}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="backspace-outline" size={28} color="white" />
                  </TouchableOpacity>
                )
              }
              return (
                <TouchableOpacity
                  key={item}
                  style={styles.numberButton}
                  onPress={() => handleNumberPress(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.numberText}>{item}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        ))}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Passcode</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="keypad" size={48} color="#ffda34" />
        </View>

        <Text style={styles.title}>{step === 'create' ? 'Create Passcode' : 'Confirm Passcode'}</Text>
        <Text style={styles.subtitle}>
          {step === 'create'
            ? 'Enter a 6-digit passcode to secure your wallet'
            : 'Re-enter your passcode to confirm'}
        </Text>

        {renderDots()}

        {error ? <Text style={styles.errorText}>{error}</Text> : <View style={styles.errorPlaceholder} />}
      </View>

      {renderNumberPad()}
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
    paddingBottom: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 195, 13, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#8B98A5',
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#8B98A5',
  },
  dotFilled: {
    backgroundColor: '#ffda34',
    borderColor: '#ffda34',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    height: 20,
  },
  errorPlaceholder: {
    height: 20,
  },
  numberPad: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  numberButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '600',
  },
})
