import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

// Tenesta Logo Component
const TenestaLogo = ({ size = 80 }) => (
  <View style={[styles.logoContainer, { width: size, height: size }]}>
    <View style={[styles.logoHouse, { width: size, height: size * 0.8 }]}>
      <View style={styles.logoRoof} />
      <View style={styles.logoBody}>
        <Text style={[styles.logoT, { fontSize: size * 0.4 }]}>T</Text>
      </View>
    </View>
    <View style={[styles.logoBase, { width: size * 1.2, height: size * 0.3 }]} />
  </View>
);

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <TenestaLogo size={120} />
      <ActivityIndicator size="large" color="#800020" style={styles.spinner} />
      <Text style={styles.loadingText}>Loading your dashboard...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoHouse: {
    position: 'relative',
    alignItems: 'center',
  },
  logoRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 40,
    borderRightWidth: 40,
    borderBottomWidth: 30,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#722F37', // Dark burgundy for roof
    marginBottom: -1,
  },
  logoBody: {
    width: 70,
    height: 50,
    backgroundColor: '#B91C1C', // Burgundy for house body
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  logoT: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Arial',
  },
  logoBase: {
    backgroundColor: '#800020', // Deep burgundy for base
    borderRadius: 20,
    marginTop: -10,
  },
  spinner: {
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});
