import { useEffect, useState } from "react";

export function usePersistentState<T>(key: string, fallback: T, parse: (value: string) => T, serialize: (value: T) => string) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return fallback;
    }

    const stored = window.localStorage.getItem(key);
    if (stored === null) {
      return fallback;
    }

    try {
      return parse(stored);
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, serialize(value));
  }, [key, serialize, value]);

  return [value, setValue] as const;
}
