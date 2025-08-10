import { useState } from 'react';

export type ContentImage = { src: string; alt?: string };

export type HeadingStyle = 'default' | 'hero' | 'section' | 'subtitle';
export type TextAlign = 'left' | 'center' | 'right' | 'justify';
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';
export type ParagraphVariant = 'body' | 'lead' | 'caption' | 'callout';

export type ParagraphSpan = {
  text: string;
  marks?: Array<'bold'|'italic'|'underline'|'strike'|'link'>;
  href?: string; // only when marks includes 'link'
};

export type ContentBlock = {
  id: string;
  type: string;
  data: {
    // common text content (legacy/simple)
    content?: string;
    // headings
    level?: number;
    headingStyle?: HeadingStyle;
    // images
    src?: string;
    alt?: string;
    images?: ContentImage[];
    mode?: 'single' | 'gallery';
    // code
    code?: string;
    // video
    url?: string;
    videoMode?: 'embed' | 'upload';
    videoSrc?: string;
    // table
    rows?: number;
    cols?: number;
    cells?: string[][];
    // paragraph formatting
    align?: TextAlign;
    transform?: TextTransform;
    variant?: ParagraphVariant;
    spans?: ParagraphSpan[];
  };
};

export function useContentBlocks(initialBlocks: ContentBlock[] = []) {
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(initialBlocks);

  const addBlock = (block: ContentBlock) => setContentBlocks(prev => [...prev, block]);
  const resetBlocks = () => setContentBlocks([]);

  return { contentBlocks, setContentBlocks, addBlock, resetBlocks };
}