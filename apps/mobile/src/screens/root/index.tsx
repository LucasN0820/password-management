import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono/400Regular';
import { NotoSansSC_400Regular } from '@expo-google-fonts/noto-sans-sc/400Regular';
import { NotoSansSC_600SemiBold } from '@expo-google-fonts/noto-sans-sc/600SemiBold';
import { NotoSerifSC_500Medium } from '@expo-google-fonts/noto-serif-sc/500Medium';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DBProvider } from '@/providers/db';
import { I18nProvider } from '@/providers/i18n';
import { PasswordProvider } from '@/providers/password';
import { ThemeProvider } from '@/providers/theme';
import { Render } from './render';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export function RootScreen() {
  const [loaded, error] = useFonts({
    NotoSansSC_400Regular,
    NotoSansSC_600SemiBold,
    NotoSerifSC_500Medium,
    JetBrainsMono_400Regular,
  });
  const queryClient = useMemo(() => new QueryClient(), []);

  useEffect(() => {
    if (error) throw error;

    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [error, loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <DBProvider>
            <I18nProvider>
              <PasswordProvider>
                <ThemeProvider>
                  <Render />
                </ThemeProvider>
              </PasswordProvider>
            </I18nProvider>
          </DBProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
