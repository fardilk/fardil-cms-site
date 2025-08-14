import React from 'react';

type Align = 'left' | 'center' | 'right';
type ListType = 'ul' | 'ol' | null;

type BaseProps = {
  className?: string;
};

type HeadingProps = BaseProps & {
  variant: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  align: Align;
  onLevelChange: (level: 1 | 2 | 3 | 4 | 5 | 6) => void;
  onAlignChange: (align: Align) => void;
  marks?: Array<'bold'|'italic'|'underline'|'strike'|'link'>;
  onBold?: () => void;
  onItalic?: () => void;
  onUnderline?: () => void;
  onStrike?: () => void;
};

type ParagraphProps = BaseProps & {
  variant?: 'paragraph';
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onStrike: () => void;
  marks?: Array<'bold'|'italic'|'underline'|'strike'|'link'>;
  onLink: () => void;
  align: Align;
  onAlignChange: (align: Align) => void;
  listType: ListType;
  onListTypeChange: (type: ListType) => void;
};

export type HoverToolbarProps = HeadingProps | ParagraphProps;

const baseCls = 'bg-white border rounded px-2 py-1 text-xs shadow flex items-center gap-1';

export default function HoverToolbar(props: HoverToolbarProps) {
  const cls = `${baseCls} ${props.className ?? ''}`;

  if (props.variant === 'heading') {
    const { level, align, onLevelChange, onAlignChange, marks, onBold, onItalic, onUnderline, onStrike } = props as HeadingProps;
    return (
      <div className={cls}>
        {[1, 2, 3, 4, 5, 6].map((l) => (
          <button
            key={l}
            className={`px-2 py-0.5 rounded border ${l === level ? 'opacity-50 cursor-not-allowed bg-white' : 'hover:bg-gray-50'}`}
            onClick={() => onLevelChange(l as 1 | 2 | 3 | 4 | 5 | 6)}
            disabled={l === level}
            title={`H${l}`}
          >
            H{l}
          </button>
        ))}
        <div className="w-px h-4 bg-gray-300 mx-1" />
          <button
            className={`px-2 py-0.5 rounded border ${marks?.includes('bold') ? 'bg-white' : ''}`}
            title="Bold"
            onClick={onBold}
          >
            B
          </button>
          <button
            className={`px-2 py-0.5 rounded border ${marks?.includes('italic') ? 'bg-white' : ''}`}
            title="Italic"
            onClick={onItalic}
          >
            I
          </button>
          <button
            className={`px-2 py-0.5 rounded border ${marks?.includes('underline') ? 'bg-white' : ''}`}
            title="Underline"
            onClick={onUnderline}
          >
            U
          </button>
          <button
            className={`px-2 py-0.5 rounded border ${marks?.includes('strike') ? 'bg-white' : ''}`}
            title="Strikethrough"
            onClick={onStrike}
          >
            S
          </button>
          <div className="w-px h-4 bg-gray-300 mx-1" />
        <button
          className={`px-2 py-0.5 rounded border ${align === 'left' ? 'bg-white' : ''}`}
          title="Align left"
          onClick={() => onAlignChange('left')}
        >
          ⇸
        </button>
        <button
          className={`px-2 py-0.5 rounded border ${align === 'center' ? 'bg-white' : ''}`}
          title="Align center"
          onClick={() => onAlignChange('center')}
        >
          ↔
        </button>
        <button
          className={`px-2 py-0.5 rounded border ${align === 'right' ? 'bg-white' : ''}`}
          title="Align right"
          onClick={() => onAlignChange('right')}
        >
          ⇹
        </button>
      </div>
    );
  }

  const {
    fontSize,
    onFontSizeChange,
    onBold,
    onItalic,
    onUnderline,
    onStrike,
    onLink,
    align,
    onAlignChange,
    listType,
    onListTypeChange,
  } = props as ParagraphProps;

  return (
    <div className={cls}>
      <button className="px-2 py-0.5 rounded border" onClick={onBold} title="Bold">
        B
      </button>
      <button className="px-2 py-0.5 rounded border" onClick={onItalic} title="Italic">
        I
      </button>
      <button className="px-2 py-0.5 rounded border" onClick={onUnderline} title="Underline">
        U
      </button>
      <button className="px-2 py-0.5 rounded border" onClick={onStrike} title="Strikethrough">
        S
      </button>
      <button className="px-2 py-0.5 rounded border" onClick={onLink} title="Link">
        Link
      </button>
      <div className="w-px h-4 bg-gray-300 mx-1" />
      <button
        className={`px-2 py-0.5 rounded border ${align === 'left' ? 'bg-white' : ''}`}
        title="Align left"
        onClick={() => onAlignChange('left')}
      >
        ⇸
      </button>
      <button
        className={`px-2 py-0.5 rounded border ${align === 'center' ? 'bg-white' : ''}`}
        title="Align center"
        onClick={() => onAlignChange('center')}
      >
        ↔
      </button>
      <button
        className={`px-2 py-0.5 rounded border ${align === 'right' ? 'bg-white' : ''}`}
        title="Align right"
        onClick={() => onAlignChange('right')}
      >
        ⇹
      </button>
      <div className="w-px h-4 bg-gray-300 mx-1" />
      <button
        className={`px-2 py-0.5 rounded border ${listType === 'ul' ? 'bg-white' : ''}`}
        title="Bulleted list"
        onClick={() => onListTypeChange(listType === 'ul' ? null : 'ul')}
      >
        • List
      </button>
      <button
        className={`px-2 py-0.5 rounded border ${listType === 'ol' ? 'bg-white' : ''}`}
        title="Numbered list"
        onClick={() => onListTypeChange(listType === 'ol' ? null : 'ol')}
      >
        1. List
      </button>
      <div className="w-px h-4 bg-gray-300 mx-1" />
      <span className="text-gray-500 mr-1">Size</span>
      <button
        className="px-2 py-0.5 rounded border"
        onClick={() => onFontSizeChange(Math.max(10, fontSize - 1))}
        title="Decrease"
      >
        −
      </button>
      <span className="px-2">{fontSize}px</span>
      <button
        className="px-2 py-0.5 rounded border"
        onClick={() => onFontSizeChange(Math.min(48, fontSize + 1))}
        title="Increase"
      >
        +
      </button>
    </div>
  );
}
