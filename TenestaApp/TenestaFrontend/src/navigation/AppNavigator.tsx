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
    dispatch(getCurrentUser());

    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          dispatch(setSession(session));
          dispatch(setUser(session.user));
        } else if (event === 'SIGNED_OUT') {
          dispatch(setSession(null));
          dispatch(setUser(null));
        }
      }
    );

    return () => subscription.unsubscribe();
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
    if (user.role === 'tenant') {
      return <TenantNavigator />;
    } else if (user.role === 'landlord') {
      return <LandlordNavigator />;
    }

    // Default fallback (should not happen)
    return (
      <Stack.Navigator>
        <Stack.Screen name="SignIn" component={SignInScreen} />
      </Stack.Navigator>
    );
  };

  return (
    <NavigationContainer>
      {getMainNavigator()}
    </NavigationContainer>
  );
};

export default AppNavigator;