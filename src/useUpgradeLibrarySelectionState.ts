import { useMemo, useRef, useState, type MouseEvent } from "react";
import type { BuildingUpgradeRow } from "./buildingCatalog";
import { buildSelectionTotals, handleSelectionClick, handleSelectionMouseDown } from "./upgradeLibrarySelection";
import { formatTotalMinutes } from "./upgradeLibraryUtils";
import type { BuildTimeFormat } from "./buildingCatalog";

type SelectionAnchor = {
  rowId: string;
};

export function useUpgradeLibrarySelectionState(displayedRows: BuildingUpgradeRow[], timeFormat: BuildTimeFormat) {
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const selectionAnchorRef = useRef<SelectionAnchor | null>(null);
  const suppressNextClickRef = useRef(false);
  const selectedRowIdSet = useMemo(() => new Set(selectedRowIds), [selectedRowIds]);

  const selectedRows = useMemo(
    () => displayedRows.filter((row) => selectedRowIdSet.has(row.id)),
    [displayedRows, selectedRowIdSet],
  );

  const selectedTotals = useMemo(() => buildSelectionTotals(selectedRows), [selectedRows]);

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

  const clearSelection = () => {
    setSelectedRowIds([]);
    selectionAnchorRef.current = null;
  };

  return {
    selectedRowIdSet,
    selectionSummary,
    handleRowMouseDown: (event: MouseEvent<HTMLTableRowElement>, rowIndex: number, rowId: string) =>
      handleSelectionMouseDown(event, rowIndex, rowId, displayedRows, selectionAnchorRef, suppressNextClickRef, setSelectedRowIds),
    handleRowClick: (event: MouseEvent<HTMLTableRowElement>, rowId: string) =>
      handleSelectionClick(event, rowId, suppressNextClickRef, selectionAnchorRef, setSelectedRowIds),
    clearSelection,
  };
}
