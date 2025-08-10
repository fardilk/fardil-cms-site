import React, { useState, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ContentImage } from '@/components/func/contentBlocks';

export const ToggleHeadingBlock = ({
  content,
  level = 1,
  onChange,
  align = 'left',
}: {
  content: string;
  level?: number;
  onChange?: (val: string) => void;
  align?: 'left'|'center'|'right';
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content);
  const lvl = Math.min(6, Math.max(1, level ?? 1));

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const text = e.currentTarget.textContent || '';
    setValue(text);
    setEditing(false);
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

  const sizeClass = (
    lvl === 1 ? 'text-4xl md:text-5xl' :
    lvl === 2 ? 'text-3xl md:text-4xl' :
    lvl === 3 ? 'text-2xl md:text-3xl' :
    lvl === 4 ? 'text-xl md:text-2xl' :
    lvl === 5 ? 'text-lg' :
    'text-base'
  );

  const Tag: string = `h${lvl}`;

  return (
    <div className="my-2 relative">
      {React.createElement(
        Tag,
        {
          className: `rounded-lg px-4 py-2 font-bold ${sizeClass} transition-colors hover:border hover:border-blue-50`,
          contentEditable: editing,
          suppressContentEditableWarning: true,
          onBlur: handleBlur,
          onKeyDown: handleKeyDown,
          tabIndex: 0,
          onClick: () => setEditing(true),
          style: { userSelect: editing ? 'text' : 'none', cursor: editing ? 'text' : 'grab', textAlign: align, color: 'var(--text-primary)' },
        },
        value
      )}
      {(!value || value.length === 0) && (
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
      e.currentTarget.blur();
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
      style={{ userSelect: editing ? 'text' : 'none' }}
    >
      {value}
    </div>
  );
};

export const Blockquote = ({ content, onChange }: { content: string; onChange?: (v:string)=>void }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content);
  const handleBlur = (e: React.FocusEvent<HTMLQuoteElement>) => {
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

export const PullQuote = ({ content, onChange }: { content: string; onChange?: (v:string)=>void }) => {
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

export const CodeBlock = ({ code, onChange }: { code: string; onChange?: (code:string)=>void }) => {
  const [value, setValue] = useState(code);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); } catch { /* noop */ }
  };
  return (
    <div className="my-3 rounded-md border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 flex justify-between items-center">
        <span className="text-xs text-gray-500">Code</span>
        <button className="text-xs px-2 py-1 border rounded hover:bg-gray-100" onClick={copy}>Copy</button>
      </div>
      <div className="grid grid-cols-2 gap-0">
        <textarea
          value={value}
          onChange={(e)=>{ setValue(e.target.value); onChange?.(e.target.value); }}
          className="p-3 font-mono text-sm outline-none resize-y min-h-[120px]"
          placeholder="Write code..."
        />
        <div className="p-3 overflow-auto bg-white">
          <SyntaxHighlighter language="javascript" style={oneLight} customStyle={{ margin: 0 }}>
            {value}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
};

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
  onChange?: (imgs: ContentImage[], mode: 'single'|'gallery') => void;
  allowGallery?: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [localImages, setLocalImages] = useState<ContentImage[]>(images);
  const [currentMode, setCurrentMode] = useState<'single'|'gallery'>(mode);
  const effectiveMode: 'single'|'gallery' = allowGallery ? currentMode : 'single';
  const maxSize = 2 * 1024 * 1024; // 2MB
  const accept = ['image/png','image/jpeg','image/jpg','image/gif'];

  const pick = () => inputRef.current?.click();
  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const selected: ContentImage[] = [];
    Array.from(files).forEach(f => {
      if (!accept.includes(f.type) || f.size > maxSize) return; // skip invalid
      const url = URL.createObjectURL(f);
      selected.push({ src: url, alt: f.name });
    });
    const next = effectiveMode === 'single' ? selected.slice(0,1) : selected.slice(0,3);
    setLocalImages(next);
    onChange?.(next, effectiveMode);
  };

  const onDropArea = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onFiles(e.dataTransfer.files);
  };

  const clearAt = (idx:number) => {
    setLocalImages(prev => {
      const copy = [...prev];
      copy.splice(idx,1);
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
            onChange={(e)=>{ const m = e.target.value as 'single'|'gallery'; setCurrentMode(m); onChange?.(localImages, m); }}
            className="border rounded px-2 py-1 text-xs"
          >
            <option value="single">Single image</option>
            <option value="gallery">Multiple images</option>
          </select>
        )}
        <button className="ml-auto px-3 py-1 text-xs border rounded hover:bg-gray-50" onClick={pick}>Upload image{allowGallery ? '(s)' : ''}</button>
      </div>
      <input ref={inputRef} type="file" multiple={allowGallery} onChange={(e)=>onFiles(e.target.files)} accept="image/png,image/jpeg,image/jpg,image/gif" hidden />
      {effectiveMode === 'single' ? (
        <div className="border rounded p-3 min-h-[120px] flex items-center justify-center bg-gray-50" onDragOver={(e)=>e.preventDefault()} onDrop={onDropArea}>
          {localImages[0] ? (
            <div className="relative">
              <img src={localImages[0].src} alt={localImages[0].alt} className="max-h-48 object-contain rounded" />
              <button className="absolute top-1 right-1 text-xs px-1 rounded bg-white/80 border" onClick={()=>clearAt(0)}>×</button>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">Drop or upload an image</span>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2" onDragOver={(e)=>e.preventDefault()} onDrop={onDropArea}>
          {[0,1,2].map(i => (
            <div key={i} className="relative border rounded p-2 min-h-[100px] flex items-center justify-center bg-gray-50">
              {localImages[i] ? (
                <>
                  <img src={localImages[i].src} alt={localImages[i].alt} className="max-h-32 object-contain rounded" />
                  <button className="absolute top-1 right-1 text-xs px-1 rounded bg-white/80 border" onClick={()=>clearAt(i)}>×</button>
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
  mode?: 'embed'|'upload';
  onChange?: (data: { url?: string; videoSrc?: string; mode: 'embed'|'upload' }) => void;
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
          onChange={(e)=> onChange?.({ url, videoSrc, mode: e.target.value as 'embed'|'upload' })}
          className="border rounded px-2 py-1 text-xs"
        >
          <option value="embed">Embed URL</option>
          <option value="upload">Upload</option>
        </select>
        {mode === 'embed' ? (
          <input
            value={url || ''}
            onChange={(e)=> onChange?.({ url: e.target.value, videoSrc, mode: 'embed' })}
            placeholder="https://www.youtube.com/embed/..."
            className="flex-1 border rounded px-2 py-1 text-xs"
          />
        ) : (
          <button className="px-3 py-1 text-xs border rounded hover:bg-gray-50" onClick={pick}>Choose video</button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="video/*" hidden onChange={(e)=>onFile(e.target.files)} />
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

export const TableBlock = ({ rows = 3, cols = 3, onChange }: { rows?: number; cols?: number; onChange?: (cells: string[][])=>void }) => {
  const [data, setData] = useState<string[][]>(Array.from({ length: rows }, () => Array.from({ length: cols }, () => '')));
  const setCell = (r:number,c:number,val:string)=>{
    setData(prev => {
      const next = prev.map((row,ri)=> row.map((cell,ci)=> ri===r && ci===c ? val : cell));
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
                  <input value={cell} onChange={(e)=>setCell(r,c,e.target.value)} className="w-full outline-none text-sm" />
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

type SpanMark = 'bold'|'italic'|'underline'|'strike'|'link';

type ParagraphRichProps = {
  spans: { text: string; marks?: SpanMark[]; href?: string }[];
  align?: 'left'|'center'|'right'|'justify';
  transform?: 'none'|'uppercase'|'lowercase'|'capitalize';
  onChange?: (spans: { text: string; marks?: SpanMark[]; href?: string }[]) => void;
};

export const ParagraphRich: React.FC<ParagraphRichProps> = ({ spans, align='left', transform='none', onChange }) => {
  const [local, setLocal] = useState(spans.length ? spans : [{ text: '' }]);
  const [linkIndex, setLinkIndex] = useState<number|null>(null);
  const [linkValue, setLinkValue] = useState('');

  const toggleMark = (mark: SpanMark) => {
    // naive: toggle on the last span
    setLocal(prev => {
      const next = [...prev];
      const i = next.length - 1;
      const m = new Set(next[i].marks || []);
      if (m.has(mark)) m.delete(mark); else m.add(mark);
      next[i].marks = Array.from(m);
      if (mark !== 'link') next[i].href = undefined;
      onChange?.(next);
      return next;
    });
  };

  const openLink = () => { setLinkIndex(local.length - 1); setLinkValue(''); };
  const applyLink = () => {
    if (linkIndex == null) return;
    setLocal(prev => {
      const next = [...prev];
      const m = new Set(next[linkIndex].marks || []);
      m.add('link');
      next[linkIndex].marks = Array.from(m);
      next[linkIndex].href = linkValue;
      onChange?.(next);
      return next;
    });
    setLinkIndex(null);
  };

  const onInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || '';
    const lastMarks = local[local.length - 1]?.marks;
    const lastHref = local[local.length - 1]?.href;
    const updated = [{ text, marks: lastMarks, href: lastHref }];
    setLocal(updated);
    onChange?.(updated);
  };

  const style: React.CSSProperties = {
    textAlign: align,
    textTransform: transform === 'uppercase' || transform === 'lowercase' || transform === 'capitalize' ? transform : 'none',
  };

  const renderHTML = () => {
    const getTag = (marks?: SpanMark[], href?: string) => {
      const text = (local[0]?.text || '');
      let el: React.ReactNode = text;
      if (marks?.includes('bold')) el = <strong>{el}</strong>;
      if (marks?.includes('italic')) el = <em>{el}</em>;
      if (marks?.includes('underline')) el = <u>{el}</u>;
      if (marks?.includes('strike')) el = <s>{el}</s>;
      if (marks?.includes('link') && href) el = <a href={href} className="text-blue-600 underline" target="_blank" rel="noreferrer">{el}</a>;
      return el;
    };
    return getTag(local[0]?.marks, local[0]?.href);
  };

  return (
    <div className="my-2">
      <div className="flex gap-2 items-center opacity-0 hover:opacity-100 transition-opacity mb-1">
        <button className="text-xs border rounded px-2 py-1" onClick={()=>toggleMark('bold')}>B</button>
        <button className="text-xs border rounded px-2 py-1" onClick={()=>toggleMark('italic')}>I</button>
        <button className="text-xs border rounded px-2 py-1" onClick={()=>toggleMark('underline')}>U</button>
        <button className="text-xs border rounded px-2 py-1" onClick={()=>toggleMark('strike')}>S</button>
        <button className="text-xs border rounded px-2 py-1" onClick={openLink}>Link</button>
        {linkIndex!=null && (
          <span className="ml-2 flex items-center gap-1">
            <input value={linkValue} onChange={(e)=>setLinkValue(e.target.value)} placeholder="https://" className="border rounded px-2 py-1 text-xs" />
            <button className="text-xs border rounded px-2 py-1" onClick={applyLink}>Apply</button>
          </span>
        )}
      </div>
      <div
        className={`bg-gray-50 rounded-lg px-4 py-3 text-base transition-colors hover:border hover:border-blue-50`}
        contentEditable
        suppressContentEditableWarning
        onInput={onInput}
        style={style}
      >
        {renderHTML()}
      </div>
    </div>
  );
};

export default {
  ToggleHeadingBlock,
  ParagraphBlock,
  Blockquote,
  PullQuote,
  CodeBlock,
  PreformattedBlock,
  ImageUploader,
  VideoBlock,
  TableBlock,
  DividerBlock,
  ParagraphRich,
};
