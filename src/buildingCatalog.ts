export type VillageFilter = "all" | "Home" | "Builder Base" | "Capital" | "War" | "Other";

export interface BuildingUpgradeRow {
  id: string;
  name: string;
  family: string;
  level: number | null;
  exportName: string;
  assetKey: string;
  buildingClass: string;
  buildResource: string;
  buildCost: number | null;
  buildTimeDays: number | null;
  buildTimeHours: number | null;
  buildTimeMinutes: number | null;
  buildTimeSeconds: number | null;
  buildTimeTotalMinutes: number;
  townHallLevel: number | null;
  capitalHallLevel: number | null;
  width: number | null;
  height: number | null;
  hitpoints: number | null;
  dps: number | null;
  damage: number | null;
  attackRange: number | null;
  housingSpace: number | null;
  resourcePer100Hours: number | null;
  resourceMax: number | null;
  maxStoredGold: number | null;
  maxStoredElixir: number | null;
  maxStoredDarkElixir: number | null;
  village: Exclude<VillageFilter, "all">;
  searchText: string;
  thumbnail: string;
}

interface ClashKingBuildingLevel {
  level: number | null;
  build_cost: number;
  build_time: number;
  required_townhall: number;
  hitpoints: number;
  dps: number;
  attack_range?: number;
  strength_weight?: number;
  damage?: number;
  weapon?: {
    name: string;
    info: string;
    TID: {
      name: string;
      info: string;
    };
    upgrade_resource: string;
    strength_weight: number;
    levels: Array<{
      level: number;
      build_cost: number;
      build_time: number;
      dps: number;
      attack_range?: number;
    }>;
  };
}

interface ClashKingBuildingEntry {
  _id: number;
  name: string;
  info: string;
  TID: {
    name: string;
    info: string;
  };
  type: string;
  upgrade_resource: string;
  village: "home" | "builderBase";
  width: number;
  superchargeable: boolean;
  levels: ClashKingBuildingLevel[];
}

interface ClashKingHeroLevel {
  level: number;
  hitpoints: number;
  dps: number;
  upgrade_time: number;
  upgrade_cost: number;
  required_townhall: number;
  required_hero_tavern_level: number;
  strength_weight: number;
}

interface ClashKingHeroEntry {
  _id: number;
  name: string;
  info: string;
  TID: {
    name: string;
    info: string;
  };
  production_building: string;
  production_building_level: number;
  upgrade_resource: string;
  is_flying: boolean;
  is_air_targeting: boolean;
  is_ground_targeting: boolean;
  movement_speed: number;
  attack_speed: number;
  attack_range: number;
  village: "home";
  levels: ClashKingHeroLevel[];
}

interface ClashKingGuardianLevel {
  level: number;
  build_cost: number;
  build_time: number;
  upgrade_resource: string;
  activation_radius: number | null;
  leap_time_ms: number | null;
  leap_distance: number | null;
  patrol_radius: number | null;
  strength: number;
  town_hall_level: number | null;
}

interface ClashKingGuardianEntry {
  _id: number;
  name: string;
  info: string;
  TID: {
    name: string;
    info: string;
  };
  type: string;
  upgrade_resource: string;
  village: "home";
  width: number;
  superchargeable: boolean;
  levels: ClashKingGuardianLevel[];
  production_building: string;
  production_building_level: number;
  is_flying: boolean;
  is_air_targeting: boolean;
  is_ground_targeting: boolean;
  attack_range: number;
}

interface ClashKingPetLevel {
  level: number;
  build_cost: number;
  build_time: number;
  upgrade_resource: string;
  hitpoints: number;
  dps: number;
  attack_range: number | null;
  attack_speed: number | null;
  speed: number | null;
  town_hall_level: number | null;
  laboratory_level: number | null;
  housing_space: number | null;
}

