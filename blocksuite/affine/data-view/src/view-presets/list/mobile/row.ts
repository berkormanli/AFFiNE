import { popupTargetFromElement } from '@blocksuite/affine-components/context-menu';
import { unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/lit';
import { CenterPeekIcon, MoreHorizontalIcon } from '@blocksuite/icons/lit';
import { ShadowlessElement } from '@blocksuite/std';
import { cssVarV2 } from '@toeverything/theme/v2';
import { css, unsafeCSS } from 'lit';
import { property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import type { ListColumn } from '../list-view-manager.js';
import type { MobileListViewUILogic } from './list-view-ui-logic.js';
import { popRowMenu } from './menu.js';

const styles = css`
  mobile-list-row {
    display: flex;
    position: relative;
    align-items: center;
    padding: 12px;
    border: 0.5px solid ${unsafeCSS(cssVarV2.layer.insideBorder.border)};
    box-shadow: 0px 2px 3px 0px rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    background-color: var(--affine-background-primary-color);
    gap: 12px;
  }

  .mobile-row-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .mobile-row-title {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
  }

  .mobile-row-properties {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .mobile-row-ops {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  .mobile-row-op {
    display: flex;
    padding: 4px;
    border-radius: 4px;
    box-shadow: 0px 0px 4px 0px rgba(66, 65, 73, 0.14);
    background-color: var(--affine-background-primary-color);
    font-size: 16px;
    color: ${unsafeCSSVarV2('icon/primary')};
  }

  .mobile-row-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    background-color: var(--affine-background-secondary-color);
    border-radius: 4px;
    flex-shrink: 0;
    font-size: 16px;
    color: ${unsafeCSSVarV2('icon/primary')};
  }
`;

export class MobileListRow extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = styles;

  private readonly clickCenterPeek = (e: MouseEvent) => {
    e.stopPropagation();
    this.listViewLogic.root.openDetailPanel({
      view: this.view,
      rowId: this.rowId,
    });
  };

  private readonly clickMore = (e: MouseEvent) => {
    e.stopPropagation();
    popRowMenu(
      popupTargetFromElement(e.currentTarget as HTMLElement),
      this.rowId,
      this.listViewLogic
    );
  };

  private renderIcon() {
    const icon = this.view.getHeaderIcon(this.rowId);
    if (!icon) {
      return;
    }
    return html`<div class="mobile-row-icon">
      ${icon.cellGetOrCreate(this.rowId).value$.value}
    </div>`;
  }

  private renderTitle() {
    const title = this.view.getHeaderTitle(this.rowId);
    if (!title) {
      return;
    }
    return html`<div class="mobile-row-title">
      <mobile-list-cell
        .contentOnly="${true}"
        data-column-id="${title.id}"
        .listViewLogic="${this.listViewLogic}"
        .column="${title}"
        .rowId="${this.rowId}"
      ></mobile-list-cell>
    </div>`;
  }

  private renderProperties(columns: ListColumn[]) {
    if (columns.length === 0) {
      return '';
    }
    return html`<div class="mobile-row-properties">
      ${repeat(
        columns,
        v => v.id,
        column => {
          if (this.view.isInHeader(column.id)) {
            return '';
          }
          return html`<mobile-list-cell
            .contentOnly="${false}"
            data-column-id="${column.id}"
            .column="${column}"
            .rowId="${this.rowId}"
            .listViewLogic="${this.listViewLogic}"
          ></mobile-list-cell>`;
        }
      )}
    </div>`;
  }

  private renderOps() {
    if (this.view.readonly$.value) {
      return;
    }
    return html`
      <div class="mobile-row-ops">
        <div class="mobile-row-op" @click="${this.clickCenterPeek}">
          ${CenterPeekIcon()}
        </div>
        <div class="mobile-row-op" @click="${this.clickMore}">
          ${MoreHorizontalIcon()}
        </div>
      </div>
    `;
  }

  override render() {
    const columns = this.view.properties$.value.filter(
      v => !this.view.isInHeader(v.id)
    );

    return html`
      ${this.renderIcon()}
      <div class="mobile-row-content">
        ${this.renderTitle()} ${this.renderProperties(columns)}
      </div>
      ${this.renderOps()}
    `;
  }

  @property({ attribute: false })
  accessor rowId!: string;

  @state()
  accessor isFocus = false;

  @property({ attribute: false })
  accessor listViewLogic!: MobileListViewUILogic;

  get view() {
    return this.listViewLogic.view;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mobile-list-row': MobileListRow;
  }
}
