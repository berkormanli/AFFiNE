import { createViewConvert } from '../core/view/convert.js';
import { kanbanViewModel } from './kanban/index.js';
import { listViewModel } from './list/index.js';
import { sprintViewModel } from './sprint/index.js';
import { tableViewModel } from './table/index.js';

export const viewConverts = [
  createViewConvert(tableViewModel, kanbanViewModel, data => {
    if (data.groupBy) {
      return {
        filter: data.filter,
        groupBy: data.groupBy,
      };
    }
    return {
      filter: data.filter,
    };
  }),
  createViewConvert(kanbanViewModel, tableViewModel, data => ({
    filter: data.filter,
    groupBy: data.groupBy,
  })),
  createViewConvert(tableViewModel, sprintViewModel, data => {
    if (data.groupBy) {
      return {
        filter: data.filter,
        groupBy: data.groupBy,
      };
    }
    return {
      filter: data.filter,
    };
  }),
  createViewConvert(sprintViewModel, tableViewModel, data => ({
    filter: data.filter,
    groupBy: data.groupBy,
  })),
  createViewConvert(kanbanViewModel, sprintViewModel, data => ({
    filter: data.filter,
    groupBy: data.groupBy,
  })),
  createViewConvert(sprintViewModel, kanbanViewModel, data => ({
    filter: data.filter,
    groupBy: data.groupBy,
  })),
  // List view conversions
  createViewConvert(tableViewModel, listViewModel, data => ({
    filter: data.filter,
  })),
  createViewConvert(listViewModel, tableViewModel, data => ({
    filter: data.filter,
  })),
  createViewConvert(kanbanViewModel, listViewModel, data => ({
    filter: data.filter,
  })),
  createViewConvert(listViewModel, kanbanViewModel, data => ({
    filter: data.filter,
  })),
  createViewConvert(sprintViewModel, listViewModel, data => ({
    filter: data.filter,
  })),
  createViewConvert(listViewModel, sprintViewModel, data => ({
    filter: data.filter,
  })),
];
