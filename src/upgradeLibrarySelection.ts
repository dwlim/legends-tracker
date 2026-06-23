import type { MouseEvent, Dispatch, SetStateAction } from "react";
import type { BuildTimeFormat, BuildingUpgradeRow } from "./buildingCatalog";
import { formatResourceLabel } from "./buildingCatalog";
import type { SortEntry, SortKey } from "./upgradeLibraryTypes";
import { escapeCsvValue, formatTotalMinutes, normalizeTownHallLevel } from "./upgradeLibraryUtils";

export type SelectionAnchor = {
  rowId: string;
};

export function filterHomeBaseRows(rows: BuildingUpgradeRow[], search: string, selectedTownHallSet: Set<number>) {
  return rows.filter((row) => {
    if (row.village !== "Home" || row.name.startsWith("Unused")) {
      return false;
    }

    const normalizedTownHallLevel = normalizeTownHallLevel(row.townHallLevel);
    if (selectedTownHallSet.size === 0 || normalizedTownHallLevel === null || !selectedTownHallSet.has(normalizedTownHallLevel)) {
      return false;
    }

    if (search && !row.searchText.includes(search)) {
      return false;
    }

    return true;
  });
}

export function sortLibraryRows(rows: BuildingUpgradeRow[], sortEntries: SortEntry[]) {
  const indexedRows = rows.map((row, index) => ({ row, index }));

  const compareText = (left: string, right: string) => left.localeCompare(right, "en-US", { sensitivity: "base" });
  const compareNumber = (left: number | null, right: number | null) => {
    if (left === right) {
      return 0;
    }
    if (left === null) return 1;
    if (right === null) return -1;
    return left - right;
  };

  indexedRows.sort((left, right) => {
    for (const entry of sortEntries) {
      let comparison = 0;

      switch (entry.key) {
        case "name":
          comparison = compareText(left.row.name, right.row.name);
          break;
        case "buildingClass":
          comparison = compareText(left.row.buildingClass || "Unknown", right.row.buildingClass || "Unknown");
          break;
        case "level":
          comparison = compareNumber(left.row.level, right.row.level);
          break;
        case "townHallLevel":
          comparison = compareNumber(
            normalizeTownHallLevel(left.row.townHallLevel),
            normalizeTownHallLevel(right.row.townHallLevel),
          );
          break;
        case "buildResource":
          comparison = compareText(formatResourceLabel(left.row.buildResource), formatResourceLabel(right.row.buildResource));
          break;
        case "buildCost":
          comparison = compareNumber(left.row.buildCost, right.row.buildCost);
          break;
        case "buildTime":
          comparison = compareNumber(left.row.buildTimeTotalMinutes, right.row.buildTimeTotalMinutes);
          break;
        case "hitpoints":
          comparison = compareNumber(left.row.hitpoints, right.row.hitpoints);
          break;
        case "dps":
          comparison = compareNumber(left.row.dps, right.row.dps);
          break;
      }

      if (comparison !== 0) {
        return entry.direction === "asc" ? comparison : -comparison;
      }
    }

    const fallbackName = compareText(left.row.name, right.row.name);
    if (fallbackName !== 0) {
      return fallbackName;
    }

    return left.index - right.index;
  });

  return indexedRows.map(({ row }) => row);
}

export function buildSelectionTotals(selectedRows: BuildingUpgradeRow[]) {
  const costByResource = new Map<string, number>();
  let totalMinutes = 0;

  for (const row of selectedRows) {
    const resourceKey = formatResourceLabel(row.buildResource);
    costByResource.set(resourceKey, (costByResource.get(resourceKey) ?? 0) + (row.buildCost ?? 0));
    totalMinutes += row.buildTimeTotalMinutes;
  }

  return {
    count: selectedRows.length,
    costByResource: Array.from(costByResource.entries()),
    timeMinutes: totalMinutes,
  };
}

