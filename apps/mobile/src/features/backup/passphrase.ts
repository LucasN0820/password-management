export const MIN_PASSPHRASE_LENGTH = 8;

export type PassphraseIssue =
  | 'required'
  | 'tooShort'
  | 'mismatch'
  | null;

/** Validate a passphrase entered during export (requires confirmation). */
export function validateNewPassphrase(
  passphrase: string,
  confirm: string
): PassphraseIssue {
  if (!passphrase) return 'required';
  if (passphrase.length < MIN_PASSPHRASE_LENGTH) return 'tooShort';
  if (passphrase !== confirm) return 'mismatch';
  return null;
}

/** Validate a passphrase entered during import (no confirmation field). */
export function validateExistingPassphrase(passphrase: string): PassphraseIssue {
  if (!passphrase) return 'required';
  return null;
}
