import { dirname, join, resolve } from 'path'
import { existsSync, readFileSync } from 'fs'
import { config } from 'dotenv'

function findWorkspaceRoot(startDir: string) {
  let current = resolve(startDir)

  while (true) {
    const packageJsonPath = join(current, 'package.json')
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
          workspaces?: unknown
        }
        if (packageJson.workspaces) {
          return current
        }
      } catch {
        // Continue walking upward.
      }
    }

    const parent = dirname(current)
    if (parent === current) {
      return resolve(startDir)
    }
    current = parent
  }
}

const workspaceRoot = findWorkspaceRoot(process.cwd())

// Load root .env first, then root .env.local to allow local overrides.
config({ path: join(workspaceRoot, '.env'), override: false })
config({ path: join(workspaceRoot, '.env.local'), override: true })

import Fastify from 'fastify'
import multipart from '@fastify/multipart'
import { importRoutes } from './routes/import.routes'

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
})

async function start() {
  const host = process.env.AI_IMPORT_SERVICE_HOST ?? 'localhost'
  const port = parseInt(process.env.AI_IMPORT_SERVICE_PORT ?? '3001')

  // Register multipart plugin for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB ?? '25') || 25) * 1024 * 1024,
    },
  })

  // Register routes
  await fastify.register(importRoutes)

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']
  for (const signal of signals) {
    process.on(signal, async () => {
      fastify.log.info(`Received ${signal}, shutting down gracefully...`)
      await fastify.close()
      process.exit(0)
    })
  }

  try {
    await fastify.listen({ host, port })
    fastify.log.info(`AI Import Service running at http://${host}:${port}`)
    fastify.log.info(`Health check: http://${host}:${port}/import/health`)
  } catch (error) {
    fastify.log.error(error)
    process.exit(1)
  }
}

start()
