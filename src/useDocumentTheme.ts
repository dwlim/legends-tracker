import { useEffect } from "react";
import type { ThemeMode } from "./upgradeLibraryTypes";

export function useDocumentTheme(theme: ThemeMode) {
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
}
