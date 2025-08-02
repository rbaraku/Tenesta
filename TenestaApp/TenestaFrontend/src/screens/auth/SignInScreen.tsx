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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { signIn, clearError } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Colors } from '../../constants';
import { RootStackParamList } from '../../types';
import { runFrontendTests, validateEnvironment } from '../../utils/testUtils';

type SignInScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SignIn'>;

const SignInScreen: React.FC = () => {
  const navigation = useNavigation<SignInScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateForm = () => {
    let isValid = true;
    
    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    dispatch(clearError());
    
    // Email validation
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }
    
    // Password validation
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }
    
    return isValid;
  };

  const handleSignIn = async () => {
    console.log('Sign In button pressed!');
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await dispatch(signIn({ email: email.trim(), password }));
      
      if (signIn.fulfilled.match(result)) {
        console.log('Sign in successful');
        // For web, show success message
        if (Platform.OS === 'web') {
          alert('Sign in successful! (Backend not deployed - this is a demo)');
        } else {
          Alert.alert('Success', 'Sign in successful! (Backend not deployed - this is a demo)');
        }
      } else if (signIn.rejected.match(result)) {
        const errorMessage = result.payload as string || 'Sign in failed';
        if (Platform.OS === 'web') {
          alert(`Sign In Failed: ${errorMessage}`);
        } else {
          Alert.alert('Sign In Failed', errorMessage);
        }
      }
    } catch (err) {
      console.error('Sign in error:', err);
      const message = 'An unexpected error occurred';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  const handleDemoLogin = () => {
    console.log('Demo login button pressed!');
    setEmail('test@example.com');
    setPassword('Test123!');
    // Show message
    const message = 'Demo credentials filled! Click Sign In to test.';
    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert('Demo Mode', message);
    }
  };

  const handleTestBackend = async () => {
    console.log('Test Backend button pressed!');
    try {
      const message = 'Starting Frontend-Backend Integration Tests...\nCheck browser console for results.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Testing', message);
      }
      
      const results = await runFrontendTests();
      
      const passed = results.filter(r => r.success).length;
      const total = results.length;
      
      const resultMessage = `Test Results:\nPassed: ${passed}/${total} tests\n\nCheck console for detailed results.`;
      if (Platform.OS === 'web') {
        alert(resultMessage);
      } else {
        Alert.alert('Integration Test Results', resultMessage);
      }
    } catch (error) {
      console.error('Test error:', error);
      const errorMessage = 'Failed to run integration tests';
      if (Platform.OS === 'web') {
        alert(errorMessage);
      } else {
        Alert.alert('Test Error', errorMessage);
      }
    }
  };

  const handleValidateEnvironment = () => {
    console.log('Validate Environment button pressed!');
    const results = validateEnvironment();
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    
    const message = results.map(r => 
      `${r.success ? '✅' : '❌'} ${r.message}`
    ).join('\n');
    
    const fullMessage = `Environment Validation:\n${passed}/${total} variables configured\n\n${message}`;
    
    if (Platform.OS === 'web') {
      alert(fullMessage);
    } else {
      Alert.alert('Environment Validation', fullMessage);
    }
  };

  const handleForgotPassword = () => {
    console.log('Forgot password pressed!');
    navigation.navigate('ForgotPassword');
  };

  const handleSignUp = () => {
    console.log('Sign up pressed!');
    navigation.navigate('SignUp');
  };

  const handleGoogleSignIn = () => {
    console.log('Google sign in pressed!');
    const message = 'This feature will be available soon';
    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert('Google Sign In', message);
    }
  };

  const handleAppleSignIn = () => {
    console.log('Apple sign in pressed!');
    const message = 'This feature will be available soon';
    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert('Apple Sign In', message);
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
            <Text style={styles.title}>Tenesta</Text>
            <Text style={styles.subtitle}>Welcome back! Sign in to your account.</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={emailError}
              required
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              isPassword
              error={passwordError}
              required
            />

            <Button
              title="Sign In"
              onPress={handleSignIn}
              loading={isLoading}
              fullWidth
              style={styles.signInButton}
            />

            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Don't have an account? </Text>
              <Button
                title="Sign up"
                onPress={handleSignUp}
                variant="text"
                size="small"
              />
            </View>

            <Button
              title="Forgot your password?"
              onPress={handleForgotPassword}
              variant="text"
              size="small"
              style={styles.forgotButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <Button
                title="🟢 Google"
                onPress={handleGoogleSignIn}
                variant="outline"
                style={styles.socialButton}
              />
              <Button
                title="🍎 Apple"
                onPress={handleAppleSignIn}
                variant="outline"
                style={styles.socialButton}
              />
            </View>

            <View style={styles.demoContainer}>
              <Text style={styles.demoTitle}>Demo & Testing</Text>
              <Button
                title="Use Demo Credentials"
                onPress={handleDemoLogin}
                variant="outline"
                size="small"
                style={styles.demoButton}
              />
              <View style={styles.testButtons}>
                <Button
                  title="Test Backend"
                  onPress={handleTestBackend}
                  variant="text"
                  size="small"
                  style={styles.testButton}
                />
                <Button
                  title="Check Environment"
                  onPress={handleValidateEnvironment}
                  variant="text"
                  size="small"
                  style={styles.testButton}
                />
              </View>
              <Text style={styles.demoText}>
                Demo: Any email with password "Test123!"
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
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
  signInButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  forgotButton: {
    alignSelf: 'center',
    marginBottom: 32,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: Colors.textLight,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
  },
  demoContainer: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.info,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  demoButton: {
    marginBottom: 12,
  },
  testButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  testButton: {
    flex: 1,
  },
  demoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default SignInScreen;