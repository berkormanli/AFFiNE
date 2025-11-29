import {
  menu,
  popMenu,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import type { InsertToPosition } from '@blocksuite/affine-shared/utils';
import { AddCursorIcon } from '@blocksuite/icons/lit';
import { css } from '@emotion/css';
import { computed, signal } from '@preact/signals-core';
import { type TemplateResult } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import {
  type GroupTrait,
  groupTraitKey,
} from '../../../core/group-by/trait.js';
import {
  createUniComponentFromWebComponent,
  renderUniLit,
} from '../../../core/index.js';
import { defaultActivators } from '../../../core/utils/wc-dnd/sensors/index.js';
import {
  createSortContext,
  sortable,
} from '../../../core/utils/wc-dnd/sort/sort-context.js';
import { horizontalListSortingStrategy } from '../../../core/utils/wc-dnd/sort/strategies/index.js';
import {
  DataViewUIBase,
  DataViewUILogicBase,
} from '../../../core/view/data-view-base.js';
import type { SprintViewSelectionWithType } from '../selection.js';
import type { SprintSingleView } from '../sprint-view-manager.js';
import { SprintClipboardController } from './controller/clipboard.js';
import { SprintDragController } from './controller/drag.js';
import { SprintHotkeysController } from './controller/hotkeys.js';
import { SprintSelectionController } from './controller/selection.js';

export class SprintViewUILogic extends DataViewUILogicBase<
  SprintSingleView,
  SprintViewSelectionWithType
> {
  ui$ = signal<SprintViewUI | undefined>();
  clipboardController = new SprintClipboardController(this);
  dragController = new SprintDragController(this);
  hotkeysController = new SprintHotkeysController(this);
  selectionController = new SprintSelectionController(this);

  groupTrait$ = computed(() => {
    return this.view.traitGet(groupTraitKey);
  });

  groups$ = computed(() => {
    const groupTrait = this.groupTrait$.value;
    return groupTrait?.groupsDataList$.value || [];
  });

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

  showIndicator = (evt: MouseEvent) => {
    return this.dragController.showIndicator(evt, undefined) != null;
  };

  hideIndicator = () => {
    this.dragController.dropPreview.remove();
  };

  moveTo = (id: string, evt: MouseEvent) => {
    const position = this.dragController.getInsertPosition(evt);
    if (position) {
      position.group.group.manager.moveCardTo(
        id,
        '',
        position.group.group.key,
        position.position
      );
    }
  };

  onWheel = (event: WheelEvent) => {
    if (event.metaKey || event.ctrlKey) {
      return;
    }
    const ele = event.currentTarget;
    if (ele instanceof HTMLElement) {
      if (ele.scrollWidth === ele.clientWidth) {
        return;
      }
      event.stopPropagation();
    }
  };

  renderAddGroup = (groupHelper: GroupTrait) => {
    const addGroup = groupHelper.addGroup;
    if (!addGroup) {
      return;
    }
    const add = (e: MouseEvent) => {
      const ele = e.currentTarget as HTMLElement;
      popMenu(popupTargetFromElement(ele), {
        options: {
          items: [
            menu.input({
              onComplete: text => {
                const column = groupHelper.property$.value;
                if (column) {
                  column.dataUpdate(() =>
                    addGroup({
                      text,
                      oldData: column.data$.value,
                      dataSource: this.view.manager.dataSource,
                    })
                  );
                }
              },
            }),
          ],
        },
      });
    };
    return html` <div
      style="height: 32px;flex-shrink:0;display:flex;align-items:center;"
      @click="${add}"
    >
      <div class="${addGroupIconStyle}">${AddCursorIcon()}</div>
    </div>`;
  };

  scrollContainer$ = signal<HTMLElement | undefined>(undefined);

  renderer = createUniComponentFromWebComponent(SprintViewUI);
}

export class SprintViewUI extends DataViewUIBase<SprintViewUILogic> {
  readonly sortContext = createSortContext({
    activators: defaultActivators,
    container: this,
    onDragEnd: evt => {
      const over = evt.over;
      const activeId = evt.active.id;
      const groupTrait = this.logic.groupTrait$.value;
      const groups = groupTrait?.groupsDataList$.value;
      if (over && over.id !== activeId && groups) {
        const activeIndex = groups.findIndex(data => data?.key === activeId);
        const overIndex = groups.findIndex(data => data?.key === over.id);

        groupTrait?.moveGroupTo(
          activeId,
          activeIndex > overIndex
            ? {
                before: true,
                id: over.id,
              }
            : {
                before: false,
                id: over.id,
              }
        );
      }
    },
    modifiers: [
      ({ transform }) => {
        return {
          ...transform,
          y: 0,
        };
      },
    ],
    items: computed(() => {
      return this.logic.groups$.value?.map(v => v?.key ?? 'default key') ?? [];
    }),
    strategy: horizontalListSortingStrategy,
  });

  private renderSprintHeader() {
    const sprintDuration = this.logic.view.sprintDuration$.value;
    const startDate = this.logic.view.startDate$.value;

    return html`
      <div class="${sprintHeaderStyle}">
        <div class="sprint-info">
          <span class="sprint-label">Sprint Duration:</span>
          <span class="sprint-value">${sprintDuration} days</span>
          ${startDate
            ? html`
                <span class="sprint-label" style="margin-left: 16px;"
                  >Start Date:</span
                >
                <span class="sprint-value"
                  >${new Date(startDate).toLocaleDateString()}</span
                >
              `
            : ''}
        </div>
      </div>
    `;
  }

  private renderGroups() {
    const groups = this.logic.groups$.value;
    if (!groups) {
      return html``;
    }

    return html`${groups.map(group => {
      return html` <affine-data-view-sprint-group
        ${sortable(group.key)}
        data-key="${group.key}"
        .sprintViewLogic="${this.logic}"
        .group="${group}"
      ></affine-data-view-sprint-group>`;
    })}`;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.logic.ui$.value = this;
    this.logic.clipboardController.hostConnected();
    this.logic.dragController.hostConnected();
    this.logic.hotkeysController.hostConnected();
    this.logic.selectionController.hostConnected();
    this.classList.add('sprint-view', sprintViewStyle);
    this.style.userSelect = 'none';
    this.style.display = 'flex';
    this.style.flexDirection = 'column';
  }

  override render(): TemplateResult {
    const groups = this.logic.groups$.value;
    if (!groups) {
      return html``;
    }

    const vPadding = this.logic.root.config.virtualPadding$.value;
    const wrapperStyle = styleMap({
      marginLeft: `-${vPadding}px`,
      marginRight: `-${vPadding}px`,
      paddingLeft: `${vPadding}px`,
      paddingRight: `${vPadding}px`,
    });

    const groupTrait = this.logic.groupTrait$.value;

    return html`
      ${renderUniLit(this.logic.root.config.headerWidget, {
        dataViewLogic: this.logic,
      })}
      ${this.renderSprintHeader()}
      <div
        ${ref(this.logic.scrollContainer$)}
        class="${sprintGroupsStyle}"
        style="${wrapperStyle}"
        @wheel="${this.logic.onWheel}"
      >
        ${this.renderGroups()}
        ${groupTrait ? this.logic.renderAddGroup(groupTrait) : ''}
      </div>
    `;
  }
}

const sprintViewStyle = css({
  userSelect: 'none',
  display: 'flex',
  flexDirection: 'column',
});

const sprintHeaderStyle = css({
  padding: '8px 0',
  marginBottom: '8px',
  borderBottom: '1px solid var(--affine-border-color)',

  '& .sprint-info': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },

  '& .sprint-label': {
    color: 'var(--affine-text-secondary-color)',
  },

  '& .sprint-value': {
    color: 'var(--affine-text-primary-color)',
    fontWeight: '500',
  },
});

