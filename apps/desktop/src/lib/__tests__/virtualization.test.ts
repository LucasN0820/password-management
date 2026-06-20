import { describe, expect, it } from 'vitest';
import {
  CANDIDATE_LIST_VIRTUALIZATION_THRESHOLD,
  PASSWORD_LIST_VIRTUALIZATION_THRESHOLD,
  shouldVirtualizeList,
} from '../virtualization';

describe('list virtualization thresholds', () => {
  it('keeps small password lists on the normal render path', () => {
    expect(
      shouldVirtualizeList(
        PASSWORD_LIST_VIRTUALIZATION_THRESHOLD - 1,
        PASSWORD_LIST_VIRTUALIZATION_THRESHOLD
      )
    ).toBe(false);
  });

  it('virtualizes password lists at the configured threshold', () => {
    expect(
      shouldVirtualizeList(
        PASSWORD_LIST_VIRTUALIZATION_THRESHOLD,
        PASSWORD_LIST_VIRTUALIZATION_THRESHOLD
      )
    ).toBe(true);
  });

  it('virtualizes candidate lists independently', () => {
    expect(
      shouldVirtualizeList(
        CANDIDATE_LIST_VIRTUALIZATION_THRESHOLD,
        CANDIDATE_LIST_VIRTUALIZATION_THRESHOLD
      )
    ).toBe(true);
  });

  it('does not virtualize when the threshold is disabled', () => {
    expect(shouldVirtualizeList(1_000, 0)).toBe(false);
  });
});
