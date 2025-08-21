import React, { useEffect, useRef, useState } from 'react';
import type { Align, RichSpan } from './types';
import Toolbar from './Toolbar';
import { spansToHTML } from './utils';
import { rootToSpans } from './domParse';

export default function ParagraphEditor({
  value,
  align,
  style,
  onChange,
  onAlign,
  onToggleList,
  onOpenLink,
  toolbarVisible = false,
}: {
  value: RichSpan[];
  align: Align;
  style: React.CSSProperties;
  onChange: (sp: RichSpan[]) => void;
  onAlign: (a: Align) => void;
  onToggleList: (k: 'none' | 'ul' | 'ol') => void;
  onOpenLink: () => void;
  toolbarVisible?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInput, setLinkInput] = useState('https://');
  const [linkNewTab, setLinkNewTab] = useState(false);
  const savedRangeRef = useRef<Range | null>(null);

  const placeCaretAtEnd = (el: HTMLElement | null) => {
    if (!el) return;
    const sel = window.getSelection();
    if (!sel) return;
    const r = document.createRange();
    r.selectNodeContents(el);
    r.collapse(false);
    sel.removeAllRanges();
    sel.addRange(r);
  };

  // When value changes and we're not actively editing, reflect it in the DOM
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isEditing) return; // avoid clobbering user typing cursor
    el.innerHTML = spansToHTML(value);
  }, [value, isEditing]);

  // Force editing when toolbar is visible (don't move cursor)
  useEffect(() => {
    if (toolbarVisible) {
      setIsEditing(true);
    }
  }, [toolbarVisible]);

  // Helpers to save/restore selection within this editor
  const saveSelectionIfInside = () => {
    const el = ref.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    // ensure the selection is within our editor root
    const contains = el.contains(range.startContainer) && el.contains(range.endContainer);
    if (contains) {
      savedRangeRef.current = range.cloneRange();
    }
  };
  const restoreSelectionIfSaved = () => {
    const el = ref.current;
    const sel = window.getSelection();
    if (!el || !sel || !savedRangeRef.current) return;
    sel.removeAllRanges();
    sel.addRange(savedRangeRef.current);
  };

  // Ctrl+Shift+Click to select the word at pointer
  const selectWordAtPoint = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const doc: any = document as any;
    const range: Range | null =
      typeof (doc.caretRangeFromPoint) === 'function'
        ? doc.caretRangeFromPoint(clientX, clientY)
        : (() => {
            const pos = (doc as any).caretPositionFromPoint?.(clientX, clientY);
            if (pos && pos.offsetNode) {
              const r = document.createRange();
              r.setStart(pos.offsetNode, pos.offset);
              r.collapse(true);
              return r;
            }
            return null;
          })();
    if (!range) return;
    const node = range.startContainer;
    // Prefer text nodes; if element, try its first text child
    const textNode = node.nodeType === Node.TEXT_NODE ? (node as Text) : (node.firstChild as Text | null);
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;
    const text = textNode.textContent || '';
    let idx = range.startOffset;
    idx = Math.max(0, Math.min(idx, text.length));
    // expand to non-space boundaries
    let start = idx;
    while (start > 0 && /[^\s]/.test(text[start - 1])) start--;
    let end = idx;
    while (end < text.length && /[^\s]/.test(text[end])) end++;
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    const r = document.createRange();
    r.setStart(textNode, start);
    r.setEnd(textNode, end);
    sel.addRange(r);
    savedRangeRef.current = r.cloneRange();
  };

  const exec = (cmd: 'bold' | 'italic' | 'underline' | 'strikeThrough') => {
    restoreSelectionIfSaved();
    document.execCommand(cmd);
  };
  const syncNow = () => {
    const root = ref.current as HTMLElement | null;
    if (!root) return;
    const sp = rootToSpans(root);
    onChange(sp);
  };
  const openLinkPopover = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    } else {
      savedRangeRef.current = null;
    }
    setLinkInput('https://');
    setLinkNewTab(false);
    setShowLinkInput(true);
  };
  const applyLink = () => {
    const url = linkInput.trim();
    if (!url) {
      setShowLinkInput(false);
      return;
    }
    const sel = window.getSelection();
    sel?.removeAllRanges();
    if (savedRangeRef.current) sel?.addRange(savedRangeRef.current);
  restoreSelectionIfSaved();
  document.execCommand('createLink', false, url);
    if (linkNewTab) {
      const range = sel?.getRangeAt(0);
      const container =
        range?.commonAncestorContainer && (range.commonAncestorContainer as HTMLElement).nodeType === 1
          ? (range!.commonAncestorContainer as HTMLElement)
          : (range?.commonAncestorContainer.parentElement as HTMLElement | null);
      const anchors = container?.querySelectorAll('a[href]') || [];
      const last = anchors[anchors.length - 1] as HTMLAnchorElement | undefined;
      if (last) {
        last.setAttribute('target', '_blank');
        last.setAttribute('rel', 'noopener noreferrer');
      }
    }
    setShowLinkInput(false);
  // Immediately sync spans after applying link
  setTimeout(syncNow, 0);
  };

  return (
    <div className="group relative">
      <Toolbar
        list="none"
        onExec={(cmd) => { exec(cmd); setTimeout(syncNow, 0); }}
        onAlign={(a) => { onAlign(a); setTimeout(syncNow, 0); }}
        onToggleList={(k) => { onToggleList(k); setTimeout(syncNow, 0); }}
        onOpenLink={openLinkPopover}
        visible={toolbarVisible}
      />
      {showLinkInput && (
        <div className="absolute top-12 right-2 bg-white border rounded shadow p-2 flex items-center gap-2 z-30">
          <input className="border rounded px-2 py-1 text-xs w-48" value={linkInput} onChange={(e)=>setLinkInput(e.target.value)} placeholder="https://" autoFocus />
          <label className="text-xs flex items-center gap-1">
            <input type="checkbox" checked={linkNewTab} onChange={(e)=>setLinkNewTab(e.target.checked)} />
            New tab
          </label>
          <button className="px-2 py-1 text-xs rounded bg-blue-600 text-white" onClick={applyLink}>Apply</button>
          <button className="px-2 py-1 text-xs rounded bg-gray-500 text-white" onClick={()=>setShowLinkInput(false)}>Cancel</button>
        </div>
      )}
      <div
        ref={ref}
  className="bg-gray-50 rounded-lg px-4 py-2 text-base whitespace-pre-wrap border border-gray-200 outline-none"
        contentEditable
        suppressContentEditableWarning
        onInput={() => { saveSelectionIfInside(); syncNow(); }}
        onFocus={() => setIsEditing(true)}
        onClick={(e) => {
          // Ctrl+Shift+Click selects word under cursor
          if (e.ctrlKey && e.shiftKey) {
            e.preventDefault();
            (e.currentTarget as HTMLElement).focus();
            selectWordAtPoint(e.clientX, e.clientY);
            return;
          }
          setIsEditing(true);
        }}
        onMouseUp={() => saveSelectionIfInside()}
        onKeyUp={() => saveSelectionIfInside()}
        onBlur={(e) => {
          const sp = rootToSpans(e.currentTarget as HTMLElement);
          onChange(sp);
          if (!toolbarVisible) setIsEditing(false);
        }}
        style={style}
      />
    </div>
  );
}
