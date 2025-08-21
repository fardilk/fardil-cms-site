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

export type ParagraphListItem = {
  spans: ParagraphSpan[]; // spans composing a single list item
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
  marks?: Array<'bold'|'italic'|'underline'|'strike'|'link'>;
    // images
    src?: string;
    alt?: string;
    images?: ContentImage[];
    mode?: 'single' | 'gallery';
  // raw HTML snippet
  html?: string;
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
  list?: 'none'|'ul'|'ol';
    spans?: ParagraphSpan[]; // used when list === 'none'
    items?: ParagraphListItem[]; // used when list is 'ul' or 'ol'
  };
};

export function useContentBlocks(initialBlocks: ContentBlock[] = []) {
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(initialBlocks);

  const addBlock = (block: ContentBlock) => setContentBlocks(prev => [...prev, block]);
  const resetBlocks = () => setContentBlocks([]);

  return { contentBlocks, setContentBlocks, addBlock, resetBlocks };
}