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
  ScrollView,
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

// Role Selection Component
const RoleSelector = ({ selectedRole, onRoleSelect }) => (
  <View style={styles.roleContainer}>
    <Text style={styles.roleLabel}>I am a:</Text>
    <View style={styles.roleButtons}>
      <TouchableOpacity
        style={[
          styles.roleButton,
          selectedRole === 'tenant' && styles.roleButtonSelected
        ]}
        onPress={() => onRoleSelect('tenant')}
      >
        <Text style={[
          styles.roleButtonText,
          selectedRole === 'tenant' && styles.roleButtonTextSelected
        ]}>
          Tenant
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.roleButton,
          selectedRole === 'landlord' && styles.roleButtonSelected
        ]}
        onPress={() => onRoleSelect('landlord')}
      >
        <Text style={[
          styles.roleButtonText,
          selectedRole === 'landlord' && styles.roleButtonTextSelected
        ]}>
          Landlord
        </Text>
      </TouchableOpacity>
    </View>
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
      {loading ? 'Creating Account...' : title}
    </Text>
  </TouchableOpacity>
);

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('tenant');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    // Validation
    if (!email.trim() || !password.trim() || !firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        role,
        profile: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        },
      };

      const { data, error } = await signUp(email.trim(), password, userData);
      
      if (error) {
        Alert.alert('Sign Up Failed', error.message);
      } else {
        Alert.alert(
          'Account Created',
          'Please check your email to verify your account.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      }
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
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TenestaLogo size={70} />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Tenesta today</Text>
          </View>

          <View style={styles.form}>
            <RoleSelector selectedRole={role} onRoleSelect={setRole} />

            <View style={styles.nameRow}>
              <View style={styles.nameInput}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  autoCapitalize="words"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.nameInput}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  autoCapitalize="words"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

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
                placeholder="Create a password"
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <CustomButton
              title="Create Account"
              onPress={handleSignUp}
              loading={loading}
              style={styles.signUpButton}
            />

            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.signInText}>
                Already have an account? <Text style={styles.signInLink}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    marginTop: 20,
    marginBottom: 30,
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
  roleContainer: {
    marginBottom: 24,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  roleButtonSelected: {
    borderColor: '#800020',
    backgroundColor: '#FEF2F2',
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  roleButtonTextSelected: {
    color: '#800020',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  nameInput: {
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
  signUpButton: {
    marginTop: 20,
    marginBottom: 24,
  },
  signInButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  signInText: {
    fontSize: 16,
    color: '#6B7280',
  },
  signInLink: {
    color: '#800020',
    fontWeight: '600',
  },
});
