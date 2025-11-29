import type { GroupBy, GroupProperty } from '../../core/common/types.js';
import type { FilterGroup } from '../../core/filter/types.js';
import type { Sort } from '../../core/sort/types.js';
import { type BasicViewDataType, viewType } from '../../core/view/data-view.js';
import { ListSingleView } from './list-view-manager.js';

export const listViewType = viewType('list');

export type ListViewColumn = {
  id: string;
  hide?: boolean;
};

type DataType = {
  columns: ListViewColumn[];
  filter: FilterGroup;
  groupBy?: GroupBy;
  sort?: Sort;
  header: {
    titleColumn?: string;
    iconColumn?: string;
  };
  groupProperties: GroupProperty[];
};

export type ListViewData = BasicViewDataType<
  typeof listViewType.type,
  DataType
>;

export const listViewModel = listViewType.createModel<ListViewData>({
  defaultName: 'List View',
  dataViewManager: ListSingleView,
  defaultData: viewManager => {
    const columns = viewManager.dataSource.properties$.value;
    return {
      columns: columns.map(id => ({
        id: id,
      })),
      filter: {
        type: 'group',
        op: 'and',
        conditions: [],
      },
      header: {
        titleColumn: viewManager.dataSource.properties$.value.find(
          id => viewManager.dataSource.propertyTypeGet(id) === 'title'
        ),
        iconColumn: 'type',
      },
      groupProperties: [],
    };
  },
});
