import { memo } from 'react';
import { cx } from '@coinbase/cds-web';
import { Box, type BoxProps } from '@coinbase/cds-web/layout';
import { css } from '@linaria/core';

import type { LegendShape } from '../utils/chart';

const pillCss = css`
  width: 6px;
  height: 24px;
  border-radius: var(--borderRadius-1000);
`;

const circleCss = css`
  width: 10px;
  height: 10px;
  border-radius: var(--borderRadius-1000);
`;

const squareCss = css`
  width: 10px;
  height: 10px;
`;

const squircleCss = css`
  width: 10px;
  height: 10px;
  border-radius: 2px;
`;

const stylesByShape: Record<LegendShape, string> = {
  pill: pillCss,
  circle: circleCss,
  square: squareCss,
  squircle: squircleCss,
};

export type LegendMediaProps = BoxProps<'div'> & {
  /**
   * The color of the legend media.
   * @default 'var(--color-fgPrimary)'
   */
  color?: string;
  /**
   * The shape of the legend media.
   * @default 'circle'
   */
  shape?: LegendShape;
};

/**
 * Media for a chart legend.
 */
export const LegendMedia = memo<LegendMediaProps>(
  ({ color = 'var(--color-fgPrimary)', shape = 'circle', className, style, ...props }) => {
    const shapeStyle = stylesByShape[shape] || stylesByShape.circle;

    return (
      <Box
        className={cx(shapeStyle, className)}
        style={{ backgroundColor: color, ...style }}
        {...props}
      />
    );
  },
);
