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

import type { MobileListViewUILogic } from './list-view-ui-logic.js';

export const popRowMenu = (
  ele: PopupTarget,
  rowId: string,
  listViewLogic: MobileListViewUILogic
) => {
  popFilterableSimpleMenu(ele, [
    menu.group({
      items: [
        menu.action({
          name: 'Expand Task',
          prefix: ExpandFullIcon(),
          select: () => {
            listViewLogic.root.openDetailPanel({
              view: listViewLogic.view,
              rowId: rowId,
            });
          },
        }),
      ],
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
            listViewLogic.view.rowAdd({ before: true, id: rowId });
            listViewLogic.ui$.value?.requestUpdate();
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
            listViewLogic.view.rowAdd({ before: false, id: rowId });
            listViewLogic.ui$.value?.requestUpdate();
          },
        }),
      ],
    }),
    menu.group({
      items: [
        menu.action({
          name: 'Delete Task',
          class: {
            'delete-item': true,
          },
          prefix: DeleteIcon(),
          select: () => {
            listViewLogic.view.rowsDelete([rowId]);
            listViewLogic.ui$.value?.requestUpdate();
          },
        }),
      ],
    }),
  ]);
};
