import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import TenantNavigator from './TenantNavigator';
import LandlordNavigator from './LandlordNavigator';
import LoadingScreen from '../screens/LoadingScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user || !userProfile) {
    return <AuthNavigator />;
  }

  // Route based on user role
  if (userProfile.role === 'tenant') {
    return <TenantNavigator />;
  } else if (userProfile.role === 'landlord' || userProfile.role === 'admin') {
    return <LandlordNavigator />;
  }

  return <AuthNavigator />;
}
