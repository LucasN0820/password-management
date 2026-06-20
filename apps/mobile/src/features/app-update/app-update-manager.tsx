import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from '@repo/i18n';
import { useToastStore } from '@/components/toast';
import {
  applyOtaUpdate,
  type AppUpdateResult,
  checkForAppUpdate,
  downloadAndInstallApk,
} from './service';

interface CheckOptions {
  interactive?: boolean;
}

// Remember what the automatic (startup) check already surfaced this session so
// it doesn't re-prompt for the same update on every remount. Manual checks from
// Settings always prompt.
let lastAutoPromptedSignature: string | null = null;

function resultSignature(result: AppUpdateResult): string {
  return result.type === 'binary'
    ? `binary:${result.release.version}`
    : result.type;
}

function useUpdatePrompts() {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.show);

  return useCallback(
    (result: AppUpdateResult, interactive: boolean) => {
      const actionable = result.type === 'ota' || result.type === 'binary';
      if (actionable && !interactive) {
        const signature = resultSignature(result);
        if (signature === lastAutoPromptedSignature) return;
        lastAutoPromptedSignature = signature;
      }

      if (result.type === 'ota') {
        Alert.alert(t('update.downloaded'), t('update.otaReadyHint'), [
          { text: t('update.later'), style: 'cancel' },
          {
            text: t('update.restartToInstall'),
            onPress: () => void applyOtaUpdate(),
          },
        ]);
        return;
      }

      if (result.type === 'binary') {
        Alert.alert(
          t('update.available'),
          t('update.binaryAvailableHint', { version: result.release.version }),
          [
            { text: t('update.later'), style: 'cancel' },
            {
              text: t('update.download'),
              onPress: () => {
                showToast(t('update.downloadingApk'));
                let lastPercent = -1;
                void downloadAndInstallApk(result.release, fraction => {
                  const percent = Math.round(fraction * 100);
                  if (percent === lastPercent) return;
                  if (percent >= lastPercent + 5 || percent === 100) {
                    lastPercent = percent;
                    showToast(t('update.downloading', { percent }));
                  }
                }).catch(() => {
                  Alert.alert(t('update.title'), t('update.installError'));
                });
              },
            },
          ]
        );
        return;
      }

      if (!interactive) return;
      showToast(
        result.type === 'unavailable'
          ? t('update.devOnly')
          : t('update.upToDate')
      );
    },
    [showToast, t]
  );
}

export function useAppUpdateCheck() {
  const { t } = useTranslation();
  const showResult = useUpdatePrompts();
  const [isChecking, setIsChecking] = useState(false);

  const check = useCallback(
    async ({ interactive = true }: CheckOptions = {}) => {
      setIsChecking(true);
      try {
        showResult(await checkForAppUpdate(), interactive);
      } catch {
        if (interactive) Alert.alert(t('update.title'), t('update.error'));
      } finally {
        setIsChecking(false);
      }
    },
    [showResult, t]
  );

  return { check, isChecking };
}

export function AppUpdateManager() {
  const { check } = useAppUpdateCheck();

  useEffect(() => {
    void check({ interactive: false });
  }, [check]);

  return null;
}
