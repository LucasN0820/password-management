import { useSQLiteContext } from "expo-sqlite";
import { ReactNode, useMemo } from "react";
import { createMobileDatabase } from "@/db/client";
import { createStore,PasswordContext } from "@/store/passwordStore";
import { Monitor } from "./monitor";

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
