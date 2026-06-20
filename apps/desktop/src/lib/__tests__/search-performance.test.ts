/* eslint-disable @typescript-eslint/unbound-method */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createEncryptedAdapter,
  createPasswordStore,
  type DatabaseAdapter,
  type Password,
  type PasswordInput,
  SEARCH_DEBOUNCE_MS,
} from '@repo/db';

function createAdapterMock(): DatabaseAdapter {
  return {
    getPasswords: vi.fn(async () => []),
    getPasswordById: vi.fn(async () => null),
    addPassword: vi.fn(async () => undefined),
    addPasswords: vi.fn(async () => undefined),
    updatePassword: vi.fn(async () => undefined),
    deletePassword: vi.fn(async () => true),
    searchPasswords: vi.fn(async () => []),
    getCategories: vi.fn(async () => ['all']),
  };
}

describe('debounced password search', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('only searches for the final value in a burst of input', async () => {
    vi.useFakeTimers();
    const adapter = createAdapterMock();
    const store = createPasswordStore(adapter);

    store.getState().setSearchQuery('g');
    store.getState().setSearchQuery('gi');
    store.getState().setSearchQuery('git');

    expect(adapter.searchPasswords).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);

    expect(adapter.searchPasswords).toHaveBeenCalledOnce();
    expect(adapter.searchPasswords).toHaveBeenCalledWith('git');
  });

  it('cancels pending work and restores the list immediately when cleared', async () => {
    vi.useFakeTimers();
    const adapter = createAdapterMock();
    const store = createPasswordStore(adapter);
    const password = createPassword({ title: 'GitHub' });
    store.getState().setPasswords([password]);

    store.getState().setSearchQuery('git');
    store.getState().setSearchQuery('');

    expect(store.getState().filteredPasswords).toEqual([password]);
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    expect(adapter.searchPasswords).not.toHaveBeenCalled();
  });
});

describe('encrypted metadata search', () => {
  it('queries metadata first and decrypts only matching rows', async () => {
    let storedPassword: Password | null = null;
    const baseAdapter = createAdapterMock();
    vi.mocked(baseAdapter.addPassword).mockImplementation(
      async (input: PasswordInput) => {
        storedPassword = createPassword(input);
      }
    );
    vi.mocked(baseAdapter.searchPasswords).mockImplementation(async query => {
      if (!storedPassword) {
        return [];
      }
      const searchable = [
        storedPassword.title,
        storedPassword.username,
        storedPassword.url ?? '',
        storedPassword.category,
      ];
      return searchable.some(value =>
        value.toLowerCase().includes(query.toLowerCase())
      )
        ? [storedPassword]
        : [];
    });
    const adapter = createEncryptedAdapter(
      baseAdapter,
      async () => '00'.repeat(32),
      length => new Uint8Array(length).fill(7)
    );

    await adapter.addPassword({
      title: 'GitHub',
      username: 'octocat',
      password: 'correct horse battery staple',
      url: 'https://github.com',
      notes: 'private note',
      totp_secret: null,
      category: 'work',
      isFavorite: false,
      icon: null,
    });
    const results = await adapter.searchPasswords(' GITHUB ');

    expect(baseAdapter.searchPasswords).toHaveBeenCalledWith('github');
    expect(baseAdapter.getPasswords).not.toHaveBeenCalled();
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      title: 'GitHub',
      password: 'correct horse battery staple',
      notes: 'private note',
    });
    await expect(adapter.searchPasswords('octo')).resolves.toHaveLength(1);
    await expect(adapter.searchPasswords('.com')).resolves.toHaveLength(1);
    await expect(adapter.searchPasswords('work')).resolves.toHaveLength(1);
    await expect(adapter.searchPasswords('private note')).resolves.toEqual([]);
    await expect(adapter.searchPasswords('correct horse')).resolves.toEqual([]);
  });
});

function createPassword(overrides: Partial<PasswordInput> = {}): Password {
  return {
    id: 1,
    title: 'Example',
    username: '',
    password: 'secret',
    url: null,
    notes: null,
    totp_secret: null,
    category: 'all',
    isFavorite: false,
    icon: null,
    created_at: '2026-01-01 00:00:00',
    updated_at: '2026-01-01 00:00:00',
    ...overrides,
  };
}
