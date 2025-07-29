import { useState } from 'react';

export type ContentBlock = {
  id: string;
  type: string;
  data: {
    content?: string;
    src?: string;
    alt?: string;
    // Add other block-specific fields here if needed
  };
};

export function useContentBlocks(initialBlocks: ContentBlock[] = []) {
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(initialBlocks);

  const addBlock = (block: ContentBlock) => setContentBlocks(prev => [...prev, block]);
  const resetBlocks = () => setContentBlocks([]);
  // You can add more helpers here (remove, update, reorder, etc.)

  return { contentBlocks, setContentBlocks, addBlock, resetBlocks };
}