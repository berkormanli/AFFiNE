import { kanbanEffects } from './kanban/effect.js';
import { listEffects } from './list/effect.js';
import { sprintEffects } from './sprint/effect.js';
import { tableEffects } from './table/effect.js';

export function viewPresetsEffects() {
  kanbanEffects();
  listEffects();
  sprintEffects();
  tableEffects();
}
