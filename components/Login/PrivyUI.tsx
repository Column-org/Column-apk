
import { useLogin } from "@privy-io/expo/ui";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  ScrollView,
  Dimensions,
  Image,
  ImageBackground
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useRef } from "react";

const { width } = Dimensions.get('window');

export default function PrivyUI() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const { login } = useLogin();

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Background rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleLogin = async () => {
    console.log('=== LOGIN ATTEMPT STARTED ===');
    setError("");
    setIsLoading(true);

    try {
      console.log('Calling Privy login()...');
      const result = await login({
        loginMethods: [
          "email",
          // "twitter",
          // "tiktok",
          // "google",
          // "apple",
          // "github",
          // "discord",
          // "linkedin"
        ]
      });
      console.log('Login successful! Result:', result);
      setIsLoading(false);
    } catch (err: any) {
      console.log('=== LOGIN ERROR CAUGHT ===');
      console.log('Login error details:', JSON.stringify(err, null, 2));
      console.log('Error object:', err);
      console.log('Error message:', err.message);
      console.log('Error.error:', err.error);
      console.log('Error code:', err.code);
      console.log('Error status:', err.status);
      console.log('Error response:', err.response);
      console.log('Full error keys:', Object.keys(err));
      console.log('Error stack:', err.stack);
      setError(err.error?.message || err.message || "Failed to login. Please try again.");
      setIsLoading(false);
    }
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const loginMethods = [
    { name: "Email", icon: "mail" },
    { name: "Google", icon: "logo-google" },
    // { name: "Apple", icon: "logo-apple" },
    // { name: "Twitter", icon: "logo-twitter" },
    // { name: "GitHub", icon: "logo-github" },
    // { name: "Discord", icon: "logo-discord" },
    // { name: "LinkedIn", icon: "logo-linkedin" },
    // { name: "TikTok", icon: "musical-notes" },
  ];

  return (
    <View style={styles.container}>
      {/* Content Area */}
      <View style={styles.contentArea}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/Collumn-Login.png')}
            style={styles.centerImage}
            resizeMode="contain"
          />
        </View>

        {/* Error Message */}
        {error && (
          <Animated.View
            style={[
              styles.errorContainer,
              { opacity: fadeAnim }
            ]}
          >
            <Ionicons name="warning" size={20} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}
      </View>

      {/* Bottom Button Area */}
      <View style={styles.bottomArea}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Column</Text>
          <Text style={styles.subtitle}>Create a new wallet or add an existing one</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.loginButton,
            pressed && styles.loginButtonPressed,
            isLoading && styles.loginButtonDisabled
          ]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Animated.View
                style={{ transform: [{ rotate: rotate }] }}
              >
                <Ionicons name="sync" size={24} color="#121315" />
              </Animated.View>
              <Text style={styles.buttonText}>Connecting...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </Pressable>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={16} color="#64748b" />
          <Text style={styles.footerText}>
            Secured by{" "}
            <Text style={styles.footerLink}>Privy</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121315',
    justifyContent: 'space-between',
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerImage: {
    width: 280,
    height: 280,
  },
  titleSection: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#8B98A5',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#ffda34',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginButtonPressed: {
    opacity: 0.8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    color: '#121315',
    fontSize: 18,
    fontWeight: '600',
  },
  methodsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  methodsTitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  methodTag: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  methodTagText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '500',
  },
  errorContainer: {
    width: '100%',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#991b1b',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },
  footerLink: {
    color: '#64748b',
    fontWeight: '600',
  },
  terms: {
    paddingTop: 8,
  },
  termsText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  bgCircle1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#fffbeb',
    top: -200,
    right: -100,
    zIndex: 0,
  },
  bgCircle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#fff9e6',
    bottom: -150,
    left: -50,
    zIndex: 0,
  },
});