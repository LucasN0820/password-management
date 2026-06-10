/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/.
 */

import { Colors } from '@/theme/colors';
import { useColorScheme } from './useColorTheme';

export function useColor(
  colorName: keyof typeof Colors.light  ,
  props?: { light?: string; dark?: string }
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props?.[theme];

  if (colorFromProps) {
    return colorFromProps;
  } 
    return Colors[theme][colorName];
  
}