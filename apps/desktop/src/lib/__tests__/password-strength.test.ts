import { describe, expect, it } from 'vitest';
import {
  calculateStrength,
  countStrongPasswords,
  isStrongPassword,
} from '../password-strength';

describe('calculateStrength', () => {
  it.each([
    ['', 0],
    ['abc', 10],
    ['password1', 45],
    ['Password12', 55],
    ['Correct-Horse-42', 100],
  ])('scores %j as %s', (password, expected) => {
    expect(calculateStrength(password)).toBe(expected);
  });

  it('caps the score at 100', () => {
    expect(calculateStrength('Very-Long-Password-12345')).toBe(100);
  });

  it('classifies and counts real strong and weak password samples', () => {
    expect(isStrongPassword('password1')).toBe(false);
    expect(isStrongPassword('Correct-Horse-42')).toBe(true);
    expect(
      countStrongPasswords([
        { password: 'abc' },
        { password: 'password1' },
        { password: 'Correct-Horse-42' },
        { password: 'Another-Strong-Password-99' },
      ])
    ).toBe(2);
  });
});
