import {
  menu,
  popMenu,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import { unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
import type { InsertToPosition } from '@blocksuite/affine-shared/utils';
import { AddCursorIcon } from '@blocksuite/icons/lit';
import { css } from '@emotion/css';
import { signal } from '@preact/signals-core';
import type { TemplateResult } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import {
  createUniComponentFromWebComponent,
  renderUniLit,
} from '../../../core/index.js';
import { sortable } from '../../../core/utils/wc-dnd/sort/sort-context.js';
import {
  DataViewUIBase,
  DataViewUILogicBase,
} from '../../../core/view/data-view-base.js';
import type { SprintViewSelectionWithType } from '../selection';
import type { SprintSingleView } from '../sprint-view-manager.js';

const mobileSprintViewWrapper = css({
  userSelect: 'none',
  display: 'flex',
  flexDirection: 'column',
});

const mobileSprintGroups = css({
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  gap: '20px',
  paddingBottom: '4px',
  overflowX: 'scroll',
  overflowY: 'hidden',
});

const mobileAddGroup = css({
  height: '32px',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  padding: '4px',
  borderRadius: '4px',
  fontSize: '16px',
  color: `var(${unsafeCSSVarV2('icon/primary')})`,
});

export class MobileSprintViewUILogic extends DataViewUILogicBase<
  SprintSingleView,
  SprintViewSelectionWithType
> {
  ui$ = signal<MobileSprintViewUI | undefined>(undefined);

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

  get groupManager() {
    return this.view.groupTrait;
  }

  renderAddGroup = () => {
    if (this.readonly) {
      return;
    }
    const addGroup = this.groupManager.addGroup;
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
                const column = this.groupManager.property$.value;
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
    return html` <div class="${mobileAddGroup}" @click="${add}">
      ${AddCursorIcon()}
    </div>`;
  };

  renderer = createUniComponentFromWebComponent(MobileSprintViewUI);
}

export class MobileSprintViewUI extends DataViewUIBase<MobileSprintViewUILogic> {
  override connectedCallback(): void {
    super.connectedCallback();
    this.logic.ui$.value = this;
    this.classList.add(mobileSprintViewWrapper);
  }

  override render(): TemplateResult {
    const groups = this.logic.groupManager.groupsDataList$.value;
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
    return html`
      ${renderUniLit(this.logic.headerWidget, {
        dataViewLogic: this.logic,
      })}
      <div class="${mobileSprintGroups}" style="${wrapperStyle}">
        ${repeat(
          groups,
          group => group.key,
          group => {
            return html` <mobile-sprint-group
              ${sortable(group.key)}
              data-key="${group.key}"
              .sprintViewLogic="${this.logic}"
              .group="${group}"
            ></mobile-sprint-group>`;
          }
        )}
        ${this.logic.renderAddGroup()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mobile-data-view-sprint-ui': MobileSprintViewUI;
  }
}
