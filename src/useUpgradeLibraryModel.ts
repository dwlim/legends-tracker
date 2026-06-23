import { useMemo } from "react";
import { useUpgradeLibrarySelectionState } from "./useUpgradeLibrarySelectionState";
import { useUpgradeLibraryViewState } from "./useUpgradeLibraryViewState";

export function useUpgradeLibraryModel() {
  const viewState = useUpgradeLibraryViewState();
  const selectionState = useUpgradeLibrarySelectionState(viewState.displayedRows, viewState.timeFormat);

  return useMemo(
    () => ({
      ...viewState,
      ...selectionState,
    }),
    [selectionState, viewState],
  );
}
