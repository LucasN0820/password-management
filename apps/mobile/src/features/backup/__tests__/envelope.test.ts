import { createHash, randomBytes as nodeRandomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  buildBackupPayload,
  createEncryptedBackup,
  decryptBackup,
  deriveBackupKey,
} from '../envelope';
import type { BackupEntry } from '../types';

const sha256Hex = (input: string) =>
  Promise.resolve(createHash('sha256').update(input, 'utf8').digest('hex'));

const randomHex = (byteCount: number) =>
  Promise.resolve(nodeRandomBytes(byteCount).toString('hex'));

const randomBytes = (length: number) =>
  Uint8Array.from(nodeRandomBytes(length));

const deps = { sha256Hex, randomHex, randomBytes };

function entry(overrides: Partial<BackupEntry> = {}): BackupEntry {
  return {
    title: 'GitHub',
    username: 'octocat',
    password: 'hunter2',
    url: 'https://github.com',
    notes: 'a secret note',
    category: 'all',
    isFavorite: true,
    icon: null,
    ...overrides,
  };
}

// Keep iterations tiny so tests stay fast; the KDF logic is identical.
const ITERATIONS = 64;

describe('deriveBackupKey', () => {
  it('produces a deterministic 32-byte (64 hex) key for the same inputs', async () => {
    const a = await deriveBackupKey('pw', 'abcd', ITERATIONS, sha256Hex);
    const b = await deriveBackupKey('pw', 'abcd', ITERATIONS, sha256Hex);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('changes with salt and passphrase', async () => {
    const base = await deriveBackupKey('pw', 'abcd', ITERATIONS, sha256Hex);
    expect(await deriveBackupKey('pw', 'efgh', ITERATIONS, sha256Hex)).not.toBe(
      base
    );
    expect(await deriveBackupKey('pw2', 'abcd', ITERATIONS, sha256Hex)).not.toBe(
      base
    );
  });
});

describe('encrypted backup round-trip', () => {
  it('decrypts back to the original payload with the right passphrase', async () => {
    const payload = buildBackupPayload([entry(), entry({ title: 'GitLab' })], '2026-06-18T00:00:00Z');
    const file = await createEncryptedBackup(payload, 'correct horse', deps, ITERATIONS);
    const restored = await decryptBackup(file, 'correct horse', sha256Hex);
    expect(restored.entries).toHaveLength(2);
    expect(restored.entries[0]).toEqual(entry());
    expect(restored.exportedAt).toBe('2026-06-18T00:00:00Z');
  });

  it('rejects a wrong passphrase', async () => {
    const payload = buildBackupPayload([entry()], '2026-06-18T00:00:00Z');
    const file = await createEncryptedBackup(payload, 'right', deps, ITERATIONS);
    await expect(decryptBackup(file, 'wrong', sha256Hex)).rejects.toThrow(
      'BAD_PASSPHRASE'
    );
  });

  it('rejects a non-backup file', async () => {
    await expect(
      decryptBackup('{"hello":"world"}', 'pw', sha256Hex)
    ).rejects.toThrow('NOT_A_BACKUP');
    await expect(decryptBackup('not json', 'pw', sha256Hex)).rejects.toThrow(
      'NOT_A_BACKUP'
    );
  });

  it('requires a passphrase to export', async () => {
    const payload = buildBackupPayload([entry()], '2026-06-18T00:00:00Z');
    await expect(
      createEncryptedBackup(payload, '', deps, ITERATIONS)
    ).rejects.toThrow(/passphrase/i);
  });
});
