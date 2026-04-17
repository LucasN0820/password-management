import type { SQLiteDatabase } from 'expo-sqlite'
import { drizzle } from 'drizzle-orm/expo-sqlite'
import {
  migratePasswordDatabase,
  schema,
  type PasswordDatabase,
} from '@repo/db'

export function createMobileDatabase(client: SQLiteDatabase) {
  const db = drizzle(client, { schema }) as PasswordDatabase

  return db
}

export function initializeMobileDatabase(client: SQLiteDatabase) {
  const db = createMobileDatabase(client)

  migratePasswordDatabase(db)

  return db
}
