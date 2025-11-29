import type { ReactiveController } from 'lit';

import type {
  ListCellSelection,
  ListRowSelection,
  ListRowSelectionRow,
  ListViewSelection,
  ListViewSelectionWithType,
} from '../../selection';
import { ListCell } from '../cell.js';
import type { ListViewUILogic } from '../list-view-ui-logic.js';
import { ListRow } from '../row.js';

export class ListSelectionController implements ReactiveController {
  private _selection?: ListViewSelectionWithType;

  shiftClickRow = (event: MouseEvent) => {
    event.preventDefault();

    const selection = this.selection;
    const target = event.target as HTMLElement;
    const closestRowId = target.closest('affine-data-view-list-row')?.rowId;
    if (!closestRowId) return;
    const rows = selection?.selectionType === 'row' ? selection.rows : [];

    const newRows = rows.some(row => row.rowId === closestRowId)
      ? rows.filter(row => row.rowId !== closestRowId)
      : [...rows, { rowId: closestRowId }];
    this.selection = atLeastOne(newRows)
      ? {
          selectionType: 'row',
          rows: newRows,
        }
      : undefined;
  };

  get selection(): ListViewSelectionWithType | undefined {
    return this._selection;
  }

  set selection(data: ListViewSelection | undefined) {
    const host = this.host;
    if (!host) {
      return;
    }
    if (!data) {
      this.logic.setSelection();
      return;
    }
    const selection: ListViewSelectionWithType = {
      ...data,
      viewId: this.logic.view.id,
      type: 'list',
    };

    if (selection.selectionType === 'cell' && selection.isEditing) {
      const container = getFocusCell(host, selection);
      const cell = container?.cell;
      const isEditing = cell
        ? cell.beforeEnterEditMode()
          ? selection.isEditing
          : false
        : false;
      this.logic.setSelection({
        ...selection,
        isEditing,
      });
    } else {
      this.logic.setSelection(selection);
    }
  }

  get view() {
    return this.logic.view;
  }

  get host() {
    return this.logic.ui$.value;
  }

  constructor(public logic: ListViewUILogic) {}

  blur(selection: ListViewSelection) {
    const host = this.host;
    if (!host) {
      return;
    }
    if (selection.selectionType !== 'cell') {
      const selectRows = getSelectedRows(this.host, selection);
      selectRows.forEach(row => (row.isFocus$.value = false));
      return;
    }
    const container = getFocusCell(this.host, selection);
    if (!container) {
      return;
    }
    container.isFocus$.value = false;
    const cell = container?.cell;

    if (selection.isEditing) {
      cell?.beforeExitEditingMode();
      if (cell?.blurCell()) {
        container.blur();
      }
      container.isEditing$.value = false;
    } else {
      container.blur();
    }
  }

  clear() {
    this.selection = undefined;
  }

  deleteRow() {
    const selection = this.selection;
    if (!selection || selection.selectionType === 'cell') {
      return;
    }
    if (selection.selectionType === 'row') {
      this.view.rowsDelete(selection.rows.map(v => v.rowId));
      this.selection = undefined;
      this.logic.ui$.value?.requestUpdate();
    }
  }

