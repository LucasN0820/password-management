import {
  Bot,
  CheckCircle2,
  FileText,
  HardDrive,
  Loader2,
  Save,
  Sparkles,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@repo/ui';
import { useImportStore } from '@/store/importStore';
import { usePasswordStore } from '@/store/passwordStore';
import type { LocalModelLibraryStatus } from '../../../electron/preload';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function OnboardPage() {
  const navigate = useNavigate();
  const {
    stage,
    files,
    candidates,
    warnings,
    fileResults,
    error,
    selectedModelId,
    selectFiles,
    setSelectedModelId,
    runImport,
    updateCandidate,
    removeCandidate,
    saveCandidates,
    reset,
  } = useImportStore();
  const [modelLibrary, setModelLibrary] =
    useState<LocalModelLibraryStatus | null>(null);
  const loadPasswords = usePasswordStore(state => state.loadPasswords);

  const selectedCount = candidates.filter(
    candidate => candidate.selected
  ).length;
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
    if (!success) return;

    toast({
      title: 'Extraction finished',
      description: 'Review the imported credentials before saving them.',
    });
  };

  const handleSave = async () => {
    try {
      const saved = await saveCandidates();
      await loadPasswords();
      toast({
        title: 'Credentials saved',
        description: `${saved} imported entries were added to the vault.`,
      });
      navigate('/password');
    } catch (saveError) {
      toast({
        title: 'Save failed',
        description:
          saveError instanceof Error
            ? saveError.message
            : 'Unable to save imported credentials.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    reset();
    toast({
      title: 'Import canceled',
      description: 'The current onboarding session was discarded.',
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
                AI Onboard MVP
              </div>
              <h1 className='font-heading text-[48px] font-medium leading-tight tracking-tight text-foreground'>
                Import passwords from mixed files and review them before saving.
              </h1>
              <p className='mt-3 max-w-xl text-base text-muted-foreground'>
                Choose password exports or notes. The desktop app parses them
                locally, asks the bundled llama.cpp model to extract likely
                credentials, and lets you fix anything before it reaches the
                database.
              </p>
            </div>
            <div className='hidden min-w-[260px] rounded-lg border border-border bg-card p-5 lg:block'>
              <div className='mb-2 flex items-center gap-2 text-sm font-semibold text-foreground'>
                <Sparkles className='h-4 w-4 text-clay' />
                Supported right now
              </div>
              <p className='text-sm leading-6 text-muted-foreground'>
                CSV, PDF, DOCX, Markdown, and TXT. Image OCR is not enabled for
                the local text provider yet.
              </p>
            </div>
          </div>

          <div className='mt-8 flex flex-wrap gap-3'>
            <Button onClick={handleSelectFiles} variant='outline' disabled={!availableModels.length}>
              <Upload className='h-4 w-4' />
              Choose Files
            </Button>
            <Button
              onClick={handleRunImport}
              disabled={!files.length || stage === 'processing' || !availableModels.length || !activeModelId}
            >
              {stage === 'processing' ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Extracting
                </>
              ) : (
                <>
                  <Sparkles className='h-4 w-4' />
                  Start AI Import
                </>
              )}
            </Button>
            <Button onClick={handleCancel} variant='ghost'>
              <XCircle className='h-4 w-4' />
              Cancel
            </Button>
          </div>

          <div className='mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3'>
            <div className='flex items-center gap-2 text-sm font-semibold text-foreground'>
              <HardDrive className='h-4 w-4 text-clay' />
              Choose model
            </div>
            <Select
              value={activeModelId}
              onValueChange={value => setSelectedModelId(value)}
            >
              <SelectTrigger className='w-[280px]'>
                <SelectValue placeholder='Default local model' />
              </SelectTrigger>
              <SelectContent>
                {
                  availableModels.length ? (
                    availableModels.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.displayName}
                      </SelectItem>
                    ))
                  ) : (
                    <div className='text-sm text-muted-foreground p-2'>No local models available</div>
                  )
                }
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
              <CardTitle>Selected Files</CardTitle>
              <CardDescription>
                Files stay on this device. Only selected text excerpts are sent
                to the local llama.cpp runtime.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3 pt-6'>
              {files.length ? (
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
                            ? `${result.candidateCount} credentials detected`
                            : (result.warning ?? 'Failed to process')}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className='rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground'>
                  No files selected yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className='gap-0 overflow-hidden rounded-lg border-border bg-card'>
            <CardHeader className='border-b border-border/70'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <CardTitle>Review Extracted Credentials</CardTitle>
                  <CardDescription>
                    Edit any field, uncheck entries you do not want, then save
                    the rest.
                  </CardDescription>
                </div>
                <div className='rounded-full bg-surface px-3 py-1 text-sm text-muted-foreground'>
                  {selectedCount} selected
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
                      Parsing files and extracting credentials
                    </div>
                    <div className='mt-1 text-sm text-muted-foreground'>
                      This MVP runs the import workflow locally, then brings
                      back editable results for review.
                    </div>
                  </div>
                </div>
              ) : candidates.length ? (
                <>
                  {warnings.length ? (
                    <div className='rounded-lg border border-clay/25 bg-clay-soft px-4 py-3 text-sm text-clay-dark'>
                      {warnings.join(' · ')}
                    </div>
                  ) : null}

                  <div className='space-y-4'>
                    {candidates.map(candidate => (
                      <div
                        key={candidate.id}
                        className='rounded-lg border border-border bg-background p-5'
                      >
                        <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
                          <label className='flex items-center gap-3 text-sm font-medium text-foreground'>
                            <input
                              checked={candidate.selected}
                              className='h-4 w-4 rounded border-border accent-[var(--clay)]'
                              onChange={event =>
                                updateCandidate(candidate.id, {
                                  selected: event.target.checked,
                                })
                              }
                              type='checkbox'
                            />
                            Save this credential
                          </label>
                          <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                            <span>
                              Confidence{' '}
                              {Math.round(candidate.confidence * 100)}%
                            </span>
                            <Button
                              onClick={() => removeCandidate(candidate.id)}
                              size='icon-xs'
                              type='button'
                              variant='ghost'
                            >
                              <Trash2 className='h-3.5 w-3.5' />
                            </Button>
                          </div>
                        </div>

                        <div className='grid gap-4 md:grid-cols-2'>
                          <div className='space-y-2'>
                            <Label htmlFor={`${candidate.id}-title`}>
                              Title
                            </Label>
                            <Input
                              id={`${candidate.id}-title`}
                              onChange={event =>
                                updateCandidate(candidate.id, {
                                  title: event.target.value,
                                })
                              }
                              value={candidate.title}
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor={`${candidate.id}-url`}>
                              Website
                            </Label>
                            <Input
                              id={`${candidate.id}-url`}
                              onChange={event =>
                                updateCandidate(candidate.id, {
                                  url: event.target.value,
                                })
                              }
                              placeholder='https://example.com'
                              value={candidate.url ?? ''}
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor={`${candidate.id}-username`}>
                              Username / Email
                            </Label>
                            <Input
                              id={`${candidate.id}-username`}
                              onChange={event =>
                                updateCandidate(candidate.id, {
                                  username: event.target.value,
                                })
                              }
                              value={candidate.username}
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor={`${candidate.id}-password`}>
                              Password
                            </Label>
                            <Input
                              id={`${candidate.id}-password`}
                              onChange={event =>
                                updateCandidate(candidate.id, {
                                  password: event.target.value,
                                })
                              }
                              value={candidate.password}
                            />
                          </div>
                          <div className='space-y-2 md:col-span-2'>
                            <Label htmlFor={`${candidate.id}-notes`}>
                              Notes
                            </Label>
                            <textarea
                              className='min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'
                              id={`${candidate.id}-notes`}
                              onChange={event =>
                                updateCandidate(candidate.id, {
                                  notes: event.target.value,
                                })
                              }
                              value={candidate.notes ?? ''}
                            />
                          </div>
                        </div>

                        <div className='mt-4 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground'>
                          <div className='mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-tertiary'>
                            Evidence
                          </div>
                          <div>
                            {candidate.sourceExcerpt ||
                              `Detected from ${candidate.sourceFile}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className='flex flex-wrap justify-end gap-3 border-t border-border pt-4'>
                    <Button
                      onClick={handleCancel}
                      type='button'
                      variant='ghost'
                    >
                      <XCircle className='h-4 w-4' />
                      Cancel
                    </Button>
                    <Button onClick={handleSave} type='button'>
                      <Save className='h-4 w-4' />
                      Save Selected
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
                      Start by choosing files to import
                    </div>
                    <div className='mt-1 text-sm text-muted-foreground'>
                      The imported results will appear here for manual
                      confirmation and edits.
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
