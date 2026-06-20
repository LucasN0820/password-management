import { AlertCircle, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from '@repo/i18n';
import { usePasswordStore } from '../store/passwordStore';

interface PasswordProviderProps {
  children: React.ReactNode;
}

export function PasswordProvider({ children }: PasswordProviderProps) {
  const { t } = useTranslation();
  const loadPasswords = usePasswordStore(state => state.loadPasswords);
  const loadCategories = usePasswordStore(state => state.loadCategories);
  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const didStartInitialLoad = useRef(false);

  const loadInitialData = useCallback(async () => {
    setIsRetrying(true);

    try {
      const results = await Promise.allSettled([
        loadPasswords(),
        loadCategories(),
      ]);
      const failure = results.find(
        (result): result is PromiseRejectedResult =>
          result.status === 'rejected'
      );

      if (failure) { throw failure.reason; }
      setError(null);
    } catch (loadError) {
      const normalizedError =
        loadError instanceof Error
          ? loadError
          : new Error(t('errors.loadVaultUnknown'));
      console.error('Failed to load password data:', normalizedError);
      setError(normalizedError);
    } finally {
      setIsRetrying(false);
    }
  }, [loadCategories, loadPasswords, t]);

  useEffect(() => {
    if (didStartInitialLoad.current) { return; }

    didStartInitialLoad.current = true;
    void loadInitialData();
  }, [loadInitialData]);

  if (error) {
    return (
      <div
        className='flex h-screen items-center justify-center bg-background px-6'
        role='alert'
      >
        <div className='w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm'>
          <AlertCircle className='mx-auto mb-4 h-10 w-10 text-destructive' />
          <h1 className='font-heading text-2xl font-medium text-foreground'>
            {t('errors.loadVaultTitle')}
          </h1>
          <p className='mt-2 text-sm leading-6 text-muted-foreground'>
            {t('errors.loadVaultDescription')}
          </p>
          <button
            type='button'
            className='mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
            disabled={isRetrying}
            onClick={() => {
              void loadInitialData();
            }}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`}
            />
            {isRetrying ? t('errors.retrying') : t('errors.retry')}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
