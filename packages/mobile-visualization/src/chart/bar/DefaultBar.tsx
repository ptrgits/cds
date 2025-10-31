import { memo, useMemo } from 'react';
import { useTheme } from '@coinbase/cds-mobile/hooks/useTheme';

import { useCartesianChartContext } from '../ChartProvider';
import { Path } from '../Path';
import { getBarPath } from '../utils';
import { type TransitionConfig } from '../utils/transition';

import type { BarComponentProps } from './Bar';

export type DefaultBarProps = BarComponentProps & {
  /**
   * Transition configurations for different animation phases.
   * Allows customization of animation type, timing, and springs.
   *
   * @example
   * // Spring animation for bouncy bars
   * transitionConfigs={{ update: { type: 'spring', damping: 10, stiffness: 100 } }}
   *
   * @example
   * // Different enter and update animations
   * transitionConfigs={{
   *   enter: { type: 'timing', duration: 1000 },
   *   update: { type: 'timing', duration: 300 }
   * }}
   */
  transitionConfigs?: {
    /**
     * Transition used when the bar first enters/mounts.
     */
    enter?: TransitionConfig;
    /**
     * Transition used when the bar morphs to new data.
     */
    update?: TransitionConfig;
  };
};

/**
 * Default bar component that renders a solid bar with animation support.
 */
export const DefaultBar = memo<DefaultBarProps>(
  ({
    x,
    y,
    width,
    height,
    borderRadius,
    roundTop,
    roundBottom,
    d,
    fill,
    fillOpacity = 1,
    stroke,
    strokeWidth,
    originY,
    transitionConfigs,
  }) => {
    const { animate } = useCartesianChartContext();
    const theme = useTheme();

    const defaultFill = fill || theme.color.fgPrimary;

    const targetPath = useMemo(() => {
      const effectiveBorderRadius = borderRadius ?? 0;
      const effectiveRoundTop = roundTop ?? true;
      const effectiveRoundBottom = roundBottom ?? true;

      return (
        d ||
        getBarPath(
          x,
          y,
          width,
          height,
          effectiveBorderRadius,
          effectiveRoundTop,
          effectiveRoundBottom,
        )
      );
    }, [x, y, width, height, borderRadius, roundTop, roundBottom, d]);

    const initialPath = useMemo(() => {
      const effectiveBorderRadius = borderRadius ?? 0;
      const effectiveRoundTop = roundTop ?? true;
      const effectiveRoundBottom = roundBottom ?? true;
      const baselineY = originY ?? y + height;

      return getBarPath(
        x,
        baselineY,
        width,
        1,
        effectiveBorderRadius,
        effectiveRoundTop,
        effectiveRoundBottom,
      );
    }, [x, originY, y, height, width, borderRadius, roundTop, roundBottom]);

    return (
      <Path
        animate={animate}
        clipPath={undefined}
        d={targetPath}
        fill={stroke ? 'none' : defaultFill}
        fillOpacity={fillOpacity}
        initialPath={initialPath}
        stroke={stroke}
        strokeWidth={strokeWidth}
        transitionConfigs={{
          enter: transitionConfigs?.enter,
          update: transitionConfigs?.update,
        }}
      />
    );
  },
);
