// SendCodeEmail.tsx - Component for sending transfer codes via email
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SendCodeEmailProps {
  code: string;
  senderName?: string;
  backendUrl?: string;
}

export default function SendCodeEmail({
  code,
  senderName,
  backendUrl = 'http://localhost:3000/api'
}: SendCodeEmailProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSendEmail = async () => {
    // Validate email
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch(`${backendUrl}/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email.trim(),
          code: code,
          senderName: senderName,
          subject: 'Your Column Wallet Transfer Code',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      setStatus({
        type: 'success',
        message: `Code sent to ${email}!`,
      });

      // Clear email after success
      setTimeout(() => {
        setEmail('');
        setStatus(null);
      }, 3000);

    } catch (error: any) {
      console.error('Error sending email:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Failed to send email. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="mail-outline" size={24} color="#ffda34" />
        <Text style={styles.headerText}>Send Code via Email</Text>
      </View>

      <Text style={styles.description}>
        Share this transfer code with a friend by sending it to their email
      </Text>

      <View style={styles.codePreview}>
        <Text style={styles.codeLabel}>Transfer Code:</Text>
        <Text style={styles.codeText}>{code}</Text>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="mail" size={20} color="#8B98A5" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="friend@example.com"
          placeholderTextColor="#8B98A5"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
      </View>

      {status && (
        <View style={[
          styles.statusContainer,
          status.type === 'success' ? styles.successContainer : styles.errorContainer
        ]}>
          <Ionicons
            name={status.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
            size={18}
            color={status.type === 'success' ? '#4caf50' : '#f44336'}
          />
          <Text style={[
            styles.statusText,
            status.type === 'success' ? styles.successText : styles.errorText
          ]}>
            {status.message}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.sendButton, loading && styles.sendButtonDisabled]}
        onPress={handleSendEmail}
        disabled={loading || !email}
      >
        {loading ? (
          <ActivityIndicator color="#121315" />
        ) : (
          <>
            <Ionicons name="send" size={20} color="#121315" />
            <Text style={styles.sendButtonText}>Send Email</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        The recipient will receive an email with instructions on how to claim the transfer
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffda34',
  },
  description: {
    fontSize: 14,
    color: '#8B98A5',
    marginBottom: 16,
    lineHeight: 20,
  },
  codePreview: {
    backgroundColor: '#121315',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffda34',
    borderStyle: 'dashed',
  },
  codeLabel: {
    fontSize: 12,
    color: '#8B98A5',
    marginBottom: 8,
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffda34',
    letterSpacing: 2,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121315',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 14,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  successContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  statusText: {
    flex: 1,
    fontSize: 14,
  },
  successText: {
    color: '#4caf50',
  },
  errorText: {
    color: '#f44336',
  },
  sendButton: {
    backgroundColor: '#ffda34',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#121315',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});
