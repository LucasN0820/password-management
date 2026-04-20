import { randomUUID } from 'crypto'
import type { ImportFileDescriptor, ImportJob, ImportWorkflowResult, JobStatus } from '../langgraph/types'

const jobs = new Map<string, ImportJob>()

export function createJob(files: ImportFileDescriptor[]): ImportJob {
  const job: ImportJob = {
    id: randomUUID(),
    status: 'queued',
    createdAt: new Date().toISOString(),
    files,
    cancellationRequested: false,
  }
  jobs.set(job.id, job)
  return job
}

export function getJob(jobId: string): ImportJob | undefined {
  return jobs.get(jobId)
}

export function updateJobStatus(
  jobId: string,
  status: JobStatus,
  result?: ImportWorkflowResult,
  error?: { code: string; message: string },
) {
  const job = jobs.get(jobId)
  if (!job) return

  job.status = status
  if (result) {
    job.result = result
  }
  if (error) {
    job.error = error
  }
  if (status === 'completed' || status === 'failed' || status === 'cancelled') {
    job.completedAt = new Date().toISOString()
  }
}

export function requestCancellation(jobId: string): boolean {
  const job = jobs.get(jobId)
  if (!job) return false

  job.cancellationRequested = true
  return true
}

export function isCancellationRequested(jobId: string): boolean {
  const job = jobs.get(jobId)
  return job?.cancellationRequested ?? false
}

export function deleteJob(jobId: string): boolean {
  return jobs.delete(jobId)
}
