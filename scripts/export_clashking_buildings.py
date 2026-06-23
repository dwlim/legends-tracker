#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import io
import json
import lzma
import re
import urllib.request
import zipfile
from pathlib import Path


BUILDING_HOME_NAMES = {
    "Army Camp",
    "Town Hall",
    "Elixir Collector",
    "Elixir Storage",
    "Gold Mine",
    "Gold Storage",
    "Barracks",
    "Laboratory",
    "Cannon",
    "Archer Tower",
    "Wall",
    "Wizard Tower",
    "Air Defense",
    "Mortar",
    "Clan Castle",
    "Builder's Hut",
    "Hidden Tesla",
    "Spell Factory",
    "X-Bow",
    "Dark Elixir Drill",
    "Dark Elixir Storage",
    "Dark Barracks",
    "Inferno Tower",
    "Air Sweeper",
    "Dark Spell Factory",
    "Eagle Artillery",
    "Bomb Tower",
    "Workshop",
    "B.O.B's Hut",
    "Scattershot",
    "Pet House",
    "Blacksmith",
    "Hero Hall",
    "Spell Tower",
    "Monolith",
    "Multi-Gear Tower",
    "Sour Elixir Cauldron",
    "Multi-Archer Tower",
    "Ricochet Cannon",
    "Revenge Tower",
    "Firespitter",
    "Helper Hut",
    "Crafting Station",
    "Super Wizard Tower",
}

NO_LEVEL_BUILDINGS = {
    "B.O.B's Hut",
    "Helper Hut",
    "Sour Elixir Cauldron",
    "Crafting Station",
}

SUPERCHARGEABLE_NAMES = {
    "Elixir Collector",
    "Gold Mine",
    "Wizard Tower",
    "Air Defense",
    "Mortar",
    "Builder's Hut",
    "Hidden Tesla",
    "X-Bow",
    "Dark Elixir Drill",
    "Inferno Tower",
    "Bomb Tower",
    "Scattershot",
    "Monolith",
    "Multi-Gear Tower",
    "Multi-Archer Tower",
    "Ricochet Cannon",
    "Revenge Tower",
    "Firespitter",
    "Super Wizard Tower",
}

BUILDING_NAME_ALIASES = {
    "Builders Hut": "Builder's Hut",
    "BOBs Hut": "B.O.B's Hut",
    "Siege Workshop": "Workshop",
    "Multi Archer Tower": "Multi-Archer Tower",
    "Multi Gear Tower": "Multi-Gear Tower",
}

HERO_ID_BY_NAME = {
    "Barbarian King": 28000000,
    "Archer Queen": 28000001,
    "Grand Warden": 28000002,
    "Battle Machine": 28000003,
    "Royal Champion": 28000004,
    "Battle Copter": 28000005,
    "Minion Prince": 28000006,
    "Dragon Duke": 28000007,
}

TOWN_HALL_UNLOCK_NAMES = {
    "Army Camp",
    "Elixir Storage",
    "Gold Storage",
    "Elixir Collector",
    "Gold Mine",
    "Barracks",
    "Cannon",
    "Clan Castle",
    "Builder's Hut",
    "B.O.B's Hut",
    "Wall",
    "Archer Tower",
    "Mortar",
    "Bomb",
    "Laboratory",
    "Air Defense",
    "Spring Trap",
    "Hero Hall",
    "Wizard Tower",
    "Spell Factory",
    "Air Bomb",
    "Giant Bomb",
    "Air Sweeper",
    "Hidden Tesla",
    "Dark Elixir Drill",
    "Dark Elixir Storage",
    "Seeking Air Mine",
    "Dark Barracks",
    "Dark Spell Factory",
    "Skeleton Trap",
    "Bomb Tower",
    "Blacksmith",
    "X-Bow",
    "Helper Hut",
    "Inferno Tower",
    "Eagle Artillery",
    "Tornado Trap",
    "Workshop",
    "Scattershot",
    "Pet House",
    "Spell Tower",
    "Monolith",
    "Multi-Archer Tower",
    "Ricochet Cannon",
    "Firespitter",
    "Giga Bomb",
    "Multi-Gear Tower",
    "Crafting Station",
    "Revenge Tower",
    "Super Wizard Tower",
}

SPECIAL_BLOCK_NAME_EXCLUDES = (
    re.compile(r"teaser", re.I),
    re.compile(r"upgrading", re.I),
    re.compile(r"tutorial", re.I),
    re.compile(r"unused", re.I),
)


def decode_supercell_csv(raw: bytes, expected_prefixes: tuple[str, ...] = ("Name",)) -> str:
    """
    Decode Supercell's compressed CSV payload.

    The payload is usually LZMA-compressed with a four-byte zero spacer inserted
    after byte 8. Some files also carry a short header before the compressed
    payload, so we probe a few offsets.
    """

    candidates = []
    for start in (0, 4, 8, 9, 12, 16, 32, 64, 68):
        if start >= len(raw):
            continue
        chunk = raw[start:]
        for insert in (None, 8, 9, 10, 12):
            payload = chunk if insert is None else chunk[:insert] + b"\x00" * 4 + chunk[insert:]
            candidates.append(payload)

    for payload in candidates:
        try:
            decoded = lzma.decompress(payload, format=lzma.FORMAT_AUTO)
        except Exception:
            continue
        try:
            text = decoded.decode("utf-8")
        except UnicodeDecodeError:
            continue
        if any(text.startswith(f'"{prefix}"') for prefix in expected_prefixes):
            return text

    raise RuntimeError("Unable to decode Supercell CSV payload")


