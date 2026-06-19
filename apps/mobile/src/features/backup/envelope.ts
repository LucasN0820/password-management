import { decryptSecret, encryptSecret } from '@repo/db';
import {
  BACKUP_FORMAT_VERSION,
  BACKUP_MAGIC,
  type BackupEntry,
  type BackupPayload,
  type EncryptedBackupFile,
} from './types';

/** Default KDF rounds. Tuned to stay responsive on-device while still adding
 * meaningful work over a single hash. SHA-256 yields a 32-byte key directly. */
export const DEFAULT_KDF_ITERATIONS = 100_000;

const SALT_BYTES = 16;

/**
 * Hashes a UTF-8 string and returns a 64-char lowercase hex SHA-256 digest.
 * Injected so the pure logic stays free of native modules.
 */
export type Sha256Hex = (input: string) => Promise<string>;

export type RandomHex = (byteCount: number) => Promise<string>;

/**
 * Derive a 32-byte (64 hex char) AES key from a passphrase using salted,
 * iterated SHA-256.
 *
 * This is a deliberately simple, dependency-light KDF: Expo ships no PBKDF2 /
 * scrypt primitive, so we stretch the passphrase with `iterations` rounds of
 * SHA-256 over `salt || passphrase || previousDigest`. SHA-256's 32-byte output
 * matches the AES-256 key size exactly, so no extra expansion is needed. The
 * salt defends against precomputation; the iteration count raises brute-force
 * cost. This is weaker than memory-hard scrypt but adequate for a
 * user-chosen-passphrase local backup file.
 */
export async function deriveBackupKey(
  passphrase: string,
  saltHex: string,
  iterations: number,
  sha256Hex: Sha256Hex
): Promise<string> {
  const rounds = Math.max(1, iterations);
  let digest = await sha256Hex(`${saltHex}:${passphrase}`);
  for (let i = 1; i < rounds; i = i + 1) {
     
    digest = await sha256Hex(`${saltHex}:${passphrase}:${digest}`);
  }
  return digest;
}

/** Build the plaintext backup payload from vault entries. */
export function buildBackupPayload(
  entries: BackupEntry[],
  exportedAt: string
): BackupPayload {
  return {
    version: BACKUP_FORMAT_VERSION,
    exportedAt,
    entries,
  };
}

/**
 * Produce the encrypted backup file (as a JSON string) for the given entries,
 * protected by `passphrase`.
 */
export async function createEncryptedBackup(
  payload: BackupPayload,
  passphrase: string,
  deps: {
    sha256Hex: Sha256Hex;
    randomHex: RandomHex;
    randomBytes: (length: number) => Uint8Array | Promise<Uint8Array>;
  },
  iterations: number = DEFAULT_KDF_ITERATIONS
): Promise<string> {
  if (!passphrase) {
    throw new Error('A passphrase is required to encrypt the backup.');
  }
  const saltHex = await deps.randomHex(SALT_BYTES);
  const key = await deriveBackupKey(
    passphrase,
    saltHex,
    iterations,
    deps.sha256Hex
  );
  const envelope = await encryptSecret(
    JSON.stringify(payload),
    key,
    deps.randomBytes
  );

  const file: EncryptedBackupFile = {
    magic: BACKUP_MAGIC,
    version: BACKUP_FORMAT_VERSION,
    kdf: { name: 'sha256-rounds', salt: saltHex, iterations },
    payload: envelope,
  };
  return JSON.stringify(file);
}

function parseEncryptedBackupFile(raw: string): EncryptedBackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('NOT_A_BACKUP');
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    (parsed as EncryptedBackupFile).magic !== BACKUP_MAGIC
  ) {
    throw new Error('NOT_A_BACKUP');
  }
  const file = parsed as EncryptedBackupFile;
  if (
    file.version !== BACKUP_FORMAT_VERSION ||
    !file.kdf ||
    typeof file.kdf.salt !== 'string' ||
    typeof file.kdf.iterations !== 'number' ||
    typeof file.payload !== 'string'
  ) {
    throw new Error('UNSUPPORTED_BACKUP');
  }
  return file;
}

/** Distinguishes the failure modes a caller may want to surface differently. */
export type BackupImportError = 'NOT_A_BACKUP' | 'UNSUPPORTED_BACKUP' | 'BAD_PASSPHRASE';

/**
 * Decrypt an encrypted backup file string with `passphrase`. Throws a
 * {@link BackupImportError} message on a malformed file or wrong passphrase.
 */
export async function decryptBackup(
  raw: string,
  passphrase: string,
  sha256Hex: Sha256Hex
): Promise<BackupPayload> {
  const file = parseEncryptedBackupFile(raw);
  const key = await deriveBackupKey(
    passphrase,
    file.kdf.salt,
    file.kdf.iterations,
    sha256Hex
  );

  let json: string;
  try {
    json = decryptSecret(file.payload, key);
  } catch {
    throw new Error('BAD_PASSPHRASE');
  }

  let payload: BackupPayload;
  try {
    payload = JSON.parse(json) as BackupPayload;
  } catch {
    // Valid-looking ciphertext that decrypted to garbage => wrong passphrase.
    throw new Error('BAD_PASSPHRASE');
  }
  if (!payload || !Array.isArray(payload.entries)) {
    throw new Error('BAD_PASSPHRASE');
  }
  return payload;
}
