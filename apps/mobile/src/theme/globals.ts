// Global design tokens — Notion-inspired
export const HEIGHT = 48;
export const FONT_SIZE = 15;
export const BORDER_RADIUS = 16;
export const CORNERS = 999;

// Font family names (must match the names registered in useFonts)
export const fonts = {
  heading: 'Caveat_700Bold',
  headingSemiBold: 'Caveat_600SemiBold',
  body: 'Nunito_400Regular',
  bodySemiBold: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  caption: 'Nunito_400Regular',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;
