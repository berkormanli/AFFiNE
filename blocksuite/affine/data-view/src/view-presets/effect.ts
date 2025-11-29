import { kanbanEffects } from './kanban/effect.js';
import { sprintEffects } from './sprint/effect.js';
import { tableEffects } from './table/effect.js';

export function viewPresetsEffects() {
  kanbanEffects();
  sprintEffects();
  tableEffects();
}
