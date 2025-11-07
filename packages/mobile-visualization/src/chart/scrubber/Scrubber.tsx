import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { useRefMap } from '@coinbase/cds-common/hooks/useRefMap';
import type { SharedProps } from '@coinbase/cds-common/types';
import { useTheme } from '@coinbase/cds-mobile';
import { Group, Rect } from '@shopify/react-native-skia';

import { useCartesianChartContext } from '../ChartProvider';
import { ReferenceLine, type ReferenceLineProps } from '../line';
import { applySerializableScale, useScrubberContext } from '../utils';

import { ScrubberBeacon, type ScrubberBeaconProps, type ScrubberBeaconRef } from './ScrubberBeacon';
import { ScrubberBeaconLabel, type ScrubberBeaconLabelProps } from './ScrubberBeaconLabel';
import { ScrubberBeaconLabelGroup } from './ScrubberBeaconLabelGroup';

const minGap = 2;

type LabelDimensions = {
  id: string;
  width: number;
  height: number;
};

/**
 * Configuration for scrubber functionality across chart components.
 * Provides consistent API with smart defaults and component customization.
 */
export type ScrubberProps = SharedProps &
  Pick<ScrubberBeaconProps, 'idlePulse' | 'beaconTransitionConfig'> & {
    /**
     * An array of series IDs that will receive visual emphasis as the user scrubs through the chart.
     * Use this prop to restrict the scrubbing visual behavior to specific series.
     * By default, all series will be highlighted by the Scrubber.
     */
    seriesIds?: string[];

    /**
     * Hides the scrubber line
     */
    hideLine?: boolean;

    /**
     * Whether to hide the overlay rect which obscures future data.
     */
    hideOverlay?: boolean;

    /**
     * Offset of the overlay rect relative to the drawing area.
     * Useful for when scrubbing over lines, where the stroke width would cause part of the line to be visible.
     * @default 2
     */
    overlayOffset?: number;

    /**
     * Label text displayed above the scrubber line.
     */
    label?: ReferenceLineProps['label'] | ((dataIndex: number) => ReferenceLineProps['label']);

    /**
     * Props passed to the scrubber line's label.
     */
    labelProps?: ReferenceLineProps['labelProps'];

    /**
     * Stroke color for the scrubber line.
     */
    lineStroke?: ReferenceLineProps['stroke'];

    /**
     * Custom component for the scrubber beacon.
     */
    BeaconComponent?: React.ComponentType<ScrubberBeaconProps>;

    /**
     * Custom component for the scrubber beacon label.
     */
    BeaconLabelComponent?: React.ComponentType<ScrubberBeaconLabelProps>;

    /**
     * Custom component for the scrubber line.
     */
    LineComponent?: React.ComponentType<ReferenceLineProps>;
  };

export type ScrubberRef = ScrubberBeaconRef;

/**
 * Unified component that manages all scrubber elements (beacons, line, labels)
 * with intelligent collision detection and consistent positioning.
 */
