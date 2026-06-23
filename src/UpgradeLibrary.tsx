import { useDeferredValue, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Download, Search, Settings2 } from "lucide-react";
import {
  formatBuildTimeLabelWithMode,
  formatResourceLabel,
  loadBuildingUpgrades,
  type BuildTimeFormat,
  type BuildingUpgradeRow,
} from "./buildingCatalog";

const TIME_FORMAT_KEY = "clash-builder-planner.time-format";
const THEME_KEY = "clash-builder-planner.theme";
type ThemeMode = "light" | "dark";
type SortDirection = "asc" | "desc";
interface SortEntry {
  key: SortKey;
  direction: SortDirection;
}
type SelectionAnchor = {
  rowId: string;
};
type SortKey =
  | "name"
  | "buildingClass"
  | "level"
  | "townHallLevel"
  | "buildResource"
  | "buildCost"
  | "buildTime"
  | "hitpoints"
  | "dps";
const TIME_FORMAT_LABELS: Record<BuildTimeFormat, string> = {
  compact: "Compact",
  "total-minutes": "Minutes",
  hours: "Hours",
  days: "Days",
};

function normalizeTownHallLevel(level: number | null) {
  if (level === null) {
    return null;
  }

  return level === 0 ? 1 : level;
}

function escapeCsvValue(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function sanitizeFilenamePart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function downloadTextFile(filename: string, text: string) {
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

function formatTotalMinutes(totalMinutes: number, format: BuildTimeFormat) {
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

function formatInteger(value: number | null | undefined) {
  return typeof value === "number" ? value.toLocaleString("en-US") : "—";
}

export function UpgradeLibrary() {
  const [rows, setRows] = useState<BuildingUpgradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedTownHalls, setSelectedTownHalls] = useState<number[]>([]);
  const [sortEntries, setSortEntries] = useState<SortEntry[]>([{ key: "buildingClass", direction: "asc" }]);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const selectionAnchorRef = useRef<SelectionAnchor | null>(null);
  const suppressNextClickRef = useRef(false);
  const [timeFormat, setTimeFormat] = useState<BuildTimeFormat>(() => {
    if (typeof window === "undefined") {
      return "compact";
    }

    const stored = window.localStorage.getItem(TIME_FORMAT_KEY);
    return stored === "total-minutes" ? "total-minutes" : "compact";
  });
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === "dark" ? "dark" : "light";
  });
  const townHallFilterInitialized = useRef(false);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const selectedRowIdSet = useMemo(() => new Set(selectedRowIds), [selectedRowIds]);

  useEffect(() => {
    window.localStorage.setItem(TIME_FORMAT_KEY, timeFormat);
  }, [timeFormat]);

  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, theme);
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    loadBuildingUpgrades()
      .then((nextRows) => {
        if (!mounted) return;
        setRows(nextRows);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load building data");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const townHallLevels = useMemo(() => {
    const levels = new Set<number>();

    for (const row of rows) {
      if (row.village !== "Home" || row.name.startsWith("Unused") || row.townHallLevel === null) {
        continue;
      }
      levels.add(normalizeTownHallLevel(row.townHallLevel) ?? 0);
    }

    return Array.from(levels).sort((a, b) => b - a);
  }, [rows]);

  useEffect(() => {
    if (townHallFilterInitialized.current || townHallLevels.length === 0) {
      return;
    }

    setSelectedTownHalls([townHallLevels[0]]);
    townHallFilterInitialized.current = true;
  }, [townHallLevels]);

  const selectedTownHallSet = useMemo(() => new Set(selectedTownHalls), [selectedTownHalls]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (row.village !== "Home") {
        return false;
      }

      if (row.name.startsWith("Unused")) {
        return false;
      }

      const normalizedTownHallLevel = normalizeTownHallLevel(row.townHallLevel);
      if (selectedTownHallSet.size === 0 || normalizedTownHallLevel === null || !selectedTownHallSet.has(normalizedTownHallLevel)) {
        return false;
      }

      if (deferredSearch && !row.searchText.includes(deferredSearch)) {
        return false;
      }

      return true;
    });
  }, [deferredSearch, rows, selectedTownHallSet]);

  const displayedRows = useMemo(() => {
    const indexedRows = filteredRows.map((row, index) => ({ row, index }));

    const compareText = (left: string, right: string) =>
      left.localeCompare(right, "en-US", { sensitivity: "base" });
    const compareNumber = (left: number | null, right: number | null) => {
      if (left === right) {
        return 0;
      }

      if (left === null) {
        return 1;
      }

      if (right === null) {
        return -1;
      }

      return left - right;
    };

    indexedRows.sort((left, right) => {
      for (const entry of sortEntries) {
        let comparison = 0;

        switch (entry.key) {
          case "name":
            comparison = compareText(left.row.name, right.row.name);
            break;
          case "buildingClass":
            comparison = compareText(left.row.buildingClass || "Unknown", right.row.buildingClass || "Unknown");
            break;
          case "level":
            comparison = compareNumber(left.row.level, right.row.level);
            break;
          case "townHallLevel":
            comparison = compareNumber(
              normalizeTownHallLevel(left.row.townHallLevel),
              normalizeTownHallLevel(right.row.townHallLevel),
            );
            break;
          case "buildResource":
            comparison = compareText(formatResourceLabel(left.row.buildResource), formatResourceLabel(right.row.buildResource));
            break;
          case "buildCost":
            comparison = compareNumber(left.row.buildCost, right.row.buildCost);
            break;
          case "buildTime":
            comparison = compareNumber(left.row.buildTimeTotalMinutes, right.row.buildTimeTotalMinutes);
            break;
          case "hitpoints":
            comparison = compareNumber(left.row.hitpoints, right.row.hitpoints);
            break;
          case "dps":
            comparison = compareNumber(left.row.dps, right.row.dps);
            break;
        }

        if (comparison !== 0) {
          return entry.direction === "asc" ? comparison : -comparison;
        }
      }

      const fallbackName = compareText(left.row.name, right.row.name);
      if (fallbackName !== 0) {
        return fallbackName;
      }

      return left.index - right.index;
    });

    return indexedRows.map(({ row }) => row);
  }, [filteredRows, sortEntries]);

  const selectedRows = useMemo(
    () => displayedRows.filter((row) => selectedRowIdSet.has(row.id)),
    [displayedRows, selectedRowIdSet],
  );

  const selectedTotals = useMemo(() => {
    const costByResource = new Map<string, number>();
    let totalMinutes = 0;

    for (const row of selectedRows) {
      const resourceKey = formatResourceLabel(row.buildResource);
      costByResource.set(resourceKey, (costByResource.get(resourceKey) ?? 0) + (row.buildCost ?? 0));
      totalMinutes += row.buildTimeTotalMinutes;
    }

    return {
      count: selectedRows.length,
      costByResource: Array.from(costByResource.entries()),
      timeMinutes: totalMinutes,
    };
  }, [selectedRows]);

  const selectionSummary = useMemo(() => {
    if (selectedTotals.count === 0) {
      return null;
    }

    return {
      countLabel: `${selectedTotals.count} selected`,
      costLabels: selectedTotals.costByResource.map(([resource, cost]) => ({
        resource,
        cost: cost.toLocaleString("en-US"),
      })),
      timeLabel: formatTotalMinutes(selectedTotals.timeMinutes, timeFormat),
    };
  }, [selectedTotals, timeFormat]);

  const townHallFilterLabel = useMemo(() => {
    if (selectedTownHalls.length === 0) {
      return "No TH";
    }

    if (selectedTownHalls.length === townHallLevels.length) {
      return "All TH";
    }

    if (selectedTownHalls.length === 1) {
      return `TH ${selectedTownHalls[0]}`;
    }

    return `${selectedTownHalls.length} TH levels`;
  }, [selectedTownHalls, townHallLevels.length]);

  const allTownHallsSelected =
    townHallLevels.length > 0 && selectedTownHalls.length === townHallLevels.length;

  const selectAllTownHalls = () => {
    setSelectedTownHalls(allTownHallsSelected ? [] : townHallLevels);
  };

  const toggleTownHall = (townHallLevel: number) => {
    setSelectedTownHalls((current) => {
      if (current.includes(townHallLevel)) {
        return current.filter((value) => value !== townHallLevel);
      }

      return [...current, townHallLevel].sort((a, b) => b - a);
    });
  };

  const renderResourceLabel = (resource: string) => {
    const label = formatResourceLabel(resource);
    const normalizedResource = label.replace(/\s+/g, "");
    const toneClass =
      normalizedResource === "Gold"
        ? "resource-tone-gold"
        : normalizedResource === "Elixir"
          ? "resource-tone-elixir"
          : normalizedResource === "DarkElixir"
            ? "resource-tone-dark-elixir"
            : "";

    return <span className={`resource-label ${toneClass}`}>{label}</span>;
  };

  const renderTownHallLabel = (level: number | null) => {
    const normalizedLevel = normalizeTownHallLevel(level);
    return normalizedLevel === null ? "—" : `TH ${normalizedLevel}`;
  };

  const setColumnSort = (key: SortKey, additive: boolean) => {
    setSortEntries((currentEntries) => {
      const existingIndex = currentEntries.findIndex((entry) => entry.key === key);

      if (!additive) {
        if (existingIndex === -1) {
          return [{ key, direction: "asc" }];
        }

        const currentEntry = currentEntries[existingIndex];

        if (currentEntry.direction === "asc") {
          return [{ key, direction: "desc" }];
        }

        return currentEntries.filter((entry) => entry.key !== key);
      }

      if (existingIndex === -1) {
        return [...currentEntries, { key, direction: "asc" }];
      }

      const nextEntries = [...currentEntries];
      const currentEntry = nextEntries[existingIndex];

      if (currentEntry.direction === "asc") {
        nextEntries[existingIndex] = { ...currentEntry, direction: "desc" };
        return nextEntries;
      }

      return nextEntries.filter((entry) => entry.key !== key);
    });
  };

  const getSortIndicator = (key: SortKey) => {
    const index = sortEntries.findIndex((entry) => entry.key === key);
    if (index === -1) {
      return "";
    }

    const entry = sortEntries[index];
    return `${entry.direction === "asc" ? "↑" : "↓"}${index > 0 ? index + 1 : ""}`;
  };

  const getAriaSort = (key: SortKey) => {
    if (sortEntries[0]?.key !== key) {
      return "none";
    }

    return sortEntries[0].direction === "asc" ? "ascending" : "descending";
  };

  const clearSelection = () => {
    setSelectedRowIds([]);
    selectionAnchorRef.current = null;
  };

  const replaceSelectionRange = (startIndex: number, endIndex: number) => {
    const lower = Math.min(startIndex, endIndex);
    const upper = Math.max(startIndex, endIndex);
    const nextIds = displayedRows.slice(lower, upper + 1).map((row) => row.id);
    setSelectedRowIds(nextIds);
  };

  const handleRowMouseDown = (event: MouseEvent<HTMLTableRowElement>, rowIndex: number, rowId: string) => {
    if (event.button !== 0) {
      return;
    }

    const additive = event.metaKey || event.ctrlKey;
    const shift = event.shiftKey;

    if (!additive && !shift) {
      return;
    }

    event.preventDefault();
    suppressNextClickRef.current = true;

    if (shift) {
      const anchorId = selectionAnchorRef.current?.rowId;
      const anchorIndex = anchorId ? displayedRows.findIndex((row) => row.id === anchorId) : -1;

      if (anchorIndex === -1) {
        replaceSelectionRange(rowIndex, rowIndex);
      } else {
        replaceSelectionRange(anchorIndex, rowIndex);
      }

      selectionAnchorRef.current = { rowId };
      return;
    }

    if (additive) {
      setSelectedRowIds((current) =>
        current.includes(rowId) ? current.filter((id) => id !== rowId) : [...current, rowId],
      );
      selectionAnchorRef.current = { rowId };
      return;
    }

    setSelectedRowIds([rowId]);
    selectionAnchorRef.current = { rowId };
  };

  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>, rowId: string) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }

    if (event.button !== 0) {
      return;
    }

    setSelectedRowIds([rowId]);
    selectionAnchorRef.current = { rowId };
  };

  const downloadFilteredCsv = () => {
    const headers = ["Name", "Class", "Level", "Town Hall", "Resource", "Cost", "Time", "HP", "DPS"];
    const rowsForExport = displayedRows.map((row) => [
      row.name,
      row.buildingClass || "Unknown",
      row.level === null || row.level === undefined ? "—" : String(row.level),
      renderTownHallLabel(row.townHallLevel),
      formatResourceLabel(row.buildResource),
      formatInteger(row.buildCost),
      formatBuildTimeLabelWithMode(row, timeFormat),
      formatInteger(row.hitpoints),
      formatInteger(row.dps),
    ]);

    const csv = [headers, ...rowsForExport]
      .map((line) => line.map((value) => escapeCsvValue(value)).join(","))
      .join("\n");

    const filenameParts = ["clash-of-clans-upgrades"];

    if (selectedTownHalls.length > 0 && selectedTownHalls.length !== townHallLevels.length) {
      filenameParts.push(`th-${selectedTownHalls.map(String).join("-")}`);
    } else if (selectedTownHalls.length === 0) {
      filenameParts.push("th-none");
    } else {
      filenameParts.push("th-all");
    }

    if (search.trim()) {
      filenameParts.push(`search-${sanitizeFilenamePart(search)}`);
    }

    downloadTextFile(`${filenameParts.join("_")}.csv`, csv);
  };

  return (
    <section className="panel library-panel">
      <div className="panel-header library-header">
        <div>
          <h2>Clash of Clans Upgrade Library</h2>
        </div>
        <div className="library-header-actions">
          <button type="button" className="library-download-button" onClick={downloadFilteredCsv} disabled={filteredRows.length === 0}>
            <Download size={15} />
            <span>Download CSV</span>
          </button>
          <details className="library-settings">
            <summary className="library-settings-summary" aria-label="Library settings">
              <Settings2 size={16} />
              <span>Settings</span>
            </summary>
            <div className="library-settings-panel">
              <div className="library-settings-header">
                <strong>Preferences</strong>
              </div>
              <label className="library-setting-row">
                <span>Time format</span>
                <details className="time-format-menu">
                  <summary className="time-format-trigger" aria-label="Time format">
                    <span className="time-format-value">{TIME_FORMAT_LABELS[timeFormat]}</span>
                    <span className="time-format-caret" aria-hidden="true" />
                  </summary>
                  <div className="time-format-panel" role="menu" aria-label="Time format options">
                    {(["compact", "total-minutes", "hours", "days"] as BuildTimeFormat[]).map((format) => (
                      <button
                        key={format}
                        type="button"
                        className={`time-format-option${timeFormat === format ? " active" : ""}`}
                        onClick={(event) => {
                          setTimeFormat(format);
                          const details = event.currentTarget.closest("details");
                          details?.removeAttribute("open");
                        }}
                      >
                        {TIME_FORMAT_LABELS[format]}
                      </button>
                    ))}
                  </div>
                </details>
              </label>
              <div className="library-setting-row">
                <span>Theme</span>
                <div className="theme-segmented-control" role="group" aria-label="Theme">
                  <button
                    type="button"
                    className={`theme-segment theme-segment-light${theme === "light" ? " active" : ""}`}
                    aria-pressed={theme === "light"}
                    onClick={() => setTheme("light")}
                  >
                    <span className="theme-segment-label">Light</span>
                    <span className="theme-segment-indicator" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={`theme-segment theme-segment-dark${theme === "dark" ? " active" : ""}`}
                    aria-pressed={theme === "dark"}
                    onClick={() => setTheme("dark")}
                  >
                    <span className="theme-segment-label">Dark</span>
                    <span className="theme-segment-indicator" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>

      <div className="library-search">
        <div className="library-search-main">
          <div className="search-row">
            <label className="library-search-field">
              <span>
                <Search size={14} /> Search buildings
              </span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, class, resource, town hall..."
                autoComplete="off"
                spellCheck={false}
              />
            </label>

            <details className="town-hall-filter">
              <summary className="town-hall-filter-summary" aria-label="Town Hall level filter">
                <span className="town-hall-filter-label">Town Hall</span>
                <span className="town-hall-filter-value">{townHallFilterLabel}</span>
              </summary>
              <div className="town-hall-filter-panel" role="group" aria-label="Town Hall level filter options">
                <button
                  type="button"
                  className={`th-filter-chip th-filter-select-all${allTownHallsSelected ? " active" : ""}`}
                  aria-pressed={allTownHallsSelected}
                  onClick={selectAllTownHalls}
                >
                  {allTownHallsSelected ? "Deselect all" : "Select all"}
                </button>
                <div className="th-filter-chips">
                  {townHallLevels.map((townHallLevel) => {
                    const active = selectedTownHallSet.has(townHallLevel);
                    return (
                      <button
                        key={townHallLevel}
                        type="button"
                        className={`th-filter-chip${active ? " active" : ""}`}
                        aria-pressed={active}
                        onClick={() => toggleTownHall(townHallLevel)}
                      >
                        TH {townHallLevel}
                      </button>
                    );
                  })}
                </div>
              </div>
            </details>
          </div>

        </div>
      </div>

      {error ? <div className="empty-state">{error}</div> : null}

      {!error && loading ? <div className="empty-state">Loading building data from the APK export...</div> : null}

      {!error && !loading && selectionSummary ? (
        <div className="selection-summary">
          <div>
            <strong>{selectionSummary.countLabel}</strong>
            <p>
              <span className="selection-summary-tone selection-summary-tone-time">Time {selectionSummary.timeLabel}</span>
              {selectionSummary.costLabels.map(({ resource, cost }) => (
                <span key={resource} className={`selection-summary-tone selection-summary-tone-${resource.toLowerCase().replace(/\s+/g, "-")}`}>
                  {resource} {cost}
                </span>
              ))}
            </p>
          </div>
          <button type="button" className="selection-clear-button" onClick={clearSelection}>
            Clear selection
          </button>
        </div>
      ) : null}

      {!error && !loading ? (
        <div className="table-shell">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th aria-sort={getAriaSort("name")}>
                    <button type="button" className="table-sort-button" onClick={(event) => setColumnSort("name", event.shiftKey)}>
                      <span>Name</span>
                      <span className="table-sort-indicator">{getSortIndicator("name")}</span>
                    </button>
                  </th>
                  <th aria-sort={getAriaSort("buildingClass")}>
                    <button type="button" className="table-sort-button" onClick={(event) => setColumnSort("buildingClass", event.shiftKey)}>
                      <span>Class</span>
                      <span className="table-sort-indicator">{getSortIndicator("buildingClass")}</span>
                    </button>
                  </th>
                  <th aria-sort={getAriaSort("level")}>
                    <button type="button" className="table-sort-button" onClick={(event) => setColumnSort("level", event.shiftKey)}>
                      <span>Lvl</span>
                      <span className="table-sort-indicator">{getSortIndicator("level")}</span>
                    </button>
                  </th>
                  <th aria-sort={getAriaSort("townHallLevel")}>
                    <button type="button" className="table-sort-button" onClick={(event) => setColumnSort("townHallLevel", event.shiftKey)}>
                      <span>Town Hall</span>
                      <span className="table-sort-indicator">{getSortIndicator("townHallLevel")}</span>
                    </button>
                  </th>
                  <th aria-sort={getAriaSort("buildResource")}>
                    <button type="button" className="table-sort-button" onClick={(event) => setColumnSort("buildResource", event.shiftKey)}>
                      <span>Resource</span>
                      <span className="table-sort-indicator">{getSortIndicator("buildResource")}</span>
                    </button>
                  </th>
                  <th aria-sort={getAriaSort("buildCost")}>
                    <button type="button" className="table-sort-button" onClick={(event) => setColumnSort("buildCost", event.shiftKey)}>
                      <span>Cost</span>
                      <span className="table-sort-indicator">{getSortIndicator("buildCost")}</span>
                    </button>
                  </th>
                  <th aria-sort={getAriaSort("buildTime")}>
                    <button type="button" className="table-sort-button" onClick={(event) => setColumnSort("buildTime", event.shiftKey)}>
                      <span>Time</span>
                      <span className="table-sort-indicator">{getSortIndicator("buildTime")}</span>
                    </button>
                  </th>
                  <th aria-sort={getAriaSort("hitpoints")}>
                    <button type="button" className="table-sort-button" onClick={(event) => setColumnSort("hitpoints", event.shiftKey)}>
                      <span>HP</span>
                      <span className="table-sort-indicator">{getSortIndicator("hitpoints")}</span>
                    </button>
                  </th>
                  <th aria-sort={getAriaSort("dps")}>
                    <button type="button" className="table-sort-button" onClick={(event) => setColumnSort("dps", event.shiftKey)}>
                      <span>DPS</span>
                      <span className="table-sort-indicator">{getSortIndicator("dps")}</span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.map((row, rowIndex) => {
                  const selected = selectedRowIdSet.has(row.id);

                  return (
                    <tr
                      key={row.id}
                      className={selected ? "row-selected" : ""}
                      onMouseDown={(event) => handleRowMouseDown(event, rowIndex, row.id)}
                      onClick={(event) => handleRowClick(event, row.id)}
                    >
                      <td className="table-name">
                        <strong>{row.name}</strong>
                      </td>
                      <td>{row.buildingClass || "Unknown"}</td>
                      <td>{row.level ?? "—"}</td>
                      <td>{renderTownHallLabel(row.townHallLevel)}</td>
                      <td>{renderResourceLabel(row.buildResource)}</td>
                      <td>{formatInteger(row.buildCost)}</td>
                      <td>{formatBuildTimeLabelWithMode(row, timeFormat)}</td>
                      <td>{formatInteger(row.hitpoints)}</td>
                      <td>{formatInteger(row.dps)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