def read_csv_rows(text: str) -> tuple[list[str], list[list[str]]]:
    reader = csv.reader(io.StringIO(text))
    rows = list(reader)
    if len(rows) < 2:
        raise RuntimeError("CSV payload is too small")

    header = rows[0]
    data_start = 1
    if len(rows) >= 3:
        type_row = rows[1]
        type_tokens = {"string", "int", "integer", "float", "double", "boolean", "bool", "enum"}
        non_empty = [cell.strip().lower() for cell in type_row if cell.strip()]
        if non_empty and sum(token in type_tokens for token in non_empty) >= max(1, len(non_empty) // 3):
            data_start = 2

    return header, rows[data_start:]


def parse_csv_table(text: str) -> list[dict[str, str]]:
    header, rows = read_csv_rows(text)
    return [dict(zip(header, row)) for row in rows if any(cell.strip() for cell in row)]


def load_localization(zf: zipfile.ZipFile) -> dict[str, str]:
    loc: dict[str, str] = {}
    for file_name in ("assets/localization/texts.csv", "assets/localization/texts_patch.csv"):
        try:
            raw = zf.read(file_name)
        except KeyError:
            continue
        text = decode_supercell_csv(raw, expected_prefixes=("TID",))
        header, rows = read_csv_rows(text)
        if "TID" not in header:
            continue
        tid_index = header.index("TID")
        en_index = header.index("EN") if "EN" in header else None
        for row in rows:
            if tid_index >= len(row):
                continue
            tid = row[tid_index]
            if not tid:
                continue
            value = row[en_index] if en_index is not None and en_index < len(row) else ""
            loc[tid] = value
    return loc


def to_int(value: str | None) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except ValueError:
        try:
            return int(float(value))
        except ValueError:
            return None


def seconds_from_parts(days: str | None, hours: str | None, minutes: str | None, seconds: str | None) -> int:
    return (
        (to_int(days) or 0) * 86400
        + (to_int(hours) or 0) * 3600
        + (to_int(minutes) or 0) * 60
        + (to_int(seconds) or 0)
    )


def build_resource_label(value: str) -> str:
    mapping = {
        "Gold": "Gold",
        "Elixir": "Elixir",
        "DarkElixir": "Dark Elixir",
        "Gold2": "Builder Gold",
        "Elixir2": "Builder Elixir",
        "Diamonds": "Gold",
    }
    return mapping.get(value, value or "Unknown")


def normalize_building_name(name: str) -> str:
    return BUILDING_NAME_ALIASES.get(name, name)


def parse_merge_requirement(value: str, all_rows: dict[str, dict[str, str]]) -> list[dict[str, object]]:
    if not value:
        return []
    out: list[dict[str, object]] = []
    for part in value.split(";"):
        if not part:
            continue
        bits = part.split(":")
        name = bits[0]
        level = to_int(bits[1]) if len(bits) > 1 else None
        geared_up = bool(to_int(bits[2])) if len(bits) > 2 else False
        entry: dict[str, object] = {"name": name}
        if level is not None:
            entry["level"] = level
        entry["geared_up"] = geared_up
        building_row = all_rows.get(normalize_building_name(name))
        if building_row is not None:
            building_id = to_int(building_row.get("GlobalID", ""))
            if building_id is not None:
                entry["_id"] = building_id
        out.append(entry)
    return out


def build_weapon_lookup(rows: list[dict[str, str]]) -> dict[str, dict[str, str]]:
    lookup: dict[str, dict[str, str]] = {}
    last_seen: dict[str, str] = {}
    for row in rows:
        merged = dict(last_seen)
        for key, value in row.items():
            if value != "":
                merged[key] = value
        last_seen = merged
        export_name = merged.get("ExportName", "")
        if export_name:
            lookup[export_name] = dict(merged)
    return lookup


def build_row_lookup(rows: list[dict[str, str]]) -> dict[str, dict[str, str]]:
    lookup: dict[str, dict[str, str]] = {}
    for row in rows:
        keys = {
            row.get("Name", ""),
            row.get("ExportName", ""),
            row.get("AlternateExportName", ""),
            row.get("ExportNameBase", ""),
        }
        for key in keys:
            if key and key not in lookup:
                lookup[key] = row
            normalized = normalize_building_name(key)
            if key and normalized not in lookup:
                lookup[normalized] = row
    return lookup


def parse_build_time_row(row: dict[str, str]) -> int:
    return seconds_from_parts(
        row.get("BuildTimeD", ""),
        row.get("BuildTimeH", ""),
        row.get("BuildTimeM", ""),
        row.get("BuildTimeS", ""),
    )


def parse_target_flag(value: str) -> bool | None:
    if value == "":
        return None
    return value.upper() == "TRUE"


def parse_alt_object(row: dict[str, str], localization: dict[str, str]) -> dict[str, object] | None:
    alt_name_tid = row.get("AlternateModeTID", "")
    alt_name = localization.get(alt_name_tid, "") if alt_name_tid else ""
    alt_air = parse_target_flag(row.get("AltAirTargets", ""))
    alt_ground = parse_target_flag(row.get("AltGroundTargets", ""))
    has_alt = bool(
        alt_name_tid
        or row.get("AltAttackMode", "")
        or row.get("AltAttackRange", "")
        or row.get("AltDPS", "")
        or row.get("AlternateExportName", "")
    )
    if not has_alt:
        return None

    alt: dict[str, object] = {}
    if alt_name:
        alt["name"] = alt_name
    if alt_air is not None:
        alt["is_air_targeting"] = alt_air
    if alt_ground is not None:
        alt["is_ground_targeting"] = alt_ground
    return alt or None


def parse_gear_up(row: dict[str, str], all_rows: dict[str, dict[str, str]]) -> dict[str, object] | None:
    building = row.get("GearUpBuilding", "")
    level_required = to_int(row.get("GearUpLevelRequirement", ""))
    resource = build_resource_label(row.get("GearUpResource", ""))
    if not building and level_required is None and not row.get("GearUpResource", ""):
        return None

    building_row = all_rows.get(building) or all_rows.get(normalize_building_name(building))
    gear_up: dict[str, object] = {
        "resource": resource,
    }
    if level_required is not None:
        gear_up["level_required"] = level_required
    if building_row is not None:
        gear_up["building_id"] = to_int(building_row.get("GlobalID", "")) or 0
    return gear_up


def parse_level_alt(row: dict[str, str]) -> dict[str, object] | None:
    alt_attack_range = to_int(row.get("AltAttackRange", ""))
    alt_dps = to_int(row.get("AltDPS", ""))
    alt_min_range = to_int(row.get("MinAttackRange", ""))
    has_alt = bool(
        row.get("AltAttackMode", "")
        or row.get("AltAttackRange", "")
        or row.get("AltDPS", "")
        or row.get("AltAirTargets", "")
        or row.get("AltGroundTargets", "")
        or row.get("AltMultiTargets", "")
        or row.get("AltNumMultiTargets", "")
    )
    if not has_alt:
        return None
    if alt_dps is None and row.get("DPS", "") != "":
        alt_dps = to_int(row.get("DPS", ""))

    alt: dict[str, object] = {}
    if alt_dps is not None:
        alt["dps"] = alt_dps
    if alt_attack_range is not None:
        alt["attack_range"] = alt_attack_range
    if alt_min_range is not None:
        alt["min_range"] = alt_min_range
    return alt or None


def parse_supercharge_levels(
    mini_header: list[str],
    mini_rows_raw: list[list[str]],
) -> dict[str, dict[str, object]]:
    supercharge: dict[str, dict[str, object]] = {}
    for block in group_building_blocks(mini_rows_raw):
        if not block:
            continue
        first = dict(zip(mini_header, block[0]))
        target = normalize_building_name(first.get("TargetBuilding", ""))
        if not target:
            continue
        entry = supercharge.setdefault(
            target,
            {
                "upgrade_resource": build_resource_label(first.get("BuildResource", "")),
                "levels": [],
            },
        )
        for raw_row in block:
            row = dict(zip(mini_header, raw_row))
            level = to_int(row.get("Level", ""))
            if level is None:
                continue
            level_entry: dict[str, object] = {
                "level": level,
                "build_cost": to_int(row.get("BuildCost", "")) or 0,
                "build_time": parse_build_time_row(row),
                "hitpoints_buff": to_int(row.get("Hitpoints", "")) or 0,
                "dps_buff": to_int(row.get("DPS", "")) or 0,
            }
            entry["levels"].append(level_entry)
    for entry in supercharge.values():
        entry["levels"].sort(key=lambda item: item["level"])
    return supercharge


def parse_spell_tower_levels(
    spell_rows: list[dict[str, str]],
) -> dict[int, dict[str, object]]:
    levels: dict[int, dict[str, object]] = {}
    level_by_name = {
        "Spell Tower Rage": 1,
        "Spell Tower Poison": 2,
        "Spell Tower Invisibility": 3,
        "Spell Tower Earthquake": 4,
    }
    for row in spell_rows:
        name = row.get("Name", "")
        if name not in level_by_name:
            continue
        level = level_by_name[name]
        spell_name = name.replace("Spell Tower ", "")
        target_info = row.get("TargetInfoString", "")
        is_air = "AIR" in target_info
        is_ground = "GROUND" in target_info
        effect_range = to_int(row.get("Radius", "")) or 0
        attack_range = 450 if spell_name == "Invisibility" else 900
        levels[level] = {
            "name": spell_name,
            "effect_range": effect_range,
            "is_air_targeting": is_air,
            "is_ground_targeting": is_ground,
            "attack_range": attack_range,
        }
    return levels


def parse_townhall_unlocks(
    townhall_rows: list[dict[str, str]],
    all_rows: dict[str, dict[str, str]],
) -> dict[int, list[dict[str, object]]]:
    unlocks_by_level: dict[int, list[dict[str, object]]] = {}
    last_seen_qty: dict[str, int] = {}
    for row in townhall_rows:
        level = to_int(row.get("Name", ""))
        if level is None:
            continue
        unlocks: list[dict[str, object]] = []
        for key, value in row.items():
            if key in {"Name", "AttackCost", "ResourceStorageLootPercentage", "DarkElixirStorageLootPercentage", "ResourceStorageLootCap", "DarkElixirStorageLootCap", "WarPrizeResourceCap", "WarPrizeDarkElixirCap", "WarPrizeCommonOreCap", "WarPrizeRareOreCap", "WarPrizeEpicOreCap", "WarPrizeAllianceExpCap", "CartLootCapResource", "CartLootReengagementResource", "CartLootCapDarkElixir", "CartLootReengagementDarkElixir", "ReengagementBuildingBudget", "ReengagementHeroBudget", "ReengagementWallBudget", "ReengagementLabBudget", "HeroBoostHours", "PowerBoostHours", "ResourceProductionBoostHours", "StarBonusBoostHours", "UnlockStage", "ResourceScalingPercentage", "ResourceScalingPercentage2", "LeagueTier", "UnrankedGoldRewardStarBonus", "UnrankedElixirRewardStarBonus", "UnrankedDarkElixirRewardStarBonus", "UnrankedCommonOreRewardStarBonus", "UnrankedRareOreRewardStarBonus", "UnrankedEpicOreRewardStarBonus", "SeasonPassResourceScalingPercentage", "SeasonPassResourceScalingPercentage2", "ScaleByTHPercent"}:
                continue
            qty = to_int(value)
            if qty is None or qty <= 0:
                continue
            building_name = normalize_building_name(key)
            if building_name.startswith("BB ") or building_name not in TOWN_HALL_UNLOCK_NAMES:
                continue
            building_row = all_rows.get(building_name)
            if building_row is None:
                continue
            building_id = to_int(building_row.get("GlobalID", ""))
            if building_id is None:
                continue
            prev_qty = last_seen_qty.get(building_name, 0)
            delta = qty - prev_qty
            if delta > 0:
                unlocks.append({"name": building_name, "_id": building_id, "quantity": delta})
            last_seen_qty[building_name] = qty
        if unlocks:
            unlocks_by_level[level] = unlocks
    return unlocks_by_level


def build_town_hall_weapon(
    weapon_rows: list[list[str]],
    weapon_header: list[str],
    localization: dict[str, str],
) -> dict[str, object] | None:
    for block in group_building_blocks(weapon_rows):
        filled = fill_block_rows(block, weapon_header)
        if not filled:
            continue
        first = filled[0]
        if first.get("Name", "") != "Townhall17":
            continue

        weapon = {
            "name": localization.get(first.get("TID", ""), first.get("Name", "")) or first.get("Name", ""),
            "info": localization.get(first.get("InfoTID", ""), ""),
            "TID": {
                "name": first.get("TID", ""),
                "info": first.get("InfoTID", ""),
            },
            "upgrade_resource": build_resource_label(first.get("BuildResource", "")),
            "strength_weight": 0,
            "levels": [],
        }

        levels: list[dict[str, object]] = []
        for row in filled:
            level = to_int(row.get("Level", "")) or to_int(row.get("BuildingLevel", ""))
            if level is None:
                continue
            level_entry: dict[str, object] = {
                "level": level,
                "build_cost": to_int(row.get("BuildCost", "")) or 0,
                "build_time": seconds_from_parts(
                    row.get("BuildTimeD", ""),
                    row.get("BuildTimeH", ""),
                    row.get("BuildTimeM", ""),
                    row.get("BuildTimeS", ""),
                ),
                "dps": to_int(row.get("DPS", "")) or 0,
            }
            levels.append(level_entry)

        weapon["levels"] = levels
        return weapon

    return None


def parse_hero_entries(
    hero_rows_text: str,
    localization: dict[str, str],
) -> list[dict[str, object]]:
    header, rows = read_csv_rows(hero_rows_text)
    blocks = group_building_blocks(rows)
    heroes: list[dict[str, object]] = []

    for block in blocks:
        filled = fill_block_rows(block, header)
        if not filled:
            continue

        first = filled[0]
        localized_name = localization.get(first.get("TID", ""), first.get("Name", "")) or first.get("Name", "")
        hero_id = HERO_ID_BY_NAME.get(localized_name)
        if hero_id is None:
            continue

        levels: list[dict[str, object]] = []
        for row in filled:
            level = to_int(row.get("VisualLevel", ""))
            if level is None:
                continue
            levels.append(
                {
                    "level": level,
                    "hitpoints": to_int(row.get("Hitpoints", "")) or 0,
                    "dps": to_int(row.get("DPS", "")) or 0,
                    "upgrade_time": seconds_from_parts(
                        row.get("UpgradeTimeD", ""),
                        row.get("UpgradeTimeH", ""),
                        row.get("UpgradeTimeM", ""),
                        row.get("UpgradeTimeS", ""),
                    ),
                    "upgrade_cost": to_int(row.get("UpgradeCost", "")) or 0,
                    "required_townhall": to_int(row.get("RequiredTownHallLevel", "")) or 0,
                    "required_hero_tavern_level": to_int(row.get("RequiredHeroTavernLevel", "")) or 0,
                    "strength_weight": to_int(row.get("StrengthWeight", "")) or 0,
                }
            )

        heroes.append(
            {
                "_id": hero_id,
                "name": localized_name,
                "info": localization.get(first.get("InfoTID", ""), ""),
                "TID": {
                    "name": first.get("TID", ""),
                    "info": first.get("InfoTID", ""),
                },
                "production_building": "Hero Hall",
                "production_building_level": to_int(first.get("RequiredHeroTavernLevel", "")) or 1,
                "upgrade_resource": build_resource_label(first.get("UpgradeResource", "")),
                "is_flying": parse_target_flag(first.get("IsFlying", "")) or False,
                "is_air_targeting": parse_target_flag(first.get("AirTargets", "")) or False,
                "is_ground_targeting": parse_target_flag(first.get("GroundTargets", "")) or False,
                "movement_speed": to_int(first.get("Speed", "")) or 0,
                "attack_speed": to_int(first.get("AttackSpeed", "")) or 0,
                "attack_range": to_int(first.get("AttackRange", "")) or 0,
                "village": "home",
                "levels": levels,
            }
        )

    return heroes


def parse_upgrade_data_entries(
    upgrade_rows_text: str,
) -> dict[str, list[dict[str, object]]]:
    header, rows = read_csv_rows(upgrade_rows_text)
    tracks: dict[str, list[dict[str, object]]] = {}
    current_track = ""

    for raw_row in rows:
        row = dict(zip(header, raw_row))
        track_name = row.get("Name", "")
        if track_name:
            current_track = track_name
        if not current_track:
            continue

        level = to_int(row.get("UpgradeLevel", ""))
        if level is None:
            continue

        tracks.setdefault(current_track, []).append(
            {
                "level": level,
                "upgrade_type": row.get("UpgradeType", ""),
                "build_time": seconds_from_parts(
                    row.get("UpgradeTimeDays", ""),
                    row.get("UpgradeTimeHours", ""),
                    row.get("UpgradeTimeMinutes", ""),
                    row.get("UpgradeTimeSeconds", ""),
                ),
                "upgrade_resource": build_resource_label(row.get("UpgradeResource", "")),
                "build_cost": to_int(row.get("UpgradeCost", "")) or 0,
                "upgrade_priority": to_int(row.get("UpgradePriority", "")) or 0,
            }
        )

    for entries in tracks.values():
        entries.sort(key=lambda item: item["level"])

    return tracks


def parse_guardian_entries(
    guardian_rows_text: str,
    localization: dict[str, str],
    upgrade_tracks: dict[str, list[dict[str, object]]],
) -> list[dict[str, object]]:
    header, rows = read_csv_rows(guardian_rows_text)
    blocks = group_building_blocks(rows)
    guardians: list[dict[str, object]] = []

    for block in blocks:
        filled = fill_block_rows(block, header)
        if not filled:
            continue

        first = filled[0]
        if first.get("Deprecated", "").upper() == "TRUE":
            continue
        if not first.get("PreviewScenario", ""):
            continue

        localized_name = localization.get(first.get("TID", ""), first.get("Name", "")) or first.get("Name", "")
        upgrade_data_name = first.get("UpgradeData", "")
        upgrade_levels = upgrade_tracks.get(upgrade_data_name, [])
        if not upgrade_levels:
            continue

        levels: list[dict[str, object]] = []
        for row in filled:
            level = to_int(row.get("Level", ""))
            if level is None:
                continue
            upgrade_level = next((item for item in upgrade_levels if item["level"] == level), None)
            if upgrade_level is None:
                continue
            levels.append(
                {
                    "level": level,
                    "build_cost": upgrade_level["build_cost"],
                    "build_time": upgrade_level["build_time"],
                    "upgrade_resource": upgrade_level["upgrade_resource"],
                    "activation_radius": to_int(row.get("ActivationRadius", "")),
                    "leap_time_ms": to_int(row.get("LeapTimeMS", "")),
                    "leap_distance": to_int(row.get("LeapDistance", "")),
                    "patrol_radius": to_int(row.get("PatrolRadius", "")),
                    "strength": to_int(row.get("Strength", "")) or 0,
                    "town_hall_level": 18,
                }
            )

        guardians.append(
            {
                "_id": 29000000 + len(guardians),
                "name": localized_name,
                "info": localization.get(first.get("InfoTID", ""), ""),
                "TID": {
                    "name": first.get("TID", ""),
                    "info": first.get("InfoTID", ""),
                },
                "type": first.get("DisplaySkin", "") or "Guardian",
                "upgrade_resource": upgrade_levels[0]["upgrade_resource"],
                "village": "home",
                "width": 0,
                "superchargeable": False,
                "levels": levels,
                "production_building": "Hero Hall",
                "production_building_level": 18,
                "is_flying": False,
                "is_air_targeting": False,
                "is_ground_targeting": True,
                "attack_range": to_int(first.get("ActivationRadius", "")) or 0,
            }
        )

    return guardians


def parse_pet_house_townhall_levels(
    building_rows_text: str,
) -> dict[int, int]:
    header, rows = read_csv_rows(building_rows_text)
    blocks = group_building_blocks(rows)
    lookup: dict[int, int] = {}
    for block in blocks:
        filled = fill_block_rows(block, header)
        if not filled:
            continue
        first = filled[0]
        if first.get("Name", "") != "Pet House":
            continue
        for row in filled:
            level = to_int(row.get("BuildingLevel", ""))
            town_hall = to_int(row.get("TownHallLevel", ""))
            if level is not None and town_hall is not None:
                lookup[level] = town_hall
        break
    return lookup


def parse_pet_entries(
    pet_rows_text: str,
    localization: dict[str, str],
    pet_house_townhall_levels: dict[int, int],
) -> list[dict[str, object]]:
    header, rows = read_csv_rows(pet_rows_text)
    blocks = group_building_blocks(rows)
    pets: list[dict[str, object]] = []

    for block in blocks:
        filled = fill_block_rows(block, header)
        if not filled:
            continue

        first = filled[0]
        if first.get("Deprecated", "").upper() == "TRUE":
            continue
        if not first.get("PreviewScenario", ""):
            continue

        localized_name = localization.get(first.get("TID", ""), first.get("Name", "")) or first.get("Name", "")
        levels: list[dict[str, object]] = []
        for row in filled:
            level = to_int(row.get("TroopLevel", ""))
            if level is None:
                continue
            lab_level = to_int(row.get("LaboratoryLevel", ""))
            town_hall_level = pet_house_townhall_levels.get(lab_level or 0)
            levels.append(
                {
                    "level": level,
                    "build_cost": to_int(row.get("UpgradeCost", "")) or 0,
                    "build_time": seconds_from_parts(
                        "0",
                        row.get("UpgradeTimeH", ""),
                        row.get("UpgradeTimeM", ""),
                        "0",
                    ),
                    "upgrade_resource": build_resource_label(row.get("UpgradeResource", "")),
                    "hitpoints": to_int(row.get("Hitpoints", "")) or 0,
                    "dps": to_int(row.get("DPS", "")) or 0,
                    "attack_range": to_int(row.get("AttackRange", "")),
                    "attack_speed": to_int(row.get("AttackSpeed", "")),
                    "speed": to_int(row.get("Speed", "")),
                    "town_hall_level": town_hall_level,
                    "laboratory_level": lab_level,
                    "housing_space": to_int(row.get("HousingSpace", "")),
                }
            )

        first_level = levels[0] if levels else {}
        pets.append(
            {
                "_id": 30000000 + len(pets),
                "name": localized_name,
                "info": localization.get(first.get("InfoTID", ""), ""),
                "TID": {
                    "name": first.get("TID", ""),
                    "info": first.get("InfoTID", ""),
                },
                "type": "Pet",
                "upgrade_resource": build_resource_label(first.get("UpgradeResource", "")),
                "village": "home",
                "width": 0,
                "superchargeable": False,
                "levels": levels,
                "production_building": "Pet House",
                "production_building_level": to_int(first.get("LaboratoryLevel", "")) or 1,
                "attack_range": to_int(first.get("AttackRange", "")) or 0,
                "is_flying": parse_target_flag(first.get("IsFlying", "")) or False,
                "is_air_targeting": parse_target_flag(first.get("AirTargets", "")) or False,
                "is_ground_targeting": parse_target_flag(first.get("GroundTargets", "")) or False,
                "town_hall_level": first_level.get("town_hall_level"),
            }
        )

    return pets


def fill_block_rows(block: list[list[str]], header: list[str]) -> list[dict[str, str]]:
    last_seen = [""] * len(header)
    filled_rows: list[dict[str, str]] = []
    for raw_row in block:
        filled = []
        for i, _ in enumerate(header):
            value = raw_row[i] if i < len(raw_row) else ""
            if value != "":
                last_seen[i] = value
            filled.append(last_seen[i])
        filled_rows.append(dict(zip(header, filled)))
    return filled_rows


def group_building_blocks(rows: list[list[str]]) -> list[list[list[str]]]:
    blocks: list[list[list[str]]] = []
    current: list[list[str]] = []
    for row in rows:
        name = row[0] if row else ""
        if name:
            if current:
                blocks.append(current)
            current = [row]
        elif current:
            current.append(row)
    if current:
        blocks.append(current)
    return blocks


def is_special_block(name: str) -> bool:
    return any(pattern.search(name) for pattern in SPECIAL_BLOCK_NAME_EXCLUDES)


def detect_village(row: dict[str, str]) -> str:
    village_type = row.get("VillageType", "")
    if village_type == "1":
        return "builderBase"
    return "home"


def build_entry_id(index: int) -> int:
    return 1000000 + index


def normalize_export_name(row: dict[str, str]) -> str:
    return row.get("ExportNameBase") or row.get("ExportName") or row.get("Name") or ""


def derive_building_entry(
    block_rows: list[dict[str, str]],
    localization: dict[str, str],
    weapon_lookup: dict[str, dict[str, str]],
    town_hall_weapon: dict[str, object] | None,
    all_rows: dict[str, dict[str, str]],
    supercharge_lookup: dict[str, dict[str, object]],
    spell_tower_lookup: dict[int, dict[str, object]],
    townhall_unlocks: dict[int, list[dict[str, object]]],
    index: int,
) -> dict[str, object] | None:
    if not block_rows:
        return None

    first = block_rows[0]
    raw_name = first.get("Name", "")
    if not raw_name or is_special_block(raw_name):
        return None

    if detect_village(first) != "home":
        return None

    canonical_name = localization.get(first.get("TID", ""), raw_name) or raw_name
    if canonical_name not in BUILDING_HOME_NAMES:
        return None
    info = localization.get(first.get("InfoTID", ""), "")
    export_name = first.get("ExportName", "") or raw_name
    asset_key = normalize_export_name(first)
    building_class = first.get("BuildingClass", "")
    upgrade_resource = build_resource_label(first.get("BuildResource", ""))
    top_alt = parse_alt_object(first, localization)
    gear_up = parse_gear_up(first, all_rows)
    is_air_targeting = parse_target_flag(first.get("AirTargets", ""))
    is_ground_targeting = parse_target_flag(first.get("GroundTargets", ""))
    width = to_int(first.get("Width", "")) or 0
    building_id = to_int(first.get("GlobalID", ""))

    levels: list[dict[str, object]] = []
    if canonical_name not in NO_LEVEL_BUILDINGS:
        for row in block_rows:
            level = to_int(row.get("BuildingLevel", ""))
            if level is None:
                continue
            build_cost = to_int(row.get("BuildCost", "")) or 0
            build_time = seconds_from_parts(
                row.get("BuildTimeD", ""),
                row.get("BuildTimeH", ""),
                row.get("BuildTimeM", ""),
                row.get("BuildTimeS", ""),
            )
            required_townhall = to_int(row.get("TownHallLevel", ""))
            if required_townhall is None:
                required_townhall = 0

            level_entry: dict[str, object] = {
                "level": level,
                "build_cost": build_cost,
                "build_time": build_time,
                "required_townhall": required_townhall,
                "hitpoints": to_int(row.get("Hitpoints", "")) or 0,
            }
            dps_raw = row.get("DPS", "")
            if dps_raw != "" or canonical_name not in {"Air Sweeper", "Eagle Artillery"}:
                level_entry["dps"] = to_int(dps_raw) or 0
            attack_range = to_int(row.get("AttackRange", ""))
            if attack_range is not None and not (canonical_name == "Builder's Hut" and level == 1):
                level_entry["attack_range"] = attack_range
            alt_build_resource = row.get("AltBuildResource", "")
            if alt_build_resource:
                level_entry["alt_upgrade_resource"] = build_resource_label(alt_build_resource)
            min_range = to_int(row.get("MinAttackRange", ""))
            if min_range is not None:
                level_entry["min_range"] = min_range
            strength_weight = to_int(row.get("StrengthWeight", ""))
            if strength_weight is not None:
                level_entry["strength_weight"] = strength_weight
            damage = to_int(row.get("Damage", ""))
            if damage is not None:
                level_entry["damage"] = damage
            alt_level = parse_level_alt(row)
            if alt_level is not None:
                level_entry["alt"] = alt_level
            if canonical_name == "Town Hall":
                weapon_row = weapon_lookup.get(row.get("ExportName", ""))
                if weapon_row and level <= 17:
                    weapon_dps = to_int(weapon_row.get("DPS", ""))
                    weapon_attack_range = to_int(weapon_row.get("AttackRange", ""))
                    if level <= 16 and weapon_dps is not None:
                        level_entry["dps"] = weapon_dps
                    if weapon_attack_range is not None:
                        level_entry["attack_range"] = weapon_attack_range
                if level == 17 and town_hall_weapon is not None:
                    for weapon_level in town_hall_weapon.get("levels", []):
                        weapon_level["build_cost"] = build_cost
                    level_entry["weapon"] = town_hall_weapon
            elif canonical_name == "Clan Castle" and "attack_range" not in level_entry:
                level_entry["attack_range"] = 1300
            elif canonical_name == "Builder's Hut" and "attack_range" not in level_entry and level > 1:
                level_entry["attack_range"] = 700
            elif canonical_name == "Spell Tower":
                spell_level = spell_tower_lookup.get(level)
                if spell_level is not None:
                    level_entry.update(spell_level)
                level_entry.pop("dps", None)
            elif canonical_name == "Multi-Archer Tower":
                level_entry.pop("dps", None)
            elif canonical_name == "Super Wizard Tower":
                level_entry.pop("alt", None)

            if row.get("MergeRequirement", "") and ((canonical_name == "Town Hall" and level == 17) or (canonical_name != "Town Hall" and level == 1)):
                level_entry["merge_requirement"] = parse_merge_requirement(row["MergeRequirement"], all_rows)
            if canonical_name == "Town Hall":
                unlocks = townhall_unlocks.get(level)
                if unlocks:
                    level_entry["unlocks"] = unlocks
            if canonical_name in {"Air Sweeper", "Eagle Artillery", "Revenge Tower"}:
                level_entry.pop("dps", None)
            if canonical_name == "Builder's Hut" and level == 1:
                level_entry.pop("attack_range", None)
            levels.append(level_entry)

    entry: dict[str, object] = {
        "_id": building_id if building_id is not None else build_entry_id(index),
        "name": canonical_name,
        "info": info,
        "TID": {
            "name": first.get("TID", ""),
            "info": first.get("InfoTID", ""),
        },
        "type": building_class,
        "upgrade_resource": upgrade_resource,
        "village": "home",
        "width": width,
        "superchargeable": bool(supercharge_lookup.get(canonical_name)) or bool(first.get("MiniLevels", "")) or canonical_name in SUPERCHARGEABLE_NAMES,
        "levels": levels,
    }

    if top_alt is not None:
        entry["alt"] = top_alt
    if gear_up is not None:
        entry["gear_up"] = gear_up
    if is_air_targeting is not None:
        entry["is_air_targeting"] = is_air_targeting
    if is_ground_targeting is not None:
        entry["is_ground_targeting"] = is_ground_targeting
    if canonical_name == "Air Sweeper":
        entry["is_ground_targeting"] = False
    if canonical_name == "Builder's Hut":
        entry.pop("is_air_targeting", None)
        entry.pop("is_ground_targeting", None)
    cone_angle = to_int(first.get("TargetingConeAngle", ""))
    if cone_angle is not None:
        entry["cone_angle"] = cone_angle
    aim_rotate_step = to_int(first.get("AimRotateStep", ""))
    if aim_rotate_step is not None:
        entry["aim_rotate_step"] = aim_rotate_step

    supercharge = supercharge_lookup.get(canonical_name)
    if supercharge and levels:
        levels[-1]["supercharge"] = supercharge

    return entry


def export_buildings(apk_path: Path) -> tuple[
    list[dict[str, object]],
    list[dict[str, object]],
    list[dict[str, object]],
    list[dict[str, object]],
]:
    with zipfile.ZipFile(apk_path) as zf:
        localization = load_localization(zf)
        buildings_text = decode_supercell_csv(zf.read("assets/logic/buildings.csv"), expected_prefixes=("Name",))
        heroes_text = decode_supercell_csv(zf.read("assets/logic/heroes.csv"), expected_prefixes=("Name",))
        guardians_text = decode_supercell_csv(zf.read("assets/logic/guardians.csv"), expected_prefixes=("Name",))
        pets_text = decode_supercell_csv(zf.read("assets/logic/pets.csv"), expected_prefixes=("Name",))
        upgrade_data_text = decode_supercell_csv(zf.read("assets/logic/upgrade_data.csv"), expected_prefixes=("Name",))
        spells_text = decode_supercell_csv(zf.read("assets/logic/spells.csv"), expected_prefixes=("Name",))
        traps_text = decode_supercell_csv(zf.read("assets/logic/traps.csv"), expected_prefixes=("Name",))
        townhall_text = decode_supercell_csv(zf.read("assets/logic/townhall_levels.csv"), expected_prefixes=("Name",))
        mini_levels_text = decode_supercell_csv(zf.read("assets/logic/mini_levels.csv"), expected_prefixes=("Name",))
        weapons_rows: list[dict[str, str]] = []
        weapons_header: list[str] = []
        try:
            weapons_text = decode_supercell_csv(zf.read("assets/logic/weapons.csv"), expected_prefixes=("Name",))
            weapons_header, weapons_raw_rows = read_csv_rows(weapons_text)
            weapons_rows = parse_csv_table(weapons_text)
            town_hall_weapon = build_town_hall_weapon(weapons_raw_rows, weapons_header, localization)
        except KeyError:
            weapons_rows = []
            weapons_header = []
            town_hall_weapon = None

    header, rows = read_csv_rows(buildings_text)
    heroes = parse_hero_entries(heroes_text, localization)
    upgrade_tracks = parse_upgrade_data_entries(upgrade_data_text)
    guardians = parse_guardian_entries(guardians_text, localization, upgrade_tracks)
    pet_house_townhall_levels = parse_pet_house_townhall_levels(buildings_text)
    pets = parse_pet_entries(pets_text, localization, pet_house_townhall_levels)
    spells_header, spells_rows_raw = read_csv_rows(spells_text)
    townhall_header, townhall_rows_raw = read_csv_rows(townhall_text)
    mini_header, mini_rows_raw = read_csv_rows(mini_levels_text)
    weapon_lookup = build_weapon_lookup(weapons_rows)
    all_rows = build_row_lookup(parse_csv_table(buildings_text) + parse_csv_table(traps_text))
    townhall_rows = [dict(zip(townhall_header, row)) for row in townhall_rows_raw if any(cell.strip() for cell in row)]
    townhall_unlocks = parse_townhall_unlocks(townhall_rows, all_rows)
    supercharge_lookup = parse_supercharge_levels(mini_header, mini_rows_raw)
    spell_tower_lookup = parse_spell_tower_levels([dict(zip(spells_header, row)) for row in spells_rows_raw if any(cell.strip() for cell in row)])

    blocks = group_building_blocks(rows)
    buildings: list[dict[str, object]] = []
    entry_index = 0
    for block in blocks:
        filled = fill_block_rows(block, header)
        entry = derive_building_entry(
            filled,
            localization,
            weapon_lookup,
            town_hall_weapon,
            all_rows,
            supercharge_lookup,
            spell_tower_lookup,
            townhall_unlocks,
            entry_index,
        )
        if entry is None:
            continue
        buildings.append(entry)
        entry_index += 1

    return buildings, heroes, guardians, pets


def compare_to_reference(exported: list[dict[str, object]], reference_path: str) -> dict[str, object]:
    if reference_path.startswith(("http://", "https://")):
        with urllib.request.urlopen(reference_path) as response:
            reference = json.load(response)
    else:
        reference = json.loads(Path(reference_path).read_text(encoding="utf-8"))

    ref_buildings = [b for b in reference.get("buildings", []) if b.get("village") == "home"]
    exp_by_name = {b["name"]: b for b in exported}
    ref_by_name = {b["name"]: b for b in ref_buildings}

    missing = sorted(set(ref_by_name) - set(exp_by_name))
    extra = sorted(set(exp_by_name) - set(ref_by_name))

    level_count_mismatches = []
    resource_mismatches = []
    type_mismatches = []
    village_mismatches = []

    for name in sorted(set(exp_by_name) & set(ref_by_name)):
        exp = exp_by_name[name]
        ref = ref_by_name[name]
        if len(exp.get("levels", [])) != len(ref.get("levels", [])):
            level_count_mismatches.append(
                {
                    "name": name,
                    "exported": len(exp.get("levels", [])),
                    "reference": len(ref.get("levels", [])),
                }
            )
        if exp.get("upgrade_resource") != ref.get("upgrade_resource"):
            resource_mismatches.append(
                {
                    "name": name,
                    "exported": exp.get("upgrade_resource"),
                    "reference": ref.get("upgrade_resource"),
                }
            )
        if exp.get("type") != ref.get("type"):
            type_mismatches.append(
                {
                    "name": name,
                    "exported": exp.get("type"),
                    "reference": ref.get("type"),
                }
            )
        if exp.get("village") != ref.get("village"):
            village_mismatches.append(
                {
                    "name": name,
                    "exported": exp.get("village"),
                    "reference": ref.get("village"),
                }
            )

    return {
        "reference_buildings": len(ref_buildings),
        "exported_buildings": len(exported),
        "missing_names": missing,
        "extra_names": extra,
        "level_count_mismatches": level_count_mismatches,
        "resource_mismatches": resource_mismatches,
        "type_mismatches": type_mismatches,
        "village_mismatches": village_mismatches,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Export ClashKing-shaped building data from a Clash of Clans APK")
    parser.add_argument("apk", type=Path, help="Path to the APK")
    parser.add_argument(
        "--out",
        type=Path,
        default=Path("public/data/clashking_buildings.json"),
        help="Output JSON path",
    )
    parser.add_argument(
        "--compare-to",
        dest="compare_to",
        help="Optional ClashKing static_data.json URL or file path to compare against",
    )
    args = parser.parse_args()

    buildings, heroes, guardians, pets = export_buildings(args.apk)
    payload = {
        "buildings": buildings,
        "heroes": heroes,
        "guardians": guardians,
        "pets": pets,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(
        json.dumps(
            {
                "buildings": len(buildings),
                "heroes": len(heroes),
                "guardians": len(guardians),
                "pets": len(pets),
                "out": str(args.out),
            },
            indent=2,
        )
    )

    if args.compare_to:
        report = compare_to_reference(buildings, args.compare_to)
        print(json.dumps(report, indent=2, ensure_ascii=False))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
