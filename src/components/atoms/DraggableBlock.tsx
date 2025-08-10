import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

export const BLOCK_TYPE = 'BLOCK';

type DragItem =
  | { type: typeof BLOCK_TYPE; id: string; index: number }
  | { type: typeof BLOCK_TYPE; blockType: string };

export function DraggableBlock({
  id,
  index,
  moveBlock,
  children,
}: {
  id: string;
  index: number;
  moveBlock: (from: number, to: number) => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Reorder existing blocks on hover crossing midpoint (Rule B)
  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean}>({
    accept: BLOCK_TYPE,
    hover(item, monitor) {
      if (!ref.current) return;
      // Only reorder when dragging an existing block (no blockType on payload)
      if ('blockType' in item) return;

      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const rect = ref.current.getBoundingClientRect();
      const middleY = (rect.bottom - rect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - rect.top;

      // Only move when cursor crosses the midline
      if (dragIndex < hoverIndex && hoverClientY < middleY) return;
      if (dragIndex > hoverIndex && hoverClientY > middleY) return;

      moveBlock(dragIndex, hoverIndex);
      (item as { index: number }).index = hoverIndex;
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  const [{ isDragging }, drag] = useDrag({
    type: BLOCK_TYPE,
    item: { id, index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{
        opacity: isDragging ? 0.5 : 1,
        border: isOver ? '2px solid #3b82f6' : 'none',
        position: 'relative',
        transition: 'border 0.2s',
      }}
      className="mb-2"
    >
      {children}
    </div>
  );
}