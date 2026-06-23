import type { BuildingUpgradeRow, ClashKingHeroEntry } from "./buildingCatalogTypes";
import { deriveFamily, displayNameFor } from "./buildingCatalogNames";
import { withThumbnail } from "./buildingCatalogRowUtils";

export function rowsFromClashKingHeroEntry(entry: ClashKingHeroEntry) {
  const exportName = entry.TID.name || entry.name;
  const assetKey = exportName;
  const displayName = displayNameFor(entry);

  return entry.levels.map((levelEntry) => {
    const baseRow = {
      id: `${entry._id}:${levelEntry.level}`,
      name: displayName,
      family: deriveFamily(displayName, exportName),
      level: levelEntry.level,
      exportName,
      assetKey,
      buildingClass: "Hero",
      buildResource: entry.upgrade_resource,
      buildCost: levelEntry.upgrade_cost,
      buildTimeDays: Math.floor(levelEntry.upgrade_time / 86400) || null,
      buildTimeHours: Math.floor((levelEntry.upgrade_time % 86400) / 3600) || null,
      buildTimeMinutes: Math.floor((levelEntry.upgrade_time % 3600) / 60) || null,
      buildTimeSeconds: Math.max(0, Math.round(levelEntry.upgrade_time % 60)) || null,
      buildTimeTotalMinutes: levelEntry.upgrade_time / 60,
      townHallLevel: levelEntry.required_townhall,
      capitalHallLevel: null,
      width: null,
      height: null,
      hitpoints: levelEntry.hitpoints,
      dps: levelEntry.dps,
      damage: null,
      attackRange: entry.attack_range,
      housingSpace: null,
      resourcePer100Hours: null,
      resourceMax: null,
      maxStoredGold: null,
      maxStoredElixir: null,
      maxStoredDarkElixir: null,
      village: "Home",
      searchText: [
        displayName,
        entry.info,
        entry.TID.name,
        entry.TID.info,
        entry.production_building,
        String(levelEntry.level),
      ]
        .join(" ")
        .toLowerCase(),
    } satisfies Omit<BuildingUpgradeRow, "thumbnail">;

    return withThumbnail(baseRow);
  });
}
