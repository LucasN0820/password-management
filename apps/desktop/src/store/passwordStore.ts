import { create } from 'zustand'

export interface Password {
  id: number
  title: string
  username: string
  password: string
  url: string
  notes: string
  category: string
  favorite: number
  icon?: string
  created_at: string
  updated_at: string
}

interface PasswordState {
  passwords: Password[]
  filteredPasswords: Password[]
  selectedPassword: Password | null
  selectedCategory: string
  searchQuery: string
  categories: string[]
  isLoading: boolean

  /**
   * Actions.
   */
  setPasswords: (passwords: Password[]) => void
  setFilteredPasswords: (passwords: Password[]) => void
  setSelectedPassword: (password: Password | null) => void
  setSelectedCategory: (category: string) => void
  setSearchQuery: (query: string) => void
  setCategories: (categories: string[]) => void
  setIsLoading: (loading: boolean) => void
  applyFilters: () => void

  /**
   * Async actions.
   */
  loadPasswords: () => Promise<void>
  loadCategories: () => Promise<void>
  addPassword: (data: Omit<Password, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updatePassword: (id: number, data: Omit<Password, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  deletePassword: (id: number) => Promise<void>
  searchPasswords: (query: string) => Promise<void>
  toggleFavorite: (password: Password) => Promise<void>
}

export const usePasswordStore = create<PasswordState>((set, get) => { return {
  passwords: [],
  filteredPasswords: [],
  selectedPassword: null,
  selectedCategory: 'all',
  searchQuery: '',
  categories: [],
  isLoading: false,

  setPasswords: (passwords) => {
    set({ passwords })
    get().applyFilters()
  },

  setFilteredPasswords: (filteredPasswords) => { set({ filteredPasswords }); },

  setSelectedPassword: (selectedPassword) => { set({ selectedPassword }); },

  setSelectedCategory: (selectedCategory) => {
    set({ selectedCategory })
    get().applyFilters()
  },

  setSearchQuery: (searchQuery) => {
    set({ searchQuery })
    if (searchQuery.trim()) {
      get().searchPasswords(searchQuery)
    } else {
      get().applyFilters()
    }
  },

  setCategories: (categories) => { set({ categories }); },

  setIsLoading: (isLoading) => { set({ isLoading }); },

  applyFilters: () => {
    const { passwords, selectedCategory } = get()
    let filtered = passwords

    if (selectedCategory === 'favorites') {
      filtered = passwords.filter(p => p.favorite === 1)
    } else if (selectedCategory !== 'all') {
      filtered = passwords.filter(p => p.category === selectedCategory)
    }

    set({ filteredPasswords: filtered })
  },

  loadPasswords: async () => {
    set({ isLoading: true })
    try {
      const data = await window.electronAPI.getPasswords()

      set({ passwords: data })
      get().applyFilters()
    } finally {
      set({ isLoading: false })
    }
  },

  loadCategories: async () => {
    const cats = await window.electronAPI.getCategories()

    set({ categories: cats })
  },

  addPassword: async (data) => {
    await window.electronAPI.addPassword(data)
    await get().loadPasswords()
    await get().loadCategories()
  },

  updatePassword: async (id, data) => {
    await window.electronAPI.updatePassword(id, data)
    await get().loadPasswords()
  },

  deletePassword: async (id) => {
    await window.electronAPI.deletePassword(id)
    const { selectedPassword } = get()

    if (selectedPassword?.id === id) {
      set({ selectedPassword: null })
    }
    await get().loadPasswords()
  },

  searchPasswords: async (query) => {
    if (!query.trim()) {
      get().applyFilters()

      return
    }
    const results = await window.electronAPI.searchPasswords(query)

    set({ filteredPasswords: results })
  },

  toggleFavorite: async (password) => {
    await window.electronAPI.updatePassword(password.id, {
      ...password,
      favorite: password.favorite ? 0 : 1
    })
    await get().loadPasswords()
    const { selectedPassword } = get()

    if (selectedPassword?.id === password.id) {
      set({
        selectedPassword: { ...selectedPassword, favorite: password.favorite ? 0 : 1 }
      })
    }
  }
} })
