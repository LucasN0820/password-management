import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import {
  migratePasswordDatabase,
  schema,
  type PasswordDatabase,
} from '@repo/db'

export function createDesktopDatabase(path: string) {
  const client = new Database(path)
  const db = drizzle(client, { schema }) as PasswordDatabase

  migratePasswordDatabase(db)

  return {
    client,
    db,
  }
}
