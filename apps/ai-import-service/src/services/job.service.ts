import { randomUUID } from 'crypto'
import { getRedis } from './redis'
import type {
  ImportFileDescriptor,
  ImportJob,
  ImportWorkflowResult,
  JobStatus,
} from '../langgraph/types'

const JOB_KEY_PREFIX = 'import:job:'
const JOB_TTL_SECONDS = 24 * 60 * 60 // 24 hours

function jobKey(jobId: string): string {
  return `${JOB_KEY_PREFIX}${jobId}`
}

export async function createJob(
  files: ImportFileDescriptor[],
): Promise<ImportJob> {
  const redis = getRedis()
  const job: ImportJob = {
    id: randomUUID(),
    status: 'queued',
    createdAt: new Date().toISOString(),
    files,
    cancellationRequested: false,
  }

  await redis
    .pipeline()
    .hset(jobKey(job.id), {
      status: job.status,
      created_at: job.createdAt,
      files_json: JSON.stringify(job.files),
      cancellation_requested: '0',
    })
    .expire(jobKey(job.id), JOB_TTL_SECONDS)
    .exec()

  return job
}

export async function getJob(
  jobId: string,
): Promise<ImportJob | undefined> {
  const redis = getRedis()
  const data = await redis.hgetall(jobKey(jobId))

  if (!data || Object.keys(data).length === 0) {
    return undefined
  }

  return hydrateJob(jobId, data as unknown as Record<string, string>)
}

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  result?: ImportWorkflowResult,
  error?: { code: string; message: string },
): Promise<void> {
  const redis = getRedis()
  const key = jobKey(jobId)

  const pipeline = redis.pipeline().hset(key, 'status', status)

  if (result) {
    pipeline.hset(key, 'result_json', JSON.stringify(result))
  }
  if (error) {
    pipeline.hset(key, 'error_code', error.code)
    pipeline.hset(key, 'error_message', error.message)
  }
  if (
    status === 'completed' ||
    status === 'failed' ||
    status === 'cancelled'
  ) {
    pipeline.hset(key, 'completed_at', new Date().toISOString())
  }

  await pipeline.exec()
}

export async function requestCancellation(
  jobId: string,
): Promise<boolean> {
  const redis = getRedis()
  const key = jobKey(jobId)
  const exists = await redis.exists(key)

  if (!exists) return false

  await redis.hset(key, 'cancellation_requested', '1')
  return true
}

export async function isCancellationRequested(
  jobId: string,
): Promise<boolean> {
  const redis = getRedis()
  const value = await redis.hget(jobKey(jobId), 'cancellation_requested')
  return value === '1'
}

export async function deleteJob(jobId: string): Promise<boolean> {
  const redis = getRedis()
  const deleted = await redis.del(jobKey(jobId))
  return deleted > 0
}

function hydrateJob(
  jobId: string,
  data: Record<string, string>,
): ImportJob {
  let files: ImportFileDescriptor[] = []
  try {
    files = JSON.parse(data.files_json ?? '[]') as ImportFileDescriptor[]
  } catch {
    // If JSON parse fails, leave as empty array
  }

  let result: ImportWorkflowResult | undefined
  try {
    if (data.result_json) {
      result = JSON.parse(data.result_json) as ImportWorkflowResult
    }
  } catch {
    // If JSON parse fails, leave as undefined
  }

  const error =
    data.error_code
      ? { code: data.error_code, message: data.error_message ?? '' }
      : undefined

  return {
    id: jobId,
    status: (data.status as JobStatus) ?? 'queued',
    createdAt: data.created_at ?? new Date().toISOString(),
    completedAt: data.completed_at,
    files,
    result,
    error,
    cancellationRequested: data.cancellation_requested === '1',
  }
}
