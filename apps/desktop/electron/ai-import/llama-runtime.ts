import { type ChildProcess, spawn } from 'node:child_process';
import { chmodSync, existsSync, realpathSync, statSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { app } from 'electron';
import type { LocalAiImportConfig } from '../settings';
import { assertFileSha256 } from './file-integrity';
import {
  ensureLocalModel,
  type LocalModelDownloadProgressHandler,
} from './model-cache';

interface RunningServer {
  baseUrl: string;
  child: ChildProcess;
  keepAliveTimer: NodeJS.Timeout | null;
  modelPath: string;
}

let runningServer: RunningServer | null = null;

const BUNDLED_SERVER_SHA256: Record<string, string> = {
  'darwin-arm64':
    'b33b16f8fd7f1f55d99f9f1229ff17a2a19a24a38da62fe22329f15eadc28a80',
  'darwin-x64':
    '47a7e075eac46750b32d7bb8bb5396fea3c84ea12088eb8594e3da1f02beaf7b',
  'win32-x64':
    '4d3d13c5d80c6ef63fd979a2c5e32474cc07d1dadd716644ab3fa68fca11e155',
};

function appendStartupOutput(current: string, chunk: Buffer) {
  const next = `${current}${chunk.toString('utf8')}`;
  return next.slice(-4000);
}

async function findAvailablePort() {
  return await new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === 'object') {
          resolve(address.port);
          return;
        }
        reject(new Error('Unable to allocate a local llama.cpp port'));
      });
    });
  });
}

function getBundledServerPath() {
  const executable =
    process.platform === 'win32' ? 'llama-server.exe' : 'llama-server';
  const platformDir = `${process.platform}-${process.arch}`;

  if (app.isPackaged) {
    const packagedPlatformPath = join(
      process.resourcesPath,
      'llama.cpp',
      platformDir,
      executable
    );
    if (existsSync(packagedPlatformPath)) {
      return packagedPlatformPath;
    }
    return join(process.resourcesPath, 'llama.cpp', executable);
  }

  const devPlatformPath = join(
    app.getAppPath(),
    'bin',
    'llama.cpp',
    platformDir,
    executable
  );
  if (existsSync(devPlatformPath)) {
    return devPlatformPath;
  }

  return join(app.getAppPath(), 'bin', 'llama.cpp', executable);
}

export async function resolveVerifiedServerPath(config: LocalAiImportConfig) {
  const serverPath = config.llamaServerPath ?? getBundledServerPath();

  if (!existsSync(serverPath)) {
    throw new Error(
      [
        'llama.cpp server binary not found.',
        `Expected at ${serverPath}.`,
        'Set AI_IMPORT_LLAMA_SERVER_PATH to a local llama-server binary.',
      ].join(' ')
    );
  }

  const canonicalPath = realpathSync(serverPath);
  const allowlistedPath = realpathSync(
    config.llamaServerPath ?? getBundledServerPath()
  );
  if (canonicalPath !== allowlistedPath) {
    throw new Error(
      'llama.cpp server path is outside the configured allowlist.'
    );
  }

  const expectedSha256 = config.llamaServerPath
    ? config.llamaServerSha256
    : BUNDLED_SERVER_SHA256[`${process.platform}-${process.arch}`];
  if (!expectedSha256) {
    throw new Error(
      'No trusted SHA256 is configured for this llama.cpp server binary.'
    );
  }
  await assertFileSha256(
    canonicalPath,
    expectedSha256,
    'llama.cpp server binary'
  );

  if (process.platform !== 'win32') {
    try {
      const { mode } = statSync(serverPath);
      if ((mode & 0o111) === 0) {
        chmodSync(serverPath, 0o500);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update permissions';
      throw new Error(
        [
          'llama.cpp server binary is not executable.',
          `Expected at ${serverPath}.`,
          message,
        ].join(' ')
      );
    }
  }

  return canonicalPath;
}

async function delay(ms: number, signal?: AbortSignal) {
  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Local llama.cpp startup was cancelled'));
      return;
    }

    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timeout);
      reject(new Error('Local llama.cpp startup was cancelled'));
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function waitForServer(
  baseUrl: string,
  getStartupFailure: () => string | null,
  getStartupOutput: () => string,
  signal?: AbortSignal
) {
  const startedAt = Date.now();
  const timeoutMs = 120000;

  while (Date.now() - startedAt < timeoutMs) {
    if (signal?.aborted) {
      throw new Error('Local llama.cpp startup was cancelled');
    }

    const failure = getStartupFailure();
    if (failure) {
      const output = getStartupOutput().trim();
      throw new Error(
        `Local llama.cpp server failed to start: ${failure}${
          output ? `\n${output}` : ''
        }`
      );
    }

    try {
      const response = await fetch(`${baseUrl}/v1/models`, {
        signal: AbortSignal.timeout(1500),
      });
      if (response.ok) {
        return;
      }
    } catch {
      // Server is still starting.
    }

    await delay(500, signal);
  }

  const output = getStartupOutput().trim();
  throw new Error(
    `Timed out waiting for local llama.cpp server${output ? `\n${output}` : ''}`
  );
}

