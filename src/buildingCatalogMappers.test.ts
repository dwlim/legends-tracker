import { describe, expect, it } from "vitest";

import { rowsFromClashKingEntry } from "./buildingCatalogBuildings";
import { rowsFromClashKingGuardianEntry } from "./buildingCatalogGuardians";
import { rowsFromClashKingHeroEntry } from "./buildingCatalogHeroes";
import { rowsFromClashKingPetEntry } from "./buildingCatalogPets";
import type {
  ClashKingBuildingEntry,
  ClashKingGuardianEntry,
  ClashKingHeroEntry,
  ClashKingPetEntry,
} from "./buildingCatalogTypes";

describe("building catalog mappers", () => {
  it("maps buildings and weapon rows", () => {
    const entry = {
      _id: 1,
      name: "Town Hall",
      info: "The heart of the village.",
      TID: {
        name: "TID_BUILDING_TOWN_HALL",
        info: "TID_TOWN_HALL_INFO",
      },
      type: "Town Hall",
      upgrade_resource: "Gold",
      village: "home",
      width: 4,
      superchargeable: false,
      levels: [
        {
          level: 17,
          build_cost: 15000000,
          build_time: 86400,
          required_townhall: 16,
          hitpoints: 9000,
          dps: 0,
          damage: 300,
          attack_range: 0,
          weapon: {
            name: "Town Hall Weapon",
            info: "Weapon info",
            TID: {
              name: "TID_TOWN_HALL_WEAPON",
              info: "TID_TOWN_HALL_WEAPON_INFO",
            },
            upgrade_resource: "Gold",
            strength_weight: 1,
            levels: [
              {
                level: 1,
                build_cost: 2500000,
                build_time: 3600,
                dps: 500,
                attack_range: 10,
              },
            ],
          },
        },
      ],
    } satisfies ClashKingBuildingEntry;

    const rows = rowsFromClashKingEntry(entry);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      id: "1:17",
      name: "Town Hall",
      level: 17,
      townHallLevel: 16,
      buildCost: 15000000,
      dps: 0,
      damage: 300,
    });
    expect(rows[1]).toMatchObject({
      id: "1:17:weapon:1",
      name: "Town Hall Weapon",
      level: 1,
      townHallLevel: 17,
      buildCost: 2500000,
      dps: 500,
      attackRange: 10,
    });
  });

  it("maps heroes with display names", () => {
    const entry = {
      _id: 2,
      name: "Barbarian King",
      display_name: "Barbarian King",
      raw_name: "Barbarian King",
      info: "King info",
      TID: {
        name: "TID_HERO_BARBARIAN_KING",
        info: "TID_HERO_BARBARIAN_KING_INFO",
      },
      production_building: "Hero Hall",
      production_building_level: 1,
      upgrade_resource: "Dark Elixir",
      is_flying: false,
      is_air_targeting: false,
      is_ground_targeting: true,
      movement_speed: 16,
      attack_speed: 1000,
      attack_range: 1,
      village: "home",
      levels: [
        {
          level: 1,
          hitpoints: 1000,
          dps: 100,
          upgrade_time: 7200,
          upgrade_cost: 50000,
          required_townhall: 7,
          required_hero_tavern_level: 1,
          strength_weight: 1,
        },
      ],
    } satisfies ClashKingHeroEntry;

    const [row] = rowsFromClashKingHeroEntry(entry);

    expect(row).toMatchObject({
      id: "2:1",
      name: "Barbarian King",
      family: "TID_HERO_BARBARIAN_KING",
      townHallLevel: 7,
      buildCost: 50000,
      buildTimeTotalMinutes: 120,
      attackRange: 1,
    });
  });

  it("maps guardians and pets with their level-specific stats", () => {
    const guardian = {
      _id: 29000000,
      name: "Longshot",
      display_name: "Longshot",
      raw_name: "InfernoArtillery",
      info: "Guardian info",
      TID: {
        name: "TID_INFERNO_GUARDIAN",
        info: "TID_INFERNO_GUARDIAN_INFO",
      },
      type: "RangedGuardian",
      upgrade_resource: "Elixir",
      village: "home",
      width: 0,
      superchargeable: false,
      levels: [
        {
          level: 1,
          build_cost: 18000000,
          build_time: 604800,
          upgrade_resource: "Elixir",
          activation_radius: 20,
          leap_time_ms: 750,
          leap_distance: 3,
          patrol_radius: 350,
          strength: 205000,
          town_hall_level: 18,
        },
      ],
      production_building: "Hero Hall",
      production_building_level: 18,
      is_flying: false,
      is_air_targeting: false,
      is_ground_targeting: true,
      attack_range: 20,
    } satisfies ClashKingGuardianEntry;

    const pet = {
      _id: 30000000,
      name: "L.A.S.S.I",
      display_name: "L.A.S.S.I",
      raw_name: "LASSI",
      info: "Pet info",
      TID: {
        name: "TID_PET_MELEEJUMPER",
        info: "TID_PET_MELEEJUMPER_INFO",
      },
      type: "Pet",
      upgrade_resource: "Dark Elixir",
      village: "home",
      width: 0,
      superchargeable: false,
      levels: [
        {
          level: 1,
          build_cost: 20000,
          build_time: 86400,
          upgrade_resource: "Dark Elixir",
          hitpoints: 2800,
          dps: 160,
          attack_range: 60,
          attack_speed: 900,
          speed: 400,
          town_hall_level: 14,
          laboratory_level: 1,
          housing_space: 20,
        },
      ],
      production_building: "Pet House",
      production_building_level: 1,
      attack_range: 60,
      is_flying: false,
      is_air_targeting: false,
      is_ground_targeting: true,
    } satisfies ClashKingPetEntry;

    const [guardianRow] = rowsFromClashKingGuardianEntry(guardian);
    const [petRow] = rowsFromClashKingPetEntry(pet);

    expect(guardianRow).toMatchObject({
      id: "29000000:1",
      name: "Longshot",
      townHallLevel: 18,
      buildCost: 18000000,
      hitpoints: 205000,
      attackRange: 20,
    });

    expect(petRow).toMatchObject({
      id: "30000000:1",
      name: "L.A.S.S.I",
      townHallLevel: 14,
      buildCost: 20000,
      housingSpace: 20,
      dps: 160,
      attackRange: 60,
    });
  });
});
