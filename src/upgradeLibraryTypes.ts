import type { BuildTimeFormat } from "./buildingCatalog";

export type ThemeMode = "light" | "dark";

export type SortKey =
  | "name"
  | "buildingClass"
  | "level"
  | "townHallLevel"
  | "buildResource"
  | "buildCost"
  | "buildTime"
  | "hitpoints"
  | "dps";

export type SortDirection = "asc" | "desc";

export interface SortEntry {
  key: SortKey;
  direction: SortDirection;
}

export const TIME_FORMAT_LABELS: Record<BuildTimeFormat, string> = {
  compact: "Compact",
  "total-minutes": "Minutes",
  hours: "Hours",
  days: "Days",
};
