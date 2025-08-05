export const Colors = {
  // Primary brand colors (maroon/brown palette from design)
  primary: '#8B4513',
  primaryDark: '#6B3410',
  primaryLight: '#A0522D',
  
  // Secondary colors
  secondary: '#CD853F',
  secondaryDark: '#A0522D',
  secondaryLight: '#DEB887',
  
  // Neutral colors
  background: '#FFFFFF',
  surface: '#F8F9FA',
  surfaceDark: '#F1F3F4',
  border: '#E0E0E0',
  white: '#FFFFFF',
  inputBackground: '#F5F5F5',
  
  // Text colors
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#9E9E9E',
  textOnPrimary: '#FFFFFF',
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Special colors
  rent: '#E53E3E',
  payment: '#38A169',
  pending: '#D69E2E',
  
  // Transparent overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',
} as const;

export type ColorKey = keyof typeof Colors;