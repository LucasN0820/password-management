import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getServiceEnvConfig } from '../settings';

const electronMock = vi.hoisted(() => { return {
  encryptionAvailable: true,
  resourcesPath: '',
  userDataPath: '',
} });

vi.mock('electron', () => { return {
  app: {
    get isPackaged() {
      return true;
    },
    getAppPath: () => electronMock.resourcesPath,
    getPath: () => electronMock.userDataPath,
  },
  safeStorage: {
    isEncryptionAvailable: () => electronMock.encryptionAvailable,
    encryptString: (value: string) => Buffer.from(`protected:${value}`, 'utf8'),
    decryptString: (value: Buffer) => {
      const encoded = value.toString('utf8');
      if (!encoded.startsWith('protected:'))
        {throw new Error('invalid ciphertext');}
      return encoded.slice('protected:'.length);
    },
  },
} });

describe('AI import service secret storage', () => {
  beforeEach(() => {
    electronMock.userDataPath = mkdtempSync(join(tmpdir(), 'settings-user-'));
    electronMock.resourcesPath = mkdtempSync(
      join(tmpdir(), 'settings-resources-')
    );
    electronMock.encryptionAvailable = true;
    Object.assign(process, { resourcesPath: electronMock.resourcesPath });
    // eslint-disable-next-line no-restricted-syntax/noDeleteOperator -- Tests must restore genuine env absence.
    delete process.env.AI_IMPORT_SERVICE_SECRET;
    // eslint-disable-next-line no-restricted-syntax/noDeleteOperator -- Tests must restore genuine env absence.
    delete process.env.AI_IMPORT_SERVICE_URL;
    writeFileSync(
      join(electronMock.resourcesPath, 'desktop-env.json'),
      JSON.stringify({ AI_IMPORT_SERVICE_URL: 'https://service.example.test' }),
      'utf8'
    );
  });

  afterEach(() => {
    // eslint-disable-next-line no-restricted-syntax/noDeleteOperator -- Tests must restore genuine env absence.
    delete process.env.AI_IMPORT_SERVICE_SECRET;
    // eslint-disable-next-line no-restricted-syntax/noDeleteOperator -- Tests must restore genuine env absence.
    delete process.env.AI_IMPORT_SERVICE_URL;
    rmSync(electronMock.userDataPath, { recursive: true, force: true });
    rmSync(electronMock.resourcesPath, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('encrypts an environment seed immediately and decrypts it when read again', () => {
    process.env.AI_IMPORT_SERVICE_SECRET = 'super-secret-value';

    expect(getServiceEnvConfig()).toEqual({
      url: 'https://service.example.test',
      secret: 'super-secret-value',
    });
    expect(process.env.AI_IMPORT_SERVICE_SECRET).toBeUndefined();

    const storedText = readFileSync(
      join(electronMock.userDataPath, 'ai-import-service-secret.json'),
      'utf8'
    );
    expect(storedText).not.toContain('super-secret-value');
    expect(JSON.parse(storedText)).toMatchObject({ version: 1 });
    expect(getServiceEnvConfig().secret).toBe('super-secret-value');
  });

  it('ignores a legacy plaintext secret in packaged desktop-env.json', () => {
    writeFileSync(
      join(electronMock.resourcesPath, 'desktop-env.json'),
      JSON.stringify({
        AI_IMPORT_SERVICE_URL: 'https://service.example.test',
        AI_IMPORT_SERVICE_SECRET: 'must-not-load',
      }),
      'utf8'
    );

    expect(getServiceEnvConfig().secret).toBeUndefined();
  });

  it('blocks secret use safely when OS secure storage is unavailable', () => {
    process.env.AI_IMPORT_SERVICE_SECRET = 'never-log-this';
    electronMock.encryptionAvailable = false;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(getServiceEnvConfig().secret).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      'AI import service credentials are unavailable because secure storage is locked.'
    );
    expect(JSON.stringify(warn.mock.calls)).not.toContain('never-log-this');
    expect(JSON.stringify(warn.mock.calls)).not.toContain(
      'https://service.example.test'
    );
  });

  it('does not leak a corrupt ciphertext or service URL in warnings', () => {
    mkdirSync(electronMock.userDataPath, { recursive: true });
    writeFileSync(
      join(electronMock.userDataPath, 'ai-import-service-secret.json'),
      JSON.stringify({ version: 1, encryptedSecret: 'not-ciphertext' }),
      'utf8'
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(getServiceEnvConfig().secret).toBeUndefined();
    const warnings = JSON.stringify(warn.mock.calls);
    expect(warnings).not.toContain('not-ciphertext');
    expect(warnings).not.toContain('https://service.example.test');
  });
});
