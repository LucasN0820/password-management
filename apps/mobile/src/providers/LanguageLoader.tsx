import { Lock } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';

interface LanguageLoaderProps {
  color?: string;
}

/**
 * Full-screen skeleton loader shown while i18n language is being detected.
 * Prevents flash of blank/unstyled content during initialization.
 */
export function LanguageLoader({ color = '#D97757' }: LanguageLoaderProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8F7F2',
      }}
    >
      <View style={{ alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            borderCurve: 'continuous',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#171614',
          }}
        >
          <Lock size={20} color="#FFFFFF" />
        </View>
        <ActivityIndicator size="small" color={color} />
      </View>
    </View>
  );
}
