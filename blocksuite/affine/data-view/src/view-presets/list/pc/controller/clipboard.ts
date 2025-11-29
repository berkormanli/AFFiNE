import type { UIEventStateContext } from '@blocksuite/std';
import type { ReactiveController } from 'lit';

import type { ListViewSelectionWithType } from '../../selection';
import type { ListViewUILogic } from '../list-view-ui-logic.js';

export class ListClipboardController implements ReactiveController {
  private readonly _onCopy = (
    _context: UIEventStateContext,
    _listSelection: ListViewSelectionWithType
  ) => {
    // todo
    return true;
  };

  private readonly _onPaste = (_context: UIEventStateContext) => {
    // todo
    return true;
  };

  private get readonly() {
    return this.logic.view.readonly$.value;
  }

  get host() {
    return this.logic.ui$.value;
  }

  constructor(public logic: ListViewUILogic) {}

  hostConnected() {
    if (this.host) {
      this.host.disposables.add(
        this.logic.handleEvent('copy', ctx => {
          const listSelection = this.logic.selectionController.selection;
          if (!listSelection) return false;

          this._onCopy(ctx, listSelection);
          return true;
        })
      );

      this.host.disposables.add(
        this.logic.handleEvent('paste', ctx => {
          if (this.readonly) return false;

          this._onPaste(ctx);
          return true;
        })
      );
    }
  }
}
