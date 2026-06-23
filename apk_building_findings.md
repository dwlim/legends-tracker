# Clash of Clans APK building inventory

Source: `/Users/daniel/Downloads/com.supercell.clashofclans_18.367.1.apk`

What I found:

- `assets/assets.scdb` is a SQLite asset index with ~6,400 rows.
- The APK includes the main building art bundles:
  - `assets/sc/buildings.sc`
  - `assets/sc/building_bases.sc`
  - `assets/sc/buildings2.sc`
  - `assets/sc/buildings_cc.sc`
- The APK also includes a small set of building-related info screens:
  - `sc/info_furnace.sc`
  - `sc/info_moving_cannon.sc`
  - `sc/info_siege_machine_commandtower.sc`
  - `sc/info_wallbreaker.sc` and `sc/info_wallbreaker_elite.sc` are troop info screens, not buildings
- `assets/logic/buildings.csv` is the main balance table and contains 766 rows. I used it during exploration, but the app now consumes the APK-derived ClashKing JSON export instead of a raw CSV.
- `assets/logic/capital_buildings.csv` contains 259 clan capital rows.
- `assets/logic/townhall_levels.csv` contains town hall level settings and loot caps.
- `assets/logic/globals.csv` contains 687 game constants.
- `assets/csv/*.csv` files are binary-encoded tables, not plain text CSV.
- `assets/globals.json` contains general gameplay toggles and server-facing constants.
- `assets/globals_definition.json` explicitly says the globals definitions were relocated to server config.

Client-side building families visible in the art bundles include:

- Home village: `townhall`, `wizard_tower`, `mortar`, `elixir_pump`, `goldmine`, `gold_storage`, `elixir_storage`, `dark_elixir_storage`, `teslatower`, `bomb_tower`, `barracks`, `laboratory`, `airdefence_tower`, `spellfactory_*`, `heroaltar_*`, `siegeWorkshop`, `monolith`, `multi_mortar`, `mega_tesla`, `megaCannon`
- Builder base / second village: `new_TH`, `newVillage_lab`, `newVillage_multi_mortar`, `new_builders_hut_arto`, `secondVillage_wall_*`, `push_trap_*`, `bomp_trap_*`, `giga_bomb_*`
- Clan capital: `capital_cannon`, `capital_crusher`, `capital_giant_cannon`, `capital_multicannon`, `capital_multimortar`, `capital_wizard_tower`, `capital_bombtower`, `capital_inferno`, `capital_mortar`
- War / alternate variants: `war_basic_cannon`, `war_townhall`, `war_gold_storage`, `war_elixir_storage`, `war_dark_elixir_storage`, `war_worker_building`, `war_spellforge`, `war_rapidfire`

Extraction result:

- I decoded the Supercell logic tables during exploration and derived the building data now stored in `public/data/clashking_buildings.json`.
- That JSON export is the canonical data source for the app.

If you want, I can keep going and turn the asset names into a machine-readable index of every building family + level variant that is present in the APK.
