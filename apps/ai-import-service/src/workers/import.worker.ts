import { rm } from 'fs/promises'
import { dirname } from 'path'
import { runImportWorkflow } from '../langgraph/workflow'
import { isCancellationRequested, updateJobStatus } from '../services/job.service'
import type { ImportJob } from '../langgraph/types'

async function cleanupJobFiles(job: ImportJob) {
  const directories = new Set(job.files.map(file => dirname(file.path)))
  await Promise.all(
    Array.from(directories).map(directory =>
      rm(directory, { recursive: true, force: true }).catch(() => undefined),
    ),
  )
}

export async function processJob(job: ImportJob): Promise<void> {
  await updateJobStatus(job.id, 'processing')

  // Check cancellation before starting
  if (await isCancellationRequested(job.id)) {
    await updateJobStatus(job.id, 'cancelled')
    return
  }

  try {
    const result = await runImportWorkflow(job.files)

    // Check cancellation after workflow (between steps)
    if (await isCancellationRequested(job.id)) {
      await updateJobStatus(job.id, 'cancelled')
      return
    }

    await updateJobStatus(job.id, 'completed', result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const isCancelled = await isCancellationRequested(job.id)

    await updateJobStatus(job.id, isCancelled ? 'cancelled' : 'failed', undefined, {
      code: 'AI_EXTRACTION_FAILED',
      message,
    })
  } finally {
    await cleanupJobFiles(job)
  }
}
