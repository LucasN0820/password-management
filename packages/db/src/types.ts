import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { passwords } from './schema'

export type PasswordRow = InferSelectModel<typeof passwords>

export type PasswordRowInput = InferInsertModel<typeof passwords>

export interface Password extends Omit<PasswordRow, 'favorite'> {
  username: string
  isFavorite: boolean
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
