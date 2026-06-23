import type { BuildingUpgradeRow, ClashKingBuildingEntry, ClashKingBuildingLevel } from "./buildingCatalogTypes";
import { deriveFamily } from "./buildingCatalogNames";
import { parseBuildTimeSeconds } from "./buildingCatalogTime";
import { withThumbnail } from "./buildingCatalogRowUtils";

export function rowsFromClashKingEntry(entry: ClashKingBuildingEntry) {
  const exportName = entry.TID.name || entry.name;
  const assetKey = exportName;
  const sourceLevels: ClashKingBuildingLevel[] =
    entry.levels.length > 0
      ? entry.levels
      : [
          {
            level: null,
            build_cost: 0,
            build_time: 0,
            required_townhall: 0,
            hitpoints: 0,
            dps: 0,
          },
        ];

  return sourceLevels.flatMap((levelEntry, index) => {
    const parts = parseBuildTimeSeconds(levelEntry.build_time);
    const baseRow = {
      id: `${entry._id}:${levelEntry.level ?? index + 1}`,
      name: entry.name,
      family: deriveFamily(entry.name, exportName),
      level: levelEntry.level,
      exportName,
      assetKey,
      buildingClass: entry.type,
      buildResource: entry.upgrade_resource,
      buildCost: levelEntry.build_cost,
      buildTimeDays: parts.buildTimeDays,
      buildTimeHours: parts.buildTimeHours,
      buildTimeMinutes: parts.buildTimeMinutes,
      buildTimeSeconds: parts.buildTimeSeconds,
      buildTimeTotalMinutes: parts.buildTimeTotalMinutes,
      townHallLevel: levelEntry.required_townhall,
      capitalHallLevel: null,
      width: entry.width,
      height: null,
      hitpoints: levelEntry.hitpoints,
      dps: levelEntry.dps,
      damage: levelEntry.damage ?? null,
      attackRange: levelEntry.attack_range ?? null,
      housingSpace: null,
      resourcePer100Hours: null,
      resourceMax: null,
      maxStoredGold: null,
      maxStoredElixir: null,
      maxStoredDarkElixir: null,
      village: entry.village === "builderBase" ? "Builder Base" : "Home",
      searchText: [
        entry.name,
        exportName,
        assetKey,
        entry.TID.name,
        entry.TID.info,
        entry.type,
        entry.upgrade_resource,
        entry.info,
        String(levelEntry.level ?? ""),
      ]
        .join(" ")
        .toLowerCase(),
    } satisfies Omit<BuildingUpgradeRow, "thumbnail">;

    const buildingRow = withThumbnail(baseRow);

    if (!levelEntry.weapon) {
      return [buildingRow];
    }

    const weaponRows = levelEntry.weapon.levels.map((weaponLevel, weaponIndex) => {
      const weaponBuildTime = parseBuildTimeSeconds(weaponLevel.build_time);
      return {
        id: `${entry._id}:${levelEntry.level ?? index + 1}:weapon:${weaponLevel.level}`,
        name: levelEntry.weapon?.name ?? `${entry.name} Weapon`,
        family: deriveFamily(levelEntry.weapon?.name ?? entry.name, levelEntry.weapon?.TID.name || exportName),
        level: weaponLevel.level,
        exportName: levelEntry.weapon?.TID.name || entry.TID.name || exportName,
        assetKey: `${assetKey}:weapon:${weaponIndex}`,
        buildingClass: `${entry.type} Weapon`,
        buildResource: levelEntry.weapon?.upgrade_resource ?? entry.upgrade_resource,
        buildCost: weaponLevel.build_cost,
        buildTimeDays: weaponBuildTime.buildTimeDays,
        buildTimeHours: weaponBuildTime.buildTimeHours,
        buildTimeMinutes: weaponBuildTime.buildTimeMinutes,
        buildTimeSeconds: weaponBuildTime.buildTimeSeconds,
        buildTimeTotalMinutes: weaponBuildTime.buildTimeTotalMinutes,
        townHallLevel: 17,
        capitalHallLevel: null,
        width: entry.width,
        height: null,
        hitpoints: 0,
        dps: weaponLevel.dps,
        damage: null,
        attackRange: weaponLevel.attack_range ?? null,
        housingSpace: null,
        resourcePer100Hours: null,
        resourceMax: null,
        maxStoredGold: null,
        maxStoredElixir: null,
        maxStoredDarkElixir: null,
        village: buildingRow.village,
        searchText: [
          entry.name,
          levelEntry.weapon?.name ?? "",
          levelEntry.weapon?.TID.name ?? "",
          entry.type,
          entry.upgrade_resource,
          entry.info,
          String(levelEntry.level ?? ""),
          String(weaponLevel.level),
        ]
          .join(" ")
          .toLowerCase(),
        thumbnail: buildingRow.thumbnail,
      } satisfies BuildingUpgradeRow;
    });

    return [buildingRow, ...weaponRows];
  });
}
