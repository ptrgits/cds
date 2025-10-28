import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { css } from '@linaria/core';
import { domMax, m as motion, useAnimation, useDragControls, useMotionValue } from 'framer-motion';

import { cx } from '../../cx';
import { Icon } from '../../icons';
import { FramerMotionProvider } from '../../system/FramerMotionProvider';

type Id = string | number;

export type MotionDndTableRow = {
  /** Unique identifier for the row */
  id: Id;
  /** Render content for the row. Keep simple for feasibility testing. */
  content: React.ReactNode;
};

export type MotionDndTableBaseProps = {
  /** Rows to render in the table */
  rows: MotionDndTableRow[];
  /**
   * Callback when a drag ends. Reports which row id was dragged over which row id.
   * `overId` can be `null` if the pointer isn't over any row.
   */
  onReorder?: (draggedId: Id, overId: Id | null) => void;
  /** Optional className for container */
  className?: string;
};

export type MotionDndTableProps = MotionDndTableBaseProps;

const containerCss = css`
  display: grid;
  grid-auto-rows: minmax(44px, auto);
  border: 1px solid var(--color-border);
  border-radius: var(--borderRadius-100);
  overflow: hidden;

  &[data-dragging='true'] {
    user-select: none;
    -webkit-user-select: none;
  }
`;

const rowCss = css`
  display: grid;
  grid-template-columns: var(--space-6) 1fr;
  column-gap: var(--space-2);
  align-items: center;
  padding: 0 var(--space-4);
  background: var(--color-bgPrimaryWash);
  border-top: 1px solid var(--color-borderSubtle);
  touch-action: none;

  &[data-first='true'] {
    border-top: 0;
  }

  &[data-dragging='true'] {
    z-index: 1;
    box-shadow: var(--shadow-elevation2);
    opacity: 0.5;
  }

  &[data-over-target='true'][data-drop-position='before'] {
    border-top: 1px dashed var(--color-fg);
  }

  &[data-over-target='true'][data-drop-position='after'] {
    border-bottom: 1px dashed var(--color-fg);
  }
`;

const handleCss = css`
  width: var(--space-6);
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  touch-action: none;
`;

type DraggableRowProps = {
  id: Id;
  idx: number;
  isDragging: boolean;
  isOverTarget: boolean;
  dropPosition: 'before' | 'after' | null;
  setRowRef: (id: Id, el: HTMLDivElement | null) => void;
  onStart: (id: Id) => void;
  onEnd: (event: PointerEvent, info: { point: { x: number; y: number } }) => void;
  onMove: (event: PointerEvent, info: { point: { x: number; y: number } }) => void;
  content: React.ReactNode;
};

const DraggableRow = ({
  id,
  idx,
  isDragging,
  isOverTarget,
  dropPosition,
  setRowRef,
  onStart,
  onEnd,
  onMove,
  content,
}: DraggableRowProps) => {
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const startDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      onStart(id);
      dragControls.start(e, { snapToCursor: true });
    },
    [dragControls, id, onStart],
  );

  return (
    <motion.div
      ref={(el) => setRowRef(id, el)}
      layout
      aria-grabbed={isDragging}
      className={rowCss}
      data-dragging={isDragging}
      data-drop-position={dropPosition ?? undefined}
      data-first={idx === 0}
      data-over-target={isOverTarget}
      drag="y"
      dragControls={dragControls}
      dragElastic={0.05}
      dragListener={false}
      dragMomentum={false}
      onDrag={onMove as any}
      onDragEnd={(event, info) => {
        onEnd(event as PointerEvent, info);
        x.set(0);
        y.set(0);
      }}
      role="row"
      style={{ x, y }}
      transition={{ layout: { duration: 0 } }}
    >
      <Icon
        aria-label="Drag row"
        className={handleCss}
        name="drag"
        onPointerDown={startDrag}
        tabIndex={0}
      />
      {content}
    </motion.div>
  );
};

