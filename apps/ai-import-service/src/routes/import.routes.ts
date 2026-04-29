import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  createJob,
  getJob,
  requestCancellation,
  deleteJob,
} from '../services/job.service';
import { processJob } from '../workers/import.worker';
import { isSupportedImportExtension } from '../langgraph/parser';
import type { ImportFileDescriptor } from '../langgraph/types';

function getApiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }
  return key;
}

async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  const expectedSecret = process.env.AI_IMPORT_SERVICE_SECRET;

  if (!expectedSecret) {
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Service API key not configured',
      },
    });
  }

  if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    return reply.status(401).send({
      error: { code: 'UNAUTHORIZED', message: 'Invalid or missing API key' },
    });
  }
}

export async function importRoutes(fastify: FastifyInstance) {
  // Health check - no auth required
  fastify.get('/import/health', async (_, reply) => {
    return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth middleware for all import routes
  fastify.addHook('onRequest', async (request, reply) => {
    // Skip auth for health endpoint
    if (request.url === '/import/health') return;
    return authMiddleware(request, reply);
  });

  // POST /import/jobs - create a new import job
  fastify.post('/import/jobs', async (request, reply) => {
    // Validate API key first (before checking files)
    try {
      getApiKey();
    } catch {
      return reply.status(401).send({
        error: {
          code: 'MISSING_API_KEY',
          message: 'DEEPSEEK_API_KEY is not configured',
        },
      });
    }

    let files: ImportFileDescriptor[] = [];
    const tempDir = join(tmpdir(), `ai-import-${randomUUID()}`);
    await mkdir(tempDir, { recursive: true });

    try {
      const parts = request.parts();

      for await (const part of parts) {
        if (part.type === 'file') {
          const file = part as {
            filename: string;
            mimetype: string;
            file: NodeJS.ReadableStream;
          };

          const extension = file.filename
            .toLowerCase()
            .slice(file.filename.lastIndexOf('.'));

          // Validate extension
          if (!isSupportedImportExtension(extension)) {
            return reply.status(400).send({
              error: {
                code: 'VALIDATION_ERROR',
                message: `Unsupported file type: ${extension}`,
              },
            });
          }

          const filePath = join(tempDir, `${randomUUID()}${extension}`);
          const writeStream = createWriteStream(filePath);

          await pipeline(file.file, writeStream);

          // Get actual file size
          const { statSync } = await import('fs');
          const stats = statSync(filePath);

          files.push({
            path: filePath,
            name: file.filename,
            size: stats.size,
            extension,
          });
        }
      }

      if (files.length === 0) {
        return reply.status(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'No files provided' },
        });
      }

      const job = await createJob(files);

      // Start processing in background
      processJob(job).catch(error => {
        console.error(`Job ${job.id} failed:`, error);
      });

      return reply.status(202).send({
        jobId: job.id,
        status: job.status,
        createdAt: job.createdAt,
      });
    } catch (error) {
      // Cleanup temp files on error
      await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
      return reply.status(500).send({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  });

  // GET /import/jobs/:jobId - get job status and result
  fastify.get('/import/jobs/:jobId', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const job = await getJob(jobId);

    if (!job) {
      return reply.status(404).send({
        error: { code: 'JOB_NOT_FOUND', message: `Job ${jobId} not found` },
      });
    }

    const response: Record<string, unknown> = {
      jobId: job.id,
      status: job.status,
      createdAt: job.createdAt,
    };

    if (job.completedAt) {
      response.completedAt = job.completedAt;
    }

    if (job.result) {
      response.result = job.result;
    }

    if (job.error) {
      response.error = job.error;
    }

    return reply.send(response);
  });

  // DELETE /import/jobs/:jobId - cancel a job
  fastify.delete('/import/jobs/:jobId', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const job = await getJob(jobId);

    if (!job) {
      return reply.status(404).send({
        error: { code: 'JOB_NOT_FOUND', message: `Job ${jobId} not found` },
      });
    }

    if (
      job.status === 'completed' ||
      job.status === 'failed' ||
      job.status === 'cancelled'
    ) {
      return reply.status(410).send({
        error: {
          code: 'JOB_CANCELLED',
          message: `Job ${jobId} is already ${job.status}`,
        },
      });
    }

    await requestCancellation(jobId);
    await deleteJob(jobId);

    return reply.send({ jobId, status: 'cancelled' });
  });
}
