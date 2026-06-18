import { router, Stack } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, useColorScheme } from 'react-native';
import { useTranslation } from '@repo/i18n';
import { HealthScreen } from '@/screens/health';
import { Colors } from '@/theme/colors';

export default function Screen() {
  const { t } = useTranslation();
  const c = useColorScheme();
  const colors = Colors[c === 'dark' ? 'dark' : 'light'];

  return (
    <>
      <Stack.Screen
        options={{
          title: t('health.title'),
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <ChevronLeft size={24} color={colors.foreground} />
            </Pressable>
          ),
        }}
      />
      <HealthScreen />
    </>
  );
}
