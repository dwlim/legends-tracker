import type { MouseEvent } from "react";
import type { BuildTimeFormat, BuildingUpgradeRow } from "./buildingCatalog";
import { formatBuildTimeLabelWithMode, formatResourceLabel } from "./buildingCatalog";
import { formatInteger, normalizeTownHallLevel } from "./upgradeLibraryUtils";
import type { SortKey } from "./upgradeLibraryTypes";

export function UpgradeLibraryTable({
  displayedRows,
  selectedRowIdSet,
  timeFormat,
  setColumnSort,
  getSortIndicator,
  getAriaSort,
  handleRowMouseDown,
  handleRowClick,
}: {
  displayedRows: BuildingUpgradeRow[];
  selectedRowIdSet: Set<string>;
  timeFormat: BuildTimeFormat;
  setColumnSort: (key: SortKey, additive: boolean) => void;
  getSortIndicator: (key: SortKey) => string;
  getAriaSort: (key: SortKey) => "none" | "ascending" | "descending" | "other";
  handleRowMouseDown: (event: MouseEvent<HTMLTableRowElement>, rowIndex: number, rowId: string) => void;
  handleRowClick: (event: MouseEvent<HTMLTableRowElement>, rowId: string) => void;
}) {
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

  return (
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
  );
}
