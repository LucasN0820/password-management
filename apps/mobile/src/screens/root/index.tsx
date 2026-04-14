import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DBProvider } from '@/providers/db';
import { ThemeProvider } from '@/providers/theme';
import { PasswordProvider } from '@/providers/password';
import { I18nProvider } from '@/providers/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Render } from './render';

// Fonts
import {
  Caveat_600SemiBold,
  Caveat_700Bold,
} from '@expo-google-fonts/caveat';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export function RootScreen() {
  const [loaded, error] = useFonts({
    Caveat_600SemiBold,
    Caveat_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
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
            <PasswordProvider>
              <I18nProvider>
                <ThemeProvider>
                  <Render />
                </ThemeProvider>
              </I18nProvider>
            </PasswordProvider>
          </DBProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
