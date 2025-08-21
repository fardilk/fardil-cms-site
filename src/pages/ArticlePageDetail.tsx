import React from 'react';
import { toast } from 'react-hot-toast';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/GlobalLayout';
import { useEffect, useState, useRef } from 'react';
import { Article } from '@/hooks/useArticle';
import { ToggleHeadingBlock, Blockquote, PullQuote, ImageUploader, VideoBlock, TableBlock, DividerBlock, ParagraphRich } from '@/components/atoms/Blocks';
import { normalizeSpans, spansToHTML } from '@/components/atoms/rich/utils';
import { blocksToHTML, htmlToBlocks } from '@/components/atoms/rich/htmlConvert';
import { saveDraft, loadDraft } from '@/lib/draftStore';
import BlockPanel from '@/components/elements/BlockPanel';
import HoverToolbar from '@/components/atoms/HoverToolbar';
import { useContentBlocks } from '@/components/func/contentBlocks';
import type { ContentBlock } from '@/components/func/contentBlocks';
import Seo from '@/elements/Seo';
import { imageURL, apiFetch } from '@/lib/api';
import { useDrop, useDragLayer } from 'react-dnd';
import { BLOCK_TYPE } from '@/components/atoms/DraggableBlock';

type DragMeta = { level?: number } | undefined;

type DropItem = { type: string; blockType?: string; id?: string; index?: number; meta?: DragMeta };

const ArticlePageDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const { contentBlocks, setContentBlocks } = useContentBlocks();
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [error, setError] = useState<string>('');
  const [featuredBlobURL, setFeaturedBlobURL] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [slugSaved, setSlugSaved] = useState(false);
  const originalSlugRef = useRef<string>('');

  const slugify = (s: string) => s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  // Save slug to localStorage and show visual feedback
  const saveSlug = () => {
    if (id && slug) {
      localStorage.setItem(`article-${id}-slug`, slug);
  setSlugSaved(true);
  setTimeout(() => setSlugSaved(false), 2000);
  // Use Toast here
  toast.success('Slug saved!', { id: 'article-feedback', style: { background: '#10b981', color: 'white' } });
    }
  };

  // Load slug from localStorage on mount
  useEffect(() => {
    if (id) {
      const savedSlug = localStorage.getItem(`article-${id}-slug`);
      if (savedSlug) {
        setSlug(savedSlug);
        originalSlugRef.current = savedSlug;
      }
    }
  }, [id]);

  const moveBlock = (from: number, to: number) => {
    const updated = [...contentBlocks];
    const [removed] = updated.splice(from, 1);
    updated.splice(to, 0, removed);
    setContentBlocks(updated);
  };

  // Insert a new block after an index
  const insertBlockAfter = (index: number, newBlock: ContentBlock) => {
    setContentBlocks((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, newBlock);
      return next;
    });
  };

  const updateBlockAt = (idx: number, patch: Partial<ContentBlock['data']>) => {
    setContentBlocks(prev => {
      const next = [...prev];
      const current = next[idx];
      if (!current) return prev;
      next[idx] = { ...current, data: { ...current.data, ...patch } };
      return next;
    });
  };

  useEffect(() => {
    setError('');
    // First try loading a draft; if exists, use it as initial state
    loadDraft(id || '').then((draft) => {
      if (draft) {
        setTitle(draft.title);
        setMetaDescription(draft.metaDescription);
        setContentBlocks(draft.blocks);
        if (draft.featuredImage) setArticle(prev => prev ? { ...prev, featuredImage: draft.featuredImage } : { id: '', title: '', status: undefined, category: undefined, excerpt: undefined, meta_description: undefined, description: undefined, tags: [], featuredImage: draft.featuredImage });
      }
    }).catch(() => { /* ignore */ });
    apiFetch(`/api/articles/${id}`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch article ${id}`);
        return res.json();
      })
      .then((data) => {
        // Normalize API wrappers
        const container = (val: unknown) => (val && typeof val === 'object' ? (val as Record<string, unknown>) : {});
        const obj = container(data);
        const wrapped = (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) ? obj.data
          : (obj.article && typeof obj.article === 'object') ? obj.article
          : (obj.result && typeof obj.result === 'object') ? obj.result
          : obj;

        // Cast to Record<string, any> for dynamic property access
        const w = wrapped as Record<string, any>;
        // Prefer .Content.blocks if available, fallback to .content.blocks
  const blocksSource = w.Content?.blocks || w.content?.blocks;
  const beBlocks = payloadToBlocks({ blocks: Array.isArray(blocksSource) ? blocksSource : [] });
  setContentBlocks(beBlocks);

        // Map other article fields as before
        type ApiArticle = {
          ID?: string; id?: string;
          Title?: string; title?: string;
          Status?: string; status?: string;
          Category?: string; category?: string;
          Excerpt?: string; excerpt?: string;
          MetaDescription?: string; meta_description?: string;
          Description?: string; description?: string; Body?: string; body?: string; Content?: string; content?: string;
          Tags?: string[]; tags?: string[];
          FeaturedImage?: string; featured_image?: string;
          [key: string]: unknown;
        };
        const rawTags = (w.Tags ?? w.tags) as unknown;
        const tags: string[] = Array.isArray(rawTags)
          ? rawTags
              .map((t: unknown) => {
                if (typeof t === 'string') return t;
                if (t && typeof t === 'object') {
                  const obj = t as { Name?: string; Slug?: string; name?: string; slug?: string };
                  return obj.Name || obj.Slug || obj.name || obj.slug || '';
                }
                return '';
              })
              .filter((s: string) => s.length > 0)
          : [];
        const mapped: Article = {
          id: w.ID ?? w.id ?? '',
          title: w.Title ?? w.title ?? '',
          status: w.Status ?? w.status,
          category: w.Category ?? w.category,
          excerpt: w.Excerpt ?? w.excerpt,
          meta_description: w.MetaDescription ?? w.meta_description,
          description: w.Description ?? w.description ?? w.Body ?? w.body ?? w.Content ?? w.content,
          // capture MetaDescription for editing (store in local state separately)
          // no-op in Article shape
          tags,
          featuredImage: w.FeaturedImage ?? w.featured_image,
        };
        setArticle(mapped);
  setMetaDescription((w.MetaDescription ?? w.meta_description) ?? '');
        if (mapped.title) {
          setTitle(mapped.title);
          const s = slugify(mapped.title);
          setSlug(s);
          originalSlugRef.current = s;
        }
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Unknown error fetching article';
        setError(msg);
      });
  }, [id]);

  const setFeaturedImage = (src?: string) => {
    // Clear any previous blob URL when changing/removing
    if (featuredBlobURL) {
      URL.revokeObjectURL(featuredBlobURL);
      setFeaturedBlobURL(undefined);
    }
    setArticle(prev => prev ? { ...prev, featuredImage: src } : prev);
  };

  // Prefetch featured image with credentials to avoid ORB and auth redirects
  useEffect(() => {
    const src = article?.featuredImage;
    if (!src) return;
    // Compute API path for fetching as blob
    const path = /^https?:\/\//i.test(src)
      ? undefined // can't fetch cross-origin without CORS; rely on direct URL
      : (src.startsWith('/') ? src : `/images/${src}`);
    let cancelled = false;
    if (!path) return;
    apiFetch(path, { credentials: 'include', headers: { Accept: 'image/*' } })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load image');
        const ctype = res.headers.get('content-type') || '';
        if (!ctype.startsWith('image/')) throw new Error('Not an image');
        const blob = await res.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setFeaturedBlobURL((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      })
      .catch(() => {
        // Fallback: let <img> use direct URL; may fail if server blocks
        setFeaturedBlobURL(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [article?.featuredImage]);

  // Create block without filler, use labels as placeholders only
  const createBlock = (type: string, meta?: DragMeta): ContentBlock | null => {
    const uid = Date.now().toString() + Math.random().toString(36).slice(2);
    switch (type) {
      case 'heading':
        return { id: uid, type: 'heading', data: { content: '', level: meta?.level ?? 1 } };
      case 'paragraph':
        return { id: uid, type: 'paragraph', data: { content: '' } }; // keep content left-aligned by default
      case 'blockquote':
        return { id: uid, type: 'blockquote', data: { content: 'Quote goes here' } };
      case 'pullquote':
        return { id: uid, type: 'pullquote', data: { content: 'An emphasized quote' } };
  case 'rawhtml':
        return { id: uid, type: 'rawhtml', data: { html: '' } };
      case 'pre':
        return { id: uid, type: 'pre', data: { content: '' } };
      case 'image':
        return { id: uid, type: 'image', data: { mode: 'single', images: [] } } as ContentBlock;
      case 'video':
        return { id: uid, type: 'video', data: { url: '', videoMode: 'embed' } } as ContentBlock;
      case 'table':
        return { id: uid, type: 'table', data: { rows: 3, cols: 3, cells: Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => '')) } };
      case 'divider':
        return { id: uid, type: 'divider', data: {} };
      default:
        return null;
    }
  };

  function isPanelItem(i: unknown): i is { blockType: string } {
    return !!i && typeof i === 'object' && 'blockType' in (i as Record<string, unknown>);
  }

  // Detect if dragging from panel (Rule A): show one end dropzone only
  const { isDraggingPanel } = useDragLayer((monitor) => {
    const item = monitor.getItem() as unknown;
    return { isDraggingPanel: monitor.isDragging() && isPanelItem(item) };
  });

  // Single DropZone component used only for Rule A (end-only surface)
  function EndDropZone({ onDrop }: { onDrop: (block: ContentBlock) => void }) {
    const [{ isOver }, drop] = useDrop({
      accept: BLOCK_TYPE,
      drop: (item: any) => {
        if (!item || typeof item !== 'object' || !('blockType' in item)) return undefined;
        const newBlock = createBlock((item as any).blockType, (item as any).meta);
        if (newBlock) onDrop(newBlock);
        return { handled: true };
      },
      collect: (monitor) => ({ isOver: monitor.isOver({ shallow: true }) }),
    });

    if (!isDraggingPanel) return null; // only while dragging panel item

    return drop(
      <div
        style={{
          minHeight: '48px',
          height: '48px',
          margin: '10px 0',
          background: 'transparent',
          borderRadius: '6px',
          border: isOver ? '2px solid #3b82f6' : '2px dashed #d1d5db',
          transition: 'border 0.2s',
        }}
      />
    );
  }

  // Fallback editor drop: append at end anywhere in editor (Rule A safety net)
  const [{ isOver: isEditorOver }, editorDrop] = useDrop({
    accept: BLOCK_TYPE,
    drop: (item: any, monitor) => {
      // If a nested drop target already handled the drop, do nothing
      if (monitor.didDrop()) return;
      if (!item || typeof item !== 'object' || !('blockType' in item)) return;
      const newBlock = createBlock((item as any).blockType, (item as any).meta);
      if (newBlock) setContentBlocks((prev) => [...prev, newBlock]);
      return { handled: true };
    },
    collect: (monitor) => ({ isOver: monitor.isOver({ shallow: true }) }),
  });

  const editorRef = useRef<HTMLDivElement | null>(null);
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // View modes: visual (read-only), html (raw), json (payload schema)
  const [viewMode, setViewMode] = useState<'visual' | 'html' | 'json'>('visual');
  // Editors state
  const [htmlText, setHtmlText] = useState('');
  const [htmlError, setHtmlError] = useState<string | null>(null);
  const [htmlDirty, setHtmlDirty] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  // Live sync: update JSON view whenever blocks change
  useEffect(() => {
    if (viewMode === 'json') {
      setJsonText(JSON.stringify(buildContentPayload(), null, 2));
    }
  }, [contentBlocks, viewMode]);
  // Live sync: always mirror Visual -> HTML when not dirty, regardless of current tab
  useEffect(() => {
    if (!htmlDirty) {
      setHtmlText(blocksToHTML(contentBlocks));
    }
  }, [contentBlocks, htmlDirty]);

  // Click-away: close richtext edit mode when clicking outside the active block
  useEffect(() => {
    if (!editingBlockId) return;
    const onDown = (e: MouseEvent) => {
      const active = blockRefs.current[editingBlockId!];
      if (!active) {
        setEditingBlockId(null);
        return;
      }
      const target = e.target as Node | null;
  // keep editing open when interacting with the open menu
  if (target && !active.contains(target) && !(target as HTMLElement).closest('[data-menu]')) {
        setEditingBlockId(null);
      }
    };
    // capture phase to run before other handlers that might stop propagation
    document.addEventListener('mousedown', onDown, true);
    return () => {
      document.removeEventListener('mousedown', onDown, true);
    };
  }, [editingBlockId]);

  if (!article) return <DashboardLayout><div>{error ? <span className="text-red-500">{error}</span> : 'Loading...'}</div></DashboardLayout>;

  // Options popover removed; toolbars appear on hover only.

  const setParagraphSpans = (idx: number, spans: { text: string; marks?: Array<'bold'|'italic'|'underline'|'strike'|'link'>; href?: string; target?: string }[]) => {
  updateBlockAt(idx, { spans, content: undefined });
  };

  // Convert payload -> internal blocks (hoisted via function declaration to avoid TDZ)
  function payloadToBlocks(payload: any): ContentBlock[] {
    const arr = Array.isArray(payload?.blocks) ? payload.blocks : [];
    return arr.map((blk: any) => {
      const t = blk?.type;
      const d = blk?.data || {};
      if (t === 'header') {
        return {
          id: crypto.randomUUID(),
          type: 'heading',
          data: { content: d.text || d.content || '', level: d.level || 1, align: d.align }
        };
      }
      if (t === 'paragraph') {
        const spans = Array.isArray(d.spans) ? d.spans : [{ text: d.text || d.content || '' }];
        return {
          id: crypto.randomUUID(),
          type: 'paragraph',
          data: { spans, list: 'none', align: d.align, transform: d.transform }
        };
      }
      if (t === 'list') {
        const style = d.style === 'ordered' || d.list === 'ol' ? 'ol' : 'ul';
        const items = Array.isArray(d.items)
          ? d.items.map((it: any) => {
              // Support either plain strings or rich span items
              if (typeof it === 'string') return { spans: [{ text: String(it || '') }] };
              if (Array.isArray(it?.spans)) return { spans: it.spans };
              return { spans: [{ text: String(it?.text || '') }] };
            })
          : [];
        return { id: crypto.randomUUID(), type: 'paragraph', data: { list: style, items, align: d.align } };
      }
      if (t === 'image') {
        // Normalize images as array of { src, alt? }
        let images: any[] = [];
        if (Array.isArray(d.images)) {
          images = d.images.map((im: any) => typeof im === 'string' ? { src: im } : im).filter((im: any) => im && im.src);
        } else if (typeof d.src === 'string') {
          images = [{ src: d.src, alt: d.alt }];
        }
        const mode = (d.mode === 'gallery' || (images.length > 1)) ? 'gallery' : 'single';
        return { id: crypto.randomUUID(), type: 'image', data: { images, mode } } as ContentBlock;
      }
      if (t === 'rawhtml' || t === 'raw' || t === 'html') {
        return { id: crypto.randomUUID(), type: 'rawhtml', data: { html: d.html || d.content || '' } } as ContentBlock;
      }
      // fallback passthrough
      return { id: crypto.randomUUID(), type: t, data: d };
    });
  }

  // Build Content JSON from contentBlocks for backend, persisting spans/items to keep marks
  const buildContentPayload = (blocks: ContentBlock[] = contentBlocks) => {
    return {
      blocks: blocks.map(b => {
        if (b.type === 'paragraph') {
          const bd: any = b.data || {};
          const out: any = {};
          if (bd.align) out.align = bd.align;
          if (bd.transform) out.transform = bd.transform;
          if (bd.list === 'ul' || bd.list === 'ol') {
            out.list = bd.list;
            out.items = Array.isArray(bd.items) ? bd.items : [];
            // If items missing but spans/content present, create a single item
            if ((!out.items || out.items.length === 0) && (Array.isArray(bd.spans) || typeof bd.content === 'string')) {
              out.items = [{ spans: Array.isArray(bd.spans) ? bd.spans : [{ text: bd.content || '' }] }];
            }
          } else {
            // Plain paragraph: prefer spans; fallback to content string as a single span
            out.spans = Array.isArray(bd.spans) ? bd.spans : [{ text: bd.content || bd.text || '' }];
          }
          return { type: 'paragraph', data: out };
        }
        if (b.type === 'image') {
          // Pass through normalized images
          const imgs = Array.isArray((b as any).data?.images) ? (b as any).data.images : [];
          const mode = (b as any).data?.mode || (imgs.length > 1 ? 'gallery' : 'single');
          return { type: 'image', data: { images: imgs, mode } };
        }
        if (b.type === 'rawhtml') {
          return { type: 'rawhtml', data: { html: (b as any).data?.html || '' } };
        }
        return { type: b.type, data: b.data };
      })
    };
  };

  const handleUpdate = async () => {
  setSaving(true);
    setError('');
    try {
  // HTML is a live read-only mirror; use current Visual blocks
  const effectiveBlocks = contentBlocks;
      const payload = {
        // Persist title so preview shows the updated value
        Title: title,
        MetaDescription: metaDescription,
        Content: buildContentPayload(effectiveBlocks),
      };
      const res = await apiFetch(`/api/articles/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed to update article ${id}`);
      const data = await res.json();
      // Unwrap potential API envelope
      const container = (val: unknown) => (val && typeof val === 'object' ? (val as Record<string, unknown>) : {});
      const obj = container(data);
      const wrapped = (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) ? obj.data
        : (obj.article && typeof obj.article === 'object') ? obj.article
        : (obj.result && typeof obj.result === 'object') ? obj.result
        : obj;
      const ww = wrapped as Record<string, any>;
      // After successful update, reflect server state in FE
      const updatedContent = (ww.Content && ww.Content.blocks) ? ww.Content.blocks : (ww.content && ww.content.blocks) ? ww.content.blocks : [];
      const normalized = Array.isArray(updatedContent) ? updatedContent.map((block:any) => {
        if (block.type === 'paragraph') {
          const data = { ...(block.data || {}) };
          // Maintain backward-compat: if server sends only text, mirror to content for UI
          if (typeof (data as any).text === 'string' && !(data as any).spans && !(data as any).items) {
            (data as any).content = (data as any).text;
          }
          return { id: crypto.randomUUID(), type: 'paragraph', data };
        }
        if (block.type === 'image') {
          const d = block.data || {};
          const images = Array.isArray(d.images) ? d.images.map((im: any) => typeof im === 'string' ? { src: im } : im) : [];
          return { id: crypto.randomUUID(), type: 'image', data: { images, mode: d.mode || (images.length > 1 ? 'gallery' : 'single') } };
        }
        if (block.type === 'rawhtml') {
          const d = block.data || {};
          return { id: crypto.randomUUID(), type: 'rawhtml', data: { html: d.html || d.content || '' } };
        }
        return { id: crypto.randomUUID(), type: block.type, data: block.data };
      }) : [];
      // If server returned no blocks but we had effective local blocks, keep local view to avoid empty UI
      if (normalized.length === 0 && (effectiveBlocks?.length || 0) > 0) {
        setContentBlocks(effectiveBlocks);
      } else {
        setContentBlocks(normalized);
      }
      // update meta description locally
      setMetaDescription(ww.MetaDescription ?? ww.meta_description ?? metaDescription);
      // update title locally if backend echoes it
      const newTitle = ww.Title ?? ww.title ?? title;
      setTitle(newTitle);
      // keep slug in sync with title field
      setSlug(slugify(newTitle));
      // Notify any open Preview tab to refresh using localStorage storage events
      try {
        const previewBlocks = (normalized.length === 0 && (effectiveBlocks?.length || 0) > 0) ? effectiveBlocks : normalized;
        localStorage.setItem(`previewLive:${id}`, JSON.stringify({ title: newTitle, blocks: previewBlocks }));
      } catch { /* ignore */ }
  // Toast
  toast.success('Sukses mengupdate artikel', { id: 'article-feedback', style: { background: '#22c55e', color: 'white' } });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error updating article');
    } finally {
      setSaving(false);
    }
  };

  const moveUp = (i: number) => {
  if (i <= 0) return;
    moveBlock(i, i - 1);
  };
  const moveDown = (i: number) => {
  if (i >= contentBlocks.length - 1) return;
    moveBlock(i, i + 1);
  };

  const removeBlock = (i: number) => {
  setContentBlocks(prev => prev.filter((_, idx) => idx !== i));
    // Close any open menus/editing if they refer to the removed block
    const blk = contentBlocks[i];
    if (blk) {
      if (openMenuFor === blk.id) setOpenMenuFor(null);
      if (editingBlockId === blk.id) setEditingBlockId(null);
    }
    // Keep HTML view aligned after deletion
    setTimeout(() => setHtmlText(blocksToHTML(contentBlocks.filter((_, idx) => idx !== i))), 0);
  };

  const focusEditableInBlock = (id: string) => {
  const el = blockRefs.current[id];
    if (!el) return;
    const editable = el.querySelector('[contenteditable="true"]') as HTMLElement | null;
    if (editable) {
      editable.focus();
      try {
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editable);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      } catch {}
    }
  };

  const onSaveDraft = async () => {
    if (!id) return;
    await saveDraft(id, { title, metaDescription, blocks: contentBlocks, featuredImage: article?.featuredImage });
    try { toast.success('Draft saved locally', { id: 'article-feedback' }); } catch {}
  };

  return (
    <DashboardLayout
      breadcrumbRight={(
        <div className="flex items-center gap-2">
          <Link
            to={`/preview/${id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center border rounded px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => {
              try {
                // Build draft blocks from current editor state; if HTML is dirty, prefer that
                const blocks = (viewMode === 'html' && htmlDirty)
                  ? htmlToBlocks(htmlText)
                  : contentBlocks;
                // Persist to sessionStorage for Preview to pick up
                sessionStorage.setItem(`previewDraft:${id}`, JSON.stringify(blocks));
              } catch {
                // ignore draft failure
              }
            }}
          >
            Open Preview
          </Link>
          <button
            onClick={onSaveDraft}
            disabled={saving}
            className="inline-flex items-center border px-3 py-2 rounded text-sm hover:bg-gray-50"
            title="Save draft locally"
          >
            Draft
          </button>
          <button
            onClick={() => handleUpdate()}
            disabled={saving}
            className="inline-flex items-center bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      )}
    >
      <div>
        {/* removed local breadcrumb row since GlobalLayout now handles it */}
        <div className="flex mt-8 gap-8">
          {/* Content Area */}
            <div
              className="w-full max-w-4xl bg-white rounded-xl shadow p-8 relative border border-gray-200"
              style={{
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
              }}
            >
            {/* Immutable header: Title and Slug */}
            <div className="mb-8 pb-6 border-b">
              <input
                className="w-full bg-transparent outline-none text-4xl md:text-5xl font-bold"
                value={title}
                onChange={(e)=>setTitle(e.target.value)}
                placeholder="Untitled"
                style={{ color: 'var(--text-primary)' }}
              />
              <div className="mt-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Slug</span>
                <input
                  className="border rounded px-3 py-1 text-sm flex-1"
                  value={slug}
                  onChange={(e)=>setSlug(e.target.value)}
                  placeholder="my-article-slug"
                  style={{ color: 'var(--text-primary)' }}
                />
                {slug !== originalSlugRef.current && (
                  <button
                    onClick={saveSlug}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      slugSaved 
                        ? 'bg-green-500 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                    title="Save slug to cache"
                  >
                    {slugSaved ? '✓' : 'Save'}
                  </button>
                )}
              </div>
             
            </div>

            {/* Wrapped editor area with tabs; title/slug above remain outside */}
            <div
              ref={(el) => { editorRef.current = el; editorDrop(el); }}
              className="mt-6 rounded-xl border bg-white"
              style={{
                borderColor: isEditorOver && viewMode === 'visual' ? '#3b82f6' : '#e5e7eb',
                minHeight: '700px',
                transition: 'border 0.2s'
              }}
              onDragEnterCapture={(e) => {
                if (viewMode !== 'visual') return;
                const dt = e.dataTransfer;
                if (!dt) return;
                const items = Array.from(dt.items || []);
                const hasFiles = items.some(it => it.kind === 'file');
                const hasUri = Array.from(dt.types || []).includes('text/uri-list');
                if (hasFiles || hasUri) {
                  e.preventDefault();
                }
              }}
              onDragOverCapture={(e) => {
                if (viewMode !== 'visual') return;
                const dt = e.dataTransfer;
                if (!dt) return;
                const items = Array.from(dt.items || []);
                const hasFiles = items.some(it => it.kind === 'file');
                const hasUri = Array.from(dt.types || []).includes('text/uri-list');
                if (hasFiles || hasUri) {
                  e.preventDefault();
                }
              }}
              onDropCapture={(e) => {
                if (viewMode !== 'visual') return;
                const dt = e.dataTransfer;
                if (!dt) return;
                const images: { src: string; alt?: string }[] = [];
                // File drops
                const files = Array.from(dt.files || []);
                if (files.length) {
                  files.forEach((f) => {
                    const isImage = (f.type && f.type.startsWith('image/')) || /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name || '');
                    if (isImage) {
                      const url = URL.createObjectURL(f);
                      images.push({ src: url, alt: f.name });
                    }
                  });
                }
                // URL drops (e.g., dragging an image from another tab)
                if (!images.length) {
                  const uriList = dt.getData && dt.getData('text/uri-list');
                  if (uriList) {
                    const first = uriList.split(/\r?\n/).find((l) => l && !l.startsWith('#'));
                    if (first && /^https?:\/\//i.test(first) && /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(first)) {
                      images.push({ src: first });
                    }
                  }
                }
                if (images.length) {
                  e.preventDefault();
                  e.stopPropagation();
                  setContentBlocks((prev) => [
                    ...prev,
                    { id: Date.now().toString(36) + Math.random().toString(36).slice(2), type: 'image', data: { images, mode: images.length > 1 ? 'gallery' : 'single' } }
                  ]);
                }
              }}
            >
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-1 rounded ${viewMode === 'visual' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
                    onClick={() => { setEditingBlockId(null); setViewMode('visual'); }}
                  >Visual</button>
                  <button
                    className={`px-3 py-1 rounded ${viewMode === 'html' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
                    onClick={() => { setEditingBlockId(null); setHtmlText(blocksToHTML(contentBlocks)); setViewMode('html'); setHtmlError(null); }}
                  >HTML</button>
                  <button
                    className={`px-3 py-1 rounded ${viewMode === 'json' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
                    onClick={() => { setEditingBlockId(null); setJsonText(JSON.stringify(buildContentPayload(), null, 2)); setViewMode('json'); setJsonError(null); }}
                  >JSON</button>
                </div>
                <div className="text-sm text-gray-500">Mode: {viewMode === 'visual' ? 'Visual' : viewMode.toUpperCase()}</div>
              </div>
              <div
                className="p-4"
                onDragOverCapture={(e) => {
                  const items = Array.from(e.dataTransfer?.items || []);
                  if (items.some(it => it.kind === 'file' && (it.type?.startsWith('image/') || !it.type))) {
                    e.preventDefault();
                  }
                }}
                onDropCapture={(e) => {
                  const files = e.dataTransfer?.files;
                  if (!files || files.length === 0) return;
                  const images: { src: string; alt?: string }[] = [];
                  Array.from(files).forEach((f) => {
                    if (!f.type || f.type.startsWith('image/')) {
                      const url = URL.createObjectURL(f);
                      images.push({ src: url, alt: f.name });
                    }
                  });
                  if (images.length) {
                    e.preventDefault();
                    e.stopPropagation();
                    setContentBlocks((prev) => [
                      ...prev,
                      { id: Date.now().toString(36) + Math.random().toString(36).slice(2), type: 'image', data: { images, mode: images.length > 1 ? 'gallery' : 'single' } }
                    ]);
                  }
                }}
              >
                {viewMode === 'html' ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      className="w-full min-h-[520px] p-3 font-mono text-sm border rounded"
                      value={htmlText}
                      readOnly
                      spellCheck={false}
                      placeholder="<p>Your article HTML here...</p>"
                    />
                    <div className="text-xs text-gray-500">Read-only HTML preview. Edits are made in Visual and mirrored here live.</div>
                  </div>
                ) : viewMode === 'json' ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      className="w-full min-h-[480px] p-3 font-mono text-sm border rounded"
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      readOnly
                      spellCheck={false}
                    />
                    <div className="text-xs text-gray-500">Read-only payload JSON (header/paragraph/list). Edit via HTML tab.</div>
                  </div>
                ) : (
                  <div
                    className="relative"
                    onMouseDown={(e)=>{
                      const target = e.target as HTMLElement;
                      // If click is outside any block editing area and not on menu, close editing
                      if (!target.closest('[data-block-id]') && !target.closest('[data-menu]')) {
                        setEditingBlockId(null);
                      }
                    }}
                  >
                    {Array.isArray(contentBlocks) && contentBlocks.length > 0 ? (
                      contentBlocks.map((block, idx) => (
                          <div
                            key={block.id}
                            className="group relative"
                            ref={(el) => { blockRefs.current[block.id] = el; }}
                            data-block-id={block.id}
                          >
                            <button
                              className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-1.5 shadow-md border border-gray-200 hover:bg-gray-50"
                              title="Block options"
                              data-menu
                              onClick={(e)=>{ e.stopPropagation(); setOpenMenuFor((prev)=> prev===block.id?null:block.id); }}
                              onDoubleClick={(e)=> e.stopPropagation()}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="13" r="1.5" fill="currentColor"/></svg>
                            </button>
        {openMenuFor === block.id && (
                              <div className="absolute top-10 right-2 z-30 bg-white rounded shadow-lg border border-gray-200 p-2 flex flex-col gap-1 min-w-[160px]"
          onClick={(e)=> e.stopPropagation()} data-menu>
                                  {(block.type === 'paragraph' || block.type === 'heading') && (
                                    <button className="px-3 py-1 text-sm rounded hover:bg-gray-100 text-left"
                                            onClick={() => { setOpenMenuFor(null); setEditingBlockId(block.id); setTimeout(()=> focusEditableInBlock(block.id), 0); }}>
                                      Edit block
                                    </button>
                                  )}
                                  <button
                                    className="px-3 py-1 text-sm rounded hover:bg-gray-100 text-left"
                                    onClick={() => { setOpenMenuFor(null); moveUp(idx); }}
                                  >
                                    Move Up
                                  </button>
                                  <button
                                    className="px-3 py-1 text-sm rounded hover:bg-gray-100 text-left"
                                    onClick={() => { setOpenMenuFor(null); moveDown(idx); }}
                                  >
                                    Move Down
                                  </button>
                                  <button
                                    className="px-3 py-1 text-sm rounded hover:bg-gray-100 text-left"
                                    onClick={() => {
                                      // Duplicate this block just below
                                      setOpenMenuFor(null);
                                      setContentBlocks((prev) => {
                                        const next = [...prev];
                                        const src = next[idx];
                                        if (!src) return prev;
                                        const cloned = {
                                          ...src,
                                          id: Date.now().toString(36) + Math.random().toString(36).slice(2),
                                          data: JSON.parse(JSON.stringify(src.data || {})),
                                        } as typeof src;
                                        next.splice(idx + 1, 0, cloned);
                                        return next;
                                      });
                                    }}
                                  >
                                    Duplicate
                                  </button>
                                  <button className="px-3 py-1 text-sm rounded hover:bg-red-50 text-left text-red-600"
                                          onClick={() => { setOpenMenuFor(null); removeBlock(idx); }}>
                                    Delete
                                  </button>
                              </div>
                            )}
                            {(() => {
                              switch (block.type) {
                                case 'heading': {
                                  return (
                                    <div className="relative">
                                      {editingBlockId === block.id && (
                                        <button
                                          type="button"
                                          className="absolute top-2 right-12 z-20 opacity-100 bg-white rounded-full px-3 py-1 text-xs shadow-md border border-gray-200 hover:bg-gray-50"
                                          onClick={() => setEditingBlockId(null)}
                                          title="Done editing"
                                        >
                                          Done
                                        </button>
                                      )}
                                      <ToggleHeadingBlock
                                        content={block.data.content ?? ''}
                                        level={block.data.level ?? 1}
                                        align={(block.data.align as 'left'|'center'|'right') || 'left'}
                                        marks={(Array.isArray(block.data.marks) ? block.data.marks : []) as Array<'bold'|'italic'|'underline'|'strike'|'link'>}
                                        editable={true}
                                        toolbarVisible={editingBlockId === block.id}
                                        onChange={(val) => updateBlockAt(idx, { content: val })}
                                        onLevelChange={(lvl) => updateBlockAt(idx, { level: lvl })}
                                      />
                                    </div>
                                  );
                                }
                                case 'paragraph': {
                                  const listKind = (block.data.list as 'none'|'ul'|'ol'|undefined) || 'none';
                                  const spans = Array.isArray(block.data.spans) ? block.data.spans : [{ text: block.data.content || '' }];
                                  const items = Array.isArray(block.data.items) ? block.data.items : [];
                                  return (
                                    <div className="relative">
                                      {editingBlockId === block.id && (
                                        <button
                                          type="button"
                                          className="absolute top-2 right-12 z-20 opacity-100 bg-white rounded-full px-3 py-1 text-xs shadow-md border border-gray-200 hover:bg-gray-50"
                                          onClick={() => setEditingBlockId(null)}
                                          title="Done editing"
                                        >
                                          Done
                                        </button>
                                      )}
                                      <ParagraphRich
                                        spans={spans as any}
                                        items={items as any}
                                        list={listKind}
                                        align={(block.data.align as any) || 'left'}
                                        transform={(block.data.transform as any) || 'none'}
                                        toolbarVisible={editingBlockId === block.id}
                                        onChange={(sp) => updateBlockAt(idx, { spans: sp, content: undefined })}
                                        onItemsChange={(it) => updateBlockAt(idx, { items: it })}
                                        onAlignChange={(a) => updateBlockAt(idx, { align: a })}
                                        onListChange={(k) => {
                                          if (k === 'none') {
                                            // collapse list into single paragraph spans
                                            const firstSpans = (Array.isArray(block.data.items) && block.data.items[0]) ? block.data.items[0].spans : (Array.isArray(block.data.spans) ? block.data.spans : [{ text: '' }]);
                                            updateBlockAt(idx, { list: 'none', items: undefined, spans: firstSpans });
                                          } else {
                                            // switch to list and seed first item from spans if empty
                                            const currItems = Array.isArray(block.data.items) ? block.data.items : [];
                                            const seeded = currItems.length ? currItems : [{ spans: Array.isArray(block.data.spans) ? block.data.spans : [{ text: block.data.content || '' }] }];
                                            updateBlockAt(idx, { list: k, items: seeded });
                                          }
                                        }}
                                      />
                                    </div>
                                  );
                                }
                                case 'blockquote':
                                  return (<blockquote className="italic border-l-4 border-gray-300 pl-4 ml-2 text-gray-700">{block.data.content ?? ''}</blockquote>);
                                case 'pullquote':
                                  return (<div className="my-4"><div className="italic text-xl font-semibold text-gray-800">“{block.data.content ?? ''}”</div></div>);
                                case 'rawhtml': {
                                  // Simple textarea editor for raw HTML; always visible since it's code-like
                                  return (
                                    <div className="my-3">
                                      <div className="text-xs text-gray-500 mb-1">Raw HTML</div>
                                      <textarea
                                        className="w-full min-h-[120px] p-3 font-mono text-sm border rounded"
                                        value={String(block.data.html || '')}
                                        onChange={(e) => {
                                          const v = e.target.value;
                                          updateBlockAt(idx, { html: v });
                                          // Immediately mirror to HTML/JSON tabs
                                          setHtmlText(blocksToHTML(contentBlocks.map((b, i) => i === idx ? { ...b, data: { ...b.data, html: v } } : b)));
                                          setJsonText(JSON.stringify(buildContentPayload(contentBlocks.map((b, i) => i === idx ? { ...b, data: { ...b.data, html: v } } : b)), null, 2));
                                        }}
                                        placeholder="<p>Type raw HTML here...</p>"
                                        spellCheck={false}
                                      />
                                    </div>
                                  );
                                }
                                case 'image': {
                                  const imgs = Array.isArray(block.data.images) ? block.data.images : [];
                                  if (imgs.length === 0) {
                                    return (
                                      <div className="my-2">
                                        <ImageUploader
                                          mode={(block.data.mode as 'single'|'gallery') || 'single'}
                                          images={[]}
                                          onChange={(newImages, mode) => updateBlockAt(idx, { images: newImages, mode })}
                                        />
                                      </div>
                                    );
                                  }
                                  return (
                                    <div className="flex gap-2 flex-wrap cursor-default">
                                      {imgs.map((im:any, i:number)=> (
                                        <img key={i} src={im.src} alt={im.alt||''} className="max-h-48 object-contain rounded border" />
                                      ))}
                                    </div>
                                  );
                                }
                                case 'video':
                                  return block.data.url ? (
                                    <div className="aspect-video w-full bg-black/5 rounded flex items-center justify-center">
                                      <iframe className="w-full h-full rounded" src={block.data.url} title="Embedded video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                                    </div>
                                  ) : null;
                                case 'table': {
                                  const cells: string[][] = Array.isArray(block.data.cells) ? block.data.cells : [];
                                  return (
                                    <div className="my-3 overflow-auto"><table className="min-w-full border-collapse"><tbody>
                                      {cells.map((row, r)=> (
                                        <tr key={r}>{row.map((cell, c)=> (<td key={c} className="border border-gray-300 p-2 text-sm">{cell}</td>))}</tr>
                                      ))}
                                    </tbody></table></div>
                                  );
                                }
                                case 'divider':
                                  return <hr/>;
                                default:
                                  return null;
                              }
                            })()}
                          </div>
                      ))
                    ) : (
                      <div className="rounded bg-gray-50 p-6 text-center text-gray-400 text-lg">
                        No content yet. Use HTML/JSON tabs to add content. Double-click here to edit HTML.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Rule A: show exactly one end dropzone while dragging a panel item (visual only) */}
            {viewMode === 'visual' && isDraggingPanel && (
              <EndDropZone onDrop={(newBlock) => {
                setContentBlocks((prev) => [...prev, newBlock]);
              }} />
            )}
          </div>

          {/* Right column: elements + featured image */}
          <div className="w-full md:w-2/5 flex flex-col gap-2">
            <BlockPanel />
            <div className="bg-white rounded-xl shadow p-4">
              <div className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Featured Image</div>
              {/* If there's a featured image path from API, show it via backend URL */}
              {article?.featuredImage ? (
                <div className="border rounded p-3 min-h-[120px] flex items-center justify-center bg-gray-50">
                  <div className="relative">
                    <img
                      src={featuredBlobURL || imageURL(article.featuredImage)}
                      alt="Featured"
                      className="max-h-48 object-contain rounded"
                    />
                    <button
                      className="absolute top-1 right-1 text-xs px-1 rounded bg-white/80 border"
                      onClick={()=> setFeaturedImage(undefined)}
                      title="Remove"
                    >×</button>
                  </div>
                </div>
              ) : (
                <ImageUploader
                  mode="single"
                  images={[]}
                  allowGallery={false}
                  onChange={(imgs)=> setFeaturedImage(imgs[0]?.src)}
                />
              )}
            </div>
          </div>
        </div>

        {/* SEO Parts */}
        <Seo article={article} />
      </div>
    </DashboardLayout>
  );
};

export default ArticlePageDetail;
