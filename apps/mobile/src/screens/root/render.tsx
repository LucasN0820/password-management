import { Stack } from 'expo-router';
import { GlobalModelDownloadBanner } from '@/components/model-download-banner';
import { Toast } from '@/components/toast';
import { ModelDownloadProvider } from '@/features/model-download/download-provider';
import { UndoDeleteSnackbar } from '@/features/undo-delete';

export function Render() {
  return (
    <ModelDownloadProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="ai-import" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="health" />
        <Stack.Screen name="backup" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <GlobalModelDownloadBanner />
      <Toast />
      <UndoDeleteSnackbar />
    </ModelDownloadProvider>
  );
}
