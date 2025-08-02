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
import { resetPassword, clearError } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Colors } from '../../constants';

const ForgotPasswordScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.auth);
  
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = () => {
    let isValid = true;
    
    // Clear previous errors
    setEmailError('');
    dispatch(clearError());
    
    // Email validation
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }
    
    return isValid;
  };

  const handleResetPassword = async () => {
    console.log('Reset password button pressed!');
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await dispatch(resetPassword({ email: email.trim() }));
      
      if (resetPassword.fulfilled.match(result)) {
        console.log('Reset password email sent');
        setIsSubmitted(true);
      } else if (resetPassword.rejected.match(result)) {
        const errorMessage = result.payload as string || 'Failed to send reset email';
        if (Platform.OS === 'web') {
          alert(`Reset Failed: ${errorMessage}`);
        } else {
          Alert.alert('Reset Failed', errorMessage);
        }
      }
    } catch (err) {
      console.error('Reset password error:', err);
      const message = 'An unexpected error occurred';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  const handleBackToSignIn = () => {
    const message = 'Navigate back to Sign In';
    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert('Navigate', message);
    }
  };

  const handleResendEmail = () => {
    setIsSubmitted(false);
    handleResetPassword();
  };

  if (isSubmitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>📧</Text>
          </View>
          
          <Text style={styles.successTitle}>Check Your Email</Text>
          
          <Text style={styles.successMessage}>
            We've sent a password reset link to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
          
          <Text style={styles.instructionText}>
            Click the link in the email to reset your password. 
            If you don't see the email, check your spam folder.
          </Text>
          
          <View style={styles.actionButtons}>
            <Button
              title="Resend Email"
              onPress={handleResendEmail}
              variant="outline"
              fullWidth
              style={styles.resendButton}
            />
            
            <Button
              title="Back to Sign In"
              onPress={handleBackToSignIn}
              fullWidth
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email Address"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (emailError) {
                  setEmailError('');
                }
              }}
              placeholder="john@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={emailError}
              required
            />

            <Button
              title="Send Reset Link"
              onPress={handleResetPassword}
              loading={isLoading}
              fullWidth
              style={styles.resetButton}
            />

            <View style={styles.backContainer}>
              <Text style={styles.backText}>Remember your password? </Text>
              <Button
                title="Sign In"
                onPress={handleBackToSignIn}
                variant="text"
                size="small"
              />
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
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  resetButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  backContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  
  // Success state styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successEmoji: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  emailText: {
    fontWeight: '600',
    color: Colors.primary,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  resendButton: {
    marginBottom: 8,
  },
});

export default ForgotPasswordScreen;