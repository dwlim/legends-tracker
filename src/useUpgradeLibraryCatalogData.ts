import { useEffect, useMemo, useRef, useState } from "react";
import type { BuildingUpgradeRow } from "./buildingCatalog";
import { loadBuildingUpgrades } from "./buildingCatalog";
import { normalizeTownHallLevel } from "./upgradeLibraryUtils";

export function useUpgradeLibraryCatalogData() {
  const [rows, setRows] = useState<BuildingUpgradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTownHalls, setSelectedTownHalls] = useState<number[]>([]);
  const townHallFilterInitialized = useRef(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    loadBuildingUpgrades()
      .then((nextRows) => {
        if (!mounted) return;
        setRows(nextRows);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load building data");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const townHallLevels = useMemo(() => {
    const levels = new Set<number>();

    for (const row of rows) {
      if (row.village !== "Home" || row.name.startsWith("Unused") || row.townHallLevel === null) {
        continue;
      }
      levels.add(normalizeTownHallLevel(row.townHallLevel) ?? 0);
    }

    return Array.from(levels).sort((a, b) => b - a);
  }, [rows]);

  useEffect(() => {
    if (townHallFilterInitialized.current || townHallLevels.length === 0) {
      return;
    }

    setSelectedTownHalls([townHallLevels[0]]);
    townHallFilterInitialized.current = true;
  }, [townHallLevels]);

  const selectedTownHallSet = useMemo(() => new Set(selectedTownHalls), [selectedTownHalls]);

  const townHallFilterLabel = useMemo(() => {
    if (selectedTownHalls.length === 0) {
      return "No TH";
    }

    if (selectedTownHalls.length === townHallLevels.length) {
      return "All TH";
    }

    if (selectedTownHalls.length === 1) {
      return `TH ${selectedTownHalls[0]}`;
    }

    return `${selectedTownHalls.length} TH levels`;
  }, [selectedTownHalls, townHallLevels.length]);

  const allTownHallsSelected = townHallLevels.length > 0 && selectedTownHalls.length === townHallLevels.length;

  return {
    rows,
    loading,
    error,
    selectedTownHalls,
    setSelectedTownHalls,
    townHallLevels,
    selectedTownHallSet,
    townHallFilterLabel,
    allTownHallsSelected,
  };
}
