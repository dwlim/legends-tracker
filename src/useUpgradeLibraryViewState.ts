import { useMemo } from "react";
import { useUpgradeLibraryCatalogData } from "./useUpgradeLibraryCatalogData";
import { useUpgradeLibraryControlsState } from "./useUpgradeLibraryControlsState";

export function useUpgradeLibraryViewState() {
  const catalogState = useUpgradeLibraryCatalogData();
  const controlsState = useUpgradeLibraryControlsState(catalogState);

  return useMemo(
    () => ({
      ...catalogState,
      ...controlsState,
    }),
    [catalogState, controlsState],
  );
}
