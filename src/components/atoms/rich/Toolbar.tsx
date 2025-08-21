import React from 'react';
import type { Align, ListKind } from './types';

export default function Toolbar({
  list,
  onExec,
  onAlign,
  onToggleList,
  onOpenLink,
  visible = false,
}: {
  list: ListKind;
  onExec: (cmd: 'bold' | 'italic' | 'underline' | 'strikeThrough') => void;
  onAlign: (a: Align) => void;
  onToggleList: (k: ListKind) => void;
  onOpenLink: () => void;
  visible?: boolean;
}) {
  return (
    <div className={`absolute top-2 right-2 z-20 transition-opacity ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'} `}>
      <div className="flex items-center gap-1 bg-white border rounded-md shadow px-1 py-1">
        <button className="w-7 h-7 grid place-items-center rounded hover:bg-gray-100 font-bold" title="Bold" onMouseDown={(e)=>e.preventDefault()} onClick={() => onExec('bold')}>B</button>
        <button className="w-7 h-7 grid place-items-center rounded hover:bg-gray-100 italic" title="Italic" onMouseDown={(e)=>e.preventDefault()} onClick={() => onExec('italic')}>I</button>
        <button className="w-7 h-7 grid place-items-center rounded hover:bg-gray-100 underline" title="Underline" onMouseDown={(e)=>e.preventDefault()} onClick={() => onExec('underline')}>U</button>
        <button className="w-7 h-7 grid place-items-center rounded hover:bg-gray-100 line-through" title="Strikethrough" onMouseDown={(e)=>e.preventDefault()} onClick={() => onExec('strikeThrough')}>S</button>
        <button className="w-7 h-7 grid place-items-center rounded hover:bg-gray-100" title="Link" onMouseDown={(e)=>e.preventDefault()} onClick={onOpenLink}>↗</button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <button className="w-7 h-7 grid place-items-center rounded hover:bg-gray-100" title="Align left" onMouseDown={(e)=>e.preventDefault()} onClick={() => onAlign('left')}>L</button>
        <button className="w-7 h-7 grid place-items-center rounded hover:bg-gray-100" title="Align center" onMouseDown={(e)=>e.preventDefault()} onClick={() => onAlign('center')}>C</button>
        <button className="w-7 h-7 grid place-items-center rounded hover:bg-gray-100" title="Align right" onMouseDown={(e)=>e.preventDefault()} onClick={() => onAlign('right')}>R</button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <button className={`w-7 h-7 grid place-items-center rounded hover:bg-gray-100 ${list === 'ul' ? 'bg-blue-100 text-blue-700' : ''}`} title="Bullet list" onMouseDown={(e)=>e.preventDefault()} onClick={() => onToggleList('ul')}>•</button>
        <button className={`w-7 h-7 grid place-items-center rounded hover:bg-gray-100 ${list === 'ol' ? 'bg-blue-100 text-blue-700' : ''}`} title="Numbered list" onMouseDown={(e)=>e.preventDefault()} onClick={() => onToggleList('ol')}>1.</button>
      </div>
    </div>
  );
}
