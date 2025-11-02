import { memo, type SVGProps, useId, useMemo } from 'react';
import type { SharedProps } from '@coinbase/cds-common/types';

import { useCartesianChartContext } from '../ChartProvider';
import { Gradient } from '../gradient';
import { Path, type PathProps } from '../Path';
import { getGradientConfig, type GradientDefinition } from '../utils/gradient';

import type { LineComponentProps } from './Line';

export type DottedLineProps = SharedProps &
  Omit<PathProps, 'fill' | 'strokeWidth'> &
  Pick<
    LineComponentProps,
    'strokeWidth' | 'gradient' | 'seriesId' | 'yAxisId' | 'transitionConfigs'
  > & {
    fill?: SVGProps<SVGPathElement>['fill'];
  };

/**
 * A customizable dotted line component.
 * Supports gradient for gradient effects on the dots.
 */
export const DottedLine = memo<DottedLineProps>(
  ({
    fill = 'none',
    stroke = 'var(--color-bgLine)',
    strokeDasharray = '0 4',
    strokeLinecap = 'round',
    strokeLinejoin = 'round',
    strokeOpacity = 1,
    strokeWidth = 2,
    vectorEffect = 'non-scaling-stroke',
    gradient,
    seriesId,
    yAxisId,
    animate,
    transitionConfigs,
    ...props
  }) => {
    const gradientId = useId();
    const context = useCartesianChartContext();

    const xScale = context.getXScale();
    const yScale = context.getYScale(yAxisId);

    const gradientConfig = useMemo(() => {
      if (!gradient || !xScale || !yScale) return;
      return getGradientConfig(gradient, xScale, yScale);
    }, [gradient, xScale, yScale]);

    return (
      <>
        {gradientConfig && (
          <defs>
            <Gradient
              animate={animate}
              axis={gradient?.axis}
              config={gradientConfig}
              id={gradientId}
              transitionConfigs={transitionConfigs}
              yAxisId={yAxisId}
            />
          </defs>
        )}
        <Path
          animate={animate}
          clipOffset={strokeWidth}
          fill={fill}
          stroke={gradientConfig ? `url(#${gradientId})` : stroke}
          strokeDasharray={strokeDasharray}
          strokeLinecap={strokeLinecap}
          strokeLinejoin={strokeLinejoin}
          strokeOpacity={strokeOpacity}
          strokeWidth={strokeWidth}
          transitionConfigs={transitionConfigs}
          vectorEffect={vectorEffect}
          {...props}
        />
      </>
    );
  },
);
