import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getOrCreateDesktopVaultKey,
  SecureStorageUnavailableError,
} from '../vault-key';

const electronMock = vi.hoisted(() => { return {
  encryptionAvailable: true,
  userDataPath: '',
  decryptCalls: [] as string[],
} });

vi.mock('electron', () => { return {
  app: {
    getPath: () => electronMock.userDataPath,
  },
  safeStorage: {
    isEncryptionAvailable: () => electronMock.encryptionAvailable,
    encryptString: (value: string) => Buffer.from(`protected:${value}`, 'utf8'),
    decryptString: (value: Buffer) => {
      const encoded = value.toString('utf8');
      electronMock.decryptCalls.push(encoded);
      if (!encoded.startsWith('protected:'))
        {throw new Error('invalid ciphertext');}
      return encoded.slice('protected:'.length);
    },
  },
} });

function getStoredVaultKey() {
  return JSON.parse(
    readFileSync(join(electronMock.userDataPath, 'vault-key.json'), 'utf8')
  ) as Record<string, unknown>;
}

function writeStoredVaultKey(stored: Record<string, unknown>) {
  writeFileSync(
    join(electronMock.userDataPath, 'vault-key.json'),
    JSON.stringify(stored),
    'utf8'
  );
}

describe('desktop vault key storage', () => {
  beforeEach(() => {
    electronMock.userDataPath = mkdtempSync(join(tmpdir(), 'vault-key-test-'));
    electronMock.encryptionAvailable = true;
    electronMock.decryptCalls = [];
  });

  afterEach(() => {
    rmSync(electronMock.userDataPath, { recursive: true, force: true });
  });

  it('creates a versioned envelope and reads the same key on restart', () => {
    const first = getOrCreateDesktopVaultKey();
    const stored = getStoredVaultKey();

    expect(first).toMatch(/^[0-9a-f]{64}$/u);
    expect(stored).toMatchObject({
      version: 1,
      encrypted: true,
    });
    expect(stored.hmac).toEqual(expect.any(String));
    expect(stored.integrityKey).toEqual(expect.any(String));
    expect(JSON.stringify(stored)).not.toContain(first);
    expect(getOrCreateDesktopVaultKey()).toBe(first);
  });

  it.each(['vaultKey', 'hmac'] as const)(
    'rejects a tampered %s before decrypting the vault key',
    field => {
      getOrCreateDesktopVaultKey();
      const stored = getStoredVaultKey();
      stored[field] = `${String(stored[field])}tampered`;
      writeStoredVaultKey(stored);
      electronMock.decryptCalls = [];

      expect(() => getOrCreateDesktopVaultKey()).toThrow(
        'Vault key integrity verification failed'
      );
      expect(electronMock.decryptCalls).toHaveLength(1);
    }
  );

  it('rejects unsupported storage versions explicitly', () => {
    getOrCreateDesktopVaultKey();
    const stored = getStoredVaultKey();
    stored.version = 99;
    writeStoredVaultKey(stored);

    expect(() => getOrCreateDesktopVaultKey()).toThrow(
      'Unsupported vault key version: 99'
    );
  });

  it('uses a readable, typed failure when secure storage is unavailable', () => {
    electronMock.encryptionAvailable = false;

    expect(() => getOrCreateDesktopVaultKey()).toThrow(
      SecureStorageUnavailableError
    );
    expect(() => getOrCreateDesktopVaultKey()).toThrow(
      'Unlock your operating system keychain'
    );
  });

  it('migrates an encrypted legacy key without changing it', () => {
    const legacyKey = 'ab'.repeat(32);
    writeStoredVaultKey({
      encrypted: true,
      vaultKey: Buffer.from(`protected:${legacyKey}`).toString('base64'),
    });

    expect(getOrCreateDesktopVaultKey()).toBe(legacyKey);
    expect(getStoredVaultKey()).toMatchObject({ version: 1, encrypted: true });
  });
});
