import { resolve } from 'path'
import { config } from 'dotenv'

// Load .env first, then .env.local to allow overrides
const envPaths = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '.env.local'),
]
for (const envPath of envPaths) {
  config({ path: envPath, override: false })
}

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
