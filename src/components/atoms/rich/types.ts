export type SpanMark = 'bold' | 'italic' | 'underline' | 'strike' | 'link';
export type RichSpan = { text: string; marks?: SpanMark[]; href?: string; target?: string };
export type ParagraphListItem = { spans: RichSpan[] };

export type Align = 'left' | 'center' | 'right' | 'justify';
export type Transform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';
export type ListKind = 'none' | 'ul' | 'ol';
