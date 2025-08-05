import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { getCurrentUser, setUser, setSession } from '../store/slices/authSlice';
import { authService } from '../services/supabase';
import { RootStackParamList } from '../types';

// Auth Screens
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Navigators
import TenantNavigator from './TenantNavigator';
import LandlordNavigator from './LandlordNavigator';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Check for existing session
    dispatch(getCurrentUser()).catch(error => {
      console.warn('Failed to get current user:', error);
    });

    // Listen for auth state changes
    try {
      const { data: { subscription } } = authService.onAuthStateChange(
        (event, session) => {
          console.log('Auth state change:', event, session?.user?.id);
          if (event === 'SIGNED_IN' && session) {
            dispatch(setSession(session));
            dispatch(setUser(session.user));
          } else if (event === 'SIGNED_OUT') {
            dispatch(setSession(null));
            dispatch(setUser(null));
          }
        }
      );

      return () => {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.warn('Failed to unsubscribe from auth changes:', error);
        }
      };
    } catch (error) {
      console.error('Failed to set up auth state listener:', error);
      return () => {}; // Return empty cleanup function
    }
  }, [dispatch]);

  const getMainNavigator = () => {
    if (!isAuthenticated || !user) {
      return (
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Navigator>
      );
    }

    // Return appropriate navigator based on user role
    // For now, default to tenant navigator since we don't have role info from Supabase user object
    // TODO: Implement user profile fetching to get role information
    const userRole = (user as any)?.role || 'tenant';
    
    if (userRole === 'tenant') {
      return <TenantNavigator />;
    } else if (userRole === 'landlord') {
      return <LandlordNavigator />;
    }

    // Default fallback to tenant navigator
    return <TenantNavigator />;
  };

  return (
    <NavigationContainer>
      {getMainNavigator()}
    </NavigationContainer>
  );
};

export default AppNavigator;