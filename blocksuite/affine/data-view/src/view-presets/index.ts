import { kanbanViewMeta } from './kanban/index.js';
import { listViewMeta } from './list/index.js';
import { sprintViewMeta } from './sprint/index.js';
import { tableViewMeta } from './table/index.js';

export * from './convert.js';
export * from './kanban/index.js';
export * from './list/index.js';
export * from './sprint/index.js';
export * from './table/index.js';

export const viewPresets = {
  tableViewMeta: tableViewMeta,
  kanbanViewMeta: kanbanViewMeta,
  sprintViewMeta: sprintViewMeta,
  listViewMeta: listViewMeta,
};
