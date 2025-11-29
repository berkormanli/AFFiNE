import type { InsertToPosition } from '@blocksuite/affine-shared/utils';
import { AddCursorIcon } from '@blocksuite/icons/lit';
import { css } from '@emotion/css';
import { signal } from '@preact/signals-core';
import { nothing, type TemplateResult } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import {
  createUniComponentFromWebComponent,
  renderUniLit,
} from '../../../core/index.js';
import {
  DataViewUIBase,
  DataViewUILogicBase,
} from '../../../core/view/data-view-base.js';
import type { ListSingleView } from '../list-view-manager.js';
import type { ListViewSelectionWithType } from '../selection.js';
import { ListClipboardController } from './controller/clipboard.js';
import { ListHotkeysController } from './controller/hotkeys.js';
import { ListSelectionController } from './controller/selection.js';

export class ListViewUILogic extends DataViewUILogicBase<
  ListSingleView,
  ListViewSelectionWithType
> {
  ui$ = signal<ListViewUI | undefined>();
  clipboardController = new ListClipboardController(this);
  hotkeysController = new ListHotkeysController(this);
  selectionController = new ListSelectionController(this);

  private get readonly() {
    return this.view.readonly$.value;
  }

  clearSelection = () => {
    this.selectionController.clear();
  };

  addRow = (position: InsertToPosition) => {
    if (this.readonly) return;
    const rowId = this.view.rowAdd(position);
    if (rowId) {
      this.root.openDetailPanel({
        view: this.view,
        rowId,
      });
    }
    this.ui$.value?.requestUpdate();
    return rowId;
  };

  focusFirstCell = () => {
    this.selectionController.focusFirstCell();
  };

  showIndicator = (_evt: MouseEvent) => {
    return false;
  };

  hideIndicator = () => {};

  moveTo = () => {};

  renderer = createUniComponentFromWebComponent(ListViewUI);
}

export class ListViewUI extends DataViewUIBase<ListViewUILogic> {
  private renderRows() {
    const rows = this.logic.view.rows$.value;
    if (!rows || rows.length === 0) {
      return html`<div class="${emptyStateStyle}">
        No tasks yet. Click "Add Task" to create your first task.
      </div>`;
    }

    return html`${repeat(
      rows,
      row => row.rowId,
      row => {
        return html`
          <affine-data-view-list-row
            data-row-id="${row.rowId}"
            .listViewLogic="${this.logic}"
            .rowId="${row.rowId}"
          ></affine-data-view-list-row>
        `;
      }
    )}`;
  }

  private renderAddRow() {
    if (this.logic.view.readonly$.value) {
      return nothing;
    }
    return html`
      <div class="${addRowStyle}" @click="${() => this.logic.addRow('end')}">
        <div class="${addRowIconStyle}">${AddCursorIcon()}</div>
        <span>Add Task</span>
      </div>
    `;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.logic.ui$.value = this;
    this.logic.clipboardController.hostConnected();
    this.logic.hotkeysController.hostConnected();
    this.logic.selectionController.hostConnected();
    this.classList.add('list-view', listViewStyle);
    this.style.userSelect = 'none';
    this.style.display = 'flex';
    this.style.flexDirection = 'column';
  }

  override render(): TemplateResult {
    const vPadding = this.logic.root.config.virtualPadding$.value;
    const wrapperStyle = styleMap({
      marginLeft: `-${vPadding}px`,
      marginRight: `-${vPadding}px`,
      paddingLeft: `${vPadding}px`,
      paddingRight: `${vPadding}px`,
    });

    return html`
      ${renderUniLit(this.logic.root.config.headerWidget, {
        dataViewLogic: this.logic,
      })}
      <div class="${listContainerStyle}" style="${wrapperStyle}">
        ${this.renderRows()} ${this.renderAddRow()}
      </div>
    `;
  }
}

const listViewStyle = css({
  userSelect: 'none',
  display: 'flex',
  flexDirection: 'column',
});

const listContainerStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '8px 0',
});

const emptyStateStyle = css({
  padding: '24px',
  textAlign: 'center',
  color: 'var(--affine-text-secondary-color)',
  fontSize: '14px',
});

const addRowStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  cursor: 'pointer',
  borderRadius: '4px',
  color: 'var(--affine-text-secondary-color)',
  fontSize: '14px',

  '&:hover': {
    backgroundColor: 'var(--affine-hover-color)',
    color: 'var(--affine-text-primary-color)',
  },
});

const addRowIconStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',

  '& svg': {
    width: '16px',
    height: '16px',
    fill: 'currentColor',
    color: 'currentColor',
  },
});

declare global {
  interface HTMLElementTagNameMap {
    'dv-list-view-ui': ListViewUI;
  }
}
