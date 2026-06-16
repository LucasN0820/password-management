import { type ReactNode, useEffect } from 'react';
import { AppState } from 'react-native';
import { i18n } from '@repo/i18n';
import { useToastStore } from '@/components/toast';
import { useMobileImportStore } from '@/features/ai-import/import-store';
import {
  ensureNotificationPermission,
  initModelDownloadCoordinator,
  registerLibraryCommittedListener,
  resumeActiveDownload,
} from './download-coordinator';

/**
 * App-level owner of the model-download lifecycle. Downloads belong to the app,
 * not to the AI Import Screen, so coordinator init, task restore and the
 * extraction AppState handling all live here — above any screen.
 */
export function ModelDownloadProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void initModelDownloadCoordinator();
    // Ask for notification permission at app load so the background-download
    // card can show on the first download without a button-gated prompt.
    void ensureNotificationPermission();

    // Refresh the model library whenever a background download commits, so any
    // mounted AI Import Screen reflects the newly available model, and surface
    // an in-app success toast. Uses the i18n singleton (not a captured `t`) so
    // the text always matches the current language.
    const unregister = registerLibraryCommittedListener(info => {
      void useMobileImportStore.getState().refreshModels();
      useToastStore
        .getState()
        .show(i18n.t('aiImport.modelReadyToast', { name: info.modelName }));
    });

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        // Re-attaching to a waiting transfer is safe and idempotent.
        void resumeActiveDownload();
      } else {
        // Only AI extraction is paused in the background; the download keeps
        // running under the native transfer layer.
        void useMobileImportStore.getState().handleAppBackground();
      }
    });

    return () => {
      unregister();
      subscription.remove();
    };
  }, []);

  return children;
}
