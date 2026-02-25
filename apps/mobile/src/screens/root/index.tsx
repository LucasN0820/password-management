import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DBProvider } from '@/providers/db';
import { ThemeProvider } from '@/providers/theme';
import { PasswordProvider } from '@/providers/password';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Render } from './render';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export function RootScreen() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../../../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const queryClient = useMemo(() => new QueryClient(), []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
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
              <ThemeProvider>
                <Render />
              </ThemeProvider>
            </PasswordProvider>
          </DBProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
