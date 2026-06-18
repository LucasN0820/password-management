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

/** How the export reached the user: a real file save vs the iOS share sheet. */
export type SaveMethod = 'saved' | 'shared';

export interface SaveResult {
  uri: string;
  method: SaveMethod;
}

/**
 * Get the export onto the device the most native way per platform. On Android
 * it writes straight into a folder the user picks via the Storage Access
 * Framework (a real "download"), falling back to the share sheet if the folder
 * permission is denied. On iOS it uses the share sheet, which is the
 * OS-sanctioned "Save to Files" path since iOS has no public Downloads folder.
 */
async function saveToDevice(
  name: string,
  content: string,
  mimeType: string
): Promise<SaveResult> {
  if (process.env.EXPO_OS === 'android') {
    try {
      const permission =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permission.granted) {
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permission.directoryUri,
          name,
          mimeType
        );
        await FileSystem.writeAsStringAsync(fileUri, content, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        return { uri: fileUri, method: 'saved' };
      }
    } catch {
      // Fall through to the share sheet below.
    }
  }
  const uri = await writeTempFile(name, content);
  await shareFile(uri, mimeType);
  return { uri, method: 'shared' };
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
 * Build and save an encrypted backup of the given vault rows. On Android the
 * file lands in a folder the user picks; on iOS it goes through the share sheet.
 * Returns where it landed and how (for the post-export UX).
 */
export async function exportEncryptedBackup(
  passwords: Password[],
  passphrase: string
): Promise<SaveResult> {
  const entries: BackupEntry[] = passwords.map(passwordToBackupEntry);
  const payload = buildBackupPayload(entries, new Date().toISOString());
  const content = await createEncryptedBackup(payload, passphrase, {
    sha256Hex,
    randomHex,
    randomBytes,
  });
  return saveToDevice(
    `vault-backup-${timestampSlug()}.pmbak`,
    content,
    'application/json'
  );
}

/** Build and save a plaintext CSV export. */
export async function exportCsv(passwords: Password[]): Promise<SaveResult> {
  const entries = passwords.map(passwordToBackupEntry);
  const content = serializeCsv(entries);
  return saveToDevice(
    `vault-export-${timestampSlug()}.csv`,
    content,
    'text/csv'
  );
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
