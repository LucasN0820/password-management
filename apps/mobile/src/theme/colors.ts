// Notion-inspired color palette for PassVault mobile
// Matches desktop design system with light/dark variants

const lightColors = {
  // Core Notion palette
  background: '#FFFFFF',
  foreground: '#37352F',
  surface: '#F7F6F3',
  border: '#E9E9E7',
  hover: '#EFEFEF',
  mutedForeground: '#787774',
  textTertiary: '#C0BFB9',

  // Semantic
  accentBlue: '#2EAADC',
  accentGreen: '#0F7B6C',
  accentRed: '#EB5757',
  accentYellow: '#F5C542',
  selectedBg: '#E8F5FD',

  // Tinted backgrounds
  favCardBg: '#FEF9EF',
  strongCardBg: '#EDF9F0',

  // Legacy mappings for existing components
  card: '#F7F6F3',
  cardForeground: '#37352F',
  primary: '#37352F',
  primaryForeground: '#FFFFFF',
  secondary: '#F7F6F3',
  secondaryForeground: '#37352F',
  muted: '#F7F6F3',
  accent: '#EFEFEF',
  accentForeground: '#37352F',
  destructive: '#EB5757',
  destructiveForeground: '#FFFFFF',
  input: '#F7F6F3',
  ring: '#2EAADC',
  text: '#37352F',
  textMuted: '#787774',
  tint: '#37352F',
  icon: '#787774',
  tabIconDefault: '#C0BFB9',
  tabIconSelected: '#37352F',

  // Keep semantic color aliases
  blue: '#2EAADC',
  green: '#0F7B6C',
  red: '#EB5757',
  orange: '#E9966A',
  yellow: '#F5C542',
  pink: '#D44C91',
  purple: '#9065B0',
  teal: '#4DAAAF',
  indigo: '#5856D6',
};

const darkColors = {
  // Core Notion palette (dark)
  background: '#191919',
  foreground: '#FFFFFFCF',
  surface: '#2F2F2F',
  border: '#3A3A3A',
  hover: '#363636',
  mutedForeground: '#9B9A97',
  textTertiary: '#5A5A5A',

  // Semantic
  accentBlue: '#529CCA',
  accentGreen: '#4DAB9A',
  accentRed: '#FF6B6B',
  accentYellow: '#F5C542',
  selectedBg: '#1A3A4A',

  // Tinted backgrounds
  favCardBg: '#2A2520',
  strongCardBg: '#1A2A20',

  // Legacy mappings
  card: '#2F2F2F',
  cardForeground: '#FFFFFFCF',
  primary: '#FFFFFFCF',
  primaryForeground: '#191919',
  secondary: '#2F2F2F',
  secondaryForeground: '#FFFFFFCF',
  muted: '#2F2F2F',
  accent: '#363636',
  accentForeground: '#FFFFFFCF',
  destructive: '#FF6B6B',
  destructiveForeground: '#FFFFFF',
  input: '#2F2F2F',
  ring: '#529CCA',
  text: '#FFFFFFCF',
  textMuted: '#9B9A97',
  tint: '#FFFFFFCF',
  icon: '#9B9A97',
  tabIconDefault: '#5A5A5A',
  tabIconSelected: '#FFFFFFCF',

  blue: '#529CCA',
  green: '#4DAB9A',
  red: '#FF6B6B',
  orange: '#E9966A',
  yellow: '#F5C542',
  pink: '#D44C91',
  purple: '#9B6FC3',
  teal: '#5AC8C8',
  indigo: '#5E5CE6',
};

export const Colors = {
  light: lightColors,
  dark: darkColors,
};

export { darkColors, lightColors };
export type ColorKeys = keyof typeof lightColors;
