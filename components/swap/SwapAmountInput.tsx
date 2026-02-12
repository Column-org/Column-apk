import React from 'react'
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native'

interface SwapAmountInputProps {
  amount: string
  onAmountChange: (amount: string) => void
  tokenSymbol?: string
  balance?: string
}

export default function SwapAmountInput({
  amount,
  onAmountChange,
  tokenSymbol,
  balance
}: SwapAmountInputProps) {
  const handleAmountChange = (text: string) => {
    // Only allow numbers and one decimal point
    const regex = /^\d*\.?\d*$/
    if (regex.test(text) || text === '') {
      onAmountChange(text)
    }
  }

  const handleMaxPress = () => {
    if (balance) {
      onAmountChange(balance)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={handleAmountChange}
          placeholder="0.00"
          placeholderTextColor="#444449"
          keyboardType="decimal-pad"
          selectionColor="#ffda34"
        />
        {tokenSymbol && (
          <Text style={styles.tokenSymbol}>{tokenSymbol}</Text>
        )}
      </View>
      {balance && (
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceText}>Balance: {balance}</Text>
          <TouchableOpacity onPress={handleMaxPress} style={styles.maxButton}>
            <Text style={styles.maxButtonText}>MAX</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1b1f',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2a2b2f',
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 32,
    fontWeight: '600',
  },
  tokenSymbol: {
    color: '#8B98A5',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  balanceText: {
    color: '#8B98A5',
    fontSize: 14,
  },
  maxButton: {
    backgroundColor: '#2a2b2f',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  maxButtonText: {
    color: '#ffda34',
    fontSize: 12,
    fontWeight: '600',
  },
})
