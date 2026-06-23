import type { BuildTimeFormat } from "./buildingCatalog";

export function normalizeTownHallLevel(level: number | null) {
  if (level === null) {
    return null;
  }

  return level === 0 ? 1 : level;
}

export function escapeCsvValue(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export function sanitizeFilenamePart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
}

export function formatTotalMinutes(totalMinutes: number, format: BuildTimeFormat) {
  if (format === "total-minutes") {
    if (Number.isInteger(totalMinutes)) {
      return `${totalMinutes.toLocaleString("en-US")}m`;
    }

    return `${totalMinutes.toLocaleString("en-US", {
      maximumFractionDigits: 1,
    })}m`;
  }

  if (format === "hours") {
    const totalHours = totalMinutes / 60;
    if (Number.isInteger(totalHours)) {
      return `${totalHours.toLocaleString("en-US")}h`;
    }

    return `${totalHours.toLocaleString("en-US", {
      maximumFractionDigits: 1,
    })}h`;
  }

  if (format === "days") {
    const totalDays = totalMinutes / (24 * 60);
    if (Number.isInteger(totalDays)) {
      return `${totalDays.toLocaleString("en-US")}d`;
    }

    return `${totalDays.toLocaleString("en-US", {
      maximumFractionDigits: 1,
    })}d`;
  }

  const totalSeconds = Math.round(totalMinutes * 60);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.max(0, Math.round(totalSeconds % 60));
  const parts: string[] = [];

  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds) parts.push(`${seconds}s`);

  return parts.length > 0 ? parts.join(" ") : "0m";
}

export function formatInteger(value: number | null | undefined) {
  return typeof value === "number" ? value.toLocaleString("en-US") : "—";
}
