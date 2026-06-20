import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, safeStorage } from 'electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serviceSecretFileName = 'ai-import-service-secret.json';
const serviceSecretVersion = 1;

interface StoredServiceSecret {
  version: typeof serviceSecretVersion;
  encryptedSecret: string;
}

function parseEnvFile(filePath: string): Record<string, string> {
  const content = readFileSync(filePath, 'utf8');
  const result: Record<string, string> = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {continue;}

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {continue;}

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

function readJsonConfigFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, string>;
  } catch {
    return {};
  }
}

function findWorkspaceRoot(startDir: string) {
  let current = resolve(startDir);

  while (true) {
    const packageJsonPath = join(current, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          readFileSync(packageJsonPath, 'utf8')
        ) as {
          workspaces?: unknown;
        };
        if (packageJson.workspaces) {
          return current;
        }
      } catch {
        // Continue walking upward.
      }
    }

    const parent = dirname(current);
    if (parent === current) {
      return resolve(startDir);
    }
    current = parent;
  }
}

function getCandidateWorkspaceRoots() {
  return [
    ...new Set([
      findWorkspaceRoot(process.cwd()),
      findWorkspaceRoot(app.getAppPath()),
      findWorkspaceRoot(__dirname),
    ]),
  ];
}

function getRootEnvPaths() {
  return getCandidateWorkspaceRoots().flatMap(root => { return [
    join(root, '.env'),
    join(root, '.env.local'),
  ] });
}

function getPackagedDesktopEnv() {
  if (!app.isPackaged) {
    return {};
  }

  return readJsonConfigFile(join(process.resourcesPath, 'desktop-env.json'));
}

function getServiceSecretPath() {
  return join(app.getPath('userData'), serviceSecretFileName);
}

function readStoredServiceSecret(): StoredServiceSecret | null {
  const path = getServiceSecretPath();
  if (!existsSync(path)) {return null;}

  try {
    const parsed = JSON.parse(
      readFileSync(path, 'utf8')
    ) as Partial<StoredServiceSecret>;
    if (
      parsed.version !== serviceSecretVersion ||
      typeof parsed.encryptedSecret !== 'string'
    ) {
      return null;
    }
    return parsed as StoredServiceSecret;
  } catch {
    return null;
  }
}

function writeStoredServiceSecret(secret: string) {
  const path = getServiceSecretPath();
  const directory = dirname(path);
  if (!existsSync(directory)) {mkdirSync(directory, { recursive: true });}

  const stored: StoredServiceSecret = {
    version: serviceSecretVersion,
    encryptedSecret: safeStorage.encryptString(secret).toString('base64'),
  };
  const temporaryPath = `${path}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify(stored, null, 2), {
    encoding: 'utf8',
    mode: 0o600,
  });
  renameSync(temporaryPath, path);
}

function getPlaintextSecretSeed() {
  if (process.env.AI_IMPORT_SERVICE_SECRET) {
    return process.env.AI_IMPORT_SERVICE_SECRET;
  }

  // Development-only migration path. Packaged builds never read a plaintext
  // secret from desktop-env.json or ship one in application resources.
  if (!app.isPackaged) {
    for (const filePath of getRootEnvPaths()) {
      if (!existsSync(filePath)) {continue;}
      const secret = parseEnvFile(filePath).AI_IMPORT_SERVICE_SECRET;
      if (secret) {return secret;}
    }
  }
  return undefined;
}

function getEncryptedServiceSecret() {
  const stored = readStoredServiceSecret();
  const seed = getPlaintextSecretSeed();
  if (!stored && !seed) {return undefined;}

  if (!safeStorage.isEncryptionAvailable()) {
    console.warn(
      'AI import service credentials are unavailable because secure storage is locked.'
    );
    return undefined;
  }

  try {
    // An explicitly supplied environment value also provides a safe rotation
    // mechanism. It is encrypted immediately and is never copied to JSON.
    if (seed) {
      writeStoredServiceSecret(seed);
      // Remove the plaintext value after it has been persisted securely.
      // eslint-disable-next-line no-restricted-syntax/noDeleteOperator
      delete process.env.AI_IMPORT_SERVICE_SECRET;
      return seed;
    }
    return safeStorage.decryptString(
      Buffer.from(stored!.encryptedSecret, 'base64')
    );
  } catch {
    console.warn('AI import service credentials could not be decrypted.');
    return undefined;
  }
}

export function getServiceEnvConfig(): {
  url: string | undefined;
  secret: string | undefined;
} {
  let url = process.env.AI_IMPORT_SERVICE_URL;

  const packagedEnv = getPackagedDesktopEnv();
  if (!url && packagedEnv.AI_IMPORT_SERVICE_URL) {
    url = packagedEnv.AI_IMPORT_SERVICE_URL;
  }

  for (const filePath of getRootEnvPaths()) {
    if (url || !existsSync(filePath)) {continue;}
    url = parseEnvFile(filePath).AI_IMPORT_SERVICE_URL;
  }

  return { url, secret: getEncryptedServiceSecret() };
}

export interface LocalAiImportConfig {
  provider: 'local-llama' | 'remote-service';
  modelRepo: string;
  modelQuant: string;
  modelFile: string | undefined;
  modelSha256: string | undefined;
  modelDownloadUrl: string | undefined;
  modelPath: string | undefined;
  llamaServerPath: string | undefined;
  llamaServerSha256: string | undefined;
  contextSize: number;
  maxTokens: number;
  keepServerAliveMs: number;
}

function readMergedEnv() {
  const merged: Record<string, string> = {};

  for (const filePath of getRootEnvPaths()) {
    if (!existsSync(filePath)) {continue;}
    Object.assign(merged, parseEnvFile(filePath));
  }

  return {
    ...merged,
    ...getPackagedDesktopEnv(),
    ...process.env,
  } as Record<string, string | undefined>;
}

function readNumberEnv(
  env: Record<string, string | undefined>,
  key: string,
  fallback: number
) {
  const value = Number(env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getLocalAiImportConfig(): LocalAiImportConfig {
  const env = readMergedEnv();
  const provider =
    env.AI_IMPORT_PROVIDER === 'remote-service'
      ? 'remote-service'
      : 'local-llama';

  return {
    provider,
    modelRepo: env.AI_IMPORT_MODEL_REPO ?? 'ggml-org/gemma-4-26B-A4B-it-GGUF',
    modelQuant: env.AI_IMPORT_MODEL_QUANT ?? 'Q4_K_M',
    modelFile: env.AI_IMPORT_MODEL_FILE || undefined,
    modelSha256: env.AI_IMPORT_MODEL_SHA256 || undefined,
    modelDownloadUrl: env.AI_IMPORT_MODEL_DOWNLOAD_URL || undefined,
    modelPath: env.AI_IMPORT_MODEL_PATH || undefined,
    llamaServerPath: env.AI_IMPORT_LLAMA_SERVER_PATH || undefined,
    llamaServerSha256: env.AI_IMPORT_LLAMA_SERVER_SHA256 || undefined,
    contextSize: readNumberEnv(env, 'AI_IMPORT_CONTEXT_SIZE', 8192),
    maxTokens: readNumberEnv(env, 'AI_IMPORT_MAX_TOKENS', 2000),
    keepServerAliveMs: readNumberEnv(
      env,
      'AI_IMPORT_KEEP_SERVER_ALIVE_MS',
      300000
    ),
  };
}
