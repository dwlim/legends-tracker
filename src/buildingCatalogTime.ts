import type { BuildTimeFormat, BuildingUpgradeRow } from "./buildingCatalogTypes";

export function partsFromSeconds(totalSeconds: number) {
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

export function secondsToParts(totalSeconds: number) {
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

export function parseBuildTimeSeconds(totalSeconds: number) {
  const { days, hours, minutes, seconds } = secondsToParts(totalSeconds);
  return {
    buildTimeDays: days || null,
    buildTimeHours: hours || null,
    buildTimeMinutes: minutes || null,
    buildTimeSeconds: seconds || null,
    buildTimeTotalMinutes: computeBuildTimeMinutes(days, hours, minutes, seconds),
  };
}

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
