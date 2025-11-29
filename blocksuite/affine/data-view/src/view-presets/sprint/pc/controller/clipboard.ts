import type { UIEventStateContext } from '@blocksuite/std';
import type { ReactiveController } from 'lit';

import type { SprintViewSelectionWithType } from '../../selection';
import type { SprintViewUILogic } from '../sprint-view-ui-logic.js';

export class SprintClipboardController implements ReactiveController {
  private readonly _onCopy = (
    _context: UIEventStateContext,
    _sprintSelection: SprintViewSelectionWithType
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

  constructor(public logic: SprintViewUILogic) {}

  hostConnected() {
    if (this.host) {
      this.host.disposables.add(
        this.logic.handleEvent('copy', ctx => {
          const sprintSelection = this.logic.selectionController.selection;
          if (!sprintSelection) return false;

          this._onCopy(ctx, sprintSelection);
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
