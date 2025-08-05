import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import { Colors } from '../constants';

// Import screens
import TenantDashboard from '../screens/tenant/TenantDashboard';
import PaymentsScreen from '../screens/tenant/PaymentsScreen';
import MessagesScreen from '../screens/tenant/MessagesScreen';
import DocumentsScreen from '../screens/tenant/DocumentsScreen';

// Placeholder screens for now
const ProfileScreen = () => <Text>Profile Screen</Text>;

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigators for each tab
const DashboardStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="TenantDashboardScreen" 
      component={TenantDashboard}
      options={{ title: 'Dashboard' }}
    />
  </Stack.Navigator>
);

const PaymentsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="PaymentsScreen" 
      component={PaymentsScreen}
      options={{ title: 'Payments' }}
    />
  </Stack.Navigator>
);

const DocumentsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="DocumentsScreen" 
      component={DocumentsScreen}
      options={{ title: 'Documents' }}
    />
  </Stack.Navigator>
);

const MessagesStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="MessagesScreen" 
      component={MessagesScreen}
      options={{ title: 'Messages' }}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="ProfileScreen" 
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
  </Stack.Navigator>
);

const TenantNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardStack}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tab.Screen 
        name="Payments" 
        component={PaymentsStack}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💳</Text>,
        }}
      />
      <Tab.Screen 
        name="Documents" 
        component={DocumentsStack}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📄</Text>,
        }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesStack}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💬</Text>,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

export default TenantNavigator;