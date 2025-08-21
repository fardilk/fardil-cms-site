import React, { useEffect, useRef, useState } from 'react';
import type { Align, ParagraphListItem } from './types';
import Toolbar from './Toolbar';
import { spansToHTML } from './utils';
import { rootToSpans } from './domParse';

export default function ListEditor({
  items,
  kind,
  align,
  style,
  onItemsChange,
  onAlign,
  onToggleList,
  onOpenLink,
  toolbarVisible = false,
}: {
  items: ParagraphListItem[];
  kind: 'ul' | 'ol';
  align: Align;
  style: React.CSSProperties;
  onItemsChange: (items: ParagraphListItem[]) => void;
  onAlign: (a: Align) => void;
  onToggleList: (k: 'none' | 'ul' | 'ol') => void;
  onOpenLink: () => void;
  toolbarVisible?: boolean;
}) {
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
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

  // When an item's spans change and it's not being edited, reflect in DOM
  useEffect(() => {
    items.forEach((it, i) => {
      if (editingIndex === i) return;
      const el = itemRefs.current[i];
      if (el) el.innerHTML = spansToHTML(it.spans);
    });
  }, [items, editingIndex]);

  // If toolbar is visible, keep an index active (default first item), but don't move caret
  useEffect(() => {
    if (!toolbarVisible) return;
    if (editingIndex === null) {
      setEditingIndex(0);
    }
  }, [toolbarVisible]);

  // Helpers to save/restore selection within current item
  const saveSelectionIfInside = () => {
    if (editingIndex === null) return;
    const el = itemRefs.current[editingIndex];
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (el.contains(range.startContainer) && el.contains(range.endContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  };
  const restoreSelectionIfSaved = () => {
    const sel = window.getSelection();
    if (!sel || !savedRangeRef.current) return;
    sel.removeAllRanges();
    sel.addRange(savedRangeRef.current);
  };

  // Ctrl+Shift+Click word selection helper
  const selectWordAtPoint = (clientX: number, clientY: number) => {
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
    const textNode = node.nodeType === Node.TEXT_NODE ? (node as Text) : (node.firstChild as Text | null);
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;
    const text = textNode.textContent || '';
    let idx = range.startOffset;
    idx = Math.max(0, Math.min(idx, text.length));
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
  const syncItem = (index: number, root?: HTMLElement | null) => {
    const el = root ?? itemRefs.current[index];
    if (!el) return;
    const sp = rootToSpans(el);
    const next = [...items];
    next[index] = { spans: sp };
    onItemsChange(next);
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
  // Immediately sync spans for the current item
  if (editingIndex !== null) setTimeout(() => syncItem(editingIndex!), 0);
  };

  const Wrapper = kind === 'ul' ? 'ul' : 'ol';
  const wrapperClass = kind === 'ul' ? 'list-disc' : 'list-decimal';

  return (
    <div className="group relative">
      <Toolbar
        list={kind}
        onExec={(cmd) => { exec(cmd); if (editingIndex !== null) setTimeout(() => syncItem(editingIndex!), 0); }}
        onAlign={(a) => { onAlign(a); if (editingIndex !== null) setTimeout(() => syncItem(editingIndex!), 0); }}
        onToggleList={(k) => { onToggleList(k); if (editingIndex !== null) setTimeout(() => syncItem(editingIndex!), 0); }}
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
  <div className="bg-gray-50 rounded-lg px-4 py-2 text-base border border-gray-200 outline-none" style={style}>
        <Wrapper className={`${wrapperClass} pl-6`}>
          {items.map((item, i) => (
            <li key={i}>
              <div
                key={`li-${i}-${editingIndex === i ? 'edit' : 'view'}`}
                ref={(el) => { itemRefs.current[i] = el; }}
                className="outline-none"
                contentEditable
                suppressContentEditableWarning
                onInput={() => { saveSelectionIfInside(); syncItem(i); }}
                onFocus={() => setEditingIndex(i)}
                onClick={(e) => {
                  if (e.ctrlKey && e.shiftKey) {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).focus();
                    setEditingIndex(i);
                    selectWordAtPoint(e.clientX, e.clientY);
                    return;
                  }
                  setEditingIndex(i);
                }}
                onMouseUp={() => saveSelectionIfInside()}
                onKeyUp={() => saveSelectionIfInside()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const next = [...items];
                    next.splice(i + 1, 0, { spans: [{ text: '' }] });
                    onItemsChange(next);
                    requestAnimationFrame(() => {
                      const el = itemRefs.current[i + 1];
                      el?.focus();
                      placeCaretAtEnd(el || null);
                    });
                  }
                }}
                onBlur={(e) => {
                  const sp = rootToSpans(e.currentTarget as HTMLElement);
                  const next = [...items];
                  next[i] = { spans: sp };
                  onItemsChange(next);
                  setTimeout(() => {
                    const anyFocused = itemRefs.current.some((el) => el === document.activeElement);
                    if (!anyFocused && !toolbarVisible) setEditingIndex(null);
                  }, 0);
                }}
                style={{ cursor: 'text' }}
              >
                {editingIndex === i ? null : (
                  <span dangerouslySetInnerHTML={{ __html: spansToHTML(item.spans) }} />
                )}
              </div>
            </li>
          ))}
        </Wrapper>
      </div>
    </div>
  );
}
