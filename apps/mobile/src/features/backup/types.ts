import type { PasswordInput } from '@repo/db';

/**
 * A single credential as stored inside a backup file. Mirrors the editable
 * fields of {@link PasswordInput} so a backup round-trips losslessly through
 * `addPasswords`.
 */
export interface BackupEntry {
  title: string;
  username: string;
  password: string;
  url: string | null;
  notes: string | null;
  category: string;
  isFavorite: boolean;
  icon: string | null;
  /** Optional: preserved by encrypted backups, absent from plaintext CSV. */
  totp_secret?: string | null;
}

/** Current encrypted-backup file format version. */
export const BACKUP_FORMAT_VERSION = 1;

/** Magic marker so we can detect our own backup files on import. */
export const BACKUP_MAGIC = 'pmgmt.backup';

/**
 * The on-disk encrypted backup envelope. The plaintext vault JSON is encrypted
 * with AES-256-GCM using a key derived from the user's passphrase via
 * `deriveBackupKey`. Salt and KDF parameters are stored alongside the
 * ciphertext so import can re-derive the same key.
 */
export interface EncryptedBackupFile {
  magic: typeof BACKUP_MAGIC;
  version: typeof BACKUP_FORMAT_VERSION;
  kdf: {
    /** Algorithm label, documented for forward-compat. */
    name: 'sha256-rounds';
    /** Hex-encoded random salt. */
    salt: string;
    /** Number of SHA-256 rounds used to stretch the passphrase. */
    iterations: number;
  };
  /** AES-256-GCM envelope produced by `@repo/db` `encryptSecret`. */
  payload: string;
}

/** Plaintext (pre-encryption) backup body. */
export interface BackupPayload {
  version: typeof BACKUP_FORMAT_VERSION;
  exportedAt: string;
  entries: BackupEntry[];
}

export type ToPasswordInput = (entry: BackupEntry) => PasswordInput;
