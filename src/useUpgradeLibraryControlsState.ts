import { useDeferredValue, useMemo, useState } from "react";
import type { BuildTimeFormat, BuildingUpgradeRow } from "./buildingCatalog";
import { downloadTextFile, sanitizeFilenamePart } from "./upgradeLibraryUtils";
import type { SortEntry, SortKey, ThemeMode } from "./upgradeLibraryTypes";
import { buildCsvExport, filterHomeBaseRows, getAriaSort, getSortIndicator, sortLibraryRows } from "./upgradeLibrarySelection";
import { useDocumentTheme } from "./useDocumentTheme";
import { usePersistentState } from "./usePersistentState";

type CatalogState = {
  rows: BuildingUpgradeRow[];
  selectedTownHalls: number[];
  setSelectedTownHalls: (value: number[] | ((current: number[]) => number[])) => void;
  townHallLevels: number[];
  selectedTownHallSet: Set<number>;
  townHallFilterLabel: string;
  allTownHallsSelected: boolean;
};

export function useUpgradeLibraryControlsState(catalog: CatalogState) {
  const [search, setSearch] = useState("");
  const [sortEntries, setSortEntries] = useState<SortEntry[]>([{ key: "buildingClass", direction: "asc" }]);
  const [timeFormat, setTimeFormat] = usePersistentState<BuildTimeFormat>(
    "clash-builder-planner.time-format",
    "compact",
    (value) => (value === "total-minutes" ? "total-minutes" : "compact"),
    (value) => value,
  );
  const [theme, setTheme] = usePersistentState<ThemeMode>(
    "clash-builder-planner.theme",
    "light",
    (value) => (value === "dark" ? "dark" : "light"),
    (value) => value,
  );
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  useDocumentTheme(theme);

  const filteredRows = useMemo(
    () => filterHomeBaseRows(catalog.rows, deferredSearch, catalog.selectedTownHallSet),
    [catalog.rows, catalog.selectedTownHallSet, deferredSearch],
  );

  const displayedRows = useMemo(() => sortLibraryRows(filteredRows, sortEntries), [filteredRows, sortEntries]);

  const downloadFilteredCsv = () => {
    const csv = buildCsvExport(displayedRows, timeFormat);

    const filenameParts = ["clash-of-clans-upgrades"];
    if (catalog.selectedTownHalls.length > 0 && catalog.selectedTownHalls.length !== catalog.townHallLevels.length) {
      filenameParts.push(`th-${catalog.selectedTownHalls.map(String).join("-")}`);
    } else if (catalog.selectedTownHalls.length === 0) {
      filenameParts.push("th-none");
    } else {
      filenameParts.push("th-all");
    }
    if (search.trim()) {
      filenameParts.push(`search-${sanitizeFilenamePart(search)}`);
    }

    downloadTextFile(`${filenameParts.join("_")}.csv`, csv);
  };

  const setColumnSort = (key: SortKey, additive: boolean) => {
    setSortEntries((currentEntries) => {
      const existingIndex = currentEntries.findIndex((entry) => entry.key === key);

      if (!additive) {
        if (existingIndex === -1) {
          return [{ key, direction: "asc" }];
        }

        const currentEntry = currentEntries[existingIndex];
        if (currentEntry.direction === "asc") {
          return [{ key, direction: "desc" }];
        }

        return currentEntries.filter((entry) => entry.key !== key);
      }

      if (existingIndex === -1) {
        return [...currentEntries, { key, direction: "asc" }];
      }

      const nextEntries = [...currentEntries];
      const currentEntry = nextEntries[existingIndex];

      if (currentEntry.direction === "asc") {
        nextEntries[existingIndex] = { ...currentEntry, direction: "desc" };
        return nextEntries;
      }

      return nextEntries.filter((entry) => entry.key !== key);
    });
  };

  return {
    search,
    setSearch,
    timeFormat,
    setTimeFormat,
    theme,
    setTheme,
    displayedRows,
    downloadDisabled: filteredRows.length === 0,
    onDownloadCsv: downloadFilteredCsv,
    onSelectAllTownHalls: () => catalog.setSelectedTownHalls(catalog.allTownHallsSelected ? [] : catalog.townHallLevels),
    onToggleTownHall: (townHallLevel: number) => {
      catalog.setSelectedTownHalls((current) => {
        if (current.includes(townHallLevel)) {
          return current.filter((value) => value !== townHallLevel);
        }

        return [...current, townHallLevel].sort((a, b) => b - a);
      });
    },
    setColumnSort,
    getSortIndicator: (key: SortKey) => getSortIndicator(sortEntries, key),
    getAriaSort: (key: SortKey) => getAriaSort(sortEntries, key),
  };
}
