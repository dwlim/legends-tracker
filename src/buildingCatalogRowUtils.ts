import type { BuildingUpgradeRow } from "./buildingCatalogTypes";
import { getBuildingThumbnail } from "./buildingCatalogThumbnails";

export function withThumbnail(row: Omit<BuildingUpgradeRow, "thumbnail">) {
  return {
    ...row,
    thumbnail: getBuildingThumbnail(row),
  } satisfies BuildingUpgradeRow;
}
