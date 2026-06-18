import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import type { Password } from '@repo/db';
import { serializeCsv } from './csv';
import { passwordToBackupEntry } from './entry';
import {
  buildBackupPayload,
  createEncryptedBackup,
  decryptBackup,
  type RandomHex,
  type Sha256Hex,
} from './envelope';
import type { BackupEntry, BackupPayload } from './types';

const sha256Hex: Sha256Hex = input =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);

const randomHex: RandomHex = async byteCount => {
  const bytes = await Crypto.getRandomBytesAsync(byteCount);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

const randomBytes = (length: number) => Crypto.getRandomBytesAsync(length);

function timestampSlug(date = new Date()): string {
  /**
   * YYYYMMDD-HHmmss in local time, filesystem-safe.
   */
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

async function writeTempFile(name: string, content: string): Promise<string> {
  const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '';
  const uri = `${dir}${name}`;
  await FileSystem.writeAsStringAsync(uri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return uri;
}

async function shareFile(uri: string, mimeType: string): Promise<void> {
  const { Share } = await import('react-native');
  await Share.share(
    process.env.EXPO_OS === 'ios'
      ? { url: uri }
      : { url: uri, message: uri, title: 'Backup' },
    { mimeType } as Record<string, unknown>
  );
}

/** Best-effort cleanup so plaintext/backup files do not linger in the cache. */
export async function deleteExportedFile(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Ignore — the OS clears the cache directory eventually.
  }
}

/**
 * Build, write, and share an encrypted backup of the given vault rows. Returns
 * the temporary file URI so the caller can offer to delete it afterwards.
 */
export async function exportEncryptedBackup(
  passwords: Password[],
  passphrase: string
): Promise<string> {
  const entries: BackupEntry[] = passwords.map(passwordToBackupEntry);
  const payload = buildBackupPayload(entries, new Date().toISOString());
  const content = await createEncryptedBackup(payload, passphrase, {
    sha256Hex,
    randomHex,
    randomBytes,
  });
  const uri = await writeTempFile(`vault-backup-${timestampSlug()}.pmbak`, content);
  await shareFile(uri, 'application/json');
  return uri;
}

/** Build, write, and share a plaintext CSV export. Returns the file URI. */
export async function exportCsv(passwords: Password[]): Promise<string> {
  const entries = passwords.map(passwordToBackupEntry);
  const content = serializeCsv(entries);
  const uri = await writeTempFile(`vault-export-${timestampSlug()}.csv`, content);
  await shareFile(uri, 'text/csv');
  return uri;
}

export interface PickedBackupFile {
  uri: string;
  name: string;
  raw: string;
}

/**
 * Let the user pick a backup file and read its contents. Returns null if the
 * picker was cancelled.
 */
export async function pickBackupFile(): Promise<PickedBackupFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'application/octet-stream', '*/*'],
    multiple: false,
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const raw = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return { uri: asset.uri, name: asset.name, raw };
}

/** Decrypt a picked backup file's contents with a passphrase. */
export async function readEncryptedBackup(
  raw: string,
  passphrase: string
): Promise<BackupPayload> {
  return decryptBackup(raw, passphrase, sha256Hex);
}
