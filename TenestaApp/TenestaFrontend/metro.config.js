const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper handling of TypeScript and React Native
config.resolver.sourceExts.push('ts', 'tsx');

// React Native Gesture Handler configuration
config.resolver.alias = {
  'react-native-gesture-handler': require.resolve('react-native-gesture-handler'),
};

module.exports = config;