interface ClashKingPetEntry {
  _id: number;
  name: string;
  info: string;
  TID: {
    name: string;
    info: string;
  };
  type: string;
  upgrade_resource: string;
  village: "home";
  width: number;
  superchargeable: boolean;
  levels: ClashKingPetLevel[];
  production_building: string;
  production_building_level: number;
  attack_range: number;
  is_flying: boolean;
  is_air_targeting: boolean;
  is_ground_targeting: boolean;
}

const THUMBNAIL_COLORS: Record<string, string> = {
  Home: "#4dd6ff",
  Defense: "#ff7b9c",
  Resource: "#72f0b2",
  Army: "#ffd166",
  Hero: "#ff9f43",
  Guardian: "#7f8cff",
  Pet: "#9be564",
  Wall: "#b48dff",
  Other: "#93a4b8",
  Capital: "#b48dff",
  Builder: "#72f0b2",
};

const DEFAULT_BUILDINGS_JSON_URL = `${import.meta.env.BASE_URL}data/clashking_buildings.json`;

function partsFromSeconds(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.max(0, Math.round(totalSeconds % 60));
  return {
    buildTimeDays: days || null,
    buildTimeHours: hours || null,
    buildTimeMinutes: minutes || null,
    buildTimeSeconds: seconds || null,
    buildTimeTotalMinutes: totalSeconds / 60,
  };
}

function secondsToParts(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.max(0, Math.round(totalSeconds % 60));
  return { days, hours, minutes, seconds };
}

function computeBuildTimeMinutes(
  days: number | null,
  hours: number | null,
  minutes: number | null,
  seconds: number | null,
) {
  return (days ?? 0) * 24 * 60 + (hours ?? 0) * 60 + (minutes ?? 0) + (seconds ?? 0) / 60;
}

function parseBuildTimeSeconds(totalSeconds: number) {
  const { days, hours, minutes, seconds } = secondsToParts(totalSeconds);
  return {
    buildTimeDays: days || null,
    buildTimeHours: hours || null,
    buildTimeMinutes: minutes || null,
    buildTimeSeconds: seconds || null,
    buildTimeTotalMinutes: computeBuildTimeMinutes(days, hours, minutes, seconds),
  };
}

function deriveFamily(name: string, exportName: string) {
  const source = exportName || name;
  return source
    .replace(/(_lvl\d+.*)$/i, "")
    .replace(/(_level\d+.*)$/i, "")
    .replace(/(_upg|_upgrade|_const|_base|_setup|_idle|_attack|_broken|_locked|_v\d+).*$/i, "")
    .replace(/[_-]+$/, "")
    .trim();
}

