import { createIcon } from '../../core/utils/uni-icon.js';
import { sprintViewModel } from './define.js';
import { MobileSprintViewUILogic } from './mobile/sprint-view-ui-logic.js';
import { SprintViewUILogic } from './pc/sprint-view-ui-logic.js';

export const sprintViewMeta = sprintViewModel.createMeta({
  icon: createIcon('TimelineIcon'),
  // @ts-expect-error fixme: typesafe
  pcLogic: () => SprintViewUILogic,
  // @ts-expect-error fixme: typesafe
  mobileLogic: () => MobileSprintViewUILogic,
});
