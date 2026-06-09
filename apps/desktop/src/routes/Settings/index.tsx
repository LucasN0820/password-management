import {
  Bot,
  CheckCircle2,
  Download,
  FolderOpen,
  HardDrive,
  KeyRound,
  Loader2,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  toast,
} from '@repo/ui';
import type {
  LocalModelLibraryStatus,
  LocalModelStatus,
} from '../../../electron/preload';

function formatBytes(bytes?: number) {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function modelStatusLabel(model?: LocalModelStatus) {
  if (!model) return 'Not downloaded';
  if (!model.exists) return 'Missing file';
  if (model.source === 'custom-file') return 'Custom GGUF';
  if (model.source === 'env-path') return 'Environment override';
  return 'Ready';
}

export default function SettingsPage() {
  const [libraryStatus, setLibraryStatus] =
    useState<LocalModelLibraryStatus | null>(null);
  const [busyModelId, setBusyModelId] = useState<string | null>(null);
  const [isChoosingModel, setIsChoosingModel] = useState(false);

  const refreshLibrary = async () => {
    const status = await window.electronAPI.getLocalImportModelLibraryStatus();
    setLibraryStatus(status);
    return status;
  };

  useEffect(() => {
    refreshLibrary().catch(() => undefined);
  }, []);

  const defaultModel = useMemo(
    () => libraryStatus?.models.find(model => model.isDefault),
    [libraryStatus]
  );

  const handlePrepareModel = async (modelId: string) => {
    setBusyModelId(modelId);
    try {
      const status = await window.electronAPI.prepareLocalImportModel(modelId);
      setLibraryStatus(status);
      const model = status.models.find(item => item.id === modelId);
      toast({
        title: 'Local model ready',
        description: `${model?.displayName ?? 'Model'} is ready for AI Import.`,
      });
    } catch (error) {
      toast({
        title: 'Model setup failed',
        description:
          error instanceof Error
            ? error.message
            : 'Unable to prepare the local AI model.',
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
        title: 'Default model updated',
        description: 'AI Import will use this model by default.',
      });
    } catch (error) {
      toast({
        title: 'Unable to set default',
        description:
          error instanceof Error
            ? error.message
            : 'Unable to set the default local model.',
        variant: 'destructive',
      });
    } finally {
      setBusyModelId(null);
    }
  };

  const handleChooseGguf = async () => {
    setIsChoosingModel(true);
    try {
      const status = await window.electronAPI.selectLocalImportModelFile();
      setLibraryStatus(status);
      toast({
        title: 'Local GGUF added',
        description: 'The selected model is available for AI Import.',
      });
    } catch (error) {
      toast({
        title: 'Unable to add model',
        description:
          error instanceof Error
            ? error.message
            : 'Unable to add the selected GGUF model.',
        variant: 'destructive',
      });
    } finally {
      setIsChoosingModel(false);
    }
  };

  const handleOpenModelFolder = async () => {
    await window.electronAPI.openLocalImportModelFolder();
  };

  return (
    <div className='h-full overflow-y-auto bg-background'>
      <div className='mx-auto flex max-w-5xl flex-col gap-6 px-10 py-10'>
        <section className='border-b border-border pb-8'>
          <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-clay/25 bg-clay-soft px-3 py-1 text-sm font-semibold text-clay'>
            <ShieldCheck className='h-4 w-4' />
            Runtime Configuration
          </div>
          <h1 className='font-heading text-[44px] font-medium leading-tight tracking-tight text-foreground'>
            Settings
          </h1>
          <p className='mt-3 max-w-2xl text-base text-muted-foreground'>
            Manage local GGUF models used by private AI Import.
          </p>
        </section>

        <Card className='rounded-lg border-border bg-card'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Bot className='h-5 w-5 text-clay' />
              Local AI Import
            </CardTitle>
            <CardDescription>
              Choose a downloaded model or add an existing GGUF file. The import
              workflow keeps files and extracted credentials on this device.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-[1.2fr_0.8fr]'>
              <div className='rounded-lg border border-border bg-surface px-4 py-4'>
                <div className='mb-2 flex items-center gap-2 text-sm font-semibold text-foreground'>
                  <HardDrive className='h-4 w-4 text-clay' />
                  Default Import Model
                </div>
                <div className='text-lg font-semibold text-foreground'>
                  {defaultModel?.displayName ?? 'Gemma 4 26B A4B Q4_K_M'}
                </div>
                <div className='mt-2 text-sm text-muted-foreground'>
                  {defaultModel
                    ? `${modelStatusLabel(defaultModel)} · ${formatBytes(
                        defaultModel.sizeBytes
                      )}`
                    : 'Download or choose a GGUF model to get started.'}
                </div>
                {defaultModel?.path ? (
                  <div className='mt-3 break-all font-mono text-xs text-muted-foreground'>
                    {defaultModel.path}
                  </div>
                ) : null}
              </div>

              <div className='flex flex-col justify-center gap-3 rounded-lg border border-border bg-surface px-4 py-4'>
                <Button onClick={handleChooseGguf} disabled={isChoosingModel}>
                  {isChoosingModel ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Plus className='h-4 w-4' />
                  )}
                  Choose GGUF
                </Button>
                <Button onClick={handleOpenModelFolder} variant='outline'>
                  <FolderOpen className='h-4 w-4' />
                  Open Model Folder
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-lg border-border bg-card'>
          <CardHeader>
            <CardTitle>Model Library</CardTitle>
            <CardDescription>
              Download supported catalog models or switch the default extractor.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 lg:grid-cols-3'>
              {libraryStatus?.catalog.map(catalogModel => {
                const installedModel = libraryStatus.models.find(
                  model => model.id === catalogModel.id
                );
                const isBusy = busyModelId === catalogModel.id;
                const isReady = Boolean(installedModel?.exists);

                return (
                  <div
                    key={catalogModel.id}
                    className='flex min-h-[236px] flex-col justify-between rounded-lg border border-border bg-background p-4'
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
                        {installedModel?.isDefault ? (
                          <CheckCircle2 className='h-4 w-4 text-clay' />
                        ) : null}
                      </div>
                      <p className='text-sm leading-6 text-muted-foreground'>
                        {catalogModel.description}
                      </p>
                      <div className='mt-3 text-xs text-muted-foreground'>
                        {formatBytes(catalogModel.sizeBytes)}
                        {catalogModel.minMemoryGb
                          ? ` · ${catalogModel.minMemoryGb}GB+ memory`
                          : ''}
                      </div>
                    </div>

                    <div className='mt-4 flex flex-wrap gap-2'>
                      {isReady ? (
                        <Button
                          disabled={isBusy || installedModel?.isDefault}
                          onClick={() => handleSetDefault(catalogModel.id)}
                          size='sm'
                          variant={
                            installedModel?.isDefault ? 'outline' : 'default'
                          }
                        >
                          {installedModel?.isDefault ? 'Default' : 'Use'}
                        </Button>
                      ) : (
                        <Button
                          disabled={isBusy}
                          onClick={() => handlePrepareModel(catalogModel.id)}
                          size='sm'
                        >
                          {isBusy ? (
                            <Loader2 className='h-4 w-4 animate-spin' />
                          ) : (
                            <Download className='h-4 w-4' />
                          )}
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className='rounded-lg border border-border bg-surface px-4 py-4'>
              <div className='mb-3 text-sm font-semibold text-foreground'>
                Added Models
              </div>
              {libraryStatus?.models.length ? (
                <div className='space-y-3'>
                  {libraryStatus.models.map(model => (
                    <div
                      className='flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-3'
                      key={model.id}
                    >
                      <div className='min-w-0'>
                        <div className='text-sm font-medium text-foreground'>
                          {model.displayName}
                        </div>
                        <div className='mt-1 break-all text-xs text-muted-foreground'>
                          {modelStatusLabel(model)} · {model.fileName}
                        </div>
                      </div>
                      <Button
                        disabled={model.isDefault || busyModelId === model.id}
                        onClick={() => handleSetDefault(model.id)}
                        size='sm'
                        variant={model.isDefault ? 'outline' : 'default'}
                      >
                        {model.isDefault ? 'Default' : 'Use'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-sm text-muted-foreground'>
                  No local models added yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-lg border-border bg-card'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <KeyRound className='h-5 w-5 text-clay' />
              Advanced
            </CardTitle>
            <CardDescription>
              Environment variables remain available for development and
              enterprise overrides.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='rounded-lg border border-border bg-surface px-4 py-4'>
              <ul className='space-y-2 text-sm text-muted-foreground'>
                <li>
                  <code>AI_IMPORT_PROVIDER</code> - Defaults to local-llama
                </li>
                <li>
                  <code>AI_IMPORT_MODEL_PATH</code> - Local GGUF model path
                  override
                </li>
                <li>
                  <code>AI_IMPORT_LLAMA_SERVER_PATH</code> - Local llama-server
                  binary path override
                </li>
                <li>
                  <code>AI_IMPORT_CONTEXT_SIZE</code> - Context window for local
                  extraction
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
