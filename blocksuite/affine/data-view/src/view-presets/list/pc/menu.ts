import {
  menu,
  popFilterableSimpleMenu,
  type PopupTarget,
} from '@blocksuite/affine-components/context-menu';
import {
  DeleteIcon,
  ExpandFullIcon,
  MoveLeftIcon,
  MoveRightIcon,
} from '@blocksuite/icons/lit';
import { html } from 'lit';

import type { ListSelectionController } from './controller/selection.js';
import type { ListViewUILogic } from './list-view-ui-logic.js';

export const openDetail = (
  listViewLogic: ListViewUILogic,
  rowId: string,
  selection: ListSelectionController
) => {
  const old = selection.selection;
  selection.selection = undefined;
  listViewLogic.root.openDetailPanel({
    view: selection.view,
    rowId: rowId,
    onClose: () => {
      selection.selection = old;
    },
  });
};

export const popRowMenu = (
  listViewLogic: ListViewUILogic,
  ele: PopupTarget,
  rowId: string,
  selection: ListSelectionController
) => {
  popFilterableSimpleMenu(ele, [
    menu.action({
      name: 'Expand Task',
      prefix: ExpandFullIcon(),
      select: () => {
        openDetail(listViewLogic, rowId, selection);
      },
    }),
    menu.group({
      name: '',
      items: [
        menu.action({
          name: 'Insert Before',
          prefix: html` <div
            style="transform: rotate(90deg);display:flex;align-items:center;"
          >
            ${MoveLeftIcon()}
          </div>`,
          select: () => {
            selection.insertRowBefore();
          },
        }),
        menu.action({
          name: 'Insert After',
          prefix: html` <div
            style="transform: rotate(90deg);display:flex;align-items:center;"
          >
            ${MoveRightIcon()}
          </div>`,
          select: () => {
            selection.insertRowAfter();
          },
        }),
      ],
    }),
    menu.group({
      name: '',
      items: [
        menu.action({
          name: 'Delete Task',
          class: {
            'delete-item': true,
          },
          prefix: DeleteIcon(),
          select: () => {
            selection.deleteRow();
          },
        }),
      ],
    }),
  ]);
};
