import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

export const BLOCK_TYPE = 'BLOCK';

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

  const [, drop] = useDrop({
    accept: BLOCK_TYPE,
    hover(item: { index: number }, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      moveBlock(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
    }),
  });

  const [{ isDragging }, drag] = useDrag({
    type: BLOCK_TYPE,
    item: { id, index },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{
        opacity: isDragging ? 0.5 : 1,
        border: isDragging ? '2px dashed #3b82f6' : 'none',
        position: 'relative',
      }}
      className="mb-2"
    >
      {children}
    </div>
  );
}