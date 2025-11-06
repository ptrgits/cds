import { memo } from 'react';
import type { SharedProps } from '@coinbase/cds-common/types';
import { useTheme } from '@coinbase/cds-mobile/hooks/useTheme';
import { DashPathEffect } from '@shopify/react-native-skia';

import { Gradient } from '../gradient';
import { Path, type PathProps } from '../Path';

import { type LineComponentProps } from './SolidLine';

export type DottedLineProps = SharedProps &
  Omit<PathProps, 'fill' | 'strokeWidth' | 'd'> &
  LineComponentProps & {
    fill?: string;
    /**
     * Stroke dash array for the dotted pattern.
     * @default [0, 4]
     */
    strokeDasharray?: number[];
  };

/**
 * A customizable dotted line component.
 * Supports gradient for gradient effects on the dots and smooth data transitions via AnimatedPath.
 */
export const DottedLine = memo<DottedLineProps>(
  ({
    fill = 'none',
    stroke,
    strokeDasharray = [0, 4],
    strokeLinecap = 'round',
    strokeLinejoin = 'round',
    strokeOpacity = 1,
    strokeWidth = 2,
    gradient,
    seriesId,
    yAxisId,
    d,
    animate,
    transitionConfig,
    ...props
  }) => {
    const theme = useTheme();

    return (
      <Path
        animate={animate}
        clipOffset={strokeWidth}
        d={d}
        fill={fill}
        stroke={stroke ?? theme.color.bgLine}
        strokeLinecap={strokeLinecap}
        strokeLinejoin={strokeLinejoin}
        strokeOpacity={strokeOpacity}
        strokeWidth={strokeWidth}
        transitionConfigs={transitionConfig ? { update: transitionConfig } : undefined}
        {...props}
      >
        <DashPathEffect intervals={strokeDasharray} />
        {gradient && <Gradient gradient={gradient} yAxisId={yAxisId} />}
      </Path>
    );
  },
);
