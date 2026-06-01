import { createContext, useContext } from "react";

export function create<T>(name: string) {
  const Context = createContext<T | null>(null);

  function useCtx(): T {
    const ctx = useContext(Context);
    if (ctx === null) {
      throw new Error(`${name} must be used within its provider`);
    }
    return ctx;
  }

  return [useCtx, Context.Provider] as const;
}
