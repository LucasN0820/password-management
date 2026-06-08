// Claude-inspired color palette for PassVault mobile.
// Matches the landing and desktop design system with light/dark variants.

const lightColors = {
  background: '#F8F7F2',
  foreground: '#1F1E1B',
  surface: '#F2EFE7',
  border: '#DFDDD5',
  hover: '#EEE9DD',
  mutedForeground: '#78736B',
  textTertiary: '#B6B0A5',

  // Semantic
  accentBlue: '#D97757',
  accentGreen: '#6E7D5A',
  accentRed: '#B84D3D',
  accentYellow: '#C5894B',
  selectedBg: '#EFE5D7',

  // Tinted backgrounds
  favCardBg: '#FFF1EB',
  strongCardBg: '#EFE5D7',

  // Legacy mappings for existing components
  card: '#FFFFFF',
  cardForeground: '#1F1E1B',
  primary: '#171614',
  primaryForeground: '#FFFFFF',
  secondary: '#F2EFE7',
  secondaryForeground: '#1F1E1B',
  muted: '#F2EFE7',
  accent: '#EEE9DD',
  accentForeground: '#1F1E1B',
  destructive: '#B84D3D',
  destructiveForeground: '#FFFFFF',
  input: '#F2EFE7',
  ring: '#D97757',
  text: '#1F1E1B',
  textMuted: '#78736B',
  tint: '#171614',
  icon: '#78736B',
  tabIconDefault: '#B6B0A5',
  tabIconSelected: '#171614',

  // Keep semantic color aliases
  blue: '#8B6F5A',
  green: '#6E7D5A',
  red: '#B84D3D',
  orange: '#D97757',
  yellow: '#C5894B',
  pink: '#A66A61',
  purple: '#7D6B83',
  teal: '#697E77',
  indigo: '#606A80',
};

const darkColors = {
  background: '#171614',
  foreground: '#F6F1E8',
  surface: '#24221F',
  border: '#37332D',
  hover: '#2D2A25',
  mutedForeground: '#B8AFA2',
  textTertiary: '#716A60',

  // Semantic
  accentBlue: '#F0A283',
  accentGreen: '#9AA781',
  accentRed: '#E56C5A',
  accentYellow: '#D0A15B',
  selectedBg: '#3B2E26',

  // Tinted backgrounds
  favCardBg: '#33251F',
  strongCardBg: '#2D2A21',

  // Legacy mappings
  card: '#201F1C',
  cardForeground: '#F6F1E8',
  primary: '#F6F1E8',
  primaryForeground: '#171614',
  secondary: '#24221F',
  secondaryForeground: '#F6F1E8',
  muted: '#24221F',
  accent: '#2D2A25',
  accentForeground: '#F6F1E8',
  destructive: '#E56C5A',
  destructiveForeground: '#FFFFFF',
  input: '#24221F',
  ring: '#F0A283',
  text: '#F6F1E8',
  textMuted: '#B8AFA2',
  tint: '#F6F1E8',
  icon: '#B8AFA2',
  tabIconDefault: '#716A60',
  tabIconSelected: '#F6F1E8',

  blue: '#BFA082',
  green: '#9AA781',
  red: '#E56C5A',
  orange: '#F0A283',
  yellow: '#D0A15B',
  pink: '#C28A80',
  purple: '#A999B1',
  teal: '#94A8A0',
  indigo: '#9BA4BC',
};

export const Colors = {
  light: lightColors,
  dark: darkColors,
};

export { darkColors, lightColors };
export type ColorKeys = keyof typeof lightColors;
