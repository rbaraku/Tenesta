import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Tenant Screens
import TenantDashboard from '../screens/tenant/TenantDashboard';
import PaymentScreen from '../screens/tenant/PaymentScreen';
import DocumentsScreen from '../screens/tenant/DocumentsScreen';
import MessagesScreen from '../screens/tenant/MessagesScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TenantTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard':
              iconName = 'view-dashboard';
              break;
            case 'Payments':
              iconName = 'credit-card';
              break;
            case 'Documents':
              iconName = 'file-document';
              break;
            case 'Messages':
              iconName = 'message-text';
              break;
            case 'Profile':
              iconName = 'account';
              break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#800020',      // Deep burgundy
        tabBarInactiveTintColor: '#9CA3AF',   // Light gray
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',          // Pure white
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={TenantDashboard} />
      <Tab.Screen name="Payments" component={PaymentScreen} />
      <Tab.Screen name="Documents" component={DocumentsScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function TenantNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TenantTabs" component={TenantTabs} />
    </Stack.Navigator>
  );
}
