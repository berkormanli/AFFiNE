import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import type { ReactiveController } from 'lit';

import type {
  SprintCardSelection,
  SprintCardSelectionCard,
  SprintCellSelection,
  SprintGroupSelection,
  SprintViewSelection,
  SprintViewSelectionWithType,
} from '../../selection';
import { SprintCard } from '../card.js';
import { SprintCell } from '../cell.js';
import type { SprintGroup } from '../group.js';
import type { SprintViewUILogic } from '../sprint-view-ui-logic.js';

export class SprintSelectionController implements ReactiveController {
  private _selection?: SprintViewSelectionWithType;

  shiftClickCard = (event: MouseEvent) => {
    event.preventDefault();

    const selection = this.selection;
    const target = event.target as HTMLElement;
    const closestCardId = target.closest(
      'affine-data-view-sprint-card'
    )?.cardId;
    const closestGroupKey = target.closest('affine-data-view-sprint-group')
      ?.group.key;
    if (!closestCardId) return;
    if (!closestGroupKey) return;
    const cards = selection?.selectionType === 'card' ? selection.cards : [];

    const newCards = cards.some(card => card.cardId === closestCardId)
      ? cards.filter(card => card.cardId !== closestCardId)
      : [...cards, { cardId: closestCardId, groupKey: closestGroupKey }];
    this.selection = atLeastOne(newCards)
      ? {
          selectionType: 'card',
          cards: newCards,
        }
      : undefined;
  };

  get selection(): SprintViewSelectionWithType | undefined {
    return this._selection;
  }