export const Scrubber = memo(
  forwardRef<ScrubberRef, ScrubberProps>(
    (
      {
        seriesIds,
        hideLine,
        label,
        lineStroke,
        labelProps,
        BeaconComponent = ScrubberBeacon,
        BeaconLabelComponent = ScrubberBeaconLabel,
        LineComponent = ReferenceLine,
        hideOverlay,
        overlayOffset = 2,
        testID,
        idlePulse,
        beaconTransitionConfig,
      },
      ref,
    ) => {
      const theme = useTheme();
      const ScrubberBeaconRefs = useRefMap<ScrubberBeaconRef>();

      // Track label dimensions for collision detection
      const [labelDimensions, setLabelDimensions] = useState<Map<string, LabelDimensions>>(
        new Map(),
      );

      const { scrubberPosition } = useScrubberContext();
      const {
        getXSerializableScale,
        getYSerializableScale,
        getSeriesData,
        getXAxis,
        series,
        drawingArea,
        animate,
      } = useCartesianChartContext();

      const xAxis = useMemo(() => getXAxis(), [getXAxis]);
      const xScale = useMemo(() => getXSerializableScale(), [getXSerializableScale]);

      // Animation state for delayed scrubber rendering (matches web timing)
      const scrubberOpacity = useSharedValue(animate ? 0 : 1);

      // Trigger delayed scrubber animation when component mounts and animate is true
      useEffect(() => {
        if (animate) {
          // Match web timing: 850ms delay + 150ms fade in
          setTimeout(() => {
            scrubberOpacity.value = withTiming(1, { duration: 150 });
          }, 850);
        }
      }, [animate, scrubberOpacity]);

      // Expose imperative handle with pulse method
      useImperativeHandle(ref, () => ({
        pulse: () => {
          // Pulse all registered scrubber beacons
          Object.values(ScrubberBeaconRefs.refs).forEach((beaconRef) => {
            beaconRef?.pulse();
          });
        },
      }));

      const filteredSeries = useMemo(() => {
        return (
          series?.filter((s) => {
            if (seriesIds === undefined) return true;
            return seriesIds.includes(s.id);
          }) ?? []
        );
      }, [series, seriesIds]);

      const createScrubberBeaconRef = useCallback(
        (seriesId: string) => {
          return (beaconRef: ScrubberBeaconRef | null) => {
            if (beaconRef) {
              ScrubberBeaconRefs.registerRef(seriesId, beaconRef);
            }
          };
        },
        [ScrubberBeaconRefs],
      );

      const maxDataLength = useMemo(
        () =>
          series?.reduce((max: any, s: any) => {
            const seriesData = getSeriesData(s.id);
            return Math.max(max, seriesData?.length ?? 0);
          }, 0) ?? 0,
        [series, getSeriesData],
      );

      const dataIndex = useDerivedValue(() => {
        return scrubberPosition.value ?? Math.max(0, maxDataLength - 1);
      }, [scrubberPosition, maxDataLength]);

      const dataX = useDerivedValue(() => {
        if (xAxis?.data && Array.isArray(xAxis.data) && xAxis.data[dataIndex.value] !== undefined) {
          const dataValue = xAxis.data[dataIndex.value];
          return typeof dataValue === 'string' ? dataIndex.value : dataValue;
        }
        return dataIndex.value;
      }, [xAxis, dataIndex]);

      /*const memoizedScrubberLabel = useDerivedValue(() => {
        if (typeof label === 'function') {
          if (dataIndex.value === undefined) return undefined;
          return label(dataIndex.value);
        }
        return label;
      }, [label, dataIndex]);*/
      const memoizedScrubberLabel = 'test';

      const labelVerticalInset = 2;
      const labelHorizontalInset = 4;

      // Calculate optimal label positioning strategy with collision detection
      /*const labelPositioning = useDerivedValue(() => {
        // Build enriched dimensions with current beacon positions
        const dimensions = beaconPositions.value
          .map((beacon: any) => {
            const dim = labelDimensions.get(beacon?.targetSeries?.id ?? '');
            if (!dim) return null;
            return {
              ...dim,
              preferredX: pixelX.value ?? 0,
              preferredY: beacon.pixelY,
            };
          })
          .filter((d): d is NonNullable<typeof d> => d !== null);

        if (dimensions.length === 0) return { strategy: 'auto' as const, adjustments: new Map() };

        const adjustments = new Map<string, { x: number; y: number; side: 'left' | 'right' }>();

        // Sort by Y position to handle overlaps systematically
        const sortedDimensions = [...dimensions].sort((a, b) => a.preferredY - b.preferredY);

        // Determine if we need to switch sides globally based on overflow
        let globalSide: 'left' | 'right' = 'right';

        const anchorRadius = 10; // Same as beacon radius
        const bufferPx = 5; // Small buffer to prevent premature switching

        // Safety check for valid bounds
        if (drawingArea.width <= 0 || drawingArea.height <= 0) {
          globalSide = 'right'; // Default to right if bounds are invalid
        } else {
          // Check if labels would overflow when positioned on the right side
          const wouldOverflow = sortedDimensions.some((dim) => {
            const labelRightEdge =
              dim.preferredX + anchorRadius + labelHorizontalInset + dim.width + bufferPx;
            return labelRightEdge > drawingArea.x + drawingArea.width;
          });

          globalSide = wouldOverflow ? 'left' : 'right';
        }

        // Initialize all labels at their preferred positions
        for (const dim of sortedDimensions) {
          adjustments.set(dim.id, {
            x: dim.preferredX,
            y: dim.preferredY,
            side: globalSide,
          });
        }

        // Check for collisions and resolve them
        const maxIterations = 10;
        let iteration = 0;

        while (iteration < maxIterations) {
          let hasCollisions = false;
          iteration++;

          // Sort by current Y position for systematic collision resolution
          const currentPositions = sortedDimensions
            .map((dim) => ({
              ...dim,
              currentY: adjustments.get(dim.id)!.y,
            }))
            .sort((a, b) => a.currentY - b.currentY);

          // Check adjacent labels for overlaps
          for (let i = 0; i < currentPositions.length - 1; i++) {
            const current = currentPositions[i];
            const next = currentPositions[i + 1];

            const currentAdjustment = adjustments.get(current.id)!;
            const nextAdjustment = adjustments.get(next.id)!;

            // Calculate required separation
            const requiredSeparation = current.height / 2 + next.height / 2 + minGap;
            const currentSeparation = nextAdjustment.y - currentAdjustment.y;

            if (currentSeparation < requiredSeparation) {
              hasCollisions = true;
              const deficit = requiredSeparation - currentSeparation;

              // Move labels apart - split the adjustment
              const offsetPerLabel = deficit / 2;

              adjustments.set(current.id, {
                ...currentAdjustment,
                y: currentAdjustment.y - offsetPerLabel,
              });
              adjustments.set(next.id, {
                ...nextAdjustment,
                y: nextAdjustment.y + offsetPerLabel,
              });
            }
          }

          if (!hasCollisions) {
            break;
          }
        }

        // After collision resolution, ensure all labels are within bounds
        const labelIds = Array.from(adjustments.keys());

        // Group labels that are close together or overlapping
        const findConnectedGroups = () => {
          const groups: string[][] = [];
          const visited = new Set<string>();

          for (const id of labelIds) {
            if (visited.has(id)) continue;

            const group: string[] = [id];
            visited.add(id);
            const queue = [id];

            while (queue.length > 0) {
              const currentId = queue.shift()!;
              const currentAdjustment = adjustments.get(currentId)!;
              const currentDim = sortedDimensions.find((d) => d.id === currentId)!;

              // Check if this label overlaps or is close to any other unvisited label
              for (const otherId of labelIds) {
                if (visited.has(otherId)) continue;

                const otherAdjustment = adjustments.get(otherId)!;
                const otherDim = sortedDimensions.find((d) => d.id === otherId)!;

                // Calculate distance between labels
                const distance = Math.abs(currentAdjustment.y - otherAdjustment.y);
                const minDistance = (currentDim.height + otherDim.height) / 2 + minGap * 2;

                // Labels are considered connected if they're close enough to potentially overlap
                if (distance <= minDistance) {
                  visited.add(otherId);
                  group.push(otherId);
                  queue.push(otherId);
                }
              }
            }

            groups.push(group);
          }

          return groups;
        };

        const connectedGroups = findConnectedGroups();

        // Process each connected group independently
        for (const groupIds of connectedGroups) {
          // Check if any labels in this group are outside bounds
          const groupOutOfBounds = groupIds.some((id) => {
            const adjustment = adjustments.get(id)!;
            const dim = sortedDimensions.find((d) => d.id === id)!;
            const labelTop = adjustment.y - dim.height / 2;
            const labelBottom = adjustment.y + dim.height / 2;
            return labelTop < drawingArea.y || labelBottom > drawingArea.y + drawingArea.height;
          });

          if (groupOutOfBounds) {
            // Get labels in this group sorted by their preferred Y position
            const groupLabels = groupIds
              .map((id) => ({
                id,
                dim: sortedDimensions.find((d) => d.id === id)!,
                preferredY: sortedDimensions.find((d) => d.id === id)!.preferredY,
                currentY: adjustments.get(id)!.y,
              }))
              .sort((a, b) => a.preferredY - b.preferredY);

            // Calculate total height needed for this group
            const totalLabelHeight = groupLabels.reduce((sum, label) => sum + label.dim.height, 0);
            const totalGaps = (groupLabels.length - 1) * minGap;
            const totalNeeded = totalLabelHeight + totalGaps;

            if (totalNeeded > drawingArea.height) {
              // Not enough space - use compressed equal spacing as fallback
              const compressedGap = Math.max(
                2,
                (drawingArea.height - totalLabelHeight) / Math.max(1, groupLabels.length - 1),
              );
              let currentY = drawingArea.y + groupLabels[0].dim.height / 2;

              for (const label of groupLabels) {
                adjustments.set(label.id, {
                  ...adjustments.get(label.id)!,
                  y: currentY,
                });

                currentY += label.dim.height + compressedGap;
              }
            } else {
              // Enough space - use minimal displacement algorithm for this group
              const finalPositions = [...groupLabels];

              // Ensure minimum spacing between adjacent labels in this group
              for (let i = 1; i < finalPositions.length; i++) {
                const prev = finalPositions[i - 1];
                const current = finalPositions[i];

                // Calculate minimum Y position for current label
                const minCurrentY =
                  prev.preferredY + prev.dim.height / 2 + minGap + current.dim.height / 2;

                if (current.preferredY < minCurrentY) {
                  // Need to push this label down
                  current.preferredY = minCurrentY;
                }
              }

              // Check if this specific group fits within bounds, if not shift only this group
              const groupTop = finalPositions[0].preferredY - finalPositions[0].dim.height / 2;
              const groupBottom =
                finalPositions[finalPositions.length - 1].preferredY +
                finalPositions[finalPositions.length - 1].dim.height / 2;

              let shiftAmount = 0;

              if (groupTop < drawingArea.y) {
                // Group is too high, shift down
                shiftAmount = drawingArea.y - groupTop;
              } else if (groupBottom > drawingArea.y + drawingArea.height) {
                // Group is too low, shift up
                shiftAmount = drawingArea.y + drawingArea.height - groupBottom;
              }

              // Apply final positions with shift only to this group
              for (const label of finalPositions) {
                const finalY = label.preferredY + shiftAmount;

                // Final bounds check for individual labels
                const clampedY = Math.max(
                  drawingArea.y + label.dim.height / 2,
                  Math.min(drawingArea.y + drawingArea.height - label.dim.height / 2, finalY),
                );

                adjustments.set(label.id, {
                  ...adjustments.get(label.id)!,
                  y: clampedY,
                });
              }
            }
          }
        }

        return { strategy: globalSide, adjustments };
      }, [beaconPositions, labelDimensions, drawingArea, pixelX]);*/

      // Callback for labels to register their dimensions
      const registerLabelDimensions = useCallback((id: string, width: number, height: number) => {
        setLabelDimensions((prev) => {
          const existing = prev.get(id);

          // Only update if dimensions actually changed
          if (existing && existing.width === width && existing.height === height) {
            return prev;
          }

          const next = new Map(prev);
          next.set(id, { id, width, height });
          return next;
        });
      }, []);

      // Synchronize label positioning state when the position of any scrubber beacons change
      /*useEffect(() => {
        const currentBeaconIds = new Set(
          beaconPositions.value.map((beacon: any) => beacon?.targetSeries.id).filter(Boolean),
        );

        setLabelDimensions((prev) => {
          // Check if any IDs need to be removed
          let hasChanges = false;
          for (const id of prev.keys()) {
            if (!currentBeaconIds.has(id)) {
              hasChanges = true;
              break;
            }
          }

          // If no changes needed, return prev to avoid re-render
          if (!hasChanges) {
            return prev;
          }

          // Only create new Map if we actually need to remove entries
          const next = new Map();
          for (const [id, dimensions] of prev) {
            if (currentBeaconIds.has(id)) {
              next.set(id, dimensions);
            }
          }
          return next;
        });
      }, [beaconPositions]);*/

      const lineOpacity = useDerivedValue(() => {
        return scrubberPosition.value !== undefined ? 1 : 0;
      }, [scrubberPosition]);

      const overlayOpacity = useDerivedValue(() => {
        return scrubberPosition.value !== undefined ? 0.8 : 0;
      }, [scrubberPosition]);

      const overlayWidth = useDerivedValue(() => {
        const pixelX =
          dataX.value !== undefined && xScale ? applySerializableScale(dataX.value, xScale) : 0;
        return drawingArea.x + drawingArea.width - pixelX + overlayOffset;
      }, [dataX, xScale]);

      const overlayX = useDerivedValue(() => {
        const xValue =
          dataX.value !== undefined && xScale ? applySerializableScale(dataX.value, xScale) : 0;
        return xValue;
      }, [dataX, xScale]);

      if (!xScale) return;

      return (
        <Group opacity={scrubberOpacity}>
          {!hideOverlay && (
            <Rect
              color={theme.color.bg}
              height={drawingArea.height + overlayOffset * 2}
              opacity={overlayOpacity}
              width={overlayWidth}
              x={overlayX}
              y={drawingArea.y - overlayOffset}
            />
          )}
          {!hideLine && (
            <Group opacity={lineOpacity}>
              <LineComponent
                dataX={dataX}
                label={memoizedScrubberLabel}
                labelProps={{
                  verticalAlignment: 'middle',
                  ...labelProps,
                }}
              />
            </Group>
          )}
          {filteredSeries.map((s) => (
            <BeaconComponent
              key={s.id}
              ref={createScrubberBeaconRef(s.id)}
              beaconTransitionConfig={beaconTransitionConfig}
              color={s.color}
              gradient={s.gradient}
              idlePulse={idlePulse}
              seriesId={s.id}
              testID={testID ? `${testID}-${s.id}-dot` : undefined}
            />
          ))}
          <ScrubberBeaconLabelGroup
            labels={filteredSeries
              .filter((s) => s.label !== undefined && s.label.length > 0)
              .map((s) => ({
                id: s.id,
                label: s.label!,
                color: s.color,
              }))}
          />
        </Group>
      );
    },
  ),
);
