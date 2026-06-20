import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ImportFileDescriptor } from '@repo/ai-import-core';
import { assertFileSha256 } from '../file-integrity';
import { parseLocalLlamaContent } from '../local-llama-provider';
import {
  MAX_REMOTE_IMPORT_FILE_BYTES,
  runRemoteImportWorkflow,
  validateRemoteImportContent,
  validateRemoteImportDescriptor,
} from '../remote-import-workflow';

const tempDirs: string[] = [];

afterEach(async () => {
  vi.useRealTimers();
  await Promise.all(
    tempDirs.splice(0).map(path => rm(path, { recursive: true }))
  );
});

function descriptor(overrides: Partial<ImportFileDescriptor> = {}) {
  return {
    path: 'notes.txt',
    name: 'private-folder-name.txt',
    extension: '.txt',
    size: 4,
    ...overrides,
  } satisfies ImportFileDescriptor;
}

describe('remote import file validation', () => {
  it('rejects oversized and non-allowlisted file types', () => {
    expect(() =>
      { return validateRemoteImportDescriptor(
        descriptor({ size: MAX_REMOTE_IMPORT_FILE_BYTES + 1 })
      ) }
    ).toThrow('AI_IMPORT_FILE_SIZE_INVALID');
    expect(() =>
      validateRemoteImportDescriptor(descriptor({ extension: '.exe' }))
    ).toThrow('AI_IMPORT_FILE_TYPE_NOT_ALLOWED');
  });

  it('uses an opaque upload name and rejects MIME/content mismatches', () => {
    const metadata = validateRemoteImportDescriptor(descriptor());
    expect(metadata.uploadName).not.toContain('private-folder-name');
    expect(metadata.uploadName).toMatch(/^[0-9a-f-]+\.txt$/);
    expect(() =>
      { validateRemoteImportContent(Buffer.from('not a PDF'), '.pdf'); }
    ).toThrow('AI_IMPORT_FILE_TYPE_NOT_ALLOWED');
  });

  it('interrupts polling at the overall deadline with a public error', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'remote-import-'));
    tempDirs.push(dir);
    const path = join(dir, 'notes.txt');
    await writeFile(path, 'test');
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({ jobId: 'job-1' }, { status: 200 })
      )
      .mockResolvedValue(
        Response.json({ status: 'processing' }, { status: 200 })
      );
    vi.useFakeTimers();
    const promise = runRemoteImportWorkflow({
      files: [descriptor({ path })],
      serviceUrl: 'https://example.test',
      secret: 'secret',
      signal: new AbortController().signal,
      onJobCreated: vi.fn(),
      fetchImpl,
    });
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toMatchObject({
      code: 'AI_IMPORT_TIMEOUT',
    });
  });
});

describe('local AI integrity and response validation', () => {
  it('rejects a SHA256 mismatch', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'model-integrity-'));
    tempDirs.push(dir);
    const path = join(dir, 'model.gguf');
    await writeFile(path, 'tampered');
    await expect(
      assertFileSha256(path, '0'.repeat(64), 'Local AI model')
    ).rejects.toThrow('failed integrity verification');
  });

  it('strictly rejects invalid JSON and unknown candidate fields', () => {
    expect(() => parseLocalLlamaContent('not-json')).toThrow();
    expect(() =>
      { return parseLocalLlamaContent(
        JSON.stringify({
          candidates: [
            {
              title: 'Example',
              username: 'user',
              password: 'secret',
              url: null,
              notes: null,
              confidence: 0.9,
              sourceExcerpt: 'user secret',
              unexpected: true,
            },
          ],
        })
      ) }
    ).toThrow();
  });
});
