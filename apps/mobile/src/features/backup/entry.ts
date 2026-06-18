import type { Password } from '@repo/db';
import type { BackupEntry } from './types';

/** Project a decrypted vault row into a portable backup entry. */
export function passwordToBackupEntry(password: Password): BackupEntry {
  return {
    title: password.title,
    username: password.username,
    password: password.password,
    url: password.url,
    notes: password.notes,
    category: password.category,
    isFavorite: password.isFavorite,
    icon: password.icon,
  };
}
