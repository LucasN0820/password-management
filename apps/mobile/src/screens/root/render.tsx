import { Stack } from 'expo-router';
import { GlobalModelDownloadBanner } from '@/components/model-download-banner';
import { Toast } from '@/components/toast';
import { AppUpdateManager } from '@/features/app-update';
import { ModelDownloadProvider } from '@/features/model-download/download-provider';
import { UndoDeleteSnackbar } from '@/features/undo-delete';

export function Render() {
  return (
    <ModelDownloadProvider>
      <Stack
        screenOptions={{
          // Android 预测性返回手势（Gmail 同款效果）。配合 app.config.ts 的
          // android.predictiveBackGestureEnabled（写入 enableOnBackInvokedCallback），
          // 返回时当前页缩成卡片滑出、下层上一个页面同时显现。
          // fullScreenGestureEnabled 允许从屏幕任意位置横向滑动返回，而不仅是最左边缘。
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      >
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
      <AppUpdateManager />
    </ModelDownloadProvider>
  );
}
