import { memo, useMemo } from 'react';
import { useTheme } from '@coinbase/cds-mobile/hooks/useTheme';
import { Blend, ImageShader, Skia } from '@shopify/react-native-skia';

import { useCartesianChartContext } from '../ChartProvider';
import { Gradient } from '../gradient';
import { Path, type PathProps } from '../Path';
import { type GradientDefinition } from '../utils/gradient';

import { type AreaComponentProps } from './SolidArea';

export type DottedAreaProps = Omit<PathProps, 'd' | 'fill' | 'fillOpacity'> &
  AreaComponentProps & {
    /**
     * Size of the pattern unit (width and height).
     * @default 4
     */
    patternSize?: number;
    /**
     * Size of the dots within the pattern.
     * @default 1
     */
    dotSize?: number;
    /**
     * Opacity at the peak values (top/bottom of gradient).
     * @default 1
     */
    peakOpacity?: number;
    /**
     * Opacity at the baseline (0 or edge closest to 0).
     * @default 0
     */
    baselineOpacity?: number;
  };

/**
 * Efficient dotted area component with gradient opacity support.
 * Uses Skia's ImageShader for the dot pattern and LinearGradient for colors/opacity.
 * Supports both data-based color gradients and simple opacity gradients.
 */
export const DottedArea = memo<DottedAreaProps>(
  ({
    d,
    fill: fillProp,
    fillOpacity = 1,
    patternSize = 4,
    dotSize = 1,
    peakOpacity = 1,
    baselineOpacity = 0,
    baseline,
    yAxisId,
    clipRect,
    gradient: gradientProp,
    seriesId,
    animate: animateProp,
    transitionConfig,
  }) => {
    const theme = useTheme();
    const context = useCartesianChartContext();

    const drawingArea = clipRect ?? context.drawingArea;
    const fill = fillProp ?? theme.color.fgPrimary;

    const animate = animateProp ?? context.animate;

    const targetSeries = seriesId ? context.getSeries(seriesId) : undefined;
    const yAxisConfig = context.getYAxis(yAxisId);

    // Auto-generate gradient if not provided
    const gradient = useMemo((): GradientDefinition | undefined => {
      if (gradientProp) return gradientProp;
      if (targetSeries?.gradient) return targetSeries.gradient;
      if (!yAxisConfig) return;

      const { min, max } = yAxisConfig.domain;
      const baselineValue = min >= 0 ? min : max <= 0 ? max : (baseline ?? 0);

      // Diverging gradient (data crosses zero)
      if (min < 0 && max > 0) {
        return {
          axis: 'y',
          stops: [
            { offset: min, color: fill, opacity: peakOpacity },
            { offset: baselineValue, color: fill, opacity: baselineOpacity },
            { offset: max, color: fill, opacity: peakOpacity },
          ],
        };
      }

      // Simple gradient (all positive or all negative)
      const peakValue = min >= 0 ? max : min;
      return {
        axis: 'y',
        stops:
          max <= 0
            ? [
                { offset: peakValue, color: fill, opacity: peakOpacity },
                { offset: baselineValue, color: fill, opacity: baselineOpacity },
              ]
            : [
                { offset: baselineValue, color: fill, opacity: baselineOpacity },
                { offset: peakValue, color: fill, opacity: peakOpacity },
              ],
      };
    }, [
      gradientProp,
      targetSeries?.gradient,
      yAxisConfig,
      fill,
      baseline,
      peakOpacity,
      baselineOpacity,
    ]);

    // Create white dot pattern image (reused for all gradients)
    // We use white so it can be colored by the gradient
    const patternImage = useMemo(() => {
      const surface = Skia.Surface.Make(patternSize, patternSize);
      if (!surface) return null;

      const canvas = surface.getCanvas();
      const paint = Skia.Paint();

      // Use white for the pattern, will be colored by gradient
      paint.setColor(Skia.Color('white'));
      paint.setAntiAlias(true);

      // Draw a single dot in the center of the pattern
      canvas.drawCircle(patternSize / 2, patternSize / 2, dotSize, paint);

      return surface.makeImageSnapshot();
    }, [patternSize, dotSize]);

    if (!drawingArea || !patternImage || !gradient) return null;

    return (
      <Path
        animate={animate}
        clipRect={clipRect}
        d={d}
        fill={fill}
        fillOpacity={fillOpacity}
        transitionConfigs={transitionConfig ? { update: transitionConfig } : undefined}
      >
        <ImageShader fit="none" image={patternImage} tx="repeat" ty="repeat" />
        <Blend mode="srcIn">
          <Gradient gradient={gradient} yAxisId={yAxisId} />
        </Blend>
      </Path>
    );
  },
);
