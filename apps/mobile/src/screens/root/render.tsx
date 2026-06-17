import { Stack } from 'expo-router';
import { GlobalModelDownloadBanner } from '@/components/model-download-banner';
import { Toast } from '@/components/toast';
import { ModelDownloadProvider } from '@/features/model-download/download-provider';

export function Render() {
  return (
    <ModelDownloadProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="ai-import" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <GlobalModelDownloadBanner />
      <Toast />
    </ModelDownloadProvider>
  );
}
