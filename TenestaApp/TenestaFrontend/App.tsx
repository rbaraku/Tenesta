import React from 'react';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';

// Enable screens for better performance
enableScreens();

export default function App() {
  return (
    <Provider store={store}>
      <StatusBar style="auto" />
      <AppNavigator />
    </Provider>
  );
}