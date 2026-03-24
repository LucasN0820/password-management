import { SQLiteDatabase } from 'expo-sqlite';
import { UseBoundStore, StoreApi } from 'zustand';
import { createContext, useContext } from 'react';
import {
  createPasswordStore,
  type Password,
  type PasswordInput,
  type PasswordState,
  type DatabaseAdapter,
} from '@repo/db';

export type { Password, PasswordInput, PasswordState };

export const PasswordContext = createContext<
  UseBoundStore<StoreApi<PasswordState>>
>(undefined!);

/** Raw SQLite row has `favorite: number` (0|1) instead of `isFavorite: boolean` */
interface PasswordRow {
  id: number;
  title: string;
  username: string;
  password: string;
  url: string | null;
  notes: string | null;
  category: string;
  favorite: number;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

function rowToPassword(row: PasswordRow): Password {
  const { favorite, ...rest } = row;
  return { ...rest, isFavorite: favorite === 1 };
}

function createSqliteAdapter(db: SQLiteDatabase): DatabaseAdapter {
  return {
    getPasswords: async () => {
      const rows = await db.getAllAsync<PasswordRow>(
        'SELECT * FROM passwords ORDER BY updated_at DESC'
      );
      return rows.map(rowToPassword);
    },

    getPasswordById: async id => {
      const row = await db.getFirstAsync<PasswordRow>(
        'SELECT * FROM passwords WHERE id = ?',
        id
      );
      return row ? rowToPassword(row) : null;
    },

    addPassword: async data => {
      await db.runAsync(
        `INSERT INTO passwords (title, username, password, url, notes, category, favorite, icon)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        data.title,
        data.username,
        data.password,
        data.url,
        data.notes,
        data.category,
        data.isFavorite ? 1 : 0,
        data.icon ?? ''
      );
    },

    updatePassword: async (id, data) => {
      await db.runAsync(
        `UPDATE passwords
         SET title = ?, username = ?, password = ?, url = ?, notes = ?, category = ?, favorite = ?, icon = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        data.title,
        data.username,
        data.password,
        data.url,
        data.notes,
        data.category,
        data.isFavorite ? 1 : 0,
        data.icon ?? '',
        id
      );
    },

    deletePassword: async id => {
      const result = await db.runAsync(
        'DELETE FROM passwords WHERE id = ?',
        id
      );
      return result.changes > 0;
    },

    searchPasswords: async query => {
      const rows = await db.getAllAsync<PasswordRow>(
        `SELECT * FROM passwords
         WHERE title LIKE ? OR username LIKE ? OR url LIKE ? OR notes LIKE ?
         ORDER BY updated_at DESC`,
        `%${query}%`,
        `%${query}%`,
        `%${query}%`,
        `%${query}%`
      );
      return rows.map(rowToPassword);
    },

    getCategories: async () => {
      const result = await db.getAllAsync<{ category: string }>(
        'SELECT DISTINCT category FROM passwords WHERE category != "all"'
      );
      return ['all', 'favorites', ...result.map(row => row.category)];
    },
  };
}

export function createStore(db: SQLiteDatabase) {
  const adapter = createSqliteAdapter(db);
  return createPasswordStore(adapter);
}

export function usePasswordStore() {
  const context = useContext(PasswordContext);

  if (!context) {
    throw new Error('usePasswordStore must be used within PasswordProvider');
  }

  return context();
}
