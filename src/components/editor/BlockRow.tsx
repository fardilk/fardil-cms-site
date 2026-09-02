import React from 'react';
import ImageWithFallback from '../atoms/ImageWithFallback';
import { imageURL } from '@/lib/api';
import { BLOCK_SPECS, specFor } from '@/lib/blocks';
import type { Block, BlockType } from '@/lib/blocks';

type Props = {
  block: Block;
  index: number;
  isDragging: boolean;
  isDropTarget: boolean;
  onChange: (data: Partial<Block['data']>) => void;
  onConvert: (type: BlockType, level?: 2 | 3) => void;
  /** Enter at the end of a block. */
  onSplit: () => void;
  /** Backspace in an empty block. */
  onRemove: () => void;
  onFocusSibling: (delta: number) => void;
  onOpenSlash: (index: number) => void;
  onPickImage: () => void;
  registerRef: (el: HTMLTextAreaElement | null) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  /** 1-based position among consecutive numbered items. */
  ordinal?: number;
};

const textClass = (block: Block) => {
  if (block.type === 'heading') {
    return block.data.level === 3
      ? 'text-lg font-semibold text-[var(--p-text)]'
      : 'text-2xl font-semibold text-[var(--p-text)]';
  }
  if (block.type === 'quote') return 'text-[0.95rem] italic text-[var(--p-text)]';
  if (block.type === 'code') return 'font-mono text-[0.8125rem] text-[var(--p-text)]';
  return 'text-[0.95rem] text-[var(--p-text)]';
};

const placeholder = (block: Block) => {
  switch (block.type) {
    case 'heading':
      return block.data.level === 3 ? 'Judul kecil' : 'Judul besar';
    case 'bulleted_list_item':
    case 'numbered_list_item':
      return 'Poin';
    case 'quote':
      return 'Kutipan';
    case 'callout':
      return 'Catatan penting';
    case 'code':
      return 'Kode';
    default:
      return "Tulis sesuatu, atau ketik '/' untuk blok lain";
  }
};

/** Grows with its content so the page scrolls, not the field. */
const AutoTextarea: React.FC<{
  value: string;
  className: string;
  placeholder: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  registerRef: (el: HTMLTextAreaElement | null) => void;
}> = ({ value, className, placeholder, onChange, onKeyDown, registerRef }) => {
  const ref = React.useRef<HTMLTextAreaElement | null>(null);

  const resize = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  React.useEffect(resize, [value, resize]);

  return (
    <textarea
      ref={(el) => {
        ref.current = el;
        registerRef(el);
      }}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      className={`w-full resize-none overflow-hidden border-0 bg-transparent p-0 leading-relaxed outline-none placeholder:text-[var(--p-text-disabled)] ${className}`}
    />
  );
};

const BlockRow: React.FC<Props> = ({
  block,
  index,
  isDragging,
  isDropTarget,
  onChange,
  onConvert,
  onSplit,
  onRemove,
  onFocusSibling,
  onOpenSlash,
  onPickImage,
  registerRef,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  ordinal,
}) => {
  const spec = specFor(block);
  const text = block.data.text ?? '';

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;

    if (e.key === 'Enter' && !e.shiftKey && block.type !== 'code') {
      e.preventDefault();
      onSplit();
      return;
    }

    if (e.key === 'Backspace' && el.selectionStart === 0 && el.selectionEnd === 0) {
      if (text === '') {
        e.preventDefault();
        onRemove();
        return;
      }
      // Non-empty blocks first fall back to a plain paragraph, which is what
      // Notion does before it will delete anything.
      if (block.type !== 'paragraph') {
        e.preventDefault();
        onConvert('paragraph');
        return;
      }
    }

    if (e.key === 'ArrowUp' && el.selectionStart === 0) {
      e.preventDefault();
      onFocusSibling(-1);
    }
    if (e.key === 'ArrowDown' && el.selectionEnd === text.length) {
      e.preventDefault();
      onFocusSibling(1);
    }
  };

  const onTextChange = (value: string) => {
    // Markdown-style shortcuts convert the block, matching muscle memory.
    if (text === '' && value.length <= 4) {
      const match = BLOCK_SPECS.find((s) => s.shortcut && value === s.shortcut);
      if (match) {
        onConvert(match.type, match.level);
        return;
      }
    }
    if (value === '/' && text === '') {
      onOpenSlash(index);
    }
    onChange({ text: value });
  };

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`group relative flex gap-1 rounded-md px-1 py-0.5 ${
        isDragging ? 'opacity-40' : ''
      } ${isDropTarget ? 'border-t-2 border-[#303030]' : 'border-t-2 border-transparent'}`}
    >
      <div className="flex w-12 shrink-0 items-start justify-end gap-0.5 pt-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          aria-label="Tambah blok di bawah"
          onClick={() => onOpenSlash(index)}
          className="flex h-6 w-6 items-center justify-center rounded text-[var(--p-text-secondary)] hover:bg-[#f1f1f1]"
        >
          <i className="fa fa-plus text-xs" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Geser blok"
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className="flex h-6 w-5 cursor-grab items-center justify-center rounded text-[var(--p-text-secondary)] hover:bg-[#f1f1f1] active:cursor-grabbing"
        >
          <i className="fa fa-grip-vertical text-xs" aria-hidden="true" />
        </button>
      </div>

      <div className="min-w-0 flex-1 py-1">
        {block.type === 'divider' && <hr className="my-3 border-[var(--p-border)]" />}

        {block.type === 'image' && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={onPickImage}
              className="block w-full overflow-hidden rounded-lg border border-[var(--p-border)] text-left hover:border-[var(--p-border-strong)]"
            >
              <ImageWithFallback
                src={block.data.url ? imageURL(block.data.url) : ''}
                alt={block.data.alt ?? ''}
                className="h-48 w-full bg-[#fafafa] object-contain"
                iconClassName="text-2xl"
              />
            </button>
            <input
              className="p-field"
              placeholder="Keterangan gambar (opsional)"
              value={block.data.caption ?? ''}
              onChange={(e) => onChange({ caption: e.target.value })}
            />
          </div>
        )}

        {!spec.textless && (
          <div
            className={
              block.type === 'quote'
                ? 'border-l-2 border-[var(--p-border-strong)] pl-3'
                : block.type === 'callout'
                  ? 'flex gap-2 rounded-lg bg-[#f7f7f7] p-3'
                  : block.type === 'code'
                    ? 'rounded-lg bg-[#f7f7f7] p-3'
                    : block.type === 'bulleted_list_item' || block.type === 'numbered_list_item'
                      ? // the marker has to sit beside the field, not above it
                        'flex gap-2'
                      : ''
            }
          >
            {block.type === 'callout' && (
              <span className="select-none text-base leading-6">{block.data.icon ?? '💡'}</span>
            )}
            {block.type === 'bulleted_list_item' && (
              <span className="select-none leading-relaxed">•</span>
            )}
            {block.type === 'numbered_list_item' && (
              <span className="select-none leading-relaxed tabular-nums">{ordinal ?? 1}.</span>
            )}
            <AutoTextarea
              value={text}
              className={textClass(block)}
              placeholder={placeholder(block)}
              onChange={onTextChange}
              onKeyDown={onKeyDown}
              registerRef={registerRef}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockRow;
