import {
  menu,
  popFilterableSimpleMenu,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/lit';
import { AddCursorIcon } from '@blocksuite/icons/lit';
import { ShadowlessElement } from '@blocksuite/std';
import { css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import { GroupTitle } from '../../../core/group-by/group-title.js';
import type { Group } from '../../../core/group-by/trait.js';
import { dragHandler } from '../../../core/utils/wc-dnd/dnd-context.js';
import type { MobileSprintViewUILogic } from './sprint-view-ui-logic.js';

const styles = css`
  mobile-sprint-group {
    width: 280px;
    flex-shrink: 0;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    background-color: var(--affine-background-secondary-color);
    padding: 8px;
  }

  .mobile-group-header {
    height: 32px;
    padding: 6px 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    overflow: hidden;
  }

  .mobile-group-body {
    margin-top: 4px;
    display: flex;
    flex-direction: column;
    padding: 0 4px;
    gap: 8px;
  }

  .mobile-add-card {
    display: flex;
    align-items: center;
    padding: 4px;
    border-radius: 4px;
    font-size: var(--data-view-cell-text-size);
    line-height: var(--data-view-cell-text-line-height);
    color: var(--affine-text-secondary-color);
  }

  .task-count {
    font-size: 12px;
    color: var(--affine-text-secondary-color);
    margin-left: auto;
  }
`;

export class MobileSprintGroup extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = styles;

  private readonly clickAddCard = () => {
    this.view.addCard('end', this.group.key);
    this.requestUpdate();
  };

  private readonly clickAddCardInStart = () => {
    this.view.addCard('start', this.group.key);
    this.requestUpdate();
  };

  private readonly clickGroupOptions = (e: MouseEvent) => {
    const ele = e.currentTarget as HTMLElement;
    popFilterableSimpleMenu(popupTargetFromElement(ele), [
      menu.group({
        items: [
          menu.action({
            name: 'Ungroup',
            hide: () => this.group.value == null,
            select: () => {
              this.group.rows.forEach(row => {
                this.group.manager.removeFromGroup(row.rowId, this.group.key);
              });
              this.requestUpdate();
            },
          }),
          menu.action({
            name: 'Delete Tasks',
            select: () => {
              this.view.rowsDelete(this.group.rows.map(row => row.rowId));
              this.requestUpdate();
            },
          }),
        ],
      }),
    ]);
  };

  override render() {
    const cards = this.group.rows;
    return html`
      <div class="mobile-group-header" ${dragHandler(this.group.key)}>
        ${GroupTitle(this.group, {
          readonly: this.view.readonly$.value,
          clickAdd: this.clickAddCardInStart,
          clickOps: this.clickGroupOptions,
        })}
        <span class="task-count">${cards.length} tasks</span>
      </div>
      <div class="mobile-group-body">
        ${repeat(
          cards,
          row => row.rowId,
          row => {
            return html`
              <mobile-sprint-card
                data-card-id="${row.rowId}"
                .groupKey="${this.group.key}"
                .cardId="${row.rowId}"
                .sprintViewLogic="${this.sprintViewLogic}"
              ></mobile-sprint-card>
            `;
          }
        )}
        ${this.view.readonly$.value
          ? nothing
          : html` <div class="mobile-add-card" @click="${this.clickAddCard}">
              <div
                style="margin-right: 4px;width: 16px;height: 16px;display:flex;align-items:center;"
              >
                ${AddCursorIcon()}
              </div>
              Add Task
            </div>`}
      </div>
    `;
  }

  @property({ attribute: false })
  accessor group!: Group;

  @property({ attribute: false })
  accessor sprintViewLogic!: MobileSprintViewUILogic;

  get view() {
    return this.sprintViewLogic.view;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mobile-sprint-group': MobileSprintGroup;
  }
}