  set selection(data: SprintViewSelection | undefined) {
    const host = this.host;
    if (!host) {
      return;
    }
    if (!data) {
      this.logic.setSelection();
      return;
    }
    const selection: SprintViewSelectionWithType = {
      ...data,
      viewId: this.logic.view.id,
      type: 'sprint',
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

  constructor(public logic: SprintViewUILogic) {}

  blur(selection: SprintViewSelection) {
    const host = this.host;
    if (!host) {
      return;
    }
    if (selection.selectionType !== 'cell') {
      const selectCards = getSelectedCards(this.host, selection);
      selectCards.forEach(card => (card.isFocus$.value = false));
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

  deleteCard() {
    const selection = this.selection;
    if (!selection || selection.selectionType === 'cell') {
      return;
    }
    if (selection.selectionType === 'card') {
      this.view.rowsDelete(selection.cards.map(v => v.cardId));
      this.selection = undefined;
      this.logic.ui$.value?.requestUpdate();
    }
  }

  focus(selection: SprintViewSelection) {
    const host = this.host;
    if (!host) {
      return;
    }
    if (selection.selectionType !== 'cell') {
      const selectCards = getSelectedCards(this.host, selection);
      selectCards.forEach((card, index) => {
        if (index === 0) {
          card.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
        card.isFocus$.value = true;
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
    const group = this.logic.groups$.value?.[0];
    const card = group?.rows[0];
    const columnId = card && this.view.getHeaderTitle(card.rowId)?.id;
    if (group && card && columnId) {
      this.selection = {
        selectionType: 'cell',
        groupKey: group.key,
        cardId: card.rowId,
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
    if (selection.selectionType === 'card') {
      const card = getSelectedCards(this.host, selection)[0];
      const cell = card?.querySelector('affine-data-view-sprint-cell');
      if (card && cell) {
        this.selection = {
          groupKey: card.groupKey,
          cardId: card.cardId,
          selectionType: 'cell',
          columnId: cell.column.id,
          isEditing: false,
        };
      }
    } else {
      // Not yet implement
    }
  }

  focusNext(position: 'up' | 'down' | 'left' | 'right') {
    const host = this.host;
    if (!host) {
      return;
    }
    const selection = this.selection;
    if (!selection) {
      return;
    }

    if (selection.selectionType === 'cell' && !selection.isEditing) {
      // cell focus
      const sprintCells = getCardCellsBySelection(this.host, selection);
      const index = sprintCells.findIndex(
        cell => cell.column.id === selection.columnId
      );
      const result = this.getNextFocusCell(selection, index, position);
      if (!result) return;
      const { cell, cardId, groupKey } = result;
      if (cell instanceof SprintCell) {
        this.selection = {
          ...selection,
          cardId: cardId ?? selection.cardId,
          groupKey: groupKey ?? selection.groupKey,
          columnId: cell.column.id,
        } satisfies SprintCellSelection;
      }
    } else if (selection.selectionType === 'card') {
      // card focus
      const group = this.host?.querySelector(
        `affine-data-view-sprint-group[data-key="${selection.cards[0].groupKey}"]`
      );
      const cardElements = Array.from(
        group?.querySelectorAll('affine-data-view-sprint-card') ?? []
      );

      const index = cardElements.findIndex(
        card => card.cardId === selection.cards[0].cardId
      );
      const result = this.getNextFocusCard(selection, index, position);
      if (!result) return;
      const { card, cards } = result;
      if (card instanceof SprintCard) {
        const newCards = cards ?? selection.cards;
        this.selection = atLeastOne(newCards)
          ? {
              ...selection,
              cards: newCards,
            }
          : undefined;
      }
    }
  }

  focusOut() {
    const selection = this.selection;
    if (selection?.selectionType === 'card') {
      if (atLeastOne(selection.cards)) {
        this.selection = {
          ...selection,
          cards: [selection.cards[0]],
        };
      } else {
        // Not yet implement
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
        selectionType: 'card',
        cards: [
          {
            cardId: selection.cardId,
            groupKey: selection.groupKey,
          },
        ],
      };
    }
  }

  getNextFocusCard(
    selection: SprintCardSelection,
    index: number,
    nextPosition: 'up' | 'down' | 'left' | 'right'
  ):
    | {
        card: SprintCard;
        cards: SprintCardSelectionCard[];
      }
    | undefined {
    const host = this.host;
    if (!host) {
      return;
    }
    const group = host.querySelector(
      `affine-data-view-sprint-group[data-key="${selection.cards[0].groupKey}"]`
    );
    const sprintCards = Array.from(
      group?.querySelectorAll('affine-data-view-sprint-card') ?? []
    );

    if (nextPosition === 'up') {
      const nextIndex = index - 1;
      const nextCardIndex = nextIndex < 0 ? sprintCards.length - 1 : nextIndex;
      const card = sprintCards[nextCardIndex];
      if (!card) return;
      return {
        card,
        cards: [
          {
            cardId: card.cardId,
            groupKey: card.groupKey,
          },
        ],
      };
    }

    if (nextPosition === 'down') {
      const nextIndex = index + 1;
      const nextCardIndex = nextIndex > sprintCards.length - 1 ? 0 : nextIndex;
      const card = sprintCards[nextCardIndex];
      if (!card) return;
      return {
        card,
        cards: [
          {
            cardId: card.cardId,
            groupKey: card.groupKey,
          },
        ],
      };
    }

    const groups = Array.from(
      this.host?.querySelectorAll('affine-data-view-sprint-group') ?? []
    );

    if (nextPosition === 'right') {
      return getNextGroupFocusElement(
        this.host,
        groups,
        selection,
        groupIndex => (groupIndex === groups.length - 1 ? 0 : groupIndex + 1)
      );
    }

    if (nextPosition === 'left') {
      return getNextGroupFocusElement(
        this.host,
        groups,
        selection,
        groupIndex => (groupIndex === 0 ? groups.length - 1 : groupIndex - 1)
      );
    }
    throw new BlockSuiteError(
      ErrorCode.DatabaseBlockError,
      'Unknown arrow keys, only support: up, down, left, and right keys.'
    );
  }

  getNextFocusCell(
    selection: SprintCellSelection,
    index: number,
    nextPosition: 'up' | 'down' | 'left' | 'right'
  ):
    | {
        cell: SprintCell;
        cardId?: string;
        groupKey?: string;
      }
    | undefined {
    const host = this.host;
    if (!host) {
      return;
    }
    const sprintCells = getCardCellsBySelection(this.host, selection);
    const group = this.host.querySelector(
      `affine-data-view-sprint-group[data-key="${selection.groupKey}"]`
    );
    const cards = Array.from(
      group?.querySelectorAll('affine-data-view-sprint-card') ?? []
    );

    if (nextPosition === 'up') {
      const nextIndex = index - 1;
      if (nextIndex < 0) {
        if (cards.length > 1) {
          return getNextCardFocusCell(
            nextPosition,
            cards,
            selection,
            cardIndex => (cardIndex === 0 ? cards.length - 1 : cardIndex - 1)
          );
        } else {
          const cell = sprintCells[sprintCells.length - 1];
          if (!cell) return;
          return {
            cell,
          };
        }
      }
      if (!sprintCells[nextIndex]) return;
      return {
        cell: sprintCells[nextIndex],
      };
    }

    if (nextPosition === 'down') {
      const nextIndex = index + 1;
      if (nextIndex >= sprintCells.length) {
        if (cards.length > 1) {
          return getNextCardFocusCell(
            nextPosition,
            cards,
            selection,
            cardIndex => (cardIndex === cards.length - 1 ? 0 : cardIndex + 1)
          );
        } else {
          const cell = sprintCells[0];
          if (!cell) return;
          return {
            cell,
          };
        }
      }
      if (!sprintCells[nextIndex]) return;
      return {
        cell: sprintCells[nextIndex],
      };
    }

    const groups = Array.from(
      this.host?.querySelectorAll('affine-data-view-sprint-group') ?? []
    );

    if (nextPosition === 'right') {
      return getNextGroupFocusElement(
        this.host,
        groups,
        selection,
        groupIndex => (groupIndex === groups.length - 1 ? 0 : groupIndex + 1)
      );
    }

    if (nextPosition === 'left') {
      return getNextGroupFocusElement(
        this.host,
        groups,
        selection,
        groupIndex => (groupIndex === 0 ? groups.length - 1 : groupIndex - 1)
      );
    }
    throw new BlockSuiteError(
      ErrorCode.DatabaseBlockError,
      'Unknown arrow keys, only support: up, down, left, and right keys.'
    );
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
    if (selection?.selectionType !== 'card') {
      return;
    }

    const { cardId, groupKey } = selection.cards[0];
    const id = this.view.addCard({ before: false, id: cardId }, groupKey);

    requestAnimationFrame(() => {
      const columnId = this.view.mainProperties$.value.titleColumn;
      if (columnId) {
        this.selection = {
          selectionType: 'cell',
          groupKey,
          cardId: id,
          columnId,
          isEditing: true,
        };
      } else {
        this.selection = {
          selectionType: 'card',
          cards: [
            {
              cardId: id,
              groupKey,
            },
          ],
        };
      }
    });
  }

  insertRowBefore() {
    const selection = this.selection;
    if (selection?.selectionType !== 'card') {
      return;
    }

    const { cardId, groupKey } = selection.cards[0];
    const id = this.view.addCard({ before: true, id: cardId }, groupKey);

    requestAnimationFrame(() => {
      const columnId = this.view.mainProperties$.value.titleColumn;
      if (columnId) {
        this.selection = {
          selectionType: 'cell',
          groupKey,
          cardId: id,
          columnId,
          isEditing: true,
        };
      } else {
        this.selection = {
          selectionType: 'card',
          cards: [
            {
              cardId: id,
              groupKey,
            },
          ],
        };
      }
    });
  }

  moveCard(rowId: string, key: string) {
    const selection = this.selection;
    if (selection?.selectionType !== 'card') {
      return;
    }
    this.view.groupTrait.moveCardTo(
      rowId,
      selection.cards[0].groupKey,
      key,
      'start'
    );
    requestAnimationFrame(() => {
      if (this.selection?.selectionType !== 'card') return;

      const newCards = selection.cards.map(card => ({
        ...card,
        groupKey: card.groupKey,
      }));
      this.selection = atLeastOne(newCards)
        ? {
            ...selection,
            cards: newCards,
          }
        : undefined;
    });
  }
}

type NextFocusCell = {
  cell: SprintCell;
  cardId: string;
  groupKey: string;
};
type NextFocusCard = {
  card: SprintCard;
  cards: {
    cardId: string;
    groupKey: string;
  }[];
};

function getNextGroupFocusElement(
  viewElement: Element,
  groups: SprintGroup[],
  selection: SprintCellSelection,
  getNextGroupIndex: (groupIndex: number) => number
): NextFocusCell | undefined;
function getNextGroupFocusElement(
  viewElement: Element,
  groups: SprintGroup[],
  selection: SprintCardSelection,
  getNextGroupIndex: (groupIndex: number) => number
): NextFocusCard | undefined;
function getNextGroupFocusElement(
  viewElement: Element,
  groups: SprintGroup[],
  selection: SprintCellSelection | SprintCardSelection,
  getNextGroupIndex: (groupIndex: number) => number
): NextFocusCell | NextFocusCard | undefined {
  const groupIndex = groups.findIndex(group => {
    if (selection.selectionType === 'cell') {
      return group.group.key === selection.groupKey;
    }
    return group.group.key === selection.cards[0].groupKey;
  });

  let nextGroupIndex = getNextGroupIndex(groupIndex);
  let nextGroup = groups[nextGroupIndex];
  while (nextGroup?.group.rows.length === 0) {
    nextGroupIndex = getNextGroupIndex(nextGroupIndex);
    nextGroup = groups[nextGroupIndex];
  }
  if (!nextGroup) return;

  const element =
    selection.selectionType === 'cell'
      ? getFocusCell(viewElement, selection)
      : getSelectedCards(viewElement, selection)[0];
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const nextCards = Array.from(
    nextGroup.querySelectorAll('affine-data-view-sprint-card')
  );
  const cardPos = nextCards
    .map((card, index) => {
      const targetRect = card.getBoundingClientRect();
      return {
        offsetY: getYOffset(rect, targetRect),
        index,
      };
    })
    .reduce((prev, curr) => {
      if (prev.offsetY < curr.offsetY) {
        return prev;
      }
      return curr;
    });
  const nextCard = nextCards[cardPos.index];

  if (!nextCard) return;
  if (selection.selectionType === 'card') {
    return {
      card: nextCard,
      cards: [
        {
          cardId: nextCard.cardId,
          groupKey: nextGroup.group.key,
        },
      ],
    };
  }

  const cells = Array.from(
    nextCard.querySelectorAll('affine-data-view-sprint-cell')
  );
  const cellPos = cells
    .map((card, index) => {
      const targetRect = card.getBoundingClientRect();
      return {
        offsetY: getYOffset(rect, targetRect),
        index,
      };
    })
    .reduce((prev, curr) => {
      if (prev.offsetY < curr.offsetY) {
        return prev;
      }
      return curr;
    });
  const nextCell = cells[cellPos.index];

  if (!nextCell) return;
  return {
    cell: nextCell,
    cardId: nextCard.cardId,
    groupKey: nextGroup.group.key,
  };
}

function getNextCardFocusCell(
  nextPosition: 'up' | 'down',
  cards: SprintCard[],
  selection: SprintCellSelection,
  getNextCardIndex: (cardIndex: number) => number
):
  | {
      cell: SprintCell;
      cardId: string;
    }
  | undefined {
  const cardIndex = cards.findIndex(card => card.cardId === selection.cardId);
  const nextCardIndex = getNextCardIndex(cardIndex);
  const nextCard = cards[nextCardIndex];
  if (!nextCard) return;
  const nextCells = Array.from(
    nextCard.querySelectorAll('affine-data-view-sprint-cell')
  );
  const nextCellIndex = nextPosition === 'up' ? nextCells.length - 1 : 0;
  if (!nextCells[nextCellIndex]) return;
  return {
    cell: nextCells[nextCellIndex],
    cardId: nextCard.cardId,
  };
}

function getCardCellsBySelection(
  viewElement: Element,
  selection: SprintCellSelection
) {
  const card = getSelectedCard(viewElement, selection);
  return Array.from(
    card?.querySelectorAll('affine-data-view-sprint-cell') ?? []
  );
}

function getSelectedCard(
  viewElement: Element,
  selection: SprintCellSelection
): SprintCard | null {
  const group = viewElement.querySelector(
    `affine-data-view-sprint-group[data-key="${selection.groupKey}"]`
  );

  if (!group) return null;
  return group.querySelector<SprintCard>(
    `affine-data-view-sprint-card[data-card-id="${selection.cardId}"]`
  );
}

function getSelectedCards(
  viewElement: Element,
  selection: SprintCardSelection | SprintGroupSelection
): SprintCard[] {
  if (selection.selectionType === 'group') return [];

  const groupKeys = selection.cards.map(card => card.groupKey);
  const groups = groupKeys
    .map(key =>
      viewElement.querySelector(
        `affine-data-view-sprint-group[data-key="${key}"]`
      )
    )
    .filter((group): group is Element => group !== null);

  const cardIds = selection.cards.map(card => card.cardId);
  const cards = groups
    .flatMap(group =>
      cardIds.map(id =>
        group.querySelector<SprintCard>(
          `affine-data-view-sprint-card[data-card-id="${id}"]`
        )
      )
    )
    .filter((card): card is SprintCard => card !== null);

  return cards;
}

function getFocusCell(viewElement: Element, selection: SprintCellSelection) {
  const card = getSelectedCard(viewElement, selection);
  return card?.querySelector<SprintCell>(
    `affine-data-view-sprint-cell[data-column-id="${selection.columnId}"]`
  );
}

function getYOffset(srcRect: DOMRect, targetRect: DOMRect) {
  return Math.abs(
    srcRect.top +
      (srcRect.bottom - srcRect.top) / 2 -
      (targetRect.top + (targetRect.bottom - targetRect.top) / 2)
  );
}

const atLeastOne = <T>(v: T[]): v is [T, ...T[]] => {
  return v.length > 0;
};
