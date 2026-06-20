import { Trash2 } from 'lucide-react';
import { memo, useDeferredValue, useRef } from 'react';
import { useTranslation } from '@repo/i18n';
import { Button, Input, Label } from '@repo/ui';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  CANDIDATE_LIST_VIRTUALIZATION_THRESHOLD,
  shouldVirtualizeList,
} from '@/lib/virtualization';
import { useImportStore } from '@/store/importStore';

const CANDIDATE_ROW_ESTIMATE_PX = 500;

interface CandidateEditorProps {
  candidateId: string;
}

const CandidateEditor = memo(({ candidateId }: CandidateEditorProps) => {
  const { t } = useTranslation();
  const candidate = useImportStore(state =>
    state.candidates.find(item => item.id === candidateId)
  );
  const updateCandidate = useImportStore(state => state.updateCandidate);
  const removeCandidate = useImportStore(state => state.removeCandidate);

  if (!candidate) {
    return null;
  }

  return (
    <div className='rounded-lg border border-border bg-background p-5'>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
        <label className='flex items-center gap-3 text-sm font-medium text-foreground'>
          <input
            checked={candidate.selected}
            className='h-4 w-4 rounded border-border accent-[var(--clay)]'
            type='checkbox'
            onChange={event => {
              updateCandidate(candidate.id, {
                selected: event.target.checked,
              });
            }}
          />
          {t('aiImport.saveCredential')}
        </label>
        <div className='flex items-center gap-3 text-xs text-muted-foreground'>
          <span>
            {t('aiImport.confidence', {
              value: Math.round(candidate.confidence * 100),
            })}
          </span>
          <Button
            size='icon-xs'
            type='button'
            variant='ghost'
            aria-label={t('aiImport.removeCredential', {
              title: candidate.title || t('aiImport.credential'),
            })}
            onClick={() => {
              removeCandidate(candidate.id);
            }}
          >
            <Trash2 className='h-3.5 w-3.5' />
          </Button>
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor={`${candidate.id}-title`}>
            {t('aiImport.fields.title')}
          </Label>
          <Input
            id={`${candidate.id}-title`}
            value={candidate.title}
            onChange={event => {
              updateCandidate(candidate.id, { title: event.target.value });
            }}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor={`${candidate.id}-url`}>
            {t('aiImport.fields.url')}
          </Label>
          <Input
            id={`${candidate.id}-url`}
            placeholder={t('aiImport.urlPlaceholder')}
            value={candidate.url ?? ''}
            onChange={event => {
              updateCandidate(candidate.id, { url: event.target.value });
            }}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor={`${candidate.id}-username`}>
            {t('aiImport.usernameEmail')}
          </Label>
          <Input
            id={`${candidate.id}-username`}
            value={candidate.username}
            onChange={event => {
              updateCandidate(candidate.id, { username: event.target.value });
            }}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor={`${candidate.id}-password`}>
            {t('aiImport.fields.password')}
          </Label>
          <Input
            id={`${candidate.id}-password`}
            value={candidate.password}
            onChange={event => {
              updateCandidate(candidate.id, { password: event.target.value });
            }}
          />
        </div>
        <div className='space-y-2 md:col-span-2'>
          <Label htmlFor={`${candidate.id}-notes`}>
            {t('aiImport.fields.notes')}
          </Label>
          <textarea
            className='min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'
            id={`${candidate.id}-notes`}
            value={candidate.notes ?? ''}
            onChange={event => {
              updateCandidate(candidate.id, { notes: event.target.value });
            }}
          />
        </div>
      </div>

      <div className='mt-4 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground'>
        <div className='mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-tertiary'>
          {t('aiImport.evidence')}
        </div>
        <div>
          {candidate.sourceExcerpt ||
            t('aiImport.detectedFrom', { file: candidate.sourceFile })}
        </div>
      </div>
    </div>
  );
});
CandidateEditor.displayName = 'CandidateEditor';

interface CandidateListProps {
  candidateIds: string[];
}

export const CandidateList = memo(({ candidateIds }: CandidateListProps) => {
  const { t } = useTranslation();
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const deferredCandidateIds = useDeferredValue(candidateIds);
  const shouldVirtualize = shouldVirtualizeList(
    candidateIds.length,
    CANDIDATE_LIST_VIRTUALIZATION_THRESHOLD
  );
  const renderedIds = shouldVirtualize ? deferredCandidateIds : candidateIds;
  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? renderedIds.length : 0,
    estimateSize: () => CANDIDATE_ROW_ESTIMATE_PX,
    getScrollElement: () => scrollElementRef.current,
    getItemKey: index => renderedIds[index] ?? index,
    overscan: 2,
  });

  if (!shouldVirtualize) {
    return (
      <div className='space-y-4'>
        {renderedIds.map(candidateId => (
          <CandidateEditor key={candidateId} candidateId={candidateId} />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={scrollElementRef}
      aria-label={t('aiImport.candidatesRegion')}
      className='max-h-[720px] overflow-y-auto overscroll-contain rounded-lg pr-2'
      role='region'
    >
      <div
        className='relative w-full'
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => {
          const candidateId = renderedIds[virtualRow.index];
          if (!candidateId) {
            return null;
          }

          return (
            <div
              key={candidateId}
              ref={virtualizer.measureElement}
              className='absolute left-0 top-0 w-full pb-4'
              data-index={virtualRow.index}
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              <CandidateEditor candidateId={candidateId} />
            </div>
          );
        })}
      </div>
    </div>
  );
});
CandidateList.displayName = 'CandidateList';
