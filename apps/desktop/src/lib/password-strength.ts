export const STRONG_PASSWORD_THRESHOLD = 60;

export function calculateStrength(password: string) {
  if (!password) {
    return 0;
  }

  let score = 0;
  if (password.length >= 8) {
    score = score + 25;
  }
  if (password.length >= 12) {
    score = score + 25;
  }
  if (password.length >= 16) {
    score = score + 25;
  }
  if (/[a-z]/u.test(password)) {
    score = score + 10;
  }
  if (/[A-Z]/u.test(password)) {
    score = score + 10;
  }
  if (/\d/u.test(password)) {
    score = score + 10;
  }
  if (/[^a-z0-9]/iu.test(password)) {
    score = score + 15;
  }

  return Math.min(100, score);
}

export function isStrongPassword(password: string) {
  return calculateStrength(password) >= STRONG_PASSWORD_THRESHOLD;
}

interface PasswordValue {
  password: string;
}

export function countStrongPasswords(passwords: readonly PasswordValue[]) {
  return passwords.filter(entry => isStrongPassword(entry.password)).length;
}
