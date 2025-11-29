import { MobileSprintCard } from './card.js';
import { MobileSprintCell } from './cell.js';
import { MobileSprintGroup } from './group.js';
import { MobileSprintViewUI } from './sprint-view-ui-logic.js';

export function mobileEffects() {
  customElements.define('mobile-sprint-card', MobileSprintCard);
  customElements.define('mobile-sprint-cell', MobileSprintCell);
  customElements.define('mobile-sprint-group', MobileSprintGroup);
  customElements.define('mobile-data-view-sprint-ui', MobileSprintViewUI);
}
