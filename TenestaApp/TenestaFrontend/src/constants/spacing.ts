export const Spacing = {
  // Base spacing unit (4px)
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
  
  // Component-specific spacing
  cardPadding: 16,
  screenPadding: 20,
  sectionSpacing: 24,
  
  // Border radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50,
  },
  
  // Button heights
  buttonHeight: {
    small: 32,
    medium: 40,
    large: 48,
  },
  
  // Input heights
  inputHeight: {
    small: 36,
    medium: 44,
    large: 52,
  },
} as const;

export type SpacingKey = keyof typeof Spacing;