const sprintGroupsStyle = css({
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  gap: '20px',
  paddingBottom: '4px',
  overflowX: 'scroll',
  overflowY: 'hidden',

  '&:hover': {
    paddingBottom: '0px',
  },

  '&::-webkit-scrollbar': {
    WebkitAppearance: 'none',
    display: 'block',
  },

  '&::-webkit-scrollbar:horizontal': {
    height: '4px',
  },

  '&::-webkit-scrollbar-thumb': {
    borderRadius: '2px',
    backgroundColor: 'transparent',
  },

  '&:hover::-webkit-scrollbar:horizontal': {
    height: '8px',
  },

  '&:hover::-webkit-scrollbar-thumb': {
    borderRadius: '16px',
    backgroundColor: 'var(--affine-black-30)',
  },

  '&:hover::-webkit-scrollbar-track': {
    backgroundColor: 'var(--affine-hover-color)',
  },
});

const addGroupIconStyle = css({
  padding: '4px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',

  '&:hover': {
    backgroundColor: 'var(--affine-hover-color)',
  },

  '& svg': {
    width: '16px',
    height: '16px',
    fill: 'var(--affine-icon-color)',
    color: 'var(--affine-icon-color)',
  },
});

declare global {
  interface HTMLElementTagNameMap {
    'dv-sprint-view-ui': SprintViewUI;
  }
}
