import { UpgradeLibraryHeader } from "./UpgradeLibraryHeader";
import { UpgradeLibrarySearch } from "./UpgradeLibrarySearch";
import { UpgradeLibraryTable } from "./UpgradeLibraryTable";
import { useUpgradeLibraryModel } from "./useUpgradeLibraryModel";

export function UpgradeLibrary() {
  const {
    loading,
    error,
    search,
    setSearch,
    timeFormat,
    setTimeFormat,
    theme,
    setTheme,
    displayedRows,
    selectedRowIdSet,
    selectionSummary,
    townHallLevels,
    selectedTownHallSet,
    townHallFilterLabel,
    allTownHallsSelected,
    downloadDisabled,
    onDownloadCsv,
    onSelectAllTownHalls,
    onToggleTownHall,
    setColumnSort,
    getSortIndicator,
    getAriaSort,
    handleRowMouseDown,
    handleRowClick,
    clearSelection,
  } = useUpgradeLibraryModel();

  return (
    <section className="panel library-panel">
      <UpgradeLibraryHeader
        downloadDisabled={downloadDisabled}
        onDownloadCsv={onDownloadCsv}
        timeFormat={timeFormat}
        onTimeFormatChange={setTimeFormat}
        theme={theme}
        onThemeChange={setTheme}
      />

      <UpgradeLibrarySearch
        search={search}
        onSearchChange={setSearch}
        townHallFilterLabel={townHallFilterLabel}
        townHallLevels={townHallLevels}
        selectedTownHallSet={selectedTownHallSet}
        allTownHallsSelected={allTownHallsSelected}
        onSelectAllTownHalls={onSelectAllTownHalls}
        onToggleTownHall={onToggleTownHall}
      />

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
        <UpgradeLibraryTable
          displayedRows={displayedRows}
          selectedRowIdSet={selectedRowIdSet}
          timeFormat={timeFormat}
          setColumnSort={setColumnSort}
          getSortIndicator={getSortIndicator}
          getAriaSort={getAriaSort}
          handleRowMouseDown={handleRowMouseDown}
          handleRowClick={handleRowClick}
        />
      ) : null}
    </section>
  );
}
