import { SQLiteDatabase, SQLiteProvider } from 'expo-sqlite';
import { ReactNode, useCallback } from 'react';
import { PASSWORDS_TABLE_DDL, PASSWORDS_ICON_MIGRATION } from '@repo/db';

export function DBProvider({ children }: { children: ReactNode }) {
  const initDB = useCallback(async (db: SQLiteDatabase) => {
    db.execSync(PASSWORDS_TABLE_DDL)

    // Add icon column to existing table if it doesn't exist
    try {
      db.execSync(PASSWORDS_ICON_MIGRATION)
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
