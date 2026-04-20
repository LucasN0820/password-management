import { app, safeStorage } from 'electron';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envCache = new Map<string, string>();
const settingsFileName = 'desktop-settings.json';

interface StoredDesktopSettings {
  aiImportKey?: string;
  aiImportKeyEncrypted?: boolean;
}

export interface AiImportKeyStatus {
  mode: 'development' | 'production';
  hasConfiguredKey: boolean;
}

function parseEnvFile(filePath: string): Record<string, string> {
  const content = readFileSync(filePath, 'utf8');
  const result: Record<string, string> = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

function getCandidateEnvPaths() {
  return [
    // dev env
    resolve(process.cwd(), '.env.local'),
    resolve(process.cwd(), '.env'),
    // prod env
    resolve(app.getAppPath(), '.env.local'),
    resolve(app.getAppPath(), '.env'),
    resolve(app.getAppPath(), '../../.env.local'),
    resolve(app.getAppPath(), '../../.env'),
    join(__dirname, '../../../../.env.local'),
    join(__dirname, '../../../../.env'),
  ];
}

export function getServiceEnvConfig(): {
  url: string | undefined;
  secret: string | undefined;
} {
  let url: string | undefined;
  let secret: string | undefined;

  // Check .env files
  for (const filePath of getCandidateEnvPaths()) {
    if (!existsSync(filePath)) continue;
    const parsed = parseEnvFile(filePath);
    if (!url && parsed.AI_IMPORT_SERVICE_URL) {
      url = parsed.AI_IMPORT_SERVICE_URL;
    }
    if (!secret && parsed.AI_IMPORT_SERVICE_SECRET) {
      secret = parsed.AI_IMPORT_SERVICE_SECRET;
    }
    // If both found, can stop
    if (url && secret) break;
  }

  return { url, secret };
}

function getSettingsFilePath() {
  return join(app.getPath('userData'), settingsFileName);
}

function ensureSettingsDirectory() {
  const settingsPath = getSettingsFilePath();
  const settingsDir = dirname(settingsPath);
  if (!existsSync(settingsDir)) {
    mkdirSync(settingsDir, { recursive: true });
  }
  return settingsPath;
}

function readStoredSettings(): StoredDesktopSettings {
  const settingsPath = getSettingsFilePath();
  if (!existsSync(settingsPath)) {
    return {};
  }

  try {
    return JSON.parse(
      readFileSync(settingsPath, 'utf8')
    ) as StoredDesktopSettings;
  } catch {
    return {};
  }
}

function writeStoredSettings(settings: StoredDesktopSettings) {
  const settingsPath = ensureSettingsDirectory();
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
}

function getDevelopmentAiImportKey() {
  const cachedValue = envCache.get('AI_IMPORT_KEY');
  if (cachedValue) {
    return cachedValue;
  }

  const fromProcess = process.env.AI_IMPORT_KEY;
  if (fromProcess) {
    envCache.set('AI_IMPORT_KEY', fromProcess);
    return fromProcess;
  }

  for (const filePath of getCandidateEnvPaths()) {
    if (!existsSync(filePath)) continue;
    const parsed = parseEnvFile(filePath);
    const value = parsed.AI_IMPORT_KEY;
    if (value) {
      envCache.set('AI_IMPORT_KEY', value);
      return value;
    }
  }

  return undefined;
}

export function getStoredAiImportKey() {
  const settings = readStoredSettings();
  const rawValue = settings.aiImportKey;
  if (!rawValue) {
    return undefined;
  }

  if (settings.aiImportKeyEncrypted) {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Secure storage is unavailable on this system');
    }

    return safeStorage.decryptString(Buffer.from(rawValue, 'base64'));
  }

  return rawValue;
}

export function setStoredAiImportKey(key: string) {
  const trimmedKey = key.trim();
  if (!trimmedKey) {
    clearStoredAiImportKey();
    return;
  }

  if (safeStorage.isEncryptionAvailable()) {
    writeStoredSettings({
      aiImportKey: safeStorage.encryptString(trimmedKey).toString('base64'),
      aiImportKeyEncrypted: true,
    });
    return;
  }

  writeStoredSettings({
    aiImportKey: trimmedKey,
    aiImportKeyEncrypted: false,
  });
}

export function clearStoredAiImportKey() {
  writeStoredSettings({});
}

export function getAiImportKey() {
  if (!app.isPackaged) {
    return getDevelopmentAiImportKey();
  }

  return getStoredAiImportKey();
}

export function getAiImportKeyStatus(): AiImportKeyStatus {
  return {
    mode: app.isPackaged ? 'production' : 'development',
    hasConfiguredKey: app.isPackaged
      ? Boolean(getStoredAiImportKey())
      : Boolean(getDevelopmentAiImportKey()),
  };
}
