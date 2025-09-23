import React, { memo, useMemo } from 'react';
import type { SVGProps } from 'react';
import { createRoundedRectPath } from '@coinbase/cds-common/visualizations/charts';
import { m as motion, type MotionProps } from 'framer-motion';

import type { BarComponentProps } from './Bar';

export type DefaultBarProps = BarComponentProps;

/**
 * Default bar component that renders a solid bar with animation.
 */
export const DefaultBar = memo<DefaultBarProps>(
  ({
    x,
    width,
    borderRadius,
    roundTop,
    roundBottom,
    originY,
    d,
    fill = 'var(--color-fgPrimary)',
    fillOpacity = 1,
    stroke,
    strokeWidth,
    disableAnimations = false,
  }) => {
    const initialPath = useMemo(() => {
      if (disableAnimations) return undefined;
      // Need a minimum height to allow for animation
      const minHeight = 1;
      const initialY = originY - minHeight;
      return createRoundedRectPath(
        x,
        initialY,
        width,
        minHeight,
        borderRadius,
        roundTop,
        roundBottom,
      );
    }, [disableAnimations, x, originY, width, borderRadius, roundTop, roundBottom]);

    const pathProps: SVGProps<SVGPathElement> & MotionProps = {
      fill,
      fillOpacity,
      stroke,
      strokeWidth,
    };

    if (!disableAnimations && initialPath) {
      return (
        <motion.path
          {...pathProps}
          animate={{ d }}
          initial={{ d: initialPath }}
          transition={{ type: 'spring', duration: 1, bounce: 0 }}
        />
      );
    }

    return <path {...pathProps} d={d} />;
  },
);
