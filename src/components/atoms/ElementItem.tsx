import React from 'react';
import { useDrag } from 'react-dnd';
import { BLOCK_TYPE } from '@/components/atoms/DraggableBlock';

type DragPayload = { type: string; blockType?: string } & Record<string, unknown>;

type ElementItemProps = {
  type: string;
  icon: React.ReactNode;
  label: string;
  dragType?: string;
  payload?: DragPayload;
};

const ElementItem: React.FC<ElementItemProps> = ({ type, icon, label, dragType, payload }) => {
  const actualDragType = dragType || BLOCK_TYPE;
  const actualItem: DragPayload = payload || { type: BLOCK_TYPE, blockType: type };

  const [{ isDragging }, drag] = useDrag<DragPayload, unknown, { isDragging: boolean}>({
    type: actualDragType,
    item: actualItem,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  return drag(
    <div
      className={`flex items-center bg-gray-100 rounded-lg p-3 h-12 transition-colors hover:bg-blue-100 hover:shadow-md cursor-move`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <span className="mr-3 w-8 flex-shrink-0 text-center">{icon}</span>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
};

export default ElementItem;
