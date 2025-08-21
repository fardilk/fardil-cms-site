import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

export const BLOCK_TYPE = 'BLOCK';

// Drag item may come from an existing block (with index) or from the side panel (without index)
type DragItem = { type: string; id?: string; index?: number; blockType?: string };

export function DraggableBlock(props: {
  id: string;
  index: number;
  moveBlock: (from: number, to: number) => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const [, drop] = useDrop<DragItem>({
    accept: BLOCK_TYPE,
    hover(item, monitor) {
      if (!ref.current) return;
      // Only reorder when dragging an existing block (panel items don't have index)
      if (typeof item.index !== 'number') return;
      const dragIndex = item.index;
      const hoverIndex = props.index;
      if (dragIndex === hoverIndex) return;
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      // Only perform the move when the cursor has crossed half of the item's height
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      props.moveBlock(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: BLOCK_TYPE,
    item: () => ({ id: props.id, index: props.index, type: BLOCK_TYPE }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  // Make the whole block both a drop target and a drag source
  drag(drop(ref));

  return (
    <div ref={ref} className="mb-2" style={{ opacity: isDragging ? 0.5 : 1 }}>
      {props.children}
    </div>
  );
}