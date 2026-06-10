import type { ImportCandidateDraft } from './types';

export function normalizeCandidates(candidates: ImportCandidateDraft[]) {
  const dedupeMap = new Map<string, ImportCandidateDraft>();

  for (const candidate of candidates) {
    const fingerprint = [
      candidate.title.trim().toLowerCase(),
      candidate.username.trim().toLowerCase(),
      candidate.password.trim(),
      candidate.url?.trim().toLowerCase() ?? '',
    ].join('\x00');
    const key = fingerprint;

    const existing = dedupeMap.get(key);
    if (!existing || existing.confidence < candidate.confidence) {
      dedupeMap.set(key, candidate);
    }
  }

  return Array.from(dedupeMap.values()).sort(
    (left, right) => right.confidence - left.confidence
  );
}
