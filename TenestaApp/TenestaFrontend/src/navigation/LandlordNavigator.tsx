import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import { Colors } from '../constants';

// Import screens
import LandlordDashboard from '../screens/landlord/LandlordDashboard';
import PaymentsScreen from '../screens/landlord/PaymentsScreen';
import PropertiesScreen from '../screens/landlord/PropertiesScreen';

// Placeholder screens for now
const TenantsScreen = () => <Text>Tenants Screen</Text>;
const ReportsScreen = () => <Text>Reports Screen</Text>;

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigators for each tab
const DashboardStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="LandlordDashboardScreen" 
      component={LandlordDashboard}
      options={{ title: 'Dashboard' }}
    />
  </Stack.Navigator>
);

const PropertiesStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="PropertiesScreen" 
      component={PropertiesScreen}
      options={{ title: 'Properties' }}
    />
  </Stack.Navigator>
);

const TenantsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="TenantsScreen" 
      component={TenantsScreen}
      options={{ title: 'Tenants' }}
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

const ReportsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="ReportsScreen" 
      component={ReportsScreen}
      options={{ title: 'Reports' }}
    />
  </Stack.Navigator>
);

const LandlordNavigator = () => {
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
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📊</Text>,
        }}
      />
      <Tab.Screen 
        name="Properties" 
        component={PropertiesStack}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏢</Text>,
        }}
      />
      <Tab.Screen 
        name="Tenants" 
        component={TenantsStack}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👥</Text>,
        }}
      />
      <Tab.Screen 
        name="Payments" 
        component={PaymentsStack}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💰</Text>,
        }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsStack}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📈</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

export default LandlordNavigator;