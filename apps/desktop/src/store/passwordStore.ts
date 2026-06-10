import { createPasswordStore, type DatabaseAdapter } from '@repo/db';

export type { Password, PasswordInput, PasswordState } from '@repo/db';

const electronAdapter: DatabaseAdapter = {
  getPasswords: () => window.electronAPI.getPasswords(),
  getPasswordById: id => window.electronAPI.getPasswordById(id),
  addPassword: async data => {
    await window.electronAPI.addPassword(data);
  },
  addPasswords: async data => {
    await window.electronAPI.addPasswords(data);
  },
  updatePassword: async (id, data) => {
    await window.electronAPI.updatePassword(id, data);
  },
  deletePassword: id => window.electronAPI.deletePassword(id),
  searchPasswords: query => window.electronAPI.searchPasswords(query),
  getCategories: () => window.electronAPI.getCategories(),
};

export const usePasswordStore = createPasswordStore(electronAdapter);
