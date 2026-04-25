import { like, desc, eq, ne, or, sql } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { passwords, schema } from './schema'
import type { DatabaseAdapter, Password, PasswordInput, PasswordRow } from './types'
import { passwordMigrations } from './migrations.generated'

export type PasswordDatabase = BaseSQLiteDatabase<'sync', unknown, typeof schema>

interface MigrationEntry {
  idx: number
  when: number
  tag: string
  breakpoints: boolean
  version?: string
}

function normalizeNullable(value: string | null | undefined) {
  return value ? value : null
}

function toPassword(row: PasswordRow): Password {
  return {
    ...row,
    username: row.username ?? '',
    isFavorite: row.favorite,
  }
}

function toPasswordRowInput(data: PasswordInput) {
  const { isFavorite, ...rest } = data

  return {
    ...rest,
    username: data.username,
    url: normalizeNullable(data.url),
    notes: normalizeNullable(data.notes),
    icon: normalizeNullable(data.icon),
    favorite: isFavorite,
  }
}

function getInsertId(result: unknown) {
  if (!result || typeof result !== 'object') {
    return null
  }

  if ('lastInsertRowid' in result) {
    const id = result.lastInsertRowid
    return typeof id === 'bigint' ? Number(id) : Number(id)
  }

  if ('lastInsertRowId' in result) {
    return Number(result.lastInsertRowId)
  }

  return null
}

function getMigrationKey(entry: MigrationEntry) {
  return `m${entry.idx.toString().padStart(4, '0')}` as keyof typeof passwordMigrations.migrations
}

function hasTable(db: PasswordDatabase, name: string) {
  const result = db.get<{ name: string }>(
    sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ${name}`
  )

  return Boolean(result)
}

function getTableColumns(db: PasswordDatabase, tableName: string) {
  return db.all<{ name: string }>(
    sql.raw(`PRAGMA table_info("${tableName.replaceAll('"', '""')}")`)
  )
}

function getAppliedMigrationCount(db: PasswordDatabase) {
  if (!hasTable(db, '__drizzle_migrations')) {
    return 0
  }

  const rows = db.all<{ created_at: number }>(
    sql`SELECT created_at FROM "__drizzle_migrations" ORDER BY created_at ASC`
  )

  return rows.length
}

function ensureDrizzleMigrationsTable(db: PasswordDatabase) {
  db.run(sql`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "hash" text NOT NULL,
      "created_at" numeric
    )
  `)
}

function markMigrationApplied(db: PasswordDatabase, entry: MigrationEntry) {
  ensureDrizzleMigrationsTable(db)
  db.run(
    sql`INSERT INTO "__drizzle_migrations" ("hash", "created_at") VALUES(${entry.tag}, ${entry.when})`
  )
}

function repairLegacyPasswordsTable(db: PasswordDatabase) {
  const columns = getTableColumns(db, 'passwords')
  const hasIconColumn = columns.some(column => column.name === 'icon')

  if (!hasIconColumn) {
    db.run(sql`ALTER TABLE passwords ADD COLUMN icon text`)
  }
}

function bootstrapLegacyMigrations(db: PasswordDatabase) {
  const hasPasswordsTable = hasTable(db, 'passwords')
  const appliedMigrationCount = getAppliedMigrationCount(db)

  if (!hasPasswordsTable || appliedMigrationCount > 0) {
    return
  }

  repairLegacyPasswordsTable(db)

  const baselineMigration = passwordMigrations.journal.entries.find(
    entry => entry.idx === 0
  )

  if (!baselineMigration) {
    throw new Error('Missing baseline migration metadata')
  }

  markMigrationApplied(db, baselineMigration)
}

export function migratePasswordDatabase(db: PasswordDatabase) {
  ensureDrizzleMigrationsTable(db)
  bootstrapLegacyMigrations(db)

  const migrations = passwordMigrations.journal.entries.map(entry => {
    const sql = passwordMigrations.migrations[getMigrationKey(entry)]

    if (!sql) {
      throw new Error(`Missing migration SQL for ${entry.tag}`)
    }

    return {
      sql: sql.split('--> statement-breakpoint'),
      bps: entry.breakpoints,
      folderMillis: entry.when,
      hash: '',
    }
  })

  // Drizzle does not expose a stable bundled-SQL migration API for this setup,
  // so this intentionally uses the current internal dialect/session contract.
  ;(db as any).dialect.migrate(migrations, (db as any).session)
}

export function getPasswords(db: PasswordDatabase): Password[] {
  return db
    .select()
    .from(passwords)
    .orderBy(desc(passwords.updated_at))
    .all()
    .map(toPassword)
}

export function getPasswordById(
  db: PasswordDatabase,
  id: number
): Password | null {
  const row = db.select().from(passwords).where(eq(passwords.id, id)).get()

  return row ? toPassword(row) : null
}

export function addPassword(db: PasswordDatabase, data: PasswordInput) {
  const result = db.insert(passwords).values(toPasswordRowInput(data)).run()
  const id = getInsertId(result)

  if (id === null) {
    throw new Error('Failed to read inserted password id')
  }

  const password = getPasswordById(db, id)

  if (!password) {
    throw new Error(`Failed to load inserted password ${id}`)
  }

  return password
}

export function updatePassword(
  db: PasswordDatabase,
  id: number,
  data: PasswordInput
) {
  db
    .update(passwords)
    .set({
      ...toPasswordRowInput(data),
      updated_at: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(passwords.id, id))
    .run()

  return getPasswordById(db, id)
}

export function deletePassword(db: PasswordDatabase, id: number) {
  const result = db.delete(passwords).where(eq(passwords.id, id)).run()

  return typeof result === 'object' && result !== null && 'changes' in result
    ? Number(result.changes) > 0
    : false
}

export function searchPasswords(
  db: PasswordDatabase,
  query: string
): Password[] {
  const searchTerm = `%${query}%`

  return db
    .select()
    .from(passwords)
    .where(
      or(
        like(passwords.title, searchTerm),
        like(passwords.username, searchTerm),
        like(passwords.url, searchTerm),
        like(passwords.notes, searchTerm)
      )
    )
    .orderBy(desc(passwords.favorite), desc(passwords.updated_at))
    .all()
    .map(toPassword)
}

export function getCategories(db: PasswordDatabase) {
  const categories = db
    .selectDistinct({ category: passwords.category })
    .from(passwords)
    .where(ne(passwords.category, 'all'))
    .orderBy(passwords.category)
    .all()
    .map(row => row.category)

  return ['all', 'favorites', ...categories]
}

export function createDrizzleAdapter(db: PasswordDatabase): DatabaseAdapter {
  return {
    getPasswords: async () => getPasswords(db),
    getPasswordById: async id => getPasswordById(db, id),
    addPassword: async data => {
      addPassword(db, data)
    },
    updatePassword: async (id, data) => {
      updatePassword(db, id, data)
    },
    deletePassword: async id => deletePassword(db, id),
    searchPasswords: async query => searchPasswords(db, query),
    getCategories: async () => getCategories(db),
  }
}
