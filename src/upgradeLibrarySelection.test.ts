import { describe, expect, it } from "vitest";

import { buildCsvExport, buildSelectionTotals, filterHomeBaseRows, sortLibraryRows } from "./upgradeLibrarySelection";
import type { BuildingUpgradeRow } from "./buildingCatalog";

function makeRow(overrides: Partial<BuildingUpgradeRow>): BuildingUpgradeRow {
  return {
    id: "row",
    name: "Town Hall",
    family: "Town Hall",
    level: 1,
    exportName: "Town Hall",
    assetKey: "Town Hall",
    buildingClass: "Town Hall",
    buildResource: "Gold",
    buildCost: 1000,
    buildTimeDays: 0,
    buildTimeHours: 0,
    buildTimeMinutes: 10,
    buildTimeSeconds: 0,
    buildTimeTotalMinutes: 10,
    townHallLevel: 1,
    capitalHallLevel: null,
    width: 4,
    height: null,
    hitpoints: 100,
    dps: 0,
    damage: null,
    attackRange: null,
    housingSpace: null,
    resourcePer100Hours: null,
    resourceMax: null,
    maxStoredGold: null,
    maxStoredElixir: null,
    maxStoredDarkElixir: null,
    village: "Home",
    searchText: "town hall gold",
    thumbnail: "",
    ...overrides,
  };
}

describe("upgradeLibrarySelection", () => {
  it("filters only home base rows that match search and town hall", () => {
    const rows = [
      makeRow({ id: "a", townHallLevel: 1, searchText: "archer tower" }),
      makeRow({ id: "b", townHallLevel: 2, searchText: "cannon", village: "Builder Base", buildingClass: "Defense" }),
      makeRow({ id: "c", townHallLevel: 1, searchText: "gold mine" }),
    ];

    const filtered = filterHomeBaseRows(rows, "gold", new Set([1]));
    expect(filtered.map((row) => row.id)).toEqual(["c"]);
  });

  it("sorts by class then name and falls back to stable order", () => {
    const rows = [
      makeRow({ id: "b", name: "Beta", buildingClass: "Defense" }),
      makeRow({ id: "a", name: "Alpha", buildingClass: "Defense" }),
      makeRow({ id: "c", name: "Gamma", buildingClass: "Army" }),
    ];

    const sorted = sortLibraryRows(rows, [{ key: "buildingClass", direction: "asc" }, { key: "name", direction: "asc" }]);
    expect(sorted.map((row) => row.id)).toEqual(["c", "a", "b"]);
  });

  it("formats totals and CSV export from selected rows", () => {
    const rows = [
      makeRow({ id: "a", buildResource: "Gold", buildCost: 1000, buildTimeTotalMinutes: 90 }),
      makeRow({ id: "b", buildResource: "Elixir", buildCost: 2000, buildTimeTotalMinutes: 30 }),
    ];

    const totals = buildSelectionTotals(rows);
    expect(totals.count).toBe(2);
    expect(totals.costByResource).toEqual([
      ["Gold", 1000],
      ["Elixir", 2000],
    ]);
    expect(totals.timeMinutes).toBe(120);

    const csv = buildCsvExport(rows, "compact");
    expect(csv).toContain("Town Hall");
    expect(csv).toContain("1h 30m");
  });
});
