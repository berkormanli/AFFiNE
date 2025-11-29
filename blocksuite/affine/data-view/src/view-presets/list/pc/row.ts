import { popupTargetFromElement } from '@blocksuite/affine-components/context-menu';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/lit';
import { CenterPeekIcon, MoreHorizontalIcon } from '@blocksuite/icons/lit';
import { ShadowlessElement } from '@blocksuite/std';
import { signal } from '@preact/signals-core';
import { cssVarV2 } from '@toeverything/theme/v2';
import { css, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import type { ListColumn } from '../list-view-manager.js';
import type { ListViewUILogic } from './list-view-ui-logic.js';
import { openDetail, popRowMenu } from './menu.js';

const styles = css`
  affine-data-view-list-row {
    display: flex;
    position: relative;
    align-items: center;
    padding: 8px 12px;
    border: 1px solid ${unsafeCSS(cssVarV2.layer.insideBorder.border)};
    border-radius: 8px;
    transition: background-color 100ms ease-in-out;
    background-color: var(--affine-background-primary-color);
    gap: 12px;
  }

  affine-data-view-list-row:hover {
    background-color: var(--affine-hover-color);
  }

  .row-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .row-title {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .row-properties {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  affine-data-view-list-row:hover .row-ops {
    visibility: visible;
  }

  affine-data-view-list-row:has([data-editing='true']) .row-ops {
    visibility: hidden;
  }

  .row-ops {
    display: flex;
    gap: 4px;
    visibility: hidden;
    flex-shrink: 0;
  }

  .row-op {
    display: flex;
    padding: 4px;
    border-radius: 4px;
    cursor: pointer;
    background-color: var(--affine-background-primary-color);
    box-shadow: 0px 0px 4px 0px rgba(66, 65, 73, 0.14);
  }

  .row-op:hover {
    background-color: var(--affine-hover-color);
  }

  .row-op svg {
    width: 16px;
    height: 16px;
    fill: var(--affine-icon-color);
    color: var(--affine-icon-color);
  }

  .row-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    background-color: var(--affine-background-secondary-color);
    border-radius: 4px;
    flex-shrink: 0;
  }

  .row-icon svg {
    width: 16px;
    height: 16px;
    fill: var(--affine-icon-color);
    color: var(--affine-icon-color);
  }
`;

export class ListRow extends SignalWatcher(WithDisposable(ShadowlessElement)) {
  static override styles = styles;

  private readonly clickEdit = (e: MouseEvent) => {
    e.stopPropagation();
    const selection = this.getSelection();
    if (selection) {
      openDetail(this.listViewLogic, this.rowId, selection);
    }
  };

  private readonly clickMore = (e: MouseEvent) => {
    e.stopPropagation();
    const selection = this.getSelection();
    const ele = e.currentTarget as HTMLElement;
    if (selection) {
      selection.selection = {
        selectionType: 'row',
        rows: [{ rowId: this.rowId }],
      };
      popRowMenu(
        this.listViewLogic,
        popupTargetFromElement(ele),
        this.rowId,
        selection
      );
    }
  };

  private readonly contextMenu = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const selection = this.getSelection();
    if (selection) {
      selection.selection = {
        selectionType: 'row',
        rows: [{ rowId: this.rowId }],
      };
      const target = e.target as HTMLElement;
      const ref = target.closest('affine-data-view-list-cell') ?? this;
      popRowMenu(
        this.listViewLogic,
        popupTargetFromElement(ref),
        this.rowId,
        selection
      );
    }
  };

  private getSelection() {
    return this.listViewLogic.selectionController;
  }

  private renderIcon() {
    const icon = this.view.getHeaderIcon(this.rowId);
    if (!icon) {
      return;
    }
    return html`<div class="row-icon">
      ${icon.cellGetOrCreate(this.rowId).value$.value}
    </div>`;
  }

  private renderTitle() {
    const title = this.view.getHeaderTitle(this.rowId);
    if (!title) {
      return;
    }
    return html`<div class="row-title">
      <affine-data-view-list-cell
        .contentOnly="${true}"
        data-column-id="${title.id}"
        .listViewLogic="${this.listViewLogic}"
        .column="${title}"
        .rowId="${this.rowId}"
      ></affine-data-view-list-cell>
    </div>`;
  }

  private renderProperties(columns: ListColumn[]) {
    if (columns.length === 0) {
      return '';
    }
    return html`<div class="row-properties">
      ${repeat(
        columns,
        v => v.id,
        column => {
          if (this.view.isInHeader(column.id)) {
            return '';
          }
          return html`<affine-data-view-list-cell
            .contentOnly="${false}"
            data-column-id="${column.id}"
            .column="${column}"
            .rowId="${this.rowId}"
            .listViewLogic="${this.listViewLogic}"
          ></affine-data-view-list-cell>`;
        }
      )}
    </div>`;
  }

  private renderOps() {
    if (this.view.readonly$.value) {
      return;
    }
    return html`
      <div class="row-ops">
        <div class="row-op" @click="${this.clickEdit}">${CenterPeekIcon()}</div>
        <div class="row-op" @click="${this.clickMore}">
          ${MoreHorizontalIcon()}
        </div>
      </div>
    `;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.view.readonly$.value) {
      return;
    }
    this._disposables.addFromEvent(this, 'contextmenu', e => {
      this.contextMenu(e);
    });
    this._disposables.addFromEvent(this, 'click', e => {
      if (e.shiftKey) {
        this.getSelection()?.shiftClickRow(e);
        return;
      }
      const selection = this.getSelection();
      const preSelection = selection?.selection;

      if (preSelection?.selectionType !== 'row') return;

      if (selection) {
        selection.selection = undefined;
      }
      this.listViewLogic.root.openDetailPanel({
        view: this.view,
        rowId: this.rowId,
        onClose: () => {
          if (selection) {
            selection.selection = preSelection;
          }
        },
      });
    });
  }

  override render() {
    const columns = this.view.properties$.value.filter(
      v => !this.view.isInHeader(v.id)
    );
    this.style.border = this.isFocus$.value
      ? '1px solid var(--affine-primary-color)'
      : '';

    return html`
      ${this.renderIcon()}
      <div class="row-content">
        ${this.renderTitle()} ${this.renderProperties(columns)}
      </div>
      ${this.renderOps()}
    `;
  }

  @property({ attribute: false })
  accessor rowId!: string;

  isFocus$ = signal(false);

  @property({ attribute: false })
  accessor listViewLogic!: ListViewUILogic;

  get view() {
    return this.listViewLogic.view;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-list-row': ListRow;
  }
}
