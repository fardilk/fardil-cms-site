import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

export const BLOCK_TYPE = 'BLOCK';

export function DraggableBlock({
  id,
  index,
  children,
}: {
  id: string;
  index: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop({
    accept: BLOCK_TYPE,
    hover() {
      // Only show outline, no movement
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
        border: isOver ? '2px solid #3b82f6' : isDragging ? '2px dashed #3b82f6' : 'none',
        position: 'relative',
        transition: 'border 0.2s',
      }}
      className="mb-2"
    >
      {children}
    </div>
  );
}