import * as FileSystem from 'expo-file-system/legacy';
import type {
  ModelDownloadTaskManifest,
  ModelDownloadTaskRecord,
} from './types';

const MANIFEST_VERSION = 1;
const MODELS_DIR = `${FileSystem.documentDirectory ?? ''}models/`;
const MANIFEST_PATH = `${MODELS_DIR}model-download-tasks.json`;
const TEMP_PATH = `${MANIFEST_PATH}.tmp`;

// All manifest writes are funnelled through this chain so concurrent state
// transitions (progress persist, clear, native callbacks) never interleave —
// a shared temp file moved by two writers at once would otherwise throw.
let writeChain: Promise<void> = Promise.resolve();

function emptyManifest(): ModelDownloadTaskManifest {
  return { version: MANIFEST_VERSION, activeTask: null };
}

async function ensureModelsDirectory() {
  if (!FileSystem.documentDirectory) {
    throw new Error('The app document directory is unavailable.');
  }
  await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });
}

export async function readTaskManifest(): Promise<ModelDownloadTaskManifest> {
  await ensureModelsDirectory();
  const info = await FileSystem.getInfoAsync(MANIFEST_PATH);
  if (!info.exists) return emptyManifest();

  try {
    const parsed = JSON.parse(
      await FileSystem.readAsStringAsync(MANIFEST_PATH)
    ) as ModelDownloadTaskManifest;
    return parsed.version === MANIFEST_VERSION ? parsed : emptyManifest();
  } catch {
    return emptyManifest();
  }
}

/** Atomic write: serialise to a temp file, then move over the manifest. */
async function writeManifestNow(manifest: ModelDownloadTaskManifest) {
  await ensureModelsDirectory();
  await FileSystem.deleteAsync(TEMP_PATH, { idempotent: true });
  await FileSystem.writeAsStringAsync(TEMP_PATH, JSON.stringify(manifest));
  await FileSystem.deleteAsync(MANIFEST_PATH, { idempotent: true });
  await FileSystem.moveAsync({ from: TEMP_PATH, to: MANIFEST_PATH });
}

/** Enqueue a manifest write so only one runs at a time. */
function writeTaskManifest(manifest: ModelDownloadTaskManifest): Promise<void> {
  const next = writeChain.then(
    () => writeManifestNow(manifest),
    () => writeManifestNow(manifest)
  );
  // Keep the chain alive even if a write rejects.
  writeChain = next.catch(() => undefined);
  return next;
}

export async function readActiveTask(): Promise<ModelDownloadTaskRecord | null> {
  return (await readTaskManifest()).activeTask;
}

export async function writeActiveTask(task: ModelDownloadTaskRecord | null) {
  await writeTaskManifest({ version: MANIFEST_VERSION, activeTask: task });
}

export async function clearActiveTask() {
  await writeActiveTask(null);
}
