import {
  Bot,
  CheckCircle2,
  FileText,
  HardDrive,
  Loader2,
  Save,
  Sparkles,
  Upload,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '@repo/i18n';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@repo/ui';
import { formatBytes } from '@/lib/format';
import { useImportStore } from '@/store/importStore';
import { usePasswordStore } from '@/store/passwordStore';
import type { LocalModelLibraryStatus } from '../../../electron/preload';
import { CandidateList } from './candidate-list';

export default function OnboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    stage,
    files,
    warnings,
    fileResults,
    error,
    selectedModelId,
    selectFiles,
    setSelectedModelId,
    runImport,
    saveCandidates,
    reset,
  } = useImportStore(
    useShallow(state => {
      return {
        stage: state.stage,
        files: state.files,
        warnings: state.warnings,
        fileResults: state.fileResults,
        error: state.error,
        selectedModelId: state.selectedModelId,
        selectFiles: state.selectFiles,
        setSelectedModelId: state.setSelectedModelId,
        runImport: state.runImport,
        saveCandidates: state.saveCandidates,
        reset: state.reset,
      };
    })
  );
  const candidateIds = useImportStore(
    useShallow(state => state.candidates.map(candidate => candidate.id))
  );
  const selectedCount = useImportStore(
    state => state.candidates.filter(candidate => candidate.selected).length
  );
  const [modelLibrary, setModelLibrary] =
    useState<LocalModelLibraryStatus | null>(null);
  const loadPasswords = usePasswordStore(state => state.loadPasswords);

  const availableModels = useMemo(
    () => modelLibrary?.models.filter(model => model.exists) ?? [],
    [modelLibrary]
  );
  const activeModelId =
    selectedModelId ?? modelLibrary?.defaultModelId ?? availableModels[0]?.id;

  useEffect(() => {
    window.electronAPI
      .getLocalImportModelLibraryStatus()
      .then(status => {
        setModelLibrary(status);
        if (!selectedModelId) {
          setSelectedModelId(status.defaultModelId);
        }
      })
      .catch(() => undefined);
  }, [selectedModelId, setSelectedModelId]);

  const handleSelectFiles = async () => {
    await selectFiles();
  };

  const handleRunImport = async () => {
    const success = await runImport();
    if (!success) {
      return;
    }

    toast({
      title: t('aiImport.extractionFinished'),
      description: t('aiImport.extractionFinishedHint'),
    });
  };

  const handleSave = async () => {
    try {
      const saved = await saveCandidates();
      await loadPasswords();
      toast({
        title: t('aiImport.credentialsSaved'),
        description: t('aiImport.credentialsSavedHint', { count: saved }),
      });
      navigate('/password');
    } catch {
      toast({
        title: t('aiImport.saveFailed'),
        description: t('aiImport.saveFailedHint'),
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    reset();
    toast({
      title: t('aiImport.importCanceled'),
      description: t('aiImport.importCanceledHint'),
    });
  };

  return (
    <div className='h-full overflow-y-auto bg-background'>
      <div className='mx-auto flex max-w-6xl flex-col gap-6 px-10 py-10'>
        <section className='border-b border-border pb-8'>
          <div className='flex items-start justify-between gap-8'>
            <div className='max-w-2xl'>
              <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-clay/25 bg-clay-soft px-3 py-1 text-sm font-semibold text-clay'>
                <Bot className='h-4 w-4' />
                {t('aiImport.onboardEyebrow')}
              </div>
              <h1 className='font-heading text-[48px] font-medium leading-tight tracking-tight text-foreground'>
                {t('aiImport.onboardTitle')}
              </h1>
              <p className='mt-3 max-w-xl text-base text-muted-foreground'>
                {t('aiImport.onboardDescription')}
              </p>
            </div>
            <div className='hidden min-w-[260px] rounded-lg border border-border bg-card p-5 lg:block'>
              <div className='mb-2 flex items-center gap-2 text-sm font-semibold text-foreground'>
                <Sparkles className='h-4 w-4 text-clay' />
                {t('aiImport.supportedTitle')}
              </div>
              <p className='text-sm leading-6 text-muted-foreground'>
                {t('aiImport.supportedDescription')}
              </p>
            </div>
          </div>

          <div className='mt-8 flex flex-wrap gap-3'>
            <Button
              variant='outline'
              disabled={availableModels.length === 0}
              onClick={handleSelectFiles}
            >
              <Upload className='h-4 w-4' />
              {t('aiImport.chooseFiles')}
            </Button>
            <Button
              disabled={
                files.length === 0 ||
                stage === 'processing' ||
                availableModels.length === 0 ||
                !activeModelId
              }
              onClick={handleRunImport}
            >
              {stage === 'processing' ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  {t('aiImport.extracting')}
                </>
              ) : (
                <>
                  <Sparkles className='h-4 w-4' />
                  {t('aiImport.startImport')}
                </>
              )}
            </Button>
            <Button variant='ghost' onClick={handleCancel}>
              <XCircle className='h-4 w-4' />
              {t('aiImport.cancel')}
            </Button>
          </div>

          <div className='mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3'>
            <div className='flex items-center gap-2 text-sm font-semibold text-foreground'>
              <HardDrive className='h-4 w-4 text-clay' />
              {t('aiImport.chooseModel')}
            </div>
            <Select
              value={activeModelId}
              onValueChange={value => {
                setSelectedModelId(value);
              }}
            >
              <SelectTrigger className='w-[280px]'>
                <SelectValue placeholder={t('aiImport.defaultModel')} />
              </SelectTrigger>
              <SelectContent>
                {availableModels.length > 0 ? (
                  availableModels.map(model => {
                    return (
                      <SelectItem key={model.id} value={model.id}>
                        {model.displayName}
                      </SelectItem>
                    );
                  })
                ) : (
                  <div className='text-sm text-muted-foreground p-2'>
                    {t('aiImport.noLocalModels')}
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <div className='mt-4 rounded-lg border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive'>
              {error}
            </div>
          ) : null}
        </section>

        <section className='grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]'>
          <Card className='gap-0 overflow-hidden rounded-lg border-border bg-card'>
            <CardHeader className='border-b border-border/70'>
              <CardTitle>{t('aiImport.selectedFiles')}</CardTitle>
              <CardDescription>
                {t('aiImport.selectedFilesHint')}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3 pt-6'>
              {files.length > 0 ? (
                files.map(file => {
                  const result = fileResults.find(
                    item => item.fileName === file.name
                  );
                  return (
                    <div
                      key={file.path}
                      className='rounded-lg border border-border bg-background p-4'
                    >
                      <div className='flex items-start justify-between gap-3'>
                        <div className='min-w-0'>
                          <div className='truncate text-sm font-semibold text-foreground'>
                            {file.name}
                          </div>
                          <div className='mt-1 text-xs text-muted-foreground'>
                            {file.extension} · {formatBytes(file.size)}
                          </div>
                        </div>
                        {result?.status === 'processed' ? (
                          <CheckCircle2 className='h-4 w-4 shrink-0 text-clay' />
                        ) : result?.status === 'failed' ? (
                          <XCircle className='h-4 w-4 shrink-0 text-destructive' />
                        ) : (
                          <FileText className='h-4 w-4 shrink-0 text-muted-foreground' />
                        )}
                      </div>
                      {result ? (
                        <div className='mt-3 text-xs text-muted-foreground'>
                          {result.status === 'processed'
                            ? t('aiImport.credentialsDetected', {
                                count: result.candidateCount,
                              })
                            : t('aiImport.fileProcessingFailed')}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className='rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground'>
                  {t('aiImport.noFilesSelected')}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className='gap-0 overflow-hidden rounded-lg border-border bg-card'>
            <CardHeader className='border-b border-border/70'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <CardTitle>{t('aiImport.reviewExtractedTitle')}</CardTitle>
                  <CardDescription>
                    {t('aiImport.reviewExtractedHint')}
                  </CardDescription>
                </div>
                <div className='rounded-full bg-surface px-3 py-1 text-sm text-muted-foreground'>
                  {t('aiImport.selectedCount', { count: selectedCount })}
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-4 pt-6'>
              {stage === 'processing' ? (
                <div className='flex min-h-[360px] flex-col items-center justify-center gap-4 text-center'>
                  <div className='flex h-16 w-16 items-center justify-center rounded-full bg-surface'>
                    <Loader2 className='h-7 w-7 animate-spin text-clay' />
                  </div>
                  <div>
                    <div className='text-base font-semibold text-foreground'>
                      {t('aiImport.processingTitle')}
                    </div>
                    <div className='mt-1 text-sm text-muted-foreground'>
                      {t('aiImport.processingHint')}
                    </div>
                  </div>
                </div>
              ) : candidateIds.length > 0 ? (
                <>
                  {warnings.length > 0 ? (
                    <div className='rounded-lg border border-clay/25 bg-clay-soft px-4 py-3 text-sm text-clay-dark'>
                      {warnings.join(' · ')}
                    </div>
                  ) : null}

                  <CandidateList candidateIds={candidateIds} />

                  <div className='flex flex-wrap justify-end gap-3 border-t border-border pt-4'>
                    <Button
                      type='button'
                      variant='ghost'
                      onClick={handleCancel}
                    >
                      <XCircle className='h-4 w-4' />
                      {t('aiImport.cancel')}
                    </Button>
                    <Button type='button' onClick={handleSave}>
                      <Save className='h-4 w-4' />
                      {t('aiImport.saveSelectedDesktop')}
                    </Button>
                  </div>
                </>
              ) : (
                <div className='flex min-h-[360px] flex-col items-center justify-center gap-4 text-center'>
                  <div className='flex h-16 w-16 items-center justify-center rounded-full bg-surface'>
                    <Upload className='h-7 w-7 text-muted-foreground' />
                  </div>
                  <div>
                    <div className='text-base font-semibold text-foreground'>
                      {t('aiImport.emptyTitle')}
                    </div>
                    <div className='mt-1 text-sm text-muted-foreground'>
                      {t('aiImport.emptyHint')}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
