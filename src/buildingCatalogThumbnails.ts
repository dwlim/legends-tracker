import type { BuildingUpgradeRow } from "./buildingCatalogTypes";

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

function shortLabel(row: Pick<BuildingUpgradeRow, "name" | "exportName">) {
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
