import { create } from 'zustand'
import type { Password, PasswordInput, DatabaseAdapter } from './types'

export interface PasswordState {
  passwords: Password[]
  filteredPasswords: Password[]
  selectedPassword: Password | null
  selectedCategory: string
  searchQuery: string
  categories: string[]
  isLoading: boolean

  setPasswords: (passwords: Password[]) => void
  setFilteredPasswords: (passwords: Password[]) => void
  setSelectedPassword: (password: Password | null) => void
  setSelectedCategory: (category: string) => void
  setSearchQuery: (query: string) => void
  setCategories: (categories: string[]) => void
  setIsLoading: (loading: boolean) => void
  applyFilters: () => void

  loadPasswords: () => Promise<void>
  loadCategories: () => Promise<void>
  addPassword: (data: PasswordInput) => Promise<void>
  updatePassword: (id: number, data: PasswordInput) => Promise<void>
  deletePassword: (id: number) => Promise<void>
  searchPasswords: (query: string) => Promise<void>
  toggleFavorite: (password: Password) => Promise<void>
}

export function createPasswordStore(adapter: DatabaseAdapter) {
  return create<PasswordState>((set, get) => ({
    passwords: [],
    filteredPasswords: [],
    selectedPassword: null,
    selectedCategory: 'all',
    searchQuery: '',
    categories: [],
    isLoading: false,

    setPasswords: passwords => {
      set({ passwords })
      get().applyFilters()
    },

    setFilteredPasswords: filteredPasswords => set({ filteredPasswords }),

    setSelectedPassword: selectedPassword => set({ selectedPassword }),

    setSelectedCategory: selectedCategory => {
      set({ selectedCategory })
      get().applyFilters()
    },

    setSearchQuery: searchQuery => {
      set({ searchQuery })
      if (searchQuery.trim()) {
        get().searchPasswords(searchQuery)
      } else {
        get().applyFilters()
      }
    },

    setCategories: categories => set({ categories }),

    setIsLoading: isLoading => set({ isLoading }),

    applyFilters: () => {
      const { passwords, selectedCategory } = get()
      let filtered = passwords

      if (selectedCategory === 'favorites') {
        filtered = passwords.filter(p => p.isFavorite)
      } else if (selectedCategory !== 'all') {
        filtered = passwords.filter(p => p.category === selectedCategory)
      }

      set({ filteredPasswords: filtered })
    },

    loadPasswords: async () => {
      set({ isLoading: true })
      try {
        const data = await adapter.getPasswords()
        set({ passwords: data })
        get().applyFilters()
      } finally {
        set({ isLoading: false })
      }
    },

    loadCategories: async () => {
      const cats = await adapter.getCategories()
      set({ categories: cats })
    },

    addPassword: async data => {
      await adapter.addPassword(data)
      await get().loadPasswords()
      await get().loadCategories()
    },

    updatePassword: async (id, data) => {
      await adapter.updatePassword(id, data)
      await get().loadPasswords()
    },

    deletePassword: async id => {
      await adapter.deletePassword(id)
      const { selectedPassword } = get()
      if (selectedPassword?.id === id) {
        set({ selectedPassword: null })
      }
      await get().loadPasswords()
    },

    searchPasswords: async query => {
      if (!query.trim()) {
        get().applyFilters()
        return
      }
      const results = await adapter.searchPasswords(query)
      set({ filteredPasswords: results })
    },

    toggleFavorite: async password => {
      const newIsFavorite = !password.isFavorite
      await adapter.updatePassword(password.id, {
        ...password,
        isFavorite: newIsFavorite,
      })
      await get().loadPasswords()
      const { selectedPassword } = get()
      if (selectedPassword?.id === password.id) {
        set({
          selectedPassword: {
            ...selectedPassword,
            isFavorite: newIsFavorite,
          },
        })
      }
    },
  }))
}
