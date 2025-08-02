import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Landlord Screens
import LandlordDashboard from '../screens/landlord/LandlordDashboard';
import PropertiesScreen from '../screens/landlord/PropertiesScreen';
import TenantsScreen from '../screens/landlord/TenantsScreen';
import ReportsScreen from '../screens/landlord/ReportsScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function LandlordTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard':
              iconName = 'view-dashboard';
              break;
            case 'Properties':
              iconName = 'home-city';
              break;
            case 'Tenants':
              iconName = 'account-group';
              break;
            case 'Reports':
              iconName = 'chart-line';
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
      <Tab.Screen name="Dashboard" component={LandlordDashboard} />
      <Tab.Screen name="Properties" component={PropertiesScreen} />
      <Tab.Screen name="Tenants" component={TenantsScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function LandlordNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LandlordTabs" component={LandlordTabs} />
    </Stack.Navigator>
  );
}
