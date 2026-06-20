import {
  Check,
  Download,
  FolderOpen,
  Languages,
  Loader2,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { type KeyboardEvent, useEffect, useState } from 'react';
import { useTranslation } from '@repo/i18n';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  toast,
} from '@repo/ui';
import { formatBytes } from '@/lib/format';
import type {
  LocalModelDownloadProgress,
  LocalModelLibraryStatus,
} from '../../../electron/preload';

const LANGUAGE_OPTIONS = [
  { code: 'en', nativeName: 'English', short: 'EN' },
  { code: 'zh', nativeName: '中文', short: '中' },
] as const;

function formatDuration(
  seconds: number | undefined,
  t: (key: string, options?: Record<string, unknown>) => string
) {
  if (!seconds || !Number.isFinite(seconds)) {
    return null;
  }
  if (seconds < 60) {
    return t('settings.secondsRemaining', { count: Math.ceil(seconds) });
  }
  const minutes = Math.ceil(seconds / 60);
  return t('settings.minutesRemaining', { count: minutes });
}

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language?.split('-')[0] ?? 'en';
  const [libraryStatus, setLibraryStatus] =
    useState<LocalModelLibraryStatus | null>(null);
  const [busyModelId, setBusyModelId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] =
    useState<LocalModelDownloadProgress | null>(null);

  const refreshLibrary = async () => {
    const status = await window.electronAPI.getLocalImportModelLibraryStatus();
    setLibraryStatus(status);
    return status;
  };

  useEffect(() => {
    const unsubscribe = window.electronAPI.onLocalImportModelDownloadProgress(
      progress => {
        setDownloadProgress(progress);
        if (progress.status === 'completed') {
          refreshLibrary().catch(() => undefined);
        }
      }
    );

    Promise.all([
      window.electronAPI.getLocalImportModelLibraryStatus(),
      window.electronAPI.getLocalImportModelDownloadProgress(),
    ])
      .then(([status, activeProgress]) => {
        // Restore in-flight download state before first paint of the
        // library so remounting mid-download doesn't flash the idle UI.
        if (activeProgress) {
          setDownloadProgress(current => current ?? activeProgress);
        }
        setLibraryStatus(status);
      })
      .catch(() => undefined);

    return unsubscribe;
  }, []);

  const handlePrepareModel = async (modelId: string) => {
    setBusyModelId(modelId);
    try {
      const status = await window.electronAPI.prepareLocalImportModel(modelId);
      setLibraryStatus(status);
      const model = status.models.find(item => item.id === modelId);
      if (model?.exists) {
        toast({
          title: t('settings.modelReady'),
          description: t('settings.modelReadyHint', {
            name: model.displayName,
          }),
        });
      } else {
        toast({
          title: t('settings.downloadCancelled'),
          description: t('settings.downloadCancelledHint'),
        });
      }
    } catch {
      toast({
        title: t('settings.modelSetupFailed'),
        description: t('settings.modelSetupFailedHint'),
        variant: 'destructive',
      });
    } finally {
      setBusyModelId(null);
      setDownloadProgress(null);
    }
  };

  const handleCancelDownload = async () => {
    try {
      const status = await window.electronAPI.cancelLocalImportModelDownload();
      setLibraryStatus(status);
    } finally {
      setDownloadProgress(null);
    }
  };

  const handleRemoveModel = async (modelId: string) => {
    setBusyModelId(modelId);
    try {
      const status = await window.electronAPI.removeLocalImportModel(modelId);
      setLibraryStatus(status);
      toast({
        title: t('settings.modelRemoved'),
        description: t('settings.modelRemovedHint'),
      });
    } catch {
      toast({
        title: t('settings.removeModelFailed'),
        description: t('settings.removeModelFailedHint'),
        variant: 'destructive',
      });
    } finally {
      setBusyModelId(null);
    }
  };

  const handleSetDefault = async (modelId: string) => {
    setBusyModelId(modelId);
    try {
      const status =
        await window.electronAPI.setDefaultLocalImportModel(modelId);
      setLibraryStatus(status);
      toast({
        title: t('settings.defaultModelUpdated'),
        description: t('settings.defaultModelUpdatedHint'),
      });
    } catch {
      toast({
        title: t('settings.defaultModelFailed'),
        description: t('settings.defaultModelFailedHint'),
        variant: 'destructive',
      });
    } finally {
      setBusyModelId(null);
    }
  };

  const handleOpenModelFolder = async () => {
    await window.electronAPI.openLocalImportModelFolder();
  };

  const handleSelectLanguage = (code: string) => {
    if (code === currentLanguage) {
      return;
    }
    // i18n persists the choice to localStorage via its languageChanged hook.
    void i18n.changeLanguage(code);
  };

  const handleModelCardKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    modelId: string,
    canSelect: boolean
  ) => {
    if (!canSelect || (event.key !== 'Enter' && event.key !== ' ')) {
      return;
    }

    event.preventDefault();
    void handleSetDefault(modelId);
  };

  return (
    <div className='h-full overflow-y-auto bg-background'>
      <div className='mx-auto flex max-w-5xl flex-col gap-6 px-10 py-10'>
        <section className='border-b border-border pb-8'>
          <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-clay/25 bg-clay-soft px-3 py-1 text-sm font-semibold text-clay'>
            <ShieldCheck className='h-4 w-4' />
            {t('settings.runtimeConfiguration')}
          </div>
          <h1 className='font-heading text-[44px] font-medium leading-tight tracking-tight text-foreground'>
            {t('settings.title')}
          </h1>
          <p className='mt-3 max-w-2xl text-base text-muted-foreground'>
            {t('settings.desktopSubtitle')}
          </p>
        </section>

        <Card className='rounded-lg border-border bg-card'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Languages className='h-4 w-4 text-clay' />
              {t('settings.language')}
            </CardTitle>
            <CardDescription className='mt-1'>
              {t('settings.languageHint')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              role='radiogroup'
              aria-label={t('settings.language')}
              className='grid gap-3 sm:grid-cols-2'
            >
              {LANGUAGE_OPTIONS.map(option => {
                const isActive = currentLanguage === option.code;
                return (
                  <button
                    key={option.code}
                    type='button'
                    role='radio'
                    aria-checked={isActive}
                    className={`flex items-center justify-between gap-3 rounded-lg border bg-background p-4 text-left transition-colors ${
                      isActive
                        ? 'border-clay ring-1 ring-clay/25'
                        : 'border-border hover:border-clay/60 hover:bg-accent/30'
                    }`}
                    onClick={() => {
                      handleSelectLanguage(option.code);
                    }}
                  >
                    <span className='flex items-center gap-3'>
                      <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay-soft text-sm font-semibold text-clay'>
                        {option.short}
                      </span>
                      <span className='text-sm font-semibold text-foreground'>
                        {option.nativeName}
                      </span>
                    </span>
                    {isActive ? (
                      <Check className='h-4 w-4 shrink-0 text-clay' />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-lg border-border bg-card'>
          <CardHeader className='flex flex-row items-start justify-between gap-4'>
            <div>
              <CardTitle>{t('settings.modelLibrary')}</CardTitle>
              <CardDescription className='mt-1'>
                {t('settings.modelLibraryHint')}
              </CardDescription>
            </div>
            <Button
              size='sm'
              variant='outline'
              onClick={() => {
                void handleOpenModelFolder();
              }}
            >
              <FolderOpen className='h-4 w-4' />
              {t('settings.openFolder')}
            </Button>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 lg:grid-cols-3'>
              {libraryStatus?.catalog.map(catalogModel => {
                const installedModel = libraryStatus.models.find(
                  model => model.id === catalogModel.id
                );
                const isBusy = busyModelId === catalogModel.id;
                const isReady = Boolean(installedModel?.exists);
                const activeProgress =
                  downloadProgress?.modelId === catalogModel.id
                    ? downloadProgress
                    : null;
                const isDownloading = Boolean(
                  activeProgress &&
                  ['starting', 'downloading', 'verifying'].includes(
                    activeProgress.status
                  )
                );
                const totalBytes =
                  activeProgress?.totalBytes ?? catalogModel.sizeBytes;
                const progressPercent = totalBytes
                  ? Math.min(
                      100,
                      ((activeProgress?.downloadedBytes ?? 0) / totalBytes) *
                        100
                    )
                  : 0;
                const remaining = formatDuration(
                  activeProgress?.estimatedSecondsRemaining,
                  t
                );

                return (
                  <div
                    key={catalogModel.id}
                    aria-checked={installedModel?.isDefault ?? false}
                    role={isReady ? 'checkbox' : undefined}
                    tabIndex={isReady ? 0 : undefined}
                    className={`flex min-h-[236px] flex-col justify-between rounded-lg border bg-background p-4 transition-colors ${
                      installedModel?.isDefault
                        ? 'border-clay ring-1 ring-clay/25'
                        : isReady
                          ? 'cursor-pointer border-border hover:border-clay/60 hover:bg-accent/30'
                          : 'border-border'
                    }`}
                    onClick={() => {
                      if (isReady && !installedModel?.isDefault && !isBusy) {
                        void handleSetDefault(catalogModel.id);
                      }
                    }}
                    onKeyDown={event => {
                      handleModelCardKeyDown(
                        event,
                        catalogModel.id,
                        isReady && !installedModel?.isDefault && !isBusy
                      );
                    }}
                  >
                    <div>
                      <div className='mb-3 flex items-start justify-between gap-3'>
                        <div>
                          <div className='text-sm font-semibold text-foreground'>
                            {catalogModel.displayName}
                          </div>
                          <div className='mt-1 text-xs uppercase text-muted-foreground'>
                            {catalogModel.family} · {catalogModel.quant}
                          </div>
                        </div>
                        {isReady ? (
                          <Checkbox
                            aria-hidden
                            checked={installedModel?.isDefault ?? false}
                            className='pointer-events-none mt-0.5'
                            tabIndex={-1}
                          />
                        ) : null}
                      </div>
                      <p className='text-sm leading-6 text-muted-foreground'>
                        {catalogModel.description}
                      </p>
                      <div className='mt-3 text-xs text-muted-foreground'>
                        {formatBytes(catalogModel.sizeBytes)}
                        {catalogModel.minMemoryGb
                          ? ` · ${t('settings.memoryRequired', {
                              count: catalogModel.minMemoryGb,
                            })}`
                          : ''}
                      </div>
                      <div className='mt-4 min-h-12'>
                        {isDownloading ? (
                          <div className='space-y-2'>
                            <div className='h-1.5 overflow-hidden rounded-full bg-muted'>
                              <div
                                className='h-full rounded-full bg-clay transition-[width] duration-200'
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <div className='flex justify-between gap-2 text-xs text-muted-foreground'>
                              <span>
                                {activeProgress?.status === 'verifying'
                                  ? t('settings.verifyingDownload')
                                  : `${Math.round(progressPercent)}% · ${formatBytes(
                                      activeProgress?.downloadedBytes
                                    )}`}
                              </span>
                              <span>
                                {remaining ??
                                  (activeProgress?.bytesPerSecond
                                    ? `${formatBytes(
                                        activeProgress.bytesPerSecond
                                      )}/s`
                                    : t('settings.starting'))}
                              </span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className='mt-4 flex flex-wrap gap-2'>
                      {isDownloading ? (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => {
                            void handleCancelDownload();
                          }}
                        >
                          <X className='h-4 w-4' />
                          {t('modal.cancel')}
                        </Button>
                      ) : isReady ? (
                        <Button
                          disabled={isBusy}
                          size='icon'
                          variant='ghost'
                          title={t('settings.removeNamedModel', {
                            name: catalogModel.displayName,
                          })}
                          onClick={event => {
                            event.stopPropagation();
                            void handleRemoveModel(catalogModel.id);
                          }}
                        >
                          {isBusy ? (
                            <Loader2 className='h-4 w-4 animate-spin' />
                          ) : (
                            <Trash2 className='h-4 w-4' />
                          )}
                        </Button>
                      ) : (
                        <Button
                          disabled={isBusy || Boolean(downloadProgress)}
                          size='sm'
                          onClick={() => {
                            void handlePrepareModel(catalogModel.id);
                          }}
                        >
                          {isBusy ? (
                            <Loader2 className='h-4 w-4 animate-spin' />
                          ) : (
                            <Download className='h-4 w-4' />
                          )}
                          {t('settings.download')}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
