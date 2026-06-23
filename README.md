# Clash Builder Planner

A standalone Clash of Clans upgrade planner focused on builder queue planning.

## Scripts

```bash
npm install
npm run dev
npm run build
npm test
npm run extract:clash-assets -- /path/to/com.supercell.clashofclans.apk --out-dir extracted_clash_assets
npm run export:clashking -- /path/to/com.supercell.clashofclans.apk --out public/data/clashking_buildings.json --compare-to https://raw.githubusercontent.com/ClashKingInc/ClashKingAssets/main/assets/static_data.json
```

## What it does

- Add upgrades with duration and category
- Reorder the queue
- See builder lanes and projected finish time
- Persist the current state in localStorage

## ClashKing Export

If you want a ClashKing-shaped buildings payload derived from the APK, use:

```bash
npm run export:clashking -- /Users/daniel/Downloads/com.supercell.clashofclans_18.367.1.apk --out extracted_clash_data/clashking_buildings.json --compare-to https://raw.githubusercontent.com/ClashKingInc/ClashKingAssets/main/assets/static_data.json
```

This writes a `buildings` array with ClashKing-style fields:

- `_id`
- `name`
- `info`
- `TID`
- `type`
- `upgrade_resource`
- `village`
- `width`
- `superchargeable`
- `levels`

The APK-derived export is what the app consumes by default.

## APK Assets

The repo also includes `scripts/extract_clash_assets.py`, which copies the game's asset tree out of the APK so you can inspect the raw art files and supporting indexes.

Example:

```bash
npm run extract:clash-assets -- /Users/daniel/Downloads/com.supercell.clashofclans_18.367.1.apk --out-dir extracted_clash_assets
```

Outputs:

- `raw/assets/sc/...`
- `raw/assets/sc3d/...`
- `raw/assets/image/...`
- `raw/assets/assets.scdb`
- `decoded/atlases/...` for building texture sheets
- `derived/asset_name_candidates.json`
- `derived/building_sprite_manifest.json`
- `manifest.json`
