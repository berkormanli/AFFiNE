import { MobileListCell } from './cell.js';
import { MobileListViewUI } from './list-view-ui-logic.js';
import { MobileListRow } from './row.js';

export function mobileEffects() {
  customElements.define('mobile-list-cell', MobileListCell);
  customElements.define('mobile-list-row', MobileListRow);
  customElements.define('mobile-data-view-list-ui', MobileListViewUI);
}
