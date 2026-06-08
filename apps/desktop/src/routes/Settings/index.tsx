import { Bot, KeyRound, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  toast,
} from '@repo/ui';
import type { LocalModelStatus } from '../../../electron/preload';

export default function SettingsPage() {
  const [modelStatus, setModelStatus] = useState<LocalModelStatus | null>(null);
  const [isPreparingModel, setIsPreparingModel] = useState(false);

  useEffect(() => {
    window.electronAPI
      .getLocalImportModelStatus()
      .then(setModelStatus)
      .catch(() => undefined);
  }, []);

  const handleOpenServiceDocs = () => {
    toast({
      title: 'Local AI Import',
      description:
        'The app downloads the default Gemma GGUF model automatically. Environment variables are only advanced overrides.',
    });
  };

  const handlePrepareModel = async () => {
    setIsPreparingModel(true);
    try {
      const status = await window.electronAPI.prepareLocalImportModel();
      setModelStatus(status);
      toast({
        title: 'Local model ready',
        description: 'AI Import can now run without sending files off device.',
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
      setIsPreparingModel(false);
    }
  };

  return (
    <div className='h-full overflow-y-auto bg-background'>
      <div className='mx-auto flex max-w-4xl flex-col gap-6 px-10 py-10'>
        <section className='border-b border-border pb-8'>
          <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-clay/25 bg-clay-soft px-3 py-1 text-sm font-semibold text-clay'>
            <ShieldCheck className='h-4 w-4' />
            Runtime Configuration
          </div>
          <h1 className='font-heading text-[48px] font-medium leading-tight tracking-tight text-foreground'>
            Settings
          </h1>
          <p className='mt-3 max-w-2xl text-base text-muted-foreground'>
            Configure your password manager settings.
          </p>
        </section>

        <Card className='rounded-lg border-border bg-card'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Bot className='h-5 w-5 text-clay' />
              Local AI Import
            </CardTitle>
            <CardDescription>
              The AI import service configuration is read from environment
              variables only for advanced overrides. Local llama.cpp import is
              the default provider.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='rounded-lg border border-border bg-surface px-4 py-4'>
              <div className='mb-2 flex items-center gap-2 text-sm font-semibold text-foreground'>
                <KeyRound className='h-4 w-4 text-clay' />
                Environment Variables
              </div>
              <ul className='space-y-2 text-sm text-muted-foreground'>
                <li>
                  <code>AI_IMPORT_PROVIDER</code> - Defaults to local-llama
                </li>
                <li>
                  <code>AI_IMPORT_MODEL_PATH</code> - Local Gemma GGUF model
                  path override
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

            <Button onClick={handleOpenServiceDocs} type='button'>
              How to Configure
            </Button>
          </CardContent>
        </Card>

        <Card className='rounded-lg border-border bg-card'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Bot className='h-5 w-5 text-clay' />
              Local Model
            </CardTitle>
            <CardDescription>
              Gemma GGUF model cache used by the local import workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='rounded-lg border border-border bg-surface px-4 py-4 text-sm'>
              <div className='grid gap-3 md:grid-cols-2'>
                <div>
                  <div className='text-xs font-semibold uppercase text-muted-foreground'>
                    Status
                  </div>
                  <div className='mt-1 text-foreground'>
                    {modelStatus?.exists ? 'Ready' : 'Not downloaded'}
                  </div>
                </div>
                <div>
                  <div className='text-xs font-semibold uppercase text-muted-foreground'>
                    Quant
                  </div>
                  <div className='mt-1 text-foreground'>
                    {modelStatus?.quant ?? 'Q4_K_M'}
                  </div>
                </div>
                <div className='md:col-span-2'>
                  <div className='text-xs font-semibold uppercase text-muted-foreground'>
                    Path
                  </div>
                  <div className='mt-1 break-all text-foreground'>
                    {modelStatus?.path ?? 'Loading...'}
                  </div>
                </div>
                {modelStatus?.sha256 ? (
                  <div className='md:col-span-2'>
                    <div className='text-xs font-semibold uppercase text-muted-foreground'>
                      SHA-256
                    </div>
                    <div className='mt-1 break-all font-mono text-xs text-muted-foreground'>
                      {modelStatus.sha256}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <Button
              disabled={isPreparingModel || modelStatus?.exists}
              onClick={handlePrepareModel}
              type='button'
            >
              {isPreparingModel ? 'Preparing Model' : 'Prepare Local Model'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
