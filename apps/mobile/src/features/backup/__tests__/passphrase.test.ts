import { describe, expect, it } from 'vitest';
import {
  validateExistingPassphrase,
  validateNewPassphrase,
} from '../passphrase';

describe('validateNewPassphrase', () => {
  it('flags an empty passphrase', () => {
    expect(validateNewPassphrase('', '')).toBe('required');
  });

  it('flags a too-short passphrase', () => {
    expect(validateNewPassphrase('short', 'short')).toBe('tooShort');
  });

  it('flags mismatched confirmation', () => {
    expect(validateNewPassphrase('longenough', 'longenuogh')).toBe('mismatch');
  });

  it('accepts a valid, confirmed passphrase', () => {
    expect(validateNewPassphrase('longenough', 'longenough')).toBeNull();
  });
});

describe('validateExistingPassphrase', () => {
  it('requires a non-empty passphrase', () => {
    expect(validateExistingPassphrase('')).toBe('required');
    expect(validateExistingPassphrase('x')).toBeNull();
  });
});
