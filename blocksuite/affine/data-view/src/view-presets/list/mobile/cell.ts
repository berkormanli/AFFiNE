// related component

import { unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/lit';
import { ShadowlessElement } from '@blocksuite/std';
import { computed, effect, signal } from '@preact/signals-core';
import { css } from 'lit';
import { property } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import type {
  CellRenderProps,
  DataViewCellLifeCycle,
} from '../../../core/property/index.js';
import { renderUniLit } from '../../../core/utils/uni-component/uni-component.js';
import type { Property } from '../../../core/view-manager/property.js';
import type { MobileListViewUILogic } from './list-view-ui-logic.js';

const styles = css`
  mobile-list-cell {
    border-radius: 4px;
    display: flex;
    align-items: center;
    padding: 2px 4px;
    min-height: 20px;
    border: 1px solid transparent;
    box-sizing: border-box;
    font-size: 12px;
  }

  .mobile-list-cell {
    flex: 1;
    display: block;
    overflow: hidden;
  }

  .mobile-list-cell-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: start;
    margin-right: 4px;
    height: var(--data-view-cell-text-line-height);
    font-size: 14px;
    color: ${unsafeCSSVarV2('icon/primary')};
  }
`;

export class MobileListCell extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = styles;

  private readonly _cell = signal<DataViewCellLifeCycle>();

  isSelectionEditing$ = computed(() => {
    const selection = this.listViewLogic.selection$.value;
    if (selection?.selectionType !== 'cell') {
      return false;
    }
    if (selection.rowId !== this.rowId) {
      return false;
    }
    if (selection.columnId !== this.column.id) {
      return false;
    }
    return selection.isEditing;
  });

  selectCurrentCell = (editing: boolean) => {
    if (this.view.readonly$.value) {
      return;
    }
    const setSelection = this.listViewLogic.setSelection.bind(
      this.listViewLogic
    );
    const viewId = this.listViewLogic.view.id;
    if (setSelection && viewId) {
      if (editing && this.cell?.beforeEnterEditMode() === false) {
        return;
      }
      setSelection({
        viewId,
        type: 'list',
        selectionType: 'cell',
        rowId: this.rowId,
        columnId: this.column.id,
        isEditing: editing,
      });
    }
  };

  get cell(): DataViewCellLifeCycle | undefined {
    return this._cell.value;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.column.readonly$.value) return;
    this.disposables.add(
      effect(() => {
        const isEditing = this.isSelectionEditing$.value;
        if (isEditing && !this.isEditing$.peek()) {
          this.isEditing$.value = true;
          requestAnimationFrame(() => {
            this._cell.value?.afterEnterEditingMode();
          });
        } else if (!isEditing && this.isEditing$.peek()) {
          this._cell.value?.beforeExitEditingMode();
          this.isEditing$.value = false;
        }
      })
    );
    this._disposables.addFromEvent(this, 'click', e => {
      e.stopPropagation();
      if (!this.isEditing$.value) {
        this.selectCurrentCell(!this.column.readonly$.value);
      }
    });
  }

  override render() {
    const props: CellRenderProps = {
      cell: this.column.cellGetOrCreate(this.rowId),
      isEditing$: this.isEditing$,
      selectCurrentCell: this.selectCurrentCell,
    };
    const renderer = this.column.renderer$.value;
    if (!renderer) return;
    const { view } = renderer;
    this.view.lockRows(this.isEditing$.value);
    this.dataset['editing'] = `${this.isEditing$.value}`;
    return html` ${this.renderIcon()}
    ${renderUniLit(view, props, {
      ref: this._cell,
      class: 'mobile-list-cell',
      style: { display: 'block', flex: '1', overflow: 'hidden' },
    })}`;
  }

  renderIcon() {
    if (this.contentOnly) {
      return;
    }
    return html` <uni-lit
      class="mobile-list-cell-icon"
      .uni="${this.column.icon}"
    ></uni-lit>`;
  }

  @property({ attribute: false })
  accessor rowId!: string;

  @property({ attribute: false })
  accessor column!: Property;

  @property({ attribute: false })
  accessor contentOnly = false;

  isEditing$ = signal(false);

  @property({ attribute: false })
  accessor listViewLogic!: MobileListViewUILogic;

  get view() {
    return this.listViewLogic.view;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mobile-list-cell': MobileListCell;
  }
}
