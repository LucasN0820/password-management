import { SQLiteDatabase, SQLiteProvider } from 'expo-sqlite';
import { ReactNode, useCallback } from 'react';
import { initializeMobileDatabase } from '@/db/client';

export function DBProvider({ children }: { children: ReactNode }) {
  const initDB = useCallback(async (db: SQLiteDatabase) => {
    initializeMobileDatabase(db)

    console.log('Database initialized successfully');
  }, []);

  return (
    <SQLiteProvider databaseName="passwords.db" onInit={initDB}>
      {children}
    </SQLiteProvider>
  );
}
