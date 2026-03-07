import { SQLiteDatabase } from 'expo-sqlite';
import { UseBoundStore, create, StoreApi } from 'zustand';
import { createContext, useContext } from 'react';

export interface Password {
  id: number;
  created_at: string;
  updated_at: string;
  title: string;
  username: string;
  password: string;
  category: string;
  favorite: number;
  url: string | null;
  notes: string | null;
  icon: string | null;
}

interface PasswordState {
  passwords: Password[];
  filteredPasswords: Password[];
  selectedPassword: Password | null;
  selectedCategory: string;
  searchQuery: string;
  categories: string[];
  isLoading: boolean;

  // Actions
  setPasswords: (passwords: Password[]) => void;
  setFilteredPasswords: (passwords: Password[]) => void;
  setSelectedPassword: (password: Password | null) => void;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  setCategories: (categories: string[]) => void;
  setIsLoading: (loading: boolean) => void;
  applyFilters: () => void;

  // Async actions - these will be initialized with db instance
  loadPasswords: () => Promise<void>;
  loadCategories: () => Promise<void>;
  addPassword: (
    data: Omit<Password, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  updatePassword: (
    id: number,
    data: Omit<Password, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  findPassword: (id: number) => Promise<Password | null>;
  deletePassword: (id: number) => Promise<void>;
  searchPasswords: (query: string) => Promise<void>;
  toggleFavorite: (password: Password) => Promise<void>;
}

function isPasswordContainsString(search: string, password: Password): boolean {
  for (let key of Object.keys(password) as (keyof Password)[]) {
    const val = password[key];
    if (typeof val === 'string' && val.includes(search)) {
      return true;
    }
  }
  return false;
}
export const PasswordContext = createContext<
  UseBoundStore<StoreApi<PasswordState>>
>(undefined!);

export function createStore(db: SQLiteDatabase) {
  const store = create<PasswordState>((set, get) => ({
    passwords: [],
    filteredPasswords: [],
    selectedPassword: null,
    selectedCategory: 'all',
    searchQuery: '',
    categories: [],
    isLoading: false,

    setPasswords: passwords => {
      set({ passwords });
      get().applyFilters();
    },

    setFilteredPasswords: filteredPasswords => set({ filteredPasswords }),

    setSelectedPassword: selectedPassword => set({ selectedPassword }),

    setSelectedCategory: selectedCategory => {
      set({ selectedCategory });
      get().applyFilters();
    },

    setSearchQuery: searchQuery => {
      set({ searchQuery });
      if (searchQuery.trim()) {
        get().searchPasswords(searchQuery);
      } else {
        get().applyFilters();
      }
    },

    setCategories: categories => set({ categories }),

    setIsLoading: isLoading => set({ isLoading }),

    applyFilters: () => {
      const { passwords, selectedCategory, searchQuery } = get();
      let filtered = passwords.filter(p =>
        isPasswordContainsString(searchQuery, p)
      );

      set({ filteredPasswords: filtered });
    },

    loadPasswords: async () => {
      if (!db) {
        console.error('Database not available');
        return;
      }

      set({ isLoading: true });
      try {
        const result = await db.getAllAsync<Password>(
          'SELECT * FROM passwords ORDER BY updated_at DESC'
        );
        set({ passwords: result });
        get().applyFilters();
      } catch (error) {
        console.error('Error loading passwords:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    loadCategories: async () => {
      if (!db) {
        console.error('Database not available');
        return;
      }

      try {
        const result = await db.getAllAsync<Password>(
          'SELECT DISTINCT category FROM passwords WHERE category != "all"'
        );
        const categories = result.map(row => row.category);
        set({ categories: ['all', 'favorites', ...categories] });
      } catch (error) {
        console.error('Error loading categories:', error);
        set({ categories: ['all', 'favorites'] });
      }
    },

    addPassword: async data => {
      if (!db) {
        console.error('Database not available');
        return;
      }

      try {
        await db.runAsync(
          `
        INSERT INTO passwords (title, username, password, url, notes, category, favorite, icon)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
          data.title,
          data.username,
          data.password,
          data.url,
          data.notes,
          data.category,
          data.favorite,
          data.icon ?? ''
        );

        await get().loadPasswords();
        await get().loadCategories();
      } catch (error) {
        console.error('Error adding password:', error);
      }
    },

    updatePassword: async (id, data) => {
      if (!db) {
        console.error('Database not available');
        return;
      }

      try {
        await db.runAsync(
          `
        UPDATE passwords 
        SET title = ?, username = ?, password = ?, url = ?, notes = ?, category = ?, favorite = ?, icon = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
          data.title,
          data.username,
          data.password,
          data.url,
          data.notes,
          data.category,
          data.favorite,
          data.icon ?? '',
          id
        );

        await get().loadPasswords();
      } catch (error) {
        console.error('Error updating password:', error);
      }
    },

    findPassword: async id => {
      if (!db) {
        console.error('Database not available');
        return null;
      }

      try {
        const result = await db.getFirstAsync<Password>(
          `SELECT * FROM passwords WHERE id = ?`,
          id
        );

        if (!result) {
          return null;
        }

        return result;
      } catch (error) {
        console.error('Error finding password:', error);
        return null;
      }
    },

    deletePassword: async id => {
      if (!db) {
        console.error('Database not available');
        return;
      }

      try {
        await db.runAsync('DELETE FROM passwords WHERE id = ?', id);
        const { selectedPassword } = get();
        if (selectedPassword?.id === id) {
          set({ selectedPassword: null });
        }
        await get().loadPasswords();
      } catch (error) {
        console.error('Error deleting password:', error);
      }
    },

    searchPasswords: async query => {
      if (!query.trim()) {
        get().applyFilters();
        return;
      }

      if (!db) {
        console.error('Database not available');
        return;
      }

      try {
        const result = await db.getAllAsync<Password>(
          `
        SELECT * FROM passwords 
        WHERE title LIKE ? OR username LIKE ? OR url LIKE ? OR notes LIKE ?
        ORDER BY updated_at DESC
      `,
          `%${query}%`,
          `%${query}%`,
          `%${query}%`,
          `%${query}%`
        );
        set({ filteredPasswords: result });
      } catch (error) {
        console.error('Error searching passwords:', error);
      }
    },

    toggleFavorite: async password => {
      if (!db) {
        console.error('Database not available');
        return;
      }

      try {
        const newFavorite = password.favorite ? 0 : 1;
        await db.runAsync(
          `
        UPDATE passwords 
        SET favorite = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
          newFavorite,
          password.id
        );

        await get().loadPasswords();
        const { selectedPassword } = get();
        if (selectedPassword?.id === password.id) {
          set({
            selectedPassword: { ...selectedPassword, favorite: newFavorite },
          });
        }
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    },
  }));

  return store;
}

export function usePasswordStore() {
  const context = useContext(PasswordContext);

  if (!context) {
    throw new Error('usePasswordStore must be used within PasswordProvider');
  }

  return context();
}
