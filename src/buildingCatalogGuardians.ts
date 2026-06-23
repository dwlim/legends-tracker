import type { BuildingUpgradeRow, ClashKingGuardianEntry } from "./buildingCatalogTypes";
import { deriveFamily, displayNameFor } from "./buildingCatalogNames";
import { parseBuildTimeSeconds } from "./buildingCatalogTime";
import { withThumbnail } from "./buildingCatalogRowUtils";

export function rowsFromClashKingGuardianEntry(entry: ClashKingGuardianEntry) {
  const exportName = entry.TID.name || entry.name;
  const assetKey = exportName;
  const displayName = displayNameFor(entry);

  return entry.levels.map((levelEntry) => {
    const parts = parseBuildTimeSeconds(levelEntry.build_time);
    const baseRow = {
      id: `${entry._id}:${levelEntry.level}`,
      name: displayName,
      family: deriveFamily(displayName, exportName),
      level: levelEntry.level,
      exportName,
      assetKey,
      buildingClass: entry.type || "Guardian",
      buildResource: levelEntry.upgrade_resource || entry.upgrade_resource,
      buildCost: levelEntry.build_cost,
      buildTimeDays: parts.buildTimeDays,
      buildTimeHours: parts.buildTimeHours,
      buildTimeMinutes: parts.buildTimeMinutes,
      buildTimeSeconds: parts.buildTimeSeconds,
      buildTimeTotalMinutes: parts.buildTimeTotalMinutes,
      townHallLevel: levelEntry.town_hall_level,
      capitalHallLevel: null,
      width: entry.width,
      height: null,
      hitpoints: levelEntry.strength,
      dps: null,
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
        entry.type,
        String(levelEntry.level),
      ]
        .join(" ")
        .toLowerCase(),
    } satisfies Omit<BuildingUpgradeRow, "thumbnail">;

    return withThumbnail(baseRow);
  });
}
