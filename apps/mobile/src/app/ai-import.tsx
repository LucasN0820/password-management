import { router, Stack } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, useColorScheme } from 'react-native';
import { useTranslation } from '@repo/i18n';
import { AiImportScreen } from '@/screens/ai-import';
import { Colors } from '@/theme/colors';

export default function Screen() {
  const { t } = useTranslation();
  const c = useColorScheme();
  const colors = Colors[c ?? 'light'];

  return (
    <>
      <Stack.Screen options={{
        title: t('aiImport.title'),
        headerLeft: () => (
          <Pressable onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.foreground} />
          </Pressable>
        ),
      }}
      />
      <AiImportScreen />
    </>
  );
}
