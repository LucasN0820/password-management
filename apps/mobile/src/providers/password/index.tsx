import { ReactNode, useMemo } from "react";
import { PasswordContext, createStore } from "@/store/passwordStore";
import { useSQLiteContext } from "expo-sqlite";
import { Monitor } from "./monitor";
import { createMobileDatabase } from "@/db/client";

export function PasswordProvider({ children }: { children: ReactNode }) {
  const sqlite = useSQLiteContext();
  const db = useMemo(() => createMobileDatabase(sqlite), [sqlite]);
  const store = useMemo(() => createStore(db), [db]);

  return (
    <PasswordContext.Provider value={store}>
      <Monitor>
        {children}
      </Monitor>
    </PasswordContext.Provider>
  )
}
