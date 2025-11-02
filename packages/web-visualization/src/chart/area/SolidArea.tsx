import { memo, useId, useMemo } from 'react';

import { useCartesianChartContext } from '../ChartProvider';
import { Gradient } from '../gradient';
import { Path, type PathProps } from '../Path';
import { getGradientConfig } from '../utils';

import type { AreaComponentProps } from './Area';

export type SolidAreaProps = Omit<PathProps, 'd' | 'fill' | 'fillOpacity'> & AreaComponentProps;

/**
 * A customizable solid area component which uses Path.
 * When a gradient is provided, renders with gradient fill.
 * Otherwise, renders with solid fill (no automatic fade).
 */
export const SolidArea = memo<SolidAreaProps>(
  ({
    d,
    fill = 'var(--color-fgPrimary)',
    fillOpacity = 1,
    yAxisId,
    baseline,
    gradient: gradientProp,
    seriesId,
    animate,
    transitionConfigs,
    ...props
  }) => {
    const context = useCartesianChartContext();
    const patternId = useId();

    const targetSeries = seriesId ? context.getSeries(seriesId) : undefined;
    const gradient = gradientProp ?? targetSeries?.gradient;

    const xScale = context.getXScale();
    const yScale = context.getYScale(yAxisId);

    const gradientConfig = useMemo(() => {
      if (!gradient || !xScale || !yScale) return;
      return getGradientConfig(gradient, xScale, yScale);
    }, [gradient, xScale, yScale]);

    if (!gradientConfig) {
      return (
        <Path
          animate={animate}
          d={d}
          fill={fill}
          fillOpacity={fillOpacity}
          transitionConfigs={transitionConfigs}
          {...props}
        />
      );
    }

    return (
      <>
        <defs>
          <Gradient
            animate={animate}
            axis={gradient?.axis}
            config={gradientConfig}
            id={patternId}
            transitionConfigs={transitionConfigs}
            yAxisId={yAxisId}
          />
        </defs>
        <Path
          animate={animate}
          d={d}
          fill={`url(#${patternId})`}
          fillOpacity={fillOpacity}
          transitionConfigs={transitionConfigs}
          {...props}
        />
      </>
    );
  },
);
