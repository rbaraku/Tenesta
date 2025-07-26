import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

// Tenesta Logo Component
const TenestaLogo = ({ size = 100 }) => (
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

// Professional Feature Icon Component
const FeatureIcon = ({ type, size = 24 }) => {
  const iconStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: '#800020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  };

  const getIconContent = () => {
    switch (type) {
      case 'payment':
        return <View style={styles.cardIcon} />;
      case 'ai':
        return <View style={styles.aiIcon} />;
      case 'notification':
        return <View style={styles.bellIcon} />;
      case 'document':
        return <View style={styles.docIcon} />;
      default:
        return null;
    }
  };

  return (
    <View style={iconStyle}>
      {getIconContent()}
    </View>
  );
};

// Custom Button Component
const CustomButton = ({ title, onPress, variant = 'primary', style }) => (
  <TouchableOpacity
    style={[
      styles.button,
      variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
      style
    ]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={[
      styles.buttonText,
      variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText
    ]}>
      {title}
    </Text>
  </TouchableOpacity>
);

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <TenestaLogo size={140} />
          <Text style={styles.appName}>Tenesta</Text>
          <Text style={styles.subtitle}>
            AI-Enhanced Property Management Platform
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <FeatureIcon type="payment" />
            <Text style={styles.featureText}>Smart Payment Tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <FeatureIcon type="ai" />
            <Text style={styles.featureText}>AI-Powered Communication</Text>
          </View>
          <View style={styles.featureItem}>
            <FeatureIcon type="notification" />
            <Text style={styles.featureText}>Real-time Notifications</Text>
          </View>
          <View style={styles.featureItem}>
            <FeatureIcon type="document" />
            <Text style={styles.featureText}>Document Management</Text>
          </View>
        </View>

        <View style={styles.buttonSection}>
          <CustomButton
            title="Get Started"
            onPress={() => navigation.navigate('SignUp')}
            style={styles.primaryButtonStyle}
          />
          <CustomButton
            title="Sign In"
            onPress={() => navigation.navigate('Login')}
            variant="secondary"
            style={styles.secondaryButtonStyle}
          />
          
          <Text style={styles.roleText}>
            For Tenants • Landlords • Property Managers
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoHouse: {
    position: 'relative',
    alignItems: 'center',
  },
  logoRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 50,
    borderRightWidth: 50,
    borderBottomWidth: 38,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#722F37',
    marginBottom: -1,
  },
  logoBody: {
    width: 90,
    height: 65,
    backgroundColor: '#B91C1C',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  logoT: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Arial',
  },
  logoBase: {
    backgroundColor: '#800020',
    borderRadius: 25,
    marginTop: -12,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#800020',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  features: {
    alignItems: 'center',
    marginVertical: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  // Professional icon styles
  cardIcon: {
    width: 12,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  aiIcon: {
    width: 10,
    height: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    position: 'relative',
  },
  bellIcon: {
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  docIcon: {
    width: 10,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  buttonSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    width: '100%',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#800020',
    shadowColor: '#800020',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#800020',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#800020',
  },
  primaryButtonStyle: {
    marginBottom: 16,
  },
  secondaryButtonStyle: {
    marginBottom: 24,
  },
  roleText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
