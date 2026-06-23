import type {
  BuildTimeFormat,
  BuildingUpgradeRow,
  ClashKingBuildingEntry,
  ClashKingGuardianEntry,
  ClashKingHeroEntry,
  ClashKingPetEntry,
} from "./buildingCatalogTypes";
import {
  rowsFromClashKingEntry,
} from "./buildingCatalogBuildings";
import { rowsFromClashKingGuardianEntry } from "./buildingCatalogGuardians";
import { rowsFromClashKingHeroEntry } from "./buildingCatalogHeroes";
import { rowsFromClashKingPetEntry } from "./buildingCatalogPets";
export type { BuildTimeFormat, BuildingUpgradeRow } from "./buildingCatalogTypes";
export { formatBuildTimeLabelWithMode, formatResourceLabel, getBuildingThumbnail, partsFromSeconds } from "./buildingCatalogFormatters";

const DEFAULT_BUILDINGS_JSON_URL = `${import.meta.env.BASE_URL}data/clashking_buildings.json`;

export async function loadBuildingUpgrades(jsonUrl = DEFAULT_BUILDINGS_JSON_URL) {
  const jsonResponse = await fetch(jsonUrl);
  if (!jsonResponse.ok) {
    throw new Error(`Failed to load ${jsonUrl}: ${jsonResponse.status}`);
  }

  const payload = (await jsonResponse.json()) as {
    buildings?: ClashKingBuildingEntry[];
    heroes?: ClashKingHeroEntry[];
    guardians?: ClashKingGuardianEntry[];
    pets?: ClashKingPetEntry[];
  };

  const buildings = payload.buildings ?? [];
  const heroes = payload.heroes ?? [];
  const guardians = payload.guardians ?? [];
  const pets = payload.pets ?? [];

  return [
    ...buildings.flatMap((entry) => rowsFromClashKingEntry(entry)),
    ...heroes.flatMap((entry) => rowsFromClashKingHeroEntry(entry)),
    ...guardians.flatMap((entry) => rowsFromClashKingGuardianEntry(entry)),
    ...pets.flatMap((entry) => rowsFromClashKingPetEntry(entry)),
  ] satisfies BuildingUpgradeRow[];
}
