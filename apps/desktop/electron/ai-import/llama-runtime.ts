import { app } from 'electron'
import { spawn, type ChildProcess } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { createServer } from 'net'
import type { LocalAiImportConfig } from '../settings'
import { ensureLocalModel } from './model-cache'

interface RunningServer {
  baseUrl: string
  child: ChildProcess
  keepAliveTimer: NodeJS.Timeout | null
}

let runningServer: RunningServer | null = null

async function findAvailablePort() {
  return await new Promise<number>((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.close(() => {
        if (address && typeof address === 'object') {
          resolve(address.port)
          return
        }
        reject(new Error('Unable to allocate a local llama.cpp port'))
      })
    })
  })
}

function getBundledServerPath() {
  const executable =
    process.platform === 'win32' ? 'llama-server.exe' : 'llama-server'
  const platformDir = `${process.platform}-${process.arch}`

  if (app.isPackaged) {
    const packagedPlatformPath = join(
      process.resourcesPath,
      'llama.cpp',
      platformDir,
      executable,
    )
    if (existsSync(packagedPlatformPath)) {
      return packagedPlatformPath
    }
    return join(process.resourcesPath, 'llama.cpp', executable)
  }

  const devPlatformPath = join(
    app.getAppPath(),
    'bin',
    'llama.cpp',
    platformDir,
    executable,
  )
  if (existsSync(devPlatformPath)) {
    return devPlatformPath
  }

  return join(app.getAppPath(), 'bin', 'llama.cpp', executable)
}

function resolveServerPath(config: LocalAiImportConfig) {
  const serverPath = config.llamaServerPath ?? getBundledServerPath()

  if (!existsSync(serverPath)) {
    throw new Error(
      [
        'llama.cpp server binary not found.',
        `Expected at ${serverPath}.`,
        'Set AI_IMPORT_LLAMA_SERVER_PATH to a local llama-server binary.',
      ].join(' '),
    )
  }

  return serverPath
}

async function waitForServer(baseUrl: string, signal?: AbortSignal) {
  const startedAt = Date.now()
  const timeoutMs = 120000

  while (Date.now() - startedAt < timeoutMs) {
    if (signal?.aborted) {
      throw new Error('Local llama.cpp startup was cancelled')
    }

    try {
      const response = await fetch(`${baseUrl}/v1/models`, { signal })
      if (response.ok) {
        return
      }
    } catch {
      // Server is still starting.
    }

    await new Promise(resolve => setTimeout(resolve, 500))
  }

  throw new Error('Timed out waiting for local llama.cpp server')
}

export async function getLlamaServerBaseUrl(
  config: LocalAiImportConfig,
  signal?: AbortSignal,
) {
  if (runningServer) {
    if (runningServer.keepAliveTimer) {
      clearTimeout(runningServer.keepAliveTimer)
      runningServer.keepAliveTimer = null
    }
    return runningServer.baseUrl
  }

  const modelPath = await ensureLocalModel(config, signal)
  const serverPath = resolveServerPath(config)
  const port = await findAvailablePort()
  const baseUrl = `http://127.0.0.1:${port}`
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
  ]

  const child = spawn(serverPath, args, {
    windowsHide: true,
    stdio: ['ignore', 'ignore', 'ignore'],
  })

  runningServer = {
    baseUrl,
    child,
    keepAliveTimer: null,
  }

  child.once('exit', () => {
    if (runningServer?.child === child) {
      runningServer = null
    }
  })

  child.once('error', error => {
    if (runningServer?.child === child) {
      runningServer = null
    }
    console.error('Failed to start local llama.cpp server:', error.message)
  })

  await waitForServer(baseUrl, signal)

  return baseUrl
}

export function releaseLlamaServer(config: LocalAiImportConfig) {
  if (!runningServer) return

  if (runningServer.keepAliveTimer) {
    clearTimeout(runningServer.keepAliveTimer)
  }

  runningServer.keepAliveTimer = setTimeout(() => {
    stopLlamaServer()
  }, config.keepServerAliveMs)
}

export function stopLlamaServer() {
  if (!runningServer) return

  const server = runningServer
  runningServer = null

  if (server.keepAliveTimer) {
    clearTimeout(server.keepAliveTimer)
  }

  if (!server.child.killed) {
    server.child.kill()
  }
}
