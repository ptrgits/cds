import type { cellPriorities } from '../tokens/cell';
import type { MarginProps, PaddingProps } from '../types';

export type CellPriority = (typeof cellPriorities)[number];

export type CellSection = 'start' | 'middle' | 'intermediary' | 'end' | 'accessory';

export type CellSpacingConfig = {
  innerSpacing?: PaddingProps & MarginProps;
  outerSpacing?: PaddingProps & MarginProps;
};
