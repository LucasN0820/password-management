import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const passwords = sqliteTable('passwords', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  username: text('username'),
  password: text('password').notNull(),
  url: text('url'),
  notes: text('notes'),
  category: text('category').notNull().default('all'),
  favorite: integer('favorite', { mode: 'boolean' }).notNull().default(false),
  icon: text('icon'),
  created_at: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
}, table => ({
  categoryIdx: index('idx_passwords_category').on(table.category),
  favoriteIdx: index('idx_passwords_favorite').on(table.favorite),
}))

export const schema = {
  passwords,
}
