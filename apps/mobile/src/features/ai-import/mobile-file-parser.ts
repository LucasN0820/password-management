import * as FileSystem from 'expo-file-system/legacy';
import {
  isPortableTextExtension,
  parsePortableTextFile,
} from '@repo/ai-import-core/text';
import type { ImportFileParser } from '@repo/ai-import-core/types';

export const MAX_IMPORT_FILES = 5;
export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_TOTAL_BYTES = 15 * 1024 * 1024;

export const parseMobileImportFile: ImportFileParser = async (
  file,
  context
) => {
  if (!isPortableTextExtension(file.extension)) {
    throw new Error(`Unsupported file type: ${file.extension}`);
  }
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw new Error('File exceeds the 5MB import limit.');
  }

  const text = await FileSystem.readAsStringAsync(file.path);
  return parsePortableTextFile(file, text, context.createId);
};

export async function cleanupPickedImportFiles(paths: string[]) {
  await Promise.all(
    paths.map(path => FileSystem.deleteAsync(path, { idempotent: true }))
  );
}
