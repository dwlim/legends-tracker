import { Download, Settings2 } from "lucide-react";
import type { BuildTimeFormat } from "./buildingCatalog";
import { TIME_FORMAT_LABELS, type ThemeMode } from "./upgradeLibraryTypes";

export function UpgradeLibraryHeader({
  downloadDisabled,
  onDownloadCsv,
  timeFormat,
  onTimeFormatChange,
  theme,
  onThemeChange,
}: {
  downloadDisabled: boolean;
  onDownloadCsv: () => void;
  timeFormat: BuildTimeFormat;
  onTimeFormatChange: (format: BuildTimeFormat) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}) {
  return (
    <div className="panel-header library-header">
      <div>
        <h2>Clash of Clans Upgrade Library</h2>
      </div>
      <div className="library-header-actions">
        <button type="button" className="library-download-button" onClick={onDownloadCsv} disabled={downloadDisabled}>
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
                        onTimeFormatChange(format);
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
                  onClick={() => onThemeChange("light")}
                >
                  <span className="theme-segment-label">Light</span>
                  <span className="theme-segment-indicator" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={`theme-segment theme-segment-dark${theme === "dark" ? " active" : ""}`}
                  aria-pressed={theme === "dark"}
                  onClick={() => onThemeChange("dark")}
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
  );
}
