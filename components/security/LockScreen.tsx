import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Vibration, StatusBar, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSecurity } from '../../context/SecurityContext'

export default function LockScreen() {
  const { verifyPasscode, authenticateWithBiometric, isBiometricEnabled, isPasscodeSet, unlock } = useSecurity()
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const hasTriggeredInitialAuth = useRef(false)

  useEffect(() => {
    // Auto-trigger biometric ONLY ONCE when component first mounts
    if (isBiometricEnabled && !isPasscodeSet && !isAuthenticating && !hasTriggeredInitialAuth.current) {
      hasTriggeredInitialAuth.current = true
      handleBiometric()
    }
  }, []) // Empty dependency array - only run on mount

  const handleBiometric = async () => {
    if (isAuthenticating) return

    setIsAuthenticating(true)
    try {
      const success = await authenticateWithBiometric()
      if (success) {
        unlock()
      }
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleNumberPress = async (num: string) => {
    if (passcode.length >= 6) return

    const newPasscode = passcode + num
    setPasscode(newPasscode)
    setError('')

    if (newPasscode.length === 6) {
      const isValid = await verifyPasscode(newPasscode)
      if (isValid) {
        unlock()
      } else {
        Vibration.vibrate(200)
        setError('Incorrect passcode')
        setAttempts((prev) => prev + 1)
        setTimeout(() => setPasscode(''), 300)
      }
    }
  }

  const handleDelete = () => {
    setPasscode((prev) => prev.slice(0, -1))
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
      ['biometric', '0', 'delete'],
    ]

    return (
      <View style={styles.numberPad}>
        {numbers.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.numberRow}>
            {row.map((item) => {
              if (item === 'biometric') {
                return (
                  <TouchableOpacity
                    key={item}
                    style={styles.numberButton}
                    onPress={isBiometricEnabled ? handleBiometric : undefined}
                    activeOpacity={isBiometricEnabled ? 0.7 : 1}
                  >
                    {isBiometricEnabled && <Ionicons name="finger-print" size={28} color="#ffda34" />}
                  </TouchableOpacity>
                )
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

  // If only biometric is enabled (no passcode), show biometric-only screen
  if (isBiometricEnabled && !isPasscodeSet) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        <View style={styles.content}>
          <View style={styles.biometricContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="finger-print" size={64} color="#ffda34" />
            </View>

            <Text style={styles.title}>Unlock Wallet</Text>
            <Text style={styles.subtitle}>Use biometric authentication to unlock</Text>

            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometric}
              activeOpacity={0.7}
            >
              <Ionicons name="finger-print" size={32} color="#121315" />
              <Text style={styles.biometricButtonText}>Authenticate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  // Show passcode screen if passcode is set
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={48} color="#ffda34" />
        </View>

        <Text style={styles.title}>Enter Passcode</Text>
        <Text style={styles.subtitle}>Enter your 6-digit passcode to unlock</Text>

        {renderDots()}

        {error ? <Text style={styles.errorText}>{error}</Text> : <View style={styles.errorPlaceholder} />}

        {attempts >= 3 && (
          <Text style={styles.warningText}>Too many incorrect attempts. Please try again carefully.</Text>
        )}
      </View>

      {renderNumberPad()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121315',
    justifyContent: 'space-between',
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
  warningText: {
    color: '#FF9500',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
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
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffda34',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 40,
  },
  biometricButtonText: {
    color: '#121315',
    fontSize: 18,
    fontWeight: '700',
  },
  biometricContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  }
})
