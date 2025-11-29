import { unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
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
import type { ListViewSelectionWithType } from '../selection';

const mobileListViewWrapper = css({
  userSelect: 'none',
  display: 'flex',
  flexDirection: 'column',
});

const mobileListContainer = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '8px 0',
});

const mobileAddRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  borderRadius: '4px',
  fontSize: '14px',
  color: `var(${unsafeCSSVarV2('icon/primary')})`,
});

export class MobileListViewUILogic extends DataViewUILogicBase<
  ListSingleView,
  ListViewSelectionWithType
> {
  ui$ = signal<MobileListViewUI | undefined>(undefined);

  private get readonly() {
    return this.view.readonly$.value;
  }

  clearSelection = () => {};

  addRow = (position: InsertToPosition) => {
    if (this.readonly) return;
    const id = this.view.rowAdd(position);
    this.ui$.value?.requestUpdate();
    return id;
  };

  focusFirstCell = () => {};

  showIndicator = (_evt: MouseEvent) => {
    return false;
  };

  hideIndicator = () => {};

  moveTo = () => {};

  renderAddRow = () => {
    if (this.readonly) {
      return nothing;
    }
    return html`
      <div class="${mobileAddRow}" @click="${() => this.addRow('end')}">
        ${AddCursorIcon()}
        <span>Add Task</span>
      </div>
    `;
  };

  renderer = createUniComponentFromWebComponent(MobileListViewUI);
}

export class MobileListViewUI extends DataViewUIBase<MobileListViewUILogic> {
  override connectedCallback(): void {
    super.connectedCallback();
    this.logic.ui$.value = this;
    this.classList.add(mobileListViewWrapper);
  }

  override render(): TemplateResult {
    const rows = this.logic.view.rows$.value;
    if (!rows) {
      return html``;
    }
    const vPadding = this.logic.root.config.virtualPadding$.value;
    const wrapperStyle = styleMap({
      marginLeft: `-${vPadding}px`,
      marginRight: `-${vPadding}px`,
      paddingLeft: `${vPadding}px`,
      paddingRight: `${vPadding}px`,
    });
    return html`
      ${renderUniLit(this.logic.headerWidget, {
        dataViewLogic: this.logic,
      })}
      <div class="${mobileListContainer}" style="${wrapperStyle}">
        ${repeat(
          rows,
          row => row.rowId,
          row => {
            return html`
              <mobile-list-row
                data-row-id="${row.rowId}"
                .listViewLogic="${this.logic}"
                .rowId="${row.rowId}"
              ></mobile-list-row>
            `;
          }
        )}
        ${this.logic.renderAddRow()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mobile-data-view-list-ui': MobileListViewUI;
  }
}
