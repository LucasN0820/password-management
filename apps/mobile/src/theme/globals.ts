// Global design tokens — Claude-inspired
export const HEIGHT = 48;
export const FONT_SIZE = 15;
export const BORDER_RADIUS = 12;
export const CORNERS = 12;

// Font family names (must match the names registered in useFonts)
export const fonts = {
  heading: 'NotoSerifSC_500Medium',
  headingSemiBold: 'NotoSerifSC_500Medium',
  body: 'NotoSansSC_400Regular',
  bodySemiBold: 'NotoSansSC_600SemiBold',
  bodyBold: 'NotoSansSC_600SemiBold',
  caption: 'NotoSansSC_400Regular',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_400Regular',
} as const;
