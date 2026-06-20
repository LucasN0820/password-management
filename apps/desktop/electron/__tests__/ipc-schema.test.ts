import { describe, expect, it, vi } from 'vitest';
import {
  importFileDescriptorSchema,
  importPasswordSchema,
  importPasswordsSchema,
  modelIdSchema,
  passwordBatchSchema,
  passwordIdSchema,
  passwordInputSchema,
  runImportWorkflowSchema,
  searchQuerySchema,
  updatePasswordSchema,
  withIpcHandler,
} from '../ipc-schema';

const validPassword = {
  title: 'Example',
  username: 'user@example.com',
  password: 'super-secret',
  url: 'https://example.com',
  notes: null,
  category: 'work',
  isFavorite: false,
  icon: null,
  totp_secret: null,
};

const validImportFile = {
  path: 'C:\\Users\\person\\credentials.csv',
  name: 'credentials.csv',
  size: 42,
  extension: '.csv',
};

describe('IPC schemas', () => {
  it('accepts complete password input and rejects missing, mistyped, extra, and oversized fields', () => {
    expect(passwordInputSchema.safeParse(validPassword).success).toBe(true);
    expect(
      passwordInputSchema.safeParse({ ...validPassword, password: undefined })
        .success
    ).toBe(false);
    expect(
      passwordInputSchema.safeParse({ ...validPassword, isFavorite: 'yes' })
        .success
    ).toBe(false);
    expect(
      passwordInputSchema.safeParse({ ...validPassword, internal: true })
        .success
    ).toBe(false);
    expect(
      passwordInputSchema.safeParse({
        ...validPassword,
        title: 'x'.repeat(201),
      }).success
    ).toBe(false);
  });

  it('validates password IDs, batches, updates, and search queries', () => {
    expect(passwordIdSchema.safeParse(1).success).toBe(true);
    expect(passwordIdSchema.safeParse(0).success).toBe(false);
    expect(passwordIdSchema.safeParse('1').success).toBe(false);
    expect(passwordBatchSchema.safeParse([validPassword]).success).toBe(true);
    expect(passwordBatchSchema.safeParse([]).success).toBe(false);
    expect(updatePasswordSchema.safeParse([1, validPassword]).success).toBe(
      true
    );
    expect(updatePasswordSchema.safeParse([1]).success).toBe(false);
    expect(searchQuerySchema.safeParse('example').success).toBe(true);
    expect(searchQuerySchema.safeParse('x'.repeat(501)).success).toBe(false);
  });

  it('validates import candidates, file descriptors, and model options', () => {
    const importCandidate = {
      title: 'Example',
      username: 'person',
      password: 'secret',
      url: null,
      notes: null,
    };

    expect(importPasswordSchema.safeParse(importCandidate).success).toBe(true);
    expect(importPasswordsSchema.safeParse([importCandidate]).success).toBe(
      true
    );
    expect(
      importPasswordSchema.safeParse({ ...importCandidate, password: '' })
        .success
    ).toBe(false);
    expect(importPasswordsSchema.safeParse([]).success).toBe(false);
    expect(importFileDescriptorSchema.safeParse(validImportFile).success).toBe(
      true
    );
    expect(
      importFileDescriptorSchema.safeParse({
        ...validImportFile,
        extension: '.exe',
      }).success
    ).toBe(false);
    expect(modelIdSchema.safeParse('qwen3-4b-q4-k-m').success).toBe(true);
    expect(modelIdSchema.safeParse('../model').success).toBe(false);
    expect(
      runImportWorkflowSchema.safeParse([
        [validImportFile],
        { modelId: 'qwen3-4b-q4-k-m' },
      ]).success
    ).toBe(true);
  });
});

describe('withIpcHandler', () => {
  it('does not execute the operation when IPC input is invalid', async () => {
    const operation = vi.fn();
    const logger = vi.fn();
    const handler = withIpcHandler(
      'add-password',
      passwordInputSchema,
      operation,
      logger
    );

    await expect(handler({ title: 'missing fields' })).resolves.toEqual({
      success: false,
      code: 'VALIDATION_ERROR',
    });
    expect(operation).not.toHaveBeenCalled();
    expect(logger).toHaveBeenCalledOnce();
  });

  it('returns a generic error without sensitive execution details', async () => {
    const logger = vi.fn();
    const handler = withIpcHandler(
      'add-password',
      passwordInputSchema,
      async () => {
        throw new Error(
          'SQL failed at C:\\vault\\passwords.db for super-secret'
        );
      },
      logger
    );

    const result = await handler(validPassword);

    expect(result).toEqual({ success: false, code: 'DB_ERROR' });
    expect(JSON.stringify(result)).not.toContain('super-secret');
    expect(JSON.stringify(result)).not.toContain('passwords.db');
    expect(logger).toHaveBeenCalledOnce();
    expect(JSON.stringify(logger.mock.calls)).not.toContain('super-secret');
    expect(JSON.stringify(logger.mock.calls)).toContain('[REDACTED]');
  });

  it('returns the operation result for valid input', async () => {
    const handler = withIpcHandler(
      'get-password-by-id',
      passwordIdSchema,
      async id => ({ id })
    );

    await expect(handler(7)).resolves.toEqual({ id: 7 });
  });
});
