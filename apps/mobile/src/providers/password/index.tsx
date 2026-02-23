import { ReactNode, useMemo } from "react";
import { PasswordContext, createStore } from "@/store/passwordStore";
import { useSQLiteContext } from "expo-sqlite";
import { Monitor } from "./monitor";

export function PasswordProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const store = useMemo(() => createStore(db), [db]);

  return (
    <PasswordContext.Provider value={store}>
      <Monitor>
        {children}
      </Monitor>
    </PasswordContext.Provider>
  )
}