  focus(selection: ListViewSelection) {
    const host = this.host;
    if (!host) {
      return;
    }
    if (selection.selectionType !== 'cell') {
      const selectRows = getSelectedRows(this.host, selection);
      selectRows.forEach((row, index) => {
        if (index === 0) {
          row.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
        row.isFocus$.value = true;
      });
      return;
    }
    const container = getFocusCell(this.host, selection);
    if (!container) {
      return;
    }
    container.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    container.isFocus$.value = true;
    const cell = container?.cell;
    if (selection.isEditing) {
      if (cell?.focusCell()) {
        container.focus();
      }
      container.isEditing$.value = true;
      requestAnimationFrame(() => {
        cell?.afterEnterEditingMode();
      });
    } else {
      container.focus();
    }
  }

  focusFirstCell() {
    const rows = this.logic.view.rows$.value;
    const row = rows?.[0];
    const columnId = row && this.view.getHeaderTitle(row.rowId)?.id;
    if (row && columnId) {
      this.selection = {
        selectionType: 'cell',
        rowId: row.rowId,
        columnId,
        isEditing: false,
      };
    }
  }

  focusIn() {
    const host = this.host;
    if (!host) {
      return;
    }
    const selection = this.selection;
    if (!selection) return;
    if (selection.selectionType === 'cell' && selection.isEditing) return;

    if (selection.selectionType === 'cell') {
      this.selection = {
        ...selection,
        isEditing: true,
      };
      return;
    }
    if (selection.selectionType === 'row') {
      const row = getSelectedRows(this.host, selection)[0];
      const cell = row?.querySelector('affine-data-view-list-cell');
      if (row && cell) {
        this.selection = {
          rowId: row.rowId,
          selectionType: 'cell',
          columnId: cell.column.id,
          isEditing: false,
        };
      }
    }
  }

  focusNext(position: 'up' | 'down') {
    const host = this.host;
    if (!host) {
      return;
    }
    const selection = this.selection;
    if (!selection) {
      return;
    }

    if (selection.selectionType === 'cell' && !selection.isEditing) {
      const listCells = getRowCellsBySelection(this.host, selection);
      const index = listCells.findIndex(
        cell => cell.column.id === selection.columnId
      );
      const result = this.getNextFocusCell(selection, index, position);
      if (!result) return;
      const { cell, rowId } = result;
      if (cell instanceof ListCell) {
        this.selection = {
          ...selection,
          rowId: rowId ?? selection.rowId,
          columnId: cell.column.id,
        } satisfies ListCellSelection;
      }
    } else if (selection.selectionType === 'row') {
      const rowElements = Array.from(
        this.host?.querySelectorAll('affine-data-view-list-row') ?? []
      );

      const index = rowElements.findIndex(
        row => row.rowId === selection.rows[0].rowId
      );
      const result = this.getNextFocusRow(selection, index, position);
      if (!result) return;
      const { row, rows } = result;
      if (row instanceof ListRow) {
        const newRows = rows ?? selection.rows;
        this.selection = atLeastOne(newRows)
          ? {
              ...selection,
              rows: newRows,
            }
          : undefined;
      }
    }
  }

  focusOut() {
    const selection = this.selection;
    if (selection?.selectionType === 'row') {
      if (atLeastOne(selection.rows)) {
        this.selection = {
          ...selection,
          rows: [selection.rows[0]],
        };
      } else {
        return;
      }
    }
    if (selection?.selectionType !== 'cell') {
      return;
    }

    if (selection.isEditing) {
      this.selection = {
        ...selection,
        isEditing: false,
      };
    } else {
      this.selection = {
        selectionType: 'row',
        rows: [
          {
            rowId: selection.rowId,
          },
        ],
      };
    }
  }

  getNextFocusRow(
    selection: ListRowSelection,
    index: number,
    nextPosition: 'up' | 'down'
  ):
    | {
        row: ListRow;
        rows: ListRowSelectionRow[];
      }
    | undefined {
    const host = this.host;
    if (!host) {
      return;
    }
    const listRows = Array.from(
      host.querySelectorAll('affine-data-view-list-row') ?? []
    );

    if (nextPosition === 'up') {
      const nextIndex = index - 1;
      const nextRowIndex = nextIndex < 0 ? listRows.length - 1 : nextIndex;
      const row = listRows[nextRowIndex];
      if (!row) return;
      return {
        row,
        rows: [{ rowId: row.rowId }],
      };
    }

    if (nextPosition === 'down') {
      const nextIndex = index + 1;
      const nextRowIndex = nextIndex > listRows.length - 1 ? 0 : nextIndex;
      const row = listRows[nextRowIndex];
      if (!row) return;
      return {
        row,
        rows: [{ rowId: row.rowId }],
      };
    }

    return;
  }

  getNextFocusCell(
    selection: ListCellSelection,
    index: number,
    nextPosition: 'up' | 'down'
  ):
    | {
        cell: ListCell;
        rowId?: string;
      }
    | undefined {
    const host = this.host;
    if (!host) {
      return;
    }
    const listCells = getRowCellsBySelection(this.host, selection);
    const rows = Array.from(
      host.querySelectorAll('affine-data-view-list-row') ?? []
    );

    if (nextPosition === 'up') {
      const nextIndex = index - 1;
      if (nextIndex < 0) {
        if (rows.length > 1) {
          return getNextRowFocusCell(nextPosition, rows, selection, rowIndex =>
            rowIndex === 0 ? rows.length - 1 : rowIndex - 1
          );
        } else {
          const cell = listCells[listCells.length - 1];
          if (!cell) return;
          return { cell };
        }
      }
      if (!listCells[nextIndex]) return;
      return { cell: listCells[nextIndex] };
    }

    if (nextPosition === 'down') {
      const nextIndex = index + 1;
      if (nextIndex >= listCells.length) {
        if (rows.length > 1) {
          return getNextRowFocusCell(nextPosition, rows, selection, rowIndex =>
            rowIndex === rows.length - 1 ? 0 : rowIndex + 1
          );
        } else {
          const cell = listCells[0];
          if (!cell) return;
          return { cell };
        }
      }
      if (!listCells[nextIndex]) return;
      return { cell: listCells[nextIndex] };
    }

    return;
  }

  hostConnected() {
    this.host?.disposables.add(
      this.logic.selection$.subscribe(selection => {
        const old = this._selection;
        if (old) {
          this.blur(old);
        }
        this._selection = selection;
        if (selection) {
          this.focus(selection);
        }
      })
    );
  }

  insertRowAfter() {
    const selection = this.selection;
    if (selection?.selectionType !== 'row') {
      return;
    }

    const { rowId } = selection.rows[0];
    const id = this.view.rowAdd({ before: false, id: rowId });

    requestAnimationFrame(() => {
      const columnId = this.view.mainProperties$.value.titleColumn;
      if (columnId) {
        this.selection = {
          selectionType: 'cell',
          rowId: id,
          columnId,
          isEditing: true,
        };
      } else {
        this.selection = {
          selectionType: 'row',
          rows: [{ rowId: id }],
        };
      }
    });
  }

  insertRowBefore() {
    const selection = this.selection;
    if (selection?.selectionType !== 'row') {
      return;
    }

    const { rowId } = selection.rows[0];
    const id = this.view.rowAdd({ before: true, id: rowId });

    requestAnimationFrame(() => {
      const columnId = this.view.mainProperties$.value.titleColumn;
      if (columnId) {
        this.selection = {
          selectionType: 'cell',
          rowId: id,
          columnId,
          isEditing: true,
        };
      } else {
        this.selection = {
          selectionType: 'row',
          rows: [{ rowId: id }],
        };
      }
    });
  }
}

function getNextRowFocusCell(
  nextPosition: 'up' | 'down',
  rows: ListRow[],
  selection: ListCellSelection,
  getNextRowIndex: (rowIndex: number) => number
):
  | {
      cell: ListCell;
      rowId: string;
    }
  | undefined {
  const rowIndex = rows.findIndex(row => row.rowId === selection.rowId);
  const nextRowIndex = getNextRowIndex(rowIndex);
  const nextRow = rows[nextRowIndex];
  if (!nextRow) return;
  const nextCells = Array.from(
    nextRow.querySelectorAll('affine-data-view-list-cell')
  );
  const nextCellIndex = nextPosition === 'up' ? nextCells.length - 1 : 0;
  if (!nextCells[nextCellIndex]) return;
  return {
    cell: nextCells[nextCellIndex],
    rowId: nextRow.rowId,
  };
}

function getRowCellsBySelection(
  viewElement: Element,
  selection: ListCellSelection
) {
  const row = getSelectedRow(viewElement, selection);
  return Array.from(row?.querySelectorAll('affine-data-view-list-cell') ?? []);
}

function getSelectedRow(
  viewElement: Element,
  selection: ListCellSelection
): ListRow | null {
  return viewElement.querySelector<ListRow>(
    `affine-data-view-list-row[data-row-id="${selection.rowId}"]`
  );
}

function getSelectedRows(
  viewElement: Element,
  selection: ListRowSelection
): ListRow[] {
  const rowIds = selection.rows.map(row => row.rowId);
  const rows = rowIds
    .map(id =>
      viewElement.querySelector<ListRow>(
        `affine-data-view-list-row[data-row-id="${id}"]`
      )
    )
    .filter((row): row is ListRow => row !== null);

  return rows;
}

function getFocusCell(viewElement: Element, selection: ListCellSelection) {
  const row = getSelectedRow(viewElement, selection);
  return row?.querySelector<ListCell>(
    `affine-data-view-list-cell[data-column-id="${selection.columnId}"]`
  );
}

const atLeastOne = <T>(v: T[]): v is [T, ...T[]] => {
  return v.length > 0;
};
