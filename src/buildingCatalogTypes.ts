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

export type BuildTimeFormat = "compact" | "hours" | "days" | "total-minutes";

export interface ClashKingBuildingLevel {
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

export interface ClashKingBuildingEntry {
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

export interface ClashKingHeroLevel {
  level: number;
  hitpoints: number;
  dps: number;
  upgrade_time: number;
  upgrade_cost: number;
  required_townhall: number;
  required_hero_tavern_level: number;
  strength_weight: number;
}

export interface ClashKingHeroEntry {
  _id: number;
  name: string;
  display_name?: string;
  raw_name?: string;
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

export interface ClashKingGuardianLevel {
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

export interface ClashKingGuardianEntry {
  _id: number;
  name: string;
  display_name?: string;
  raw_name?: string;
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

export interface ClashKingPetLevel {
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

export interface ClashKingPetEntry {
  _id: number;
  name: string;
  display_name?: string;
  raw_name?: string;
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
