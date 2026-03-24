import {
  createPasswordStore,
  type DatabaseAdapter,
  type Password,
} from '@repo/db'

export type { Password, PasswordInput, PasswordState } from '@repo/db'

function rowToPassword(row: any): Password {
  return {
    ...row,
    isFavorite: row.favorite === 1,
  }
}

function passwordToRow(data: any) {
  const { isFavorite, ...rest } = data
  return { ...rest, favorite: isFavorite ? 1 : 0 }
}

const electronAdapter: DatabaseAdapter = {
  getPasswords: async () => {
    const rows = await window.electronAPI.getPasswords()
    return rows.map(rowToPassword)
  },
  getPasswordById: async id => {
    const row = await window.electronAPI.getPasswordById(id)
    return row ? rowToPassword(row) : null
  },
  addPassword: async data => {
    await window.electronAPI.addPassword(passwordToRow(data))
  },
  updatePassword: async (id, data) => {
    await window.electronAPI.updatePassword(id, passwordToRow(data))
  },
  deletePassword: async id => {
    return await window.electronAPI.deletePassword(id)
  },
  searchPasswords: async query => {
    const rows = await window.electronAPI.searchPasswords(query)
    return rows.map(rowToPassword)
  },
  getCategories: () => window.electronAPI.getCategories(),
}

export const usePasswordStore = createPasswordStore(electronAdapter)
