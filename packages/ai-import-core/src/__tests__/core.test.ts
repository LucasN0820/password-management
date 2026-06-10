import { describe, expect, it, vi } from 'vitest';
import {
  buildCsvPrefilledCandidates,
  extractJson,
  normalizeCandidates,
  parseCredentialCandidates,
  parsePortableTextFile,
  runImportWorkflow,
  selectRelevantExcerpts,
  type ImportCandidateDraft,
  type ImportFileDescriptor,
} from '../index.js';
import { syntheticCredentialFixtures } from './fixtures.js';

function ids() {
  let id = 0;
  return () => `id-${++id}`;
}

describe('portable import core', () => {
  it('provides 75 CSV/TXT/MD fixtures', () => {
    expect(syntheticCredentialFixtures).toHaveLength(75);
    expect(
      new Set(syntheticCredentialFixtures.map(item => item.extension))
    ).toEqual(new Set(['.csv', '.txt', '.md']));
  });

  it('maps structured CSV fields without invoking a model', () => {
    const createId = ids();
    const file = {
      path: '/fixture.csv',
      name: 'fixture.csv',
      size: 100,
      extension: '.csv',
    };
    const candidates = buildCsvPrefilledCandidates(
      file,
      '标题,账号,密码,网址\nGitHub,user@example.com,p@ss,https://github.com',
      createId
    );
    expect(candidates).toMatchObject([
      {
        title: 'GitHub',
        username: 'user@example.com',
        password: 'p@ss',
        url: 'https://github.com',
      },
    ]);
  });

  it('selects credential-heavy excerpts', () => {
    const text = `${'irrelevant words '.repeat(300)}\nPassword: exact-secret\nUsername: me`;
    expect(selectRelevantExcerpts(text)[0]).toContain('Password: exact-secret');
  });

  it.each([
    '{"candidates":[]}',
    '```json\n{"candidates":[]}\n```',
    'prefix {"candidates":[]} suffix',
  ])('extracts JSON from supported model output: %s', output => {
    expect(JSON.parse(extractJson(output))).toEqual({ candidates: [] });
  });

  it('filters candidates without a password', () => {
    const result = parseCredentialCandidates(
      JSON.stringify({
        candidates: [
          {
            title: 'No secret',
            username: 'user',
            password: '',
            url: null,
            notes: null,
            confidence: 0.8,
            sourceExcerpt: 'Username: user',
          },
        ],
      }),
      'fixture.txt',
      ids()
    );
    expect(result).toEqual([]);
  });

  it('preserves password whitespace and rejects invented evidence', () => {
    const output = JSON.stringify({
      candidates: [
        {
          title: 'Exact',
          username: 'user',
          password: ' secret with spaces ',
          url: null,
          notes: null,
          confidence: 0.9,
          sourceExcerpt: 'Password: exact evidence',
        },
        {
          title: 'Invented',
          username: 'user',
          password: 'wrong',
          url: null,
          notes: null,
          confidence: 0.9,
          sourceExcerpt: 'not in the source',
        },
      ],
    });
    const result = parseCredentialCandidates(output, 'fixture.txt', ids(), [
      'Username: user\nPassword: exact evidence',
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.password).toBe(' secret with spaces ');
  });

  it('deduplicates exact records and keeps the highest confidence', () => {
    const base: ImportCandidateDraft = {
      id: 'low',
      sourceFile: 'a.txt',
      title: 'Example',
      username: 'user',
      password: 'secret',
      url: 'https://example.com',
      notes: null,
      confidence: 0.4,
      sourceExcerpt: 'low',
    };
    expect(
      normalizeCandidates([
        base,
        { ...base, id: 'high', confidence: 0.9, sourceExcerpt: 'high' },
      ])
    ).toMatchObject([{ id: 'high', confidence: 0.9 }]);
  });

  it('isolates a parse failure and continues other files', async () => {
    const files: ImportFileDescriptor[] = [
      { path: '/bad', name: 'bad.txt', size: 1, extension: '.txt' },
      { path: '/good', name: 'good.txt', size: 1, extension: '.txt' },
    ];
    const result = await runImportWorkflow(files, {
      createId: ids(),
      parseFile: async (file, context) => {
        if (file.name === 'bad.txt') throw new Error('broken fixture');
        return parsePortableTextFile(file, 'Password: safe', context.createId);
      },
      extractCandidates: async () => [],
    });
    expect(result.files).toMatchObject([
      { fileName: 'bad.txt', status: 'failed' },
      { fileName: 'good.txt', status: 'processed' },
    ]);
    expect(result.warnings[0]).toContain('broken fixture');
  });

  it('reports workflow phases', async () => {
    const progress = vi.fn();
    const file = { path: '/a', name: 'a.txt', size: 1, extension: '.txt' };
    await runImportWorkflow(
      [file],
      {
        createId: ids(),
        parseFile: async (item, context) =>
          parsePortableTextFile(item, 'Password: safe', context.createId),
        extractCandidates: async () => [],
      },
      { onProgress: progress }
    );
    expect(progress.mock.calls.map(call => call[0].phase)).toEqual([
      'parsing',
      'extracting',
      'normalizing',
      'completed',
    ]);
  });

  it('honors cancellation before parsing', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      runImportWorkflow(
        [{ path: '/a', name: 'a.txt', size: 1, extension: '.txt' }],
        {
          createId: ids(),
          parseFile: vi.fn(),
          extractCandidates: vi.fn(),
        },
        { signal: controller.signal }
      )
    ).rejects.toThrow('Import cancelled');
  });
});
