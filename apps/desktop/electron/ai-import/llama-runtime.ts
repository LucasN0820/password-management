import { app } from 'electron';
import { spawn, type ChildProcess } from 'child_process';
import { chmodSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { createServer } from 'net';
import type { LocalAiImportConfig } from '../settings';
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

function resolveServerPath(config: LocalAiImportConfig) {
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

  if (process.platform !== 'win32') {
    try {
      const mode = statSync(serverPath).mode;
      if ((mode & 0o111) === 0) {
        chmodSync(serverPath, mode | 0o755);
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

  return serverPath;
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

  const serverPath = resolveServerPath(config);
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
  if (!runningServer) return;

  if (runningServer.keepAliveTimer) {
    clearTimeout(runningServer.keepAliveTimer);
  }

  runningServer.keepAliveTimer = setTimeout(() => {
    stopLlamaServer();
  }, config.keepServerAliveMs);
}

export function stopLlamaServer() {
  if (!runningServer) return;

  const server = runningServer;
  runningServer = null;

  if (server.keepAliveTimer) {
    clearTimeout(server.keepAliveTimer);
  }

  if (!server.child.killed) {
    server.child.kill();
  }
}
