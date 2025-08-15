import React from 'react';

export const BLOCK_TYPE = 'BLOCK';

export function DraggableBlock(
  props: {
    id: string;
    index: number;
    moveBlock: (from: number, to: number) => void;
    children: React.ReactNode;
  }
) {
  // Reordering via drag is disabled; buttons will control order instead.
  return (
    <div className="mb-2">
      {props.children}
    </div>
  );
}