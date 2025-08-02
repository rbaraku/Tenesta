import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { signUp, clearError } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { Colors } from '../../constants';

const SignUpScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as 'tenant' | 'landlord' | '',
  });
  
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
    };
    
    dispatch(clearError());
    
    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
      isValid = false;
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
      isValid = false;
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
      isValid = false;
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    
    // Role validation
    if (!formData.role) {
      newErrors.role = 'Please select your role';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSignUp = async () => {
    console.log('Sign Up button pressed!');
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await dispatch(signUp({
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
      }));
      
      if (signUp.fulfilled.match(result)) {
        console.log('Sign up successful');
        const message = 'Account created successfully! Please check your email to verify your account.';
        if (Platform.OS === 'web') {
          alert(message);
        } else {
          Alert.alert('Success', message);
        }
      } else if (signUp.rejected.match(result)) {
        const errorMessage = result.payload as string || 'Sign up failed';
        if (Platform.OS === 'web') {
          alert(`Sign Up Failed: ${errorMessage}`);
        } else {
          Alert.alert('Sign Up Failed', errorMessage);
        }
      }
    } catch (err) {
      console.error('Sign up error:', err);
      const message = 'An unexpected error occurred';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  const handleRoleSelect = (role: 'tenant' | 'landlord') => {
    setFormData(prev => ({ ...prev, role }));
    setErrors(prev => ({ ...prev, role: '' }));
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Join Tenesta</Text>
            <Text style={styles.subtitle}>Create your account to get started</Text>
          </View>

          <View style={styles.form}>
            {/* Role Selection */}
            <View style={styles.roleSection}>
              <Text style={styles.roleLabel}>I am a *</Text>
              <View style={styles.roleButtons}>
                <Card 
                  style={[
                    styles.roleCard,
                    formData.role === 'tenant' && styles.roleCardSelected
                  ]}
                  onPress={() => handleRoleSelect('tenant')}
                >
                  <Text style={styles.roleIcon}>🏠</Text>
                  <Text style={[
                    styles.roleTitle,
                    formData.role === 'tenant' && styles.roleTextSelected
                  ]}>
                    Tenant
                  </Text>
                  <Text style={styles.roleDescription}>
                    I rent a property and need to manage payments, documents, and communication
                  </Text>
                </Card>

                <Card 
                  style={[
                    styles.roleCard,
                    formData.role === 'landlord' && styles.roleCardSelected
                  ]}
                  onPress={() => handleRoleSelect('landlord')}
                >
                  <Text style={styles.roleIcon}>🏢</Text>
                  <Text style={[
                    styles.roleTitle,
                    formData.role === 'landlord' && styles.roleTextSelected
                  ]}>
                    Landlord
                  </Text>
                  <Text style={styles.roleDescription}>
                    I own/manage properties and need to collect rent and manage tenants
                  </Text>
                </Card>
              </View>
              {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}
            </View>

            {/* Form Fields */}
            <Input
              label="Full Name"
              value={formData.fullName}
              onChangeText={(value) => handleInputChange('fullName', value)}
              placeholder="John Doe"
              autoCapitalize="words"
              error={errors.fullName}
              required
            />

            <Input
              label="Email Address"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="john@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
              required
            />

            <Input
              label="Password"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              placeholder="••••••••"
              isPassword
              error={errors.password}
              required
            />

            <Input
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              placeholder="••••••••"
              isPassword
              error={errors.confirmPassword}
              required
            />

            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={isLoading}
              fullWidth
              style={styles.signUpButton}
            />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Button
                title="Sign In"
                onPress={() => {
                  // TODO: Navigate to sign in
                  const message = 'Navigation back to Sign In';
                  if (Platform.OS === 'web') {
                    alert(message);
                  } else {
                    Alert.alert('Navigate', message);
                  }
                }}
                variant="text"
                size="small"
              />
            </View>

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  roleSection: {
    marginBottom: 24,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  roleButtons: {
    gap: 12,
  },
  roleCard: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  roleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  roleIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  roleTextSelected: {
    color: Colors.primary,
  },
  roleDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  signUpButton: {
    marginTop: 16,
    marginBottom: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  termsContainer: {
    paddingHorizontal: 16,
  },
  termsText: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default SignUpScreen;