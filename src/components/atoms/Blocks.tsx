import React, { useState, useRef, useEffect } from 'react';
import type { Align, Transform, ListKind, RichSpan, ParagraphListItem } from './rich/types';
import ParagraphEditor from './rich/ParagraphEditor';
import ListEditor from './rich/ListEditor';
import { normalizeSpans } from './rich/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ContentImage } from '@/components/func/contentBlocks';

export const ToggleHeadingBlock = ({
  content,
  level = 1,
  onChange,
  onLevelChange,
  align = 'left',
  marks = [],
  editable = true,
  toolbarVisible = false,
}: {
  content: string;
  level?: number;
  onChange?: (val: string) => void;
  onLevelChange?: (lvl: number) => void;
  align?: 'left' | 'center' | 'right';
  marks?: Array<'bold' | 'italic' | 'underline' | 'strike' | 'link'>;
  editable?: boolean;
  toolbarVisible?: boolean;
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content);
  const [showToolbar, setShowToolbar] = useState(false);
  const lvl = Math.min(5, Math.max(1, level ?? 1)); // Only H1-H5
  const headingRef = useRef<HTMLElement | null>(null);

  const placeCaretAtEnd = () => {
    const el = headingRef.current;
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const text = e.currentTarget.textContent || '';
    setValue(text);
  if (!toolbarVisible) setEditing(false);
    onChange?.(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = (e.currentTarget as HTMLElement).textContent || '';
      setValue(text);
      setEditing(false);
      onChange?.(text);
      (e.currentTarget as HTMLElement).blur();
    }
  };

  const handleLevelChange = (newLevel: number) => {
    onLevelChange?.(newLevel);
    setShowToolbar(false);
  };

  const sizeClass = (
    lvl === 1 ? 'text-4xl md:text-5xl' :
      lvl === 2 ? 'text-3xl md:text-4xl' :
        lvl === 3 ? 'text-2xl md:text-3xl' :
          lvl === 4 ? 'text-xl md:text-2xl' :
            'text-lg'
  );

  const Tag: string = `h${lvl}`;

  return (
    <div className="my-2 relative group">
    {/* Explicit toolbar controlled by parent */}
  {editable && toolbarVisible && (
        <div className="absolute top-10 right-2 z-30 bg-white rounded shadow-lg border border-gray-200 p-2 flex flex-col gap-1">
          {[1, 2, 3, 4, 5].map(h => (
            <button
              key={h}
              className={`px-3 py-1 text-sm rounded hover:bg-gray-100 text-left ${lvl === h ? 'bg-blue-100 text-blue-600' : ''}`}
              onClick={() => handleLevelChange(h)}
            >
              H{h}
            </button>
          ))}
        </div>
      )}

  {React.createElement(
        Tag,
        editable
          ? {
              ref: (el: HTMLElement | null) => { headingRef.current = el; },
              className: `bg-gray-50 rounded-lg px-4 py-2 whitespace-pre-wrap transition-colors border border-gray-200 ${sizeClass}`,
              contentEditable: true,
              suppressContentEditableWarning: true,
              onBlur: handleBlur,
              onKeyDown: handleKeyDown,
      onFocus: () => { setEditing(true); },
      onClick: () => { setEditing(true); },
              tabIndex: 0,
              style: {
                textAlign: align,
                color: 'var(--text-primary)',
                cursor: 'text',
                caretColor: '#3b82f6',
                outline: 'none',
              },
            }
          : {
              className: `${sizeClass} my-2`,
              style: { textAlign: align, color: 'var(--text-primary)' },
            },
        value
      )}
  {editable && (!value || value.length === 0) && !editing && (
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 opacity-40 select-none" style={{ color: 'var(--text-primary)' }}>
          Heading
        </span>
      )}
    </div>
  );
};

export const ParagraphBlock = ({
  content,
  onChange,
}: {
  content: string;
  onChange?: (val: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content);

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || '';
    setValue(text);
    setEditing(false);
    onChange?.(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = e.currentTarget.textContent || '';
      setValue(text);
      setEditing(false);
      onChange?.(text);
      (e.currentTarget as HTMLDivElement).blur();
    }
  };
  return (
    <div
      className={`bg-gray-50 rounded-lg px-4 py-3 my-2 text-base transition-colors hover:border hover:border-blue-50 ${editing ? 'cursor-text' : 'cursor-grab'}`}
      contentEditable={editing}
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      onClick={() => setEditing(true)}
      style={{
        userSelect: 'text',
        cursor: 'text',
        color: 'var(--text-primary)',
        top: '-3em',
        minHeight: '32px'
      }}
    >
      {value}
    </div>
  );
};

export const Blockquote = ({ content, onChange }: { content: string; onChange?: (v: string) => void }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content);
  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const text = e.currentTarget.textContent || '';
    setValue(text);
    setEditing(false);
    onChange?.(text);
  };
  return (
    <blockquote
      className={`italic border-l-4 border-gray-300 pl-4 ml-2 text-gray-700 ${editing ? 'cursor-text' : 'cursor-grab'}`}
      contentEditable={editing}
      suppressContentEditableWarning
      onBlur={handleBlur}
      onClick={() => setEditing(true)}
      style={{ userSelect: editing ? 'text' : 'none' }}
    >
      {value}
    </blockquote>
  );
};

