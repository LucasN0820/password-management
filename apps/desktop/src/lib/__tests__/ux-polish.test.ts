import { describe, expect, it } from 'vitest';
import { resources } from '@repo/i18n';

describe('UX polish translations', () => {
  it('provides localized oversized-icon toast copy', () => {
    expect(resources.en.translation.form.iconTooLargeTitle).toBe(
      'Icon is too large'
    );
    expect(resources.en.translation.form.iconTooLargeDescription).toContain(
      '5 MB'
    );
    expect(resources.zh.translation.form.iconTooLargeTitle).toBe(
      '图标文件过大'
    );
    expect(resources.zh.translation.form.iconTooLargeDescription).toContain(
      '5 MB'
    );
  });

  it('keeps accessibility labels available in both languages', () => {
    expect(resources.en.translation.passwords.showPassword).toBeTruthy();
    expect(resources.zh.translation.passwords.showPassword).toBeTruthy();
    expect(resources.en.translation.modal.closePasswordForm).toBeTruthy();
    expect(resources.zh.translation.modal.closePasswordForm).toBeTruthy();
  });
});
