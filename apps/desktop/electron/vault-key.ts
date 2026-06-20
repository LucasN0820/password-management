import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { app, safeStorage } from 'electron';

const vaultKeyFileName = 'vault-key.json';
const vaultKeyStorageVersion = 1;
const vaultKeyBytes = 32;
const integrityContext = 'password-volt/vault-key-integrity/v1';

interface StoredVaultKeyV1 {
  version: typeof vaultKeyStorageVersion;
  encrypted: true;
  vaultKey: string;
  integrityKey: string;
  hmac: string;
}

interface LegacyStoredVaultKey {
  vaultKey: string;
  encrypted: boolean;
}

// Error subclasses let startup code present a specific secure-storage failure.
// eslint-disable-next-line no-restricted-syntax/noClasses
export class SecureStorageUnavailableError extends Error {
  constructor() {
    super(
      'Secure storage is unavailable. Unlock your operating system keychain and restart Password Vault.'
    );
    this.name = 'SecureStorageUnavailableError';
  }
}

function getVaultKeyPath() {
  return join(app.getPath('userData'), vaultKeyFileName);
}

function requireSecureStorage() {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new SecureStorageUnavailableError();
  }
}

function readStoredVaultKey(): unknown {
  const path = getVaultKeyPath();
  if (!existsSync(path)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(path, 'utf8')) as unknown;
  } catch {
    throw new Error('The vault key file is invalid or corrupted');
  }
}

function writeStoredVaultKey(settings: StoredVaultKeyV1) {
  const path = getVaultKeyPath();
  const directory = dirname(path);
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  const temporaryPath = `${path}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify(settings, null, 2), {
    encoding: 'utf8',
    mode: 0o600,
  });
  renameSync(temporaryPath, path);
}

function deriveIntegrityKey(material: Buffer) {
  return createHash('sha256')
    .update(integrityContext, 'utf8')
    .update(material)
    .digest();
}

function integrityPayload(stored: Omit<StoredVaultKeyV1, 'hmac'>) {
  return JSON.stringify([
    stored.version,
    stored.encrypted,
    stored.vaultKey,
    stored.integrityKey,
  ]);
}

function calculateHmac(
  stored: Omit<StoredVaultKeyV1, 'hmac'>,
  integrityKey: Buffer
) {
  return createHmac('sha256', integrityKey)
    .update(integrityPayload(stored), 'utf8')
    .digest('base64');
}

function decodeBase64(value: string) {
  if (
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(
      value
    )
  ) {
    throw new Error('invalid base64');
  }
  const decoded = Buffer.from(value, 'base64');
  if (decoded.toString('base64') !== value) {
    throw new Error('non-canonical base64');
  }
  return decoded;
}

function persistVaultKey(vaultKey: string) {
  const integrityMaterial = randomBytes(vaultKeyBytes);
  const integrityKey = deriveIntegrityKey(integrityMaterial);
  try {
    const withoutHmac = {
      version: vaultKeyStorageVersion,
      encrypted: true,
      vaultKey: safeStorage.encryptString(vaultKey).toString('base64'),
      integrityKey: safeStorage
        .encryptString(integrityMaterial.toString('base64'))
        .toString('base64'),
    } satisfies Omit<StoredVaultKeyV1, 'hmac'>;

    writeStoredVaultKey({
      ...withoutHmac,
      hmac: calculateHmac(withoutHmac, integrityKey),
    });
  } finally {
    integrityMaterial.fill(0);
    integrityKey.fill(0);
  }
}

function createDesktopVaultKey() {
  requireSecureStorage();
  const vaultKey = randomBytes(vaultKeyBytes).toString('hex');
  persistVaultKey(vaultKey);
  return vaultKey;
}

function isLegacyStoredVaultKey(value: unknown): value is LegacyStoredVaultKey {
  if (!value || typeof value !== 'object') {return false;}
  const candidate = value as Partial<LegacyStoredVaultKey>;
  return (
    typeof candidate.vaultKey === 'string' &&
    typeof candidate.encrypted === 'boolean' &&
    !('version' in value)
  );
}

function parseStoredVaultKeyV1(value: unknown): StoredVaultKeyV1 {
  if (!value || typeof value !== 'object') {
    throw new Error('The vault key file is invalid or corrupted');
  }

  const candidate = value as Partial<StoredVaultKeyV1>;
  if (candidate.version !== vaultKeyStorageVersion) {
    throw new Error(
      `Unsupported vault key version: ${String(candidate.version)}`
    );
  }
  if (
    candidate.encrypted !== true ||
    typeof candidate.vaultKey !== 'string' ||
    typeof candidate.integrityKey !== 'string' ||
    typeof candidate.hmac !== 'string'
  ) {
    throw new Error('The vault key file is invalid or corrupted');
  }
  return candidate as StoredVaultKeyV1;
}

function readVerifiedVaultKey(stored: StoredVaultKeyV1) {
  let integrityMaterial: Buffer | undefined;
  let integrityKey: Buffer | undefined;
  try {
    const materialBase64 = safeStorage.decryptString(
      decodeBase64(stored.integrityKey)
    );
    integrityMaterial = decodeBase64(materialBase64);
    if (integrityMaterial.length !== vaultKeyBytes) {
      throw new Error('invalid integrity material');
    }
    integrityKey = deriveIntegrityKey(integrityMaterial);

    const expected = decodeBase64(calculateHmac(stored, integrityKey));
    const actual = decodeBase64(stored.hmac);
    if (
      actual.length !== expected.length ||
      !timingSafeEqual(actual, expected)
    ) {
      throw new Error('integrity mismatch');
    }
  } catch {
    throw new Error('Vault key integrity verification failed');
  } finally {
    integrityMaterial?.fill(0);
    integrityKey?.fill(0);
  }

  // Decrypt only after the envelope has passed its integrity check.
  const vaultKey = safeStorage.decryptString(decodeBase64(stored.vaultKey));
  if (!/^[0-9a-f]{64}$/u.test(vaultKey)) {
    throw new Error('The decrypted vault key is invalid');
  }
  return vaultKey;
}

function migrateLegacyVaultKey(stored: LegacyStoredVaultKey) {
  if (!stored.encrypted) {
    throw new Error('Vault key is not stored securely');
  }

  const vaultKey = safeStorage.decryptString(decodeBase64(stored.vaultKey));
  if (!/^[0-9a-f]{64}$/u.test(vaultKey)) {
    throw new Error('The decrypted vault key is invalid');
  }
  persistVaultKey(vaultKey);
  return vaultKey;
}

export function getOrCreateDesktopVaultKey() {
  requireSecureStorage();
  const stored = readStoredVaultKey();
  if (!stored) {
    return createDesktopVaultKey();
  }

  if (isLegacyStoredVaultKey(stored)) {
    return migrateLegacyVaultKey(stored);
  }
  return readVerifiedVaultKey(parseStoredVaultKeyV1(stored));
}