export const MotionDndTable = memo(({ rows, onReorder, className }: MotionDndTableProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef(new Map<Id, HTMLDivElement | null>());
  const [order, setOrder] = useState<Id[]>(() => rows.map((r) => r.id));
  const [draggingId, setDraggingId] = useState<Id | null>(null);
  const [overId, setOverId] = useState<Id | null>(null);
  const [overPosition, setOverPosition] = useState<'before' | 'after' | null>(null);
  const [staticRects, setStaticRects] = useState<Map<Id, DOMRect> | null>(null);

  // Keep order in sync if rows change
  React.useEffect(() => {
    const nextIds = rows.map((r) => r.id);
    setOrder((prev) => {
      // If ids set changed, reset order to incoming order
      if (prev.length !== nextIds.length || prev.some((id, i) => id !== nextIds[i])) {
        return nextIds;
      }
      return prev;
    });
  }, [rows]);

  const idToRow = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  const snapshotRects = useCallback(() => {
    const rects = new Map<Id, DOMRect>();
    for (const id of order) {
      const el = rowRefs.current.get(id);
      if (!el) continue;
      rects.set(id, el.getBoundingClientRect());
    }
    return rects;
  }, [order]);

  const getOverAtPoint = useCallback(
    (clientY: number): { id: Id | null; position: 'before' | 'after' | null } => {
      let nearestId: Id | null = null;
      let nearestCenter = 0;
      let nearestDist = Infinity;
      for (const id of order) {
        const rect = staticRects?.get(id) ?? rowRefs.current.get(id)?.getBoundingClientRect();
        if (!rect) continue;
        const center = (rect.top + rect.bottom) / 2;
        const dist = Math.abs(center - clientY);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestId = id;
          nearestCenter = center;
        }
      }
      if (nearestId == null) return { id: null, position: null };
      const position: 'before' | 'after' = clientY < nearestCenter ? 'before' : 'after';
      return { id: nearestId, position };
    },
    [order, staticRects],
  );

  const moveIdToOverIndex = useCallback(
    (dragged: Id, over: Id | null, position: 'before' | 'after' | null) => {
      setOrder((prev) => {
        const currentIdx = prev.indexOf(dragged);
        if (currentIdx === -1) return prev;
        if (over == null) return prev;
        const overIdx = prev.indexOf(over);
        if (overIdx === -1) return prev;
        const next = prev.slice();
        next.splice(currentIdx, 1);
        let insertIdx = overIdx;
        if (position === 'after') insertIdx += 1;
        if (currentIdx < insertIdx) insertIdx -= 1;
        next.splice(insertIdx, 0, dragged);
        return next;
      });
    },
    [],
  );

  const handleDragStart = useCallback(
    (id: Id) => {
      // Take a static snapshot of row rects at drag start
      setStaticRects(snapshotRects());
      setDraggingId(id);
    },
    [snapshotRects],
  );

  const handleDragEnd = useCallback(
    (event: PointerEvent, info: { point: { x: number; y: number } }) => {
      if (draggingId == null) return;
      const { id: over, position } = getOverAtPoint(info.point.y);
      onReorder?.(draggingId, over);
      if (over != null) moveIdToOverIndex(draggingId, over, position);
      setDraggingId(null);
      setOverId(null);
      setOverPosition(null);
      // Refresh static rects to new layout after reorder
      requestAnimationFrame(() => setStaticRects(snapshotRects()));
    },
    [draggingId, getOverAtPoint, moveIdToOverIndex, onReorder, snapshotRects],
  );

  const handleDragMove = useCallback(
    (event: PointerEvent, info: { point: { x: number; y: number } }) => {
      const { id, position } = getOverAtPoint(info.point.y);
      setOverId(id);
      setOverPosition(position);
    },
    [getOverAtPoint],
  );

  const setRowRef = useCallback((id: Id, el: HTMLDivElement | null) => {
    rowRefs.current.set(id, el);
  }, []);

  console.log('order', order);
  console.log('overId', overId);
  return (
    <FramerMotionProvider motionFeatures={domMax}>
      <div
        ref={containerRef}
        className={cx(containerCss, className)}
        data-dragging={draggingId != null}
        role="table"
      >
        {order.map((id, idx) => {
          const row = idToRow.get(id);
          if (!row) return null;
          return (
            <DraggableRow
              key={id}
              content={row.content}
              dropPosition={overPosition}
              id={id}
              idx={idx}
              isDragging={draggingId === id}
              isOverTarget={overId === id}
              onEnd={handleDragEnd}
              onMove={handleDragMove}
              onStart={handleDragStart}
              setRowRef={setRowRef}
            />
          );
        })}
      </div>
    </FramerMotionProvider>
  );
});

MotionDndTable.displayName = 'MotionDndTable';
