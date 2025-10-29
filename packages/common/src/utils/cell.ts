import type { CellPriority } from '../types';

const priorityToSectionMap: Record<CellPriority, 'middle' | 'intermediary' | 'end'> = {
  start: 'middle',
  middle: 'intermediary',
  end: 'end',
};

export const mapCellPriorityToSection = (
  priority: CellPriority | CellPriority[],
): ('middle' | 'intermediary' | 'end')[] => {
  if (Array.isArray(priority)) {
    return priority.flatMap(mapCellPriorityToSection);
  }
  return [priorityToSectionMap[priority]];
};

export const hasCellPriority = (
  priorityToMatch: CellPriority,
  priority?: CellPriority | CellPriority[],
) => {
  if (!priority) return false;
  if (Array.isArray(priority)) return priority.includes(priorityToMatch);
  return priority === priorityToMatch;
};
