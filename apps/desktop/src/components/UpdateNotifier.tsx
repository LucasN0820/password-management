import { Download, RefreshCw, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@repo/i18n';
import { Button } from '@repo/ui';
import type { AutoUpdateStatus } from '../../electron/preload';

/**
 * Global, dismissible update banner. Stays silent while idle/checking and only
 * surfaces actionable states (available → download → restart). Status is pushed
 * from the main process via `onAutoUpdateStatus`.
 */
export function UpdateNotifier() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<AutoUpdateStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const lastState = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = window.electronAPI.onAutoUpdateStatus(next => {
      setStatus(next);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!status) {
      return;
    }
    // Re-show the banner whenever a fresh actionable state arrives.
    if (
      status.state !== lastState.current &&
      (status.state === 'available' || status.state === 'downloaded')
    ) {
      setDismissed(false);
    }
    lastState.current = status.state;
  }, [status]);

  if (!status || dismissed) {
    return null;
  }

  const { state } = status;
  if (
    state !== 'available' &&
    state !== 'downloading' &&
    state !== 'downloaded'
  ) {
    return null;
  }

  const percent = Math.round(status.percent ?? 0);
  const heading =
    state === 'downloaded'
      ? t('update.downloaded')
      : state === 'downloading'
        ? t('update.downloading', { percent })
        : t('update.available');

  return (
    <div className='pointer-events-auto fixed bottom-6 right-6 z-50 w-80 rounded-xl border border-border bg-card p-4 shadow-lg'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-sm font-semibold text-foreground'>{heading}</p>
          {status.version ? (
            <p className='mt-0.5 truncate text-xs text-muted-foreground'>
              v{status.version}
            </p>
          ) : null}
        </div>
        <button
          type='button'
          aria-label={t('update.later')}
          className='shrink-0 text-muted-foreground transition-colors hover:text-foreground'
          onClick={() => {
            setDismissed(true);
          }}
        >
          <X className='h-4 w-4' />
        </button>
      </div>

      {state === 'downloading' ? (
        <div className='mt-3 h-1.5 overflow-hidden rounded-full bg-muted'>
          <div
            className='h-full rounded-full bg-clay transition-[width] duration-200'
            style={{ width: `${percent}%` }}
          />
        </div>
      ) : (
        <div className='mt-3 flex justify-end'>
          {state === 'available' ? (
            <Button
              size='sm'
              onClick={() => {
                void window.electronAPI.downloadUpdate();
              }}
            >
              <Download className='h-4 w-4' />
              {t('update.download')}
            </Button>
          ) : (
            <Button
              size='sm'
              onClick={() => {
                void window.electronAPI.quitAndInstallUpdate();
              }}
            >
              <RefreshCw className='h-4 w-4' />
              {t('update.restartToInstall')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
