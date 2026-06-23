import { Search } from "lucide-react";

export function UpgradeLibrarySearch({
  search,
  onSearchChange,
  townHallFilterLabel,
  townHallLevels,
  selectedTownHallSet,
  allTownHallsSelected,
  onSelectAllTownHalls,
  onToggleTownHall,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  townHallFilterLabel: string;
  townHallLevels: number[];
  selectedTownHallSet: Set<number>;
  allTownHallsSelected: boolean;
  onSelectAllTownHalls: () => void;
  onToggleTownHall: (townHallLevel: number) => void;
}) {
  return (
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
              onChange={(event) => onSearchChange(event.target.value)}
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
                onClick={onSelectAllTownHalls}
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
                      onClick={() => onToggleTownHall(townHallLevel)}
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
  );
}
