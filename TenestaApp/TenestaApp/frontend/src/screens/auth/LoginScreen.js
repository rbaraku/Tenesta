import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

// Tenesta Logo Component (smaller version)
const TenestaLogo = ({ size = 60 }) => (
  <View style={[styles.logoContainer, { width: size, height: size }]}>
    <View style={[styles.logoHouse, { width: size, height: size * 0.8 }]}>
      <View style={[styles.logoRoof, { 
        borderLeftWidth: size * 0.35,
        borderRightWidth: size * 0.35,
        borderBottomWidth: size * 0.25
      }]} />
      <View style={[styles.logoBody, { 
        width: size * 0.7,
        height: size * 0.5
      }]}>
        <Text style={[styles.logoT, { fontSize: size * 0.3 }]}>T</Text>
      </View>
    </View>
    <View style={[styles.logoBase, { 
      width: size * 1.1,
      height: size * 0.25
    }]} />
  </View>
);

// Custom Button Component
const CustomButton = ({ title, onPress, loading, style }) => (
  <TouchableOpacity
    style={[styles.button, style]}
    onPress={onPress}
    disabled={loading}
    activeOpacity={0.8}
  >
    <Text style={styles.buttonText}>
      {loading ? 'Signing In...' : title}
    </Text>
  </TouchableOpacity>
);

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await signIn(email.trim(), password);
      
      if (error) {
        Alert.alert('Login Failed', error.message);
      }
      // Navigation will be handled by AuthContext
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TenestaLogo size={80} />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your Tenesta account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <CustomButton
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.signInButton}
          />

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.signUpText}>
              Don't have an account? <Text style={styles.signUpLink}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoHouse: {
    position: 'relative',
    alignItems: 'center',
  },
  logoRoof: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#722F37',
    marginBottom: -1,
  },
  logoBody: {
    backgroundColor: '#B91C1C',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  logoT: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Arial',
  },
  logoBase: {
    backgroundColor: '#800020',
    borderRadius: 15,
    marginTop: -8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#800020',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
  },
  button: {
    backgroundColor: '#800020',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    shadowColor: '#800020',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  signInButton: {
    marginTop: 20,
    marginBottom: 24,
  },
  signUpButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  signUpText: {
    fontSize: 16,
    color: '#6B7280',
  },
  signUpLink:
