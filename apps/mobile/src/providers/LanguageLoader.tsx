import { View, Text, ActivityIndicator } from 'react-native';

interface LanguageLoaderProps {
  color?: string;
}

/**
 * Full-screen skeleton loader shown while i18n language is being detected.
 * Prevents flash of blank/unstyled content during initialization.
 */
export function LanguageLoader({ color = '#007AFF' }: LanguageLoaderProps) {
  return (
    <View className="flex-1 flex items-center justify-center bg-background">
      <View className="flex flex-col items-center gap-3">
        <Text className="text-4xl">🔐</Text>
        <ActivityIndicator size="small" color={color} />
      </View>
    </View>
  );
}