export function getSortIndicator(sortEntries: SortEntry[], key: SortKey) {
  const index = sortEntries.findIndex((entry) => entry.key === key);
  if (index === -1) {
    return "";
  }

  const entry = sortEntries[index];
  return `${entry.direction === "asc" ? "↑" : "↓"}${index > 0 ? index + 1 : ""}`;
}

export function getAriaSort(sortEntries: SortEntry[], key: SortKey) {
  if (sortEntries[0]?.key !== key) {
    return "none";
  }

  return sortEntries[0].direction === "asc" ? "ascending" : "descending";
}

export function buildCsvExport(rows: BuildingUpgradeRow[], timeFormat: BuildTimeFormat) {
  const headers = ["Name", "Class", "Level", "Town Hall", "Resource", "Cost", "Time", "HP", "DPS"];
  const rowsForExport = rows.map((row) => [
    row.name,
    row.buildingClass || "Unknown",
    row.level === null || row.level === undefined ? "—" : String(row.level),
    row.townHallLevel === null ? "—" : `TH ${normalizeTownHallLevel(row.townHallLevel) ?? 0}`,
    formatResourceLabel(row.buildResource),
    row.buildCost === null || row.buildCost === undefined ? "—" : row.buildCost.toLocaleString("en-US"),
    formatTotalMinutes(row.buildTimeTotalMinutes, timeFormat),
    row.hitpoints === null || row.hitpoints === undefined ? "—" : row.hitpoints.toLocaleString("en-US"),
    row.dps === null || row.dps === undefined ? "—" : row.dps.toLocaleString("en-US"),
  ]);

  return [headers, ...rowsForExport]
    .map((line) => line.map((value) => escapeCsvValue(String(value))).join(","))
    .join("\n");
}

export function replaceSelectionRange(displayedRows: BuildingUpgradeRow[], startIndex: number, endIndex: number) {
  const lower = Math.min(startIndex, endIndex);
  const upper = Math.max(startIndex, endIndex);
  return displayedRows.slice(lower, upper + 1).map((row) => row.id);
}

export function nextRowSelection(
  current: string[],
  rowId: string,
) {
  return current.includes(rowId) ? current.filter((id) => id !== rowId) : [...current, rowId];
}

export function handleSelectionMouseDown(
  event: MouseEvent<HTMLTableRowElement>,
  rowIndex: number,
  rowId: string,
  displayedRows: BuildingUpgradeRow[],
  selectionAnchorRef: { current: SelectionAnchor | null },
  suppressNextClickRef: { current: boolean },
  setSelectedRowIds: Dispatch<SetStateAction<string[]>>,
) {
  if (event.button !== 0) {
    return false;
  }

  const additive = event.metaKey || event.ctrlKey;
  const shift = event.shiftKey;
  if (!additive && !shift) {
    return false;
  }

  event.preventDefault();
  suppressNextClickRef.current = true;

  if (shift) {
    const anchorId = selectionAnchorRef.current?.rowId;
    const anchorIndex = anchorId ? displayedRows.findIndex((row) => row.id === anchorId) : -1;
    const nextIds = anchorIndex === -1 ? replaceSelectionRange(displayedRows, rowIndex, rowIndex) : replaceSelectionRange(displayedRows, anchorIndex, rowIndex);
    setSelectedRowIds(nextIds);
    selectionAnchorRef.current = { rowId };
    return true;
  }

  if (additive) {
    setSelectedRowIds((current) => nextRowSelection(current, rowId));
    selectionAnchorRef.current = { rowId };
    return true;
  }

  setSelectedRowIds([rowId]);
  selectionAnchorRef.current = { rowId };
  return true;
}

export function handleSelectionClick(
  event: MouseEvent<HTMLTableRowElement>,
  rowId: string,
  suppressNextClickRef: { current: boolean },
  selectionAnchorRef: { current: SelectionAnchor | null },
  setSelectedRowIds: Dispatch<SetStateAction<string[]>>,
) {
  if (suppressNextClickRef.current) {
    suppressNextClickRef.current = false;
    return;
  }

  if (event.button !== 0) {
    return;
  }

  setSelectedRowIds([rowId]);
  selectionAnchorRef.current = { rowId };
}