export async function getLlamaServerBaseUrl(
  config: LocalAiImportConfig,
  signal?: AbortSignal,
  modelId?: string,
  onModelDownloadProgress?: LocalModelDownloadProgressHandler
) {
  const modelPath = await ensureLocalModel(
    config,
    signal,
    modelId,
    onModelDownloadProgress
  );

  if (runningServer) {
    if (runningServer.modelPath !== modelPath) {
      stopLlamaServer();
    } else {
      if (runningServer.keepAliveTimer) {
        clearTimeout(runningServer.keepAliveTimer);
        runningServer.keepAliveTimer = null;
      }
      return runningServer.baseUrl;
    }
  }

  const serverPath = await resolveVerifiedServerPath(config);
  const port = await findAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const args = [
    '-m',
    modelPath,
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
    '-c',
    String(config.contextSize),
    '-ngl',
    'auto',
  ];

  let startupFailure: string | null = null;
  let startupOutput = '';
  const child = spawn(serverPath, args, {
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  runningServer = {
    baseUrl,
    child,
    keepAliveTimer: null,
    modelPath,
  };

  child.stdout?.on('data', chunk => {
    startupOutput = appendStartupOutput(startupOutput, chunk);
  });

  child.stderr?.on('data', chunk => {
    startupOutput = appendStartupOutput(startupOutput, chunk);
  });

  child.once('exit', (code, signalName) => {
    startupFailure = `process exited with code ${code ?? 'null'}${
      signalName ? ` and signal ${signalName}` : ''
    }`;
    if (runningServer?.child === child) {
      runningServer = null;
    }
  });

  child.once('error', error => {
    startupFailure = error.message;
    if (runningServer?.child === child) {
      runningServer = null;
    }
    console.error('Failed to start local llama.cpp server:', error.message);
  });

  try {
    await waitForServer(
      baseUrl,
      () => startupFailure,
      () => startupOutput,
      signal
    );
  } catch (error) {
    if (runningServer?.child === child) {
      stopLlamaServer();
    }
    throw error;
  }

  return baseUrl;
}

export function releaseLlamaServer(config: LocalAiImportConfig) {
  if (!runningServer) {
    return;
  }

  if (runningServer.keepAliveTimer) {
    clearTimeout(runningServer.keepAliveTimer);
  }

  runningServer.keepAliveTimer = setTimeout(() => {
    stopLlamaServer();
  }, config.keepServerAliveMs);
}

export function stopLlamaServer() {
  if (!runningServer) {
    return;
  }

  const server = runningServer;
  runningServer = null;

  if (server.keepAliveTimer) {
    clearTimeout(server.keepAliveTimer);
  }

  if (!server.child.killed) {
    server.child.kill();
  }
}
