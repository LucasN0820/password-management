import { z } from 'zod';

const MAX_TITLE_LENGTH = 200;
const MAX_USERNAME_LENGTH = 500;
const MAX_PASSWORD_LENGTH = 10_000;
const MAX_URL_LENGTH = 2_048;
const MAX_NOTES_LENGTH = 20_000;
const MAX_CATEGORY_LENGTH = 100;
const MAX_ICON_LENGTH = 2_000_000;
const MAX_TOTP_SECRET_LENGTH = 512;
const MAX_BATCH_SIZE = 1_000;

const nullableLimitedString = (maxLength: number) => {
  return z.string().max(maxLength).nullable();
};

export const passwordInputSchema = z
  .object({
    title: z.string().trim().min(1).max(MAX_TITLE_LENGTH),
    username: z.string().max(MAX_USERNAME_LENGTH),
    password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
    url: nullableLimitedString(MAX_URL_LENGTH),
    notes: nullableLimitedString(MAX_NOTES_LENGTH),
    category: z.string().trim().min(1).max(MAX_CATEGORY_LENGTH),
    isFavorite: z.boolean(),
    icon: nullableLimitedString(MAX_ICON_LENGTH),
    totp_secret: nullableLimitedString(MAX_TOTP_SECRET_LENGTH),
  })
  .strict();

export const passwordIdSchema = z.number().int().positive().safe();
export const noInputSchema = z.undefined();
export const passwordBatchSchema = z
  .array(passwordInputSchema)
  .min(1)
  .max(MAX_BATCH_SIZE);
export const updatePasswordSchema = z.tuple([
  passwordIdSchema,
  passwordInputSchema,
]);
export const searchQuerySchema = z.string().max(500);

export const modelIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^\w[\w.-]*$/);
export const optionalModelIdSchema = modelIdSchema.optional();

export const importFileDescriptorSchema = z
  .object({
    path: z.string().min(1).max(32_768),
    name: z.string().min(1).max(255),
    size: z.number().int().nonnegative().safe(),
    extension: z.enum(['.csv', '.pdf', '.docx', '.md', '.markdown', '.txt']),
  })
  .strict();

export const runImportWorkflowSchema = z.tuple([
  z.array(importFileDescriptorSchema).min(1).max(100),
  z.object({ modelId: optionalModelIdSchema }).strict().optional(),
]);

export const importPasswordSchema = z
  .object({
    title: z.string().trim().min(1).max(MAX_TITLE_LENGTH),
    username: z.string().max(MAX_USERNAME_LENGTH),
    password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
    url: nullableLimitedString(MAX_URL_LENGTH),
    notes: nullableLimitedString(MAX_NOTES_LENGTH),
  })
  .strict();
export const importPasswordsSchema = z
  .array(importPasswordSchema)
  .min(1)
  .max(MAX_BATCH_SIZE);

export type IpcErrorCode = 'VALIDATION_ERROR' | 'DB_ERROR';

export interface IpcErrorResult {
  success: false;
  code: IpcErrorCode;
}

type IpcErrorLogger = (
  channel: string,
  stage: 'validation' | 'execution',
  error: unknown
) => void;

const defaultErrorLogger: IpcErrorLogger = (channel, stage, error) => {
  console.error(`[IPC:${channel}] ${stage} failed`, error);
};

function collectSensitiveValues(
  value: unknown,
  values: Set<string>,
  key?: string
) {
  if (typeof value === 'string') {
    if (key && /^(?:password|notes|totp_secret)$/iu.test(key) && value) {
      values.add(value);
    }
    return;
  }
  if (!value || typeof value !== 'object') {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(item => {
      collectSensitiveValues(item, values, key);
    });
    return;
  }

  Object.entries(value).forEach(([entryKey, entryValue]) => {
    collectSensitiveValues(entryValue, values, entryKey);
  });
}

function redactSensitiveError(error: unknown, input: unknown) {
  const sensitiveValues = new Set<string>();
  collectSensitiveValues(input, sensitiveValues);

  const redact = (value: string | undefined) => {
    if (!value) {
      return value;
    }
    let result = value;
    sensitiveValues.forEach(sensitiveValue => {
      result = result.replaceAll(sensitiveValue, '[REDACTED]');
    });
    return result;
  };

  if (!(error instanceof Error)) {
    return error;
  }
  return {
    name: error.name,
    message: redact(error.message),
    stack: redact(error.stack),
  };
}

/**
 * Validates untrusted renderer input and prevents main-process details from
 * crossing the IPC boundary. Callers receive the original success value or a
 * stable, detail-free error object.
 */
export function withIpcHandler<Schema extends z.ZodType, Result>(
  name: string,
  schema: Schema,
  fn: (input: z.output<Schema>) => Result | Promise<Result>,
  logError: IpcErrorLogger = defaultErrorLogger
) {
  return async (input: unknown): Promise<Result | IpcErrorResult> => {
    // schema校验输入数据是否合法，如果不合法，记录错误日志并返回一个标准的错误对象
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      // Zod issues describe constraints and paths, but do not include the
      // submitted values (which may contain plaintext passwords).
      logError(name, 'validation', parsed.error.issues);
      return { success: false, code: 'VALIDATION_ERROR' };
    }

    try {
      return await fn(parsed.data);
    } catch (error) {
      // Never attach the error to the public result. It may contain a database
      // path, SQL text, encryption details, or other main-process internals.
      logError(name, 'execution', redactSensitiveError(error, parsed.data));
      return { success: false, code: 'DB_ERROR' };
    }
  };
}
