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

const dotCss = css`
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
  circle: dotCss,
  dot: dotCss,
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
 * A component that displays a visual indicator for a chart series in a legend.
 * Renders a shape (circle, square, pill, etc.) with a specific color.
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
