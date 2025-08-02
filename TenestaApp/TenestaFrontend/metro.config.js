const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure proper handling of TypeScript and React Native
config.resolver.sourceExts.push('ts', 'tsx');

module.exports = config;