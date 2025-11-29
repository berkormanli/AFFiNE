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
import type { MobileSprintViewUILogic } from './sprint-view-ui-logic.js';

const styles = css`
  mobile-sprint-cell {
    border-radius: 4px;
    display: flex;
    align-items: center;
    padding: 4px;
    min-height: 20px;
    border: 1px solid transparent;
    box-sizing: border-box;
  }

  .mobile-sprint-cell {
    flex: 1;
    display: block;
    width: 196px;
  }

  .mobile-sprint-cell-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: start;
    margin-right: 12px;
    height: var(--data-view-cell-text-line-height);
    font-size: 16px;
    color: ${unsafeCSSVarV2('icon/primary')};
  }
`;

export class MobileSprintCell extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = styles;

  private readonly _cell = signal<DataViewCellLifeCycle>();

  isSelectionEditing$ = computed(() => {
    const selection = this.sprintViewLogic.selection$.value;
    if (selection?.selectionType !== 'cell') {
      return false;
    }
    if (selection.groupKey !== this.groupKey) {
      return false;
    }
    if (selection.cardId !== this.cardId) {
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
    const setSelection = this.sprintViewLogic.setSelection.bind(
      this.sprintViewLogic
    );
    const viewId = this.sprintViewLogic.view.id;
    if (setSelection && viewId) {
      if (editing && this.cell?.beforeEnterEditMode() === false) {
        return;
      }
      setSelection({
        viewId,
        type: 'sprint',
        selectionType: 'cell',
        groupKey: this.groupKey,
        cardId: this.cardId,
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
      cell: this.column.cellGetOrCreate(this.cardId),
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
      class: 'mobile-sprint-cell',
      style: { display: 'block', flex: '1', overflow: 'hidden' },
    })}`;
  }

  renderIcon() {
    if (this.contentOnly) {
      return;
    }
    return html` <uni-lit
      class="mobile-sprint-cell-icon"
      .uni="${this.column.icon}"
    ></uni-lit>`;
  }

  @property({ attribute: false })
  accessor cardId!: string;

  @property({ attribute: false })
  accessor column!: Property;

  @property({ attribute: false })
  accessor contentOnly = false;

  @property({ attribute: false })
  accessor groupKey!: string;

  isEditing$ = signal(false);

  @property({ attribute: false })
  accessor sprintViewLogic!: MobileSprintViewUILogic;

  get view() {
    return this.sprintViewLogic.view;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mobile-sprint-cell': MobileSprintCell;
  }
}