function shortLabel(row: BuildingUpgradeRow) {
  const source = row.name || row.exportName;
  const parts = source
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

type ThumbnailSource = Pick<BuildingUpgradeRow, "name" | "exportName" | "buildingClass" | "village">;

export function getBuildingThumbnail(row: ThumbnailSource) {
  const label = shortLabel(row);
  const color = THUMBNAIL_COLORS[row.buildingClass] ?? THUMBNAIL_COLORS[row.village] ?? "#93a4b8";
  const accent = row.buildingClass === "Defense" ? "#0f172a" : "#08111b";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none">
      <defs>
        <linearGradient id="g" x1="12" y1="10" x2="84" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.95" />
          <stop offset="100%" stop-color="${accent}" stop-opacity="0.98" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="88" height="88" rx="22" fill="url(#g)" />
      <circle cx="48" cy="36" r="17" fill="white" fill-opacity="0.16" />
      <path d="M48 24 L56 35 L48 46 L40 35 Z" fill="white" fill-opacity="0.22" />
      <rect x="26" y="56" width="44" height="10" rx="5" fill="white" fill-opacity="0.18" />
      <text x="48" y="72" fill="white" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="800" text-anchor="middle">${label}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;
}

export function formatBuildTimeLabel(row: BuildingUpgradeRow) {
  return formatBuildTimeLabelWithMode(row, "compact");
}

export type BuildTimeFormat = "compact" | "hours" | "days" | "total-minutes";

export function formatBuildTimeLabelWithMode(row: BuildingUpgradeRow, format: BuildTimeFormat) {
  if (format === "total-minutes") {
    const minutes = row.buildTimeTotalMinutes;
    if (Number.isInteger(minutes)) {
      return `${minutes.toLocaleString("en-US")}m`;
    }

    return `${minutes.toLocaleString("en-US", {
      maximumFractionDigits: 1,
    })}m`;
  }

  if (format === "hours") {
    const totalHours = row.buildTimeTotalMinutes / 60;
    if (Number.isInteger(totalHours)) {
      return `${totalHours.toLocaleString("en-US")}h`;
    }

    return `${totalHours.toLocaleString("en-US", {
      maximumFractionDigits: 1,
    })}h`;
  }

  if (format === "days") {
    const totalDays = row.buildTimeTotalMinutes / (24 * 60);
    if (Number.isInteger(totalDays)) {
      return `${totalDays.toLocaleString("en-US")}d`;
    }

    return `${totalDays.toLocaleString("en-US", {
      maximumFractionDigits: 1,
    })}d`;
  }

  const parts: string[] = [];
  if (row.buildTimeDays) parts.push(`${row.buildTimeDays}d`);
  if (row.buildTimeHours) parts.push(`${row.buildTimeHours}h`);
  if (row.buildTimeMinutes) parts.push(`${row.buildTimeMinutes}m`);
  if (row.buildTimeSeconds) parts.push(`${row.buildTimeSeconds}s`);
  return parts.length > 0 ? parts.join(" ") : "0m";
}

export function formatResourceLabel(resource: string) {
  if (resource === "Gold2") return "Builder Gold";
  if (resource === "Elixir2") return "Builder Elixir";
  if (resource === "Gold") return "Gold";
  if (resource === "Elixir") return "Elixir";
  if (resource === "DarkElixir" || resource === "Dark Elixir") return "Dark Elixir";
  if (resource === "Builder Gold") return "Builder Gold";
  if (resource === "Builder Elixir") return "Builder Elixir";
  return resource || "Unknown";
}

function rowsFromClashKingEntry(entry: ClashKingBuildingEntry) {
  const exportName = entry.TID.name || entry.name;
  const assetKey = exportName;
  const sourceLevels = entry.levels.length > 0 ? entry.levels : [
      {
        level: null,
        build_cost: 0,
        build_time: 0,
        required_townhall: 0,
        hitpoints: 0,
        dps: 0,
      } satisfies ClashKingBuildingLevel,
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

    const buildingRow = {
      ...baseRow,
      thumbnail: getBuildingThumbnail(baseRow),
    } satisfies BuildingUpgradeRow;

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

function rowsFromClashKingHeroEntry(entry: ClashKingHeroEntry) {
  const exportName = entry.TID.name || entry.name;
  const assetKey = exportName;

  return entry.levels.map((levelEntry) => {
    const baseRow = {
      id: `${entry._id}:${levelEntry.level}`,
      name: entry.name,
      family: deriveFamily(entry.name, exportName),
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
        entry.name,
        entry.info,
        entry.TID.name,
        entry.TID.info,
        entry.production_building,
        String(levelEntry.level),
      ]
        .join(" ")
        .toLowerCase(),
    } satisfies Omit<BuildingUpgradeRow, "thumbnail">;

    return {
      ...baseRow,
      thumbnail: getBuildingThumbnail(baseRow),
    } satisfies BuildingUpgradeRow;
  });
}

function rowsFromClashKingGuardianEntry(entry: ClashKingGuardianEntry) {
  const exportName = entry.TID.name || entry.name;
  const assetKey = exportName;

  return entry.levels.map((levelEntry) => {
    const parts = partsFromSeconds(levelEntry.build_time);
    const baseRow = {
      id: `${entry._id}:${levelEntry.level}`,
      name: entry.name,
      family: deriveFamily(entry.name, exportName),
      level: levelEntry.level,
      exportName,
      assetKey,
      buildingClass: "Guardian",
      buildResource: levelEntry.upgrade_resource || entry.upgrade_resource,
      buildCost: levelEntry.build_cost,
      buildTimeDays: parts.buildTimeDays,
      buildTimeHours: parts.buildTimeHours,
      buildTimeMinutes: parts.buildTimeMinutes,
      buildTimeSeconds: parts.buildTimeSeconds,
      buildTimeTotalMinutes: parts.buildTimeTotalMinutes,
      townHallLevel: levelEntry.town_hall_level ?? 18,
      capitalHallLevel: null,
      width: null,
      height: null,
      hitpoints: levelEntry.strength,
      dps: null,
      damage: null,
      attackRange: levelEntry.activation_radius,
      housingSpace: null,
      resourcePer100Hours: null,
      resourceMax: null,
      maxStoredGold: null,
      maxStoredElixir: null,
      maxStoredDarkElixir: null,
      village: "Home",
      searchText: [
        entry.name,
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

    return {
      ...baseRow,
      thumbnail: getBuildingThumbnail(baseRow),
    } satisfies BuildingUpgradeRow;
  });
}

function rowsFromClashKingPetEntry(entry: ClashKingPetEntry) {
  const exportName = entry.TID.name || entry.name;
  const assetKey = exportName;

  return entry.levels.map((levelEntry) => {
    const parts = partsFromSeconds(levelEntry.build_time);
    const baseRow = {
      id: `${entry._id}:${levelEntry.level}`,
      name: entry.name,
      family: deriveFamily(entry.name, exportName),
      level: levelEntry.level,
      exportName,
      assetKey,
      buildingClass: "Pet",
      buildResource: levelEntry.upgrade_resource || entry.upgrade_resource,
      buildCost: levelEntry.build_cost,
      buildTimeDays: parts.buildTimeDays,
      buildTimeHours: parts.buildTimeHours,
      buildTimeMinutes: parts.buildTimeMinutes,
      buildTimeSeconds: parts.buildTimeSeconds,
      buildTimeTotalMinutes: parts.buildTimeTotalMinutes,
      townHallLevel: levelEntry.town_hall_level,
      capitalHallLevel: null,
      width: null,
      height: null,
      hitpoints: levelEntry.hitpoints,
      dps: levelEntry.dps,
      damage: null,
      attackRange: levelEntry.attack_range,
      housingSpace: levelEntry.housing_space,
      resourcePer100Hours: null,
      resourceMax: null,
      maxStoredGold: null,
      maxStoredElixir: null,
      maxStoredDarkElixir: null,
      village: "Home",
      searchText: [
        entry.name,
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

    return {
      ...baseRow,
      thumbnail: getBuildingThumbnail(baseRow),
    } satisfies BuildingUpgradeRow;
  });
}

export async function loadBuildingUpgrades(
  jsonUrl = DEFAULT_BUILDINGS_JSON_URL,
) {
  const jsonResponse = await fetch(jsonUrl);

  if (jsonResponse.ok) {
    const payload = (await jsonResponse.json()) as {
      buildings?: ClashKingBuildingEntry[];
      heroes?: ClashKingHeroEntry[];
      guardians?: ClashKingGuardianEntry[];
      pets?: ClashKingPetEntry[];
    };
    const buildings = payload.buildings ?? [];
    const buildingRows = buildings.flatMap((entry) => rowsFromClashKingEntry(entry));
    const parseRows = <T,>(rows: T[], mapper: (entry: T) => BuildingUpgradeRow[], label: string) => {
      try {
        return rows.flatMap((entry) => mapper(entry));
      } catch (error) {
        console.error(`Failed to parse ${label} rows`, error);
        return [];
      }
    };

    const heroRows = parseRows(payload.heroes ?? [], rowsFromClashKingHeroEntry, "hero");
    const guardianRows = parseRows(payload.guardians ?? [], rowsFromClashKingGuardianEntry, "guardian");
    const petRows = parseRows(payload.pets ?? [], rowsFromClashKingPetEntry, "pet");
    return [...buildingRows, ...heroRows, ...guardianRows, ...petRows];
  }

  throw new Error(`Failed to load ${jsonUrl}: ${jsonResponse.status}`);
}
