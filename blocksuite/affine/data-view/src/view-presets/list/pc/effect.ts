import { ListCell } from './cell.js';
import { ListViewUI } from './list-view-ui-logic.js';
import { ListRow } from './row.js';

export function pcEffects() {
  customElements.define('affine-data-view-list-cell', ListCell);
  customElements.define('affine-data-view-list-row', ListRow);
  customElements.define('dv-list-view-ui', ListViewUI);
}
