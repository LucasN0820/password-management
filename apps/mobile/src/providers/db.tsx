import { SQLiteDatabase, SQLiteProvider } from 'expo-sqlite';
import { ReactNode, useCallback } from 'react';

export function DBProvider({ children }: { children: ReactNode }) {
  const initDB = useCallback(async (db: SQLiteDatabase) => {
    db.execSync(`
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
    `)

    // Add icon column to existing table if it doesn't exist
    try {
      db.execSync(`ALTER TABLE passwords ADD COLUMN icon TEXT`)
    } catch (error) {
      // Column already exists, ignore error
    }

    console.log('Database initialized successfully');
  }, []);
  return (
    <SQLiteProvider databaseName="passwords.db" onInit={initDB}>
      {children}
    </SQLiteProvider>
  );
}