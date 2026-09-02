import React from 'react';
import BlockRow from './BlockRow';
import { BLOCK_SPECS, makeBlock } from '@/lib/blocks';
import type { Block, BlockType } from '@/lib/blocks';

type Props = {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  /** Opens the media library and resolves to a stored path, or null. */
  pickImage: () => Promise<string | null>;
};

/**
 * Block editor for articles.
 *
 * The writing flow is the point: Enter makes the next block, Backspace at the
 * start of an empty one removes it, arrows move between blocks, "/" opens the
 * type menu, and markdown prefixes convert as you type. Blocks are reordered by
 * dragging their handle.
 */
const BlockEditor: React.FC<Props> = ({ blocks, onChange, pickImage }) => {
  const refs = React.useRef(new Map<string, HTMLTextAreaElement>());
  const [slashFor, setSlashFor] = React.useState<number | null>(null);
  const [slashQuery, setSlashQuery] = React.useState('');
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [overIndex, setOverIndex] = React.useState<number | null>(null);
  // Set when an action should move the caret once React has rendered.
  const focusKey = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!focusKey.current) return;
    const el = refs.current.get(focusKey.current);
    focusKey.current = null;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  });

  const replace = (next: Block[]) => onChange(next.length ? next : [makeBlock()]);

  const updateAt = (index: number, patch: Partial<Block['data']>) =>
    replace(blocks.map((b, i) => (i === index ? { ...b, data: { ...b.data, ...patch } } : b)));

  const convertAt = (index: number, type: BlockType, level?: 2 | 3) => {
    const target = blocks[index];
    const next = blocks.map((b, i) =>
      i === index
        ? {
            ...b,
            type,
            // Text carries over so converting mid-sentence never loses words.
            data: { ...b.data, text: b.data.text ?? '', ...(level ? { level } : {}) },
          }
        : b,
    );
    focusKey.current = target.key;
    replace(next);
  };

  const insertAfter = (index: number, block: Block) => {
    const next = [...blocks];
    next.splice(index + 1, 0, block);
    focusKey.current = block.key;
    replace(next);
  };

  const splitAt = (index: number) => {
    const current = blocks[index];
    // Continuing a list keeps the list going, which is what a writer expects.
    const continues =
      current.type === 'bulleted_list_item' || current.type === 'numbered_list_item';
    insertAfter(index, makeBlock(continues ? current.type : 'paragraph'));
  };

  const removeAt = (index: number) => {
    if (blocks.length === 1) return;
    const previous = blocks[index - 1];
    const next = blocks.filter((_, i) => i !== index);
    if (previous) focusKey.current = previous.key;
    replace(next);
  };

  const focusSibling = (index: number, delta: number) => {
    const target = blocks[index + delta];
    if (!target) return;
    const el = refs.current.get(target.key);
    el?.focus();
  };

  const openSlash = (index: number) => {
    setSlashQuery('');
    setSlashFor(index);
  };

  const applySlash = async (spec: (typeof BLOCK_SPECS)[number], index: number) => {
    setSlashFor(null);
    const current = blocks[index];
    const isEmpty = !current.data.text?.trim() || current.data.text === '/';

    if (spec.type === 'image') {
      const url = await pickImage();
      if (!url) return;
      const block = makeBlock('image', { url });
      if (isEmpty) replace(blocks.map((b, i) => (i === index ? block : b)));
      else insertAfter(index, block);
      return;
    }

    if (isEmpty) {
      // The "/" the writer typed must not survive the conversion.
      const next = blocks.map((b, i) =>
        i === index
          ? { ...b, type: spec.type, data: { text: '', ...(spec.level ? { level: spec.level } : {}) } }
          : b,
      );
      focusKey.current = current.key;
      replace(next);
    } else {
      insertAfter(index, makeBlock(spec.type, spec.level ? { level: spec.level } : {}));
    }
  };

  const moveBlock = (from: number, to: number) => {
    if (from === to || to < 0 || to >= blocks.length) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    replace(next);
  };

  const matches = BLOCK_SPECS.filter((s) =>
    slashQuery.trim() === ''
      ? true
      : `${s.label} ${s.hint}`.toLowerCase().includes(slashQuery.toLowerCase()),
  );

  // Numbering restarts whenever a run of numbered items is interrupted.
  let run = 0;
  const ordinals = blocks.map((b) => {
    if (b.type !== 'numbered_list_item') {
      run = 0;
      return undefined;
    }
    run += 1;
    return run;
  });

  return (
    <div className="relative">
      {blocks.map((block, index) => (
        <BlockRow
          key={block.key}
          block={block}
          index={index}
          ordinal={ordinals[index]}
          isDragging={dragIndex === index}
          isDropTarget={overIndex === index && dragIndex !== null && dragIndex !== index}
          registerRef={(el) => {
            if (el) refs.current.set(block.key, el);
            else refs.current.delete(block.key);
          }}
          onChange={(patch) => updateAt(index, patch)}
          onConvert={(type, level) => convertAt(index, type, level)}
          onSplit={() => splitAt(index)}
          onRemove={() => removeAt(index)}
          onFocusSibling={(delta) => focusSibling(index, delta)}
          onOpenSlash={openSlash}
          onPickImage={async () => {
            const url = await pickImage();
            if (url) updateAt(index, { url });
          }}
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => {
            e.preventDefault();
            setOverIndex(index);
          }}
          onDrop={() => {
            if (dragIndex !== null) moveBlock(dragIndex, index);
            setDragIndex(null);
            setOverIndex(null);
          }}
          onDragEnd={() => {
            setDragIndex(null);
            setOverIndex(null);
          }}
        />
      ))}

      <div className="pt-2 pl-[3.25rem]">
        <button
          type="button"
          onClick={() => insertAfter(blocks.length - 1, makeBlock())}
          className="ml-1 flex items-center gap-2 rounded-md px-2 py-1 text-[0.8125rem] text-[var(--p-text-secondary)] hover:bg-[#f1f1f1]"
        >
          <i className="fa fa-plus text-xs" aria-hidden="true" />
          Tambah blok
        </button>
      </div>

      {slashFor !== null && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/20 p-4 pt-24">
          <div className="w-full max-w-sm overflow-hidden rounded-xl border border-[var(--p-border)] bg-white shadow-lg">
            <input
              autoFocus
              className="w-full border-b border-[var(--p-border)] px-3 py-2 text-[0.8125rem] outline-none"
              placeholder="Cari jenis blok…"
              value={slashQuery}
              onChange={(e) => setSlashQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSlashFor(null);
                if (e.key === 'Enter' && matches[0]) {
                  e.preventDefault();
                  void applySlash(matches[0], slashFor);
                }
              }}
            />
            <ul className="max-h-72 overflow-y-auto py-1">
              {matches.map((spec) => (
                <li key={`${spec.type}-${spec.level ?? ''}`}>
                  <button
                    type="button"
                    onClick={() => void applySlash(spec, slashFor)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#f1f1f1]"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded border border-[var(--p-border)] text-xs text-[var(--p-text-secondary)]">
                      <i className={`fa ${spec.icon}`} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.8125rem] text-[var(--p-text)]">{spec.label}</span>
                      <span className="block truncate text-xs text-[var(--p-text-secondary)]">
                        {spec.hint}
                      </span>
                    </span>
                    {spec.shortcut && (
                      <span className="ml-auto rounded bg-[#f1f1f1] px-1.5 py-0.5 font-mono text-[11px] text-[var(--p-text-secondary)]">
                        {spec.shortcut.trim()}
                      </span>
                    )}
                  </button>
                </li>
              ))}
              {matches.length === 0 && (
                <li className="px-3 py-6 text-center text-[0.8125rem] text-[var(--p-text-secondary)]">
                  Tidak ada yang cocok
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockEditor;
