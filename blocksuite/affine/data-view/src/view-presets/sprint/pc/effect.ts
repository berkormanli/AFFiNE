import { SprintCard } from './card.js';
import { SprintCell } from './cell.js';
import { SprintGroup } from './group.js';
import { SprintHeader } from './header.js';

export function pcEffects() {
  customElements.define('affine-data-view-sprint-card', SprintCard);
  customElements.define('affine-data-view-sprint-cell', SprintCell);
  customElements.define('affine-data-view-sprint-group', SprintGroup);
  customElements.define('affine-data-view-sprint-header', SprintHeader);
}