export const PullQuote = ({ content, onChange }: { content: string; onChange?: (v: string) => void }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content);
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || '';
    setValue(text);
    setEditing(false);
    onChange?.(text);
  };
  return (
    <div className="my-4">
      <div
        className={`italic text-xl font-semibold text-gray-800 bg-gray-50 rounded-md p-4 border-l-4 border-blue-300 ${editing ? 'cursor-text' : 'cursor-grab'}`}
        contentEditable={editing}
        suppressContentEditableWarning
        onBlur={handleBlur}
        onClick={() => setEditing(true)}
        style={{ userSelect: editing ? 'text' : 'none' }}
      >
        “{value}”
      </div>
    </div>
  );
};

// CodeBlock removed — replaced by rawhtml (Code Snippet) block

export const PreformattedBlock = ({ text }: { text: string }) => (
  <pre className="whitespace-pre my-3 p-3 font-mono text-sm bg-gray-50 rounded border border-gray-200">{text}</pre>
);

export const ImageUploader = ({
  mode = 'single',
  images = [],
  onChange,
  allowGallery = true,
}: {
  mode?: 'single' | 'gallery';
  images?: ContentImage[];
  onChange?: (imgs: ContentImage[], mode: 'single' | 'gallery') => void;
  allowGallery?: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [localImages, setLocalImages] = useState<ContentImage[]>(images);
  const [currentMode, setCurrentMode] = useState<'single' | 'gallery'>(mode);
  const effectiveMode: 'single' | 'gallery' = allowGallery ? currentMode : 'single';
  const maxSize = 2 * 1024 * 1024; // 2MB
  const accept = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];

  // Keep internal state in sync when parent updates images
  useEffect(() => {
    setLocalImages(images || []);
  }, [images]);

  const pick = () => inputRef.current?.click();
  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const selected: ContentImage[] = [];
    Array.from(files).forEach(f => {
      if (!accept.includes(f.type) || f.size > maxSize) return; // skip invalid
      const url = URL.createObjectURL(f);
      selected.push({ src: url, alt: f.name });
    });
    const next = effectiveMode === 'single' ? selected.slice(0, 1) : selected.slice(0, 3);
    setLocalImages(next);
    onChange?.(next, effectiveMode);
  };

  const onDropArea = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onFiles(e.dataTransfer.files);
  };

  const clearAt = (idx: number) => {
    setLocalImages(prev => {
      const copy = [...prev];
      copy.splice(idx, 1);
      onChange?.(copy, effectiveMode);
      return copy;
    });
  };

  return (
    <div className="my-3">
      <div className="flex items-center gap-2 mb-2">
        {allowGallery && (
          <select
            value={effectiveMode}
            onChange={(e) => { const m = e.target.value as 'single' | 'gallery'; setCurrentMode(m); onChange?.(localImages, m); }}
            className="border rounded px-2 py-1 text-xs"
          >
            <option value="single">Single image</option>
            <option value="gallery">Multiple images</option>
          </select>
        )}
        <button className="ml-auto px-3 py-1 text-xs border rounded hover:bg-gray-50" onClick={pick}>Upload image{allowGallery ? '(s)' : ''}</button>
      </div>
      <input ref={inputRef} type="file" multiple={allowGallery} onChange={(e) => onFiles(e.target.files)} accept="image/png,image/jpeg,image/jpg,image/gif" hidden />
      {effectiveMode === 'single' ? (
        <div className="border rounded p-3 min-h-[120px] flex items-center justify-center bg-gray-50" onDragOver={(e) => e.preventDefault()} onDrop={onDropArea}>
          {localImages[0] ? (
            <div className="relative">
              <img src={localImages[0].src} alt={localImages[0].alt} className="max-h-48 object-contain rounded" />
              <button className="absolute top-1 right-1 text-xs px-1 rounded bg-white/80 border" onClick={() => clearAt(0)}>×</button>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">Drop or upload an image</span>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2" onDragOver={(e) => e.preventDefault()} onDrop={onDropArea}>
          {[0, 1, 2].map(i => (
            <div key={i} className="relative border rounded p-2 min-h-[100px] flex items-center justify-center bg-gray-50">
              {localImages[i] ? (
                <>
                  <img src={localImages[i].src} alt={localImages[i].alt} className="max-h-32 object-contain rounded" />
                  <button className="absolute top-1 right-1 text-xs px-1 rounded bg-white/80 border" onClick={() => clearAt(i)}>×</button>
                </>
              ) : (
                <span className="text-gray-300 text-xs">Empty</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const VideoBlock = ({
  url,
  videoSrc,
  mode = 'embed',
  onChange,
}: {
  url?: string;
  videoSrc?: string;
  mode?: 'embed' | 'upload';
  onChange?: (data: { url?: string; videoSrc?: string; mode: 'embed' | 'upload' }) => void;
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pick = () => inputRef.current?.click();
  const onFile = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    const src = URL.createObjectURL(file);
    onChange?.({ videoSrc: src, url: undefined, mode: 'upload' });
  };
  return (
    <div className="my-3">
      <div className="flex items-center gap-2 mb-2">
        <select
          value={mode}
          onChange={(e) => onChange?.({ url, videoSrc, mode: e.target.value as 'embed' | 'upload' })}
          className="border rounded px-2 py-1 text-xs"
        >
          <option value="embed">Embed URL</option>
          <option value="upload">Upload</option>
        </select>
        {mode === 'embed' ? (
          <input
            value={url || ''}
            onChange={(e) => onChange?.({ url: e.target.value, videoSrc, mode: 'embed' })}
            placeholder="https://www.youtube.com/embed/..."
            className="flex-1 border rounded px-2 py-1 text-xs"
          />
        ) : (
          <button className="px-3 py-1 text-xs border rounded hover:bg-gray-50" onClick={pick}>Choose video</button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="video/*" hidden onChange={(e) => onFile(e.target.files)} />
      {mode === 'embed' && url ? (
        <div className="aspect-video w-full bg-black/5 rounded flex items-center justify-center">
          <iframe className="w-full h-full rounded" src={url} title="Embedded video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      ) : null}
      {mode === 'upload' && videoSrc ? (
        <video controls className="w-full rounded bg-black/5">
          <source src={videoSrc} />
        </video>
      ) : null}
      {!url && !videoSrc ? (
        <div className="p-4 border rounded text-sm text-gray-500">Video placeholder</div>
      ) : null}
    </div>
  );
};

export const TableBlock = ({ rows = 3, cols = 3, onChange }: { rows?: number; cols?: number; onChange?: (cells: string[][]) => void }) => {
  const [data, setData] = useState<string[][]>(Array.from({ length: rows }, () => Array.from({ length: cols }, () => '')));
  const setCell = (r: number, c: number, val: string) => {
    setData(prev => {
      const next = prev.map((row, ri) => row.map((cell, ci) => ri === r && ci === c ? val : cell));
      onChange?.(next);
      return next;
    });
  };
  return (
    <div className="my-3 overflow-auto">
      <table className="min-w-full border-collapse">
        <tbody>
          {data.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} className="border border-gray-300 p-2">
                  <input value={cell} onChange={(e) => setCell(r, c, e.target.value)} className="w-full outline-none text-sm" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const DividerBlock = () => (
  <div className="my-4 flex justify-center">
    <div className="w-2/3 h-0.5 bg-gray-300 rounded transition-colors hover:border hover:border-blue-50"></div>
  </div>
);

// Extend props to allow align/list updates from parent
type ParagraphRichProps = {
  spans: RichSpan[];
  align?: Align;
  transform?: Transform;
  list?: ListKind;
  items?: ParagraphListItem[];
  onChange?: (spans: RichSpan[]) => void;
  onItemsChange?: (items: ParagraphListItem[]) => void;
  onAlignChange?: (align: Align) => void;
  onListChange?: (list: ListKind) => void;
  toolbarVisible?: boolean;
};

const ParagraphRichBase: React.FC<ParagraphRichProps> = ({ spans, items, align = 'left', transform = 'none', list = 'none', onChange, onItemsChange, onAlignChange, onListChange, toolbarVisible = false }) => {
  const style: React.CSSProperties = {
    textAlign: align,
    textTransform: transform === 'uppercase' || transform === 'lowercase' || transform === 'capitalize' ? transform : 'none',
    cursor: 'text',
    color: 'var(--text-primary)'
  };

  const handleToggleList = (k: ListKind) => {
    if (!onListChange) return;
    if (k === list) return;
    if (k === 'none') {
      onListChange('none');
    } else {
      onListChange(k);
      if ((!items || items.length === 0) && spans) {
        onItemsChange?.([{ spans: normalizeSpans(spans) }]);
      }
    }
  };

  return list === 'none' ? (
    <ParagraphEditor
      value={spans}
      align={align}
      style={style}
  toolbarVisible={toolbarVisible}
      onChange={(sp) => onChange?.(sp)}
      onAlign={(a) => onAlignChange?.(a)}
      onToggleList={(k) => handleToggleList(k)}
      onOpenLink={() => { /* handled inside editor */ }}
    />
  ) : (
    <ListEditor
      items={items && items.length ? items : [{ spans: normalizeSpans(spans || [{ text: '' }]) }]}
      kind={list === 'ul' ? 'ul' : 'ol'}
      align={align}
      style={style}
  toolbarVisible={toolbarVisible}
      onItemsChange={(it) => onItemsChange?.(it)}
      onAlign={(a) => onAlignChange?.(a)}
      onToggleList={(k) => handleToggleList(k)}
      onOpenLink={() => { /* handled inside editor */ }}
    />
  );
};

export const ParagraphRich = React.memo(ParagraphRichBase);
