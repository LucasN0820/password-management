export interface Password {
  id: number
  title: string
  username: string
  password: string
  url: string | null
  notes: string | null
  category: string
  isFavorite: boolean
  icon: string | null
  created_at: string
  updated_at: string
}

export type PasswordInput = Omit<Password, 'id' | 'created_at' | 'updated_at'>

export interface DatabaseAdapter {
  getPasswords(): Promise<Password[]>
  getPasswordById(id: number): Promise<Password | null>
  addPassword(data: PasswordInput): Promise<void>
  updatePassword(id: number, data: PasswordInput): Promise<void>
  deletePassword(id: number): Promise<boolean>
  searchPasswords(query: string): Promise<Password[]>
  getCategories(): Promise<string[]>
}
