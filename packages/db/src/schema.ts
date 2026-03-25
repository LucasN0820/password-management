export const PASSWORDS_TABLE_DDL = `
  CREATE TABLE IF NOT EXISTS passwords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    username TEXT,
    password TEXT NOT NULL,
    url TEXT,
    notes TEXT,
    category TEXT DEFAULT 'all',
    favorite INTEGER DEFAULT 0,
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_category ON passwords(category);
  CREATE INDEX IF NOT EXISTS idx_favorite ON passwords(favorite);
`

export const PASSWORDS_ICON_MIGRATION = `ALTER TABLE passwords ADD COLUMN icon TEXT`
