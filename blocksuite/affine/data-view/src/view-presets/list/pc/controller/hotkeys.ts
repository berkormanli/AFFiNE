import type { ReactiveController } from 'lit';

import type { ListViewUILogic } from '../list-view-ui-logic.js';

export class ListHotkeysController implements ReactiveController {
  private get hasSelection() {
    return !!this.logic.selectionController.selection;
  }

  constructor(public logic: ListViewUILogic) {}

  get host() {
    return this.logic.ui$.value;
  }

  hostConnected() {
    if (this.host) {
      this.host.disposables.add(
        this.logic.bindHotkey({
          Escape: () => {
            this.logic.selectionController.focusOut();
            return true;
          },
          Enter: () => {
            this.logic.selectionController.focusIn();
          },
          ArrowUp: context => {
            if (!this.hasSelection) return false;

            this.logic.selectionController.focusNext('up');
            context.get('keyboardState').raw.preventDefault();
            return true;
          },
          ArrowDown: context => {
            if (!this.hasSelection) return false;

            this.logic.selectionController.focusNext('down');
            context.get('keyboardState').raw.preventDefault();
            return true;
          },
          Tab: context => {
            if (!this.hasSelection) return false;

            this.logic.selectionController.focusNext('down');
            context.get('keyboardState').raw.preventDefault();
            return true;
          },
          Backspace: () => {
            this.logic.selectionController.deleteRow();
          },
        })
      );
    }
  }
}
