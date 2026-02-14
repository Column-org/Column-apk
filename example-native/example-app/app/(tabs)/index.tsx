import { Image } from 'expo-image';
import { StyleSheet, Linking, Alert, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';
import * as ExpoLinking from 'expo-linking';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { column } from '@/constants/column';

import { ColumnWalletModal } from '@column-org/wallet-sdk';

export default function HomeScreen() {
  const [address, setAddress] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  // useURL() can sometimes be "sticky" or fail to re-trigger if the URL is "same-ish"
  // Using explicit event listeners + getInitialURL offers more robust control for connect/disconnect flows.
  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      console.log("🔔 Deep Link Detected:", url);
      handleDeepLink(url);
    };

    console.log("🚀 Link listener active");
    const sub = ExpoLinking.addEventListener('url', handleUrl);

    // 2. Handle initial link if app was closed
    ExpoLinking.getInitialURL().then((startUrl) => {
      if (startUrl) handleDeepLink(startUrl);
    });

    return () => sub.remove();
  }, []);

  const handleDeepLink = (deepLinkUrl: string) => {
    try {
      // 1. Let the SDK parse the response
      const response = column.handleResponse(deepLinkUrl);

      // 2. If connection successful
      if (response.address) {
        console.log("Wallet Connected:", response.address);
        setAddress(response.address);
        Alert.alert("Success", "Wallet connected successfully!");
      }
      // 3. If transaction hash returned
      else if (response.data?.hash) {
        Alert.alert("Transaction Submitted", `Hash: ${response.data.hash}`);
      }
      else if (response.error) {
        Alert.alert("Error", response.error);
      }
    } catch (e: any) {
      // Silent catch for invalid links not meant for us
      console.log("Deep link error:", e.message);
    }
  };


  const handleConnect = () => {
    console.log("🖱️ Connect button pressed, opening modal");
    setModalVisible(true);
  };

  const handleSignTransaction = async () => {
    if (!address) return;

    try {
      // Example: Transfer 0.01 MOVE (8 decimals)
      const payload = {
        function: "0x1::aptos_account::transfer",
        functionArguments: [address, "1000000"],
      };

      const url = column.signAndSubmitTransaction(payload);
      await ExpoLinking.openURL(url);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={
          <Image
            source={require('@/assets/images/partial-react-logo.png')}
            style={styles.reactLogo}
          />
        }>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Column Wallet SDK</ThemedText>
        </ThemedView>

        <ThemedView style={styles.stepContainer}>
          <ThemedText>
            This example demonstrates how to integrate Column Wallet into your React Native application.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.container}>
          {address ? (
            <View style={styles.connectedContainer}>
              <ThemedText type="subtitle">Connected</ThemedText>
              <ThemedText style={styles.addressText}>{address}</ThemedText>

              <TouchableOpacity style={styles.actionButton} onPress={handleSignTransaction}>
                <ThemedText style={styles.buttonText}>Sign Test Transaction</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, styles.disconnectButton]} onPress={() => {
                console.log("❌ Disconnecting wallet");
                setAddress(null);
              }}>
                <ThemedText style={styles.buttonText}>Disconnect</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
              <ThemedText style={styles.connectButtonText}>Connect Column</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>

      </ParallaxScrollView>

      <ColumnWalletModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConnect={() => setModalVisible(false)}
        sdk={column}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  container: {
    marginTop: 20,
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: '#ffda34', // Column Yellow
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  connectButtonText: {
    color: '#121315',
    fontWeight: 'bold',
    fontSize: 16,
  },
  connectedContainer: {
    width: '100%',
    gap: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  addressText: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  disconnectButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});
