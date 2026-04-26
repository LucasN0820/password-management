import { app } from 'electron';
import { existsSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
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
  return Array.from(
    new Set([
      findWorkspaceRoot(process.cwd()),
      findWorkspaceRoot(app.getAppPath()),
      findWorkspaceRoot(__dirname),
    ]),
  );
}

function getRootEnvPaths() {
  return getCandidateWorkspaceRoots().flatMap(root => [
    join(root, '.env'),
    join(root, '.env.local'),
  ]);
}

function getPackagedDesktopEnv() {
  if (!app.isPackaged) {
    return {};
  }

  return readJsonConfigFile(join(process.resourcesPath, 'desktop-env.json'));
}

export function getServiceEnvConfig(): {
  url: string | undefined;
  secret: string | undefined;
} {
  let url = process.env.AI_IMPORT_SERVICE_URL;
  let secret = process.env.AI_IMPORT_SERVICE_SECRET;

  const packagedEnv = getPackagedDesktopEnv();
  if (!url && packagedEnv.AI_IMPORT_SERVICE_URL) {
    url = packagedEnv.AI_IMPORT_SERVICE_URL;
  }
  if (!secret && packagedEnv.AI_IMPORT_SERVICE_SECRET) {
    secret = packagedEnv.AI_IMPORT_SERVICE_SECRET;
  }

  for (const filePath of getRootEnvPaths()) {
    if (url && secret) break;
    if (!existsSync(filePath)) continue;

    const parsed = parseEnvFile(filePath);
    if (!url && parsed.AI_IMPORT_SERVICE_URL) {
      url = parsed.AI_IMPORT_SERVICE_URL;
    }
    if (!secret && parsed.AI_IMPORT_SERVICE_SECRET) {
      secret = parsed.AI_IMPORT_SERVICE_SECRET;
    }
  }

  return { url, secret };
}
