import React from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/GlobalLayout';
import { useEffect, useState, useRef } from 'react';
import { Article } from '@/hooks/useArticle';
import { ToggleHeadingBlock, Blockquote, PullQuote, CodeBlock, ImageUploader, VideoBlock, TableBlock, DividerBlock, ParagraphRich } from '@/components/atoms/Blocks';
import BlockPanel from '@/components/elements/BlockPanel';
import HoverToolbar from '@/components/atoms/HoverToolbar';
import { useContentBlocks } from '@/components/func/contentBlocks';
import type { ContentBlock } from '@/components/func/contentBlocks';
import Seo from '@/elements/Seo';
import { imageURL, apiFetch } from '@/lib/api';
import { DraggableBlock, BLOCK_TYPE } from '@/components/atoms/DraggableBlock';
import { useDrop, useDragLayer } from 'react-dnd';

type DragMeta = { level?: number } | undefined;

type DropItem = { type: string; blockType?: string; id?: string; index?: number; meta?: DragMeta };

const ArticlePageDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const { contentBlocks, setContentBlocks } = useContentBlocks();
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string>('');
  const [featuredBlobURL, setFeaturedBlobURL] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const slugify = (s: string) => s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

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
    apiFetch(`/api/articles/${id}`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch article ${id}`);
        return res.json();
      })
      .then((data) => {
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
        // Normalize common API wrappers: { data: {...} } | { article: {...} } | { result: {...} } | {...}
        const container = (val: unknown) => (val && typeof val === 'object' ? (val as Record<string, unknown>) : {});
        const obj = container(data);
        const wrapped = (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) ? obj.data
          : (obj.article && typeof obj.article === 'object') ? obj.article
          : (obj.result && typeof obj.result === 'object') ? obj.result
          : obj;
        const a: ApiArticle = (wrapped as ApiArticle) || {};
        const rawTags = (a.Tags ?? a.tags) as unknown;
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
          id: a.ID ?? a.id ?? '',
          title: a.Title ?? a.title ?? '',
          status: a.Status ?? a.status,
          category: a.Category ?? a.category,
          excerpt: a.Excerpt ?? a.excerpt,
          meta_description: a.MetaDescription ?? a.meta_description,
          description: a.Description ?? a.description ?? a.Body ?? a.body ?? a.Content ?? a.content,
          tags,
          featuredImage: a.FeaturedImage ?? a.featured_image,
        };
        setArticle(mapped);
        if (mapped.title) {
          setTitle(mapped.title);
          setSlug(slugify(mapped.title));
        }
        if (mapped.description) setDescription(mapped.description);
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
      case 'code':
        return { id: uid, type: 'code', data: { code: '' } };
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
      drop: (item: DropItem) => {
        if (!item.blockType) return undefined;
        const newBlock = createBlock(item.blockType, item.meta);
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
    drop: (item: DropItem, monitor) => {
      // If a nested drop target already handled the drop, do nothing
      if (monitor.didDrop()) return;
      if (!item.blockType) return;
      const newBlock = createBlock(item.blockType, item.meta);
      if (newBlock) setContentBlocks((prev) => [...prev, newBlock]);
      return { handled: true };
    },
    collect: (monitor) => ({ isOver: monitor.isOver({ shallow: true }) }),
  });

  const editorRef = useRef<HTMLDivElement | null>(null);
  editorDrop(editorRef);

  if (!article) return <DashboardLayout><div>{error ? <span className="text-red-500">{error}</span> : 'Loading...'}</div></DashboardLayout>;

  // Options popover removed; toolbars appear on hover only.

  const setParagraphSpans = (idx: number, spans: { text: string; marks?: Array<'bold'|'italic'|'underline'|'strike'|'link'>; href?: string }[]) => {
    updateBlockAt(idx, { spans, content: undefined });
  };

  const moveUp = (i: number) => {
    if (i <= 0) return;
    moveBlock(i, i - 1);
  };
  const moveDown = (i: number) => {
    if (i >= contentBlocks.length - 1) return;
    moveBlock(i, i + 1);
  };

  return (
    <DashboardLayout
      breadcrumbRight={(
        <Link
          to={`/preview/${id}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center border rounded px-3 py-2 text-sm hover:bg-gray-50"
        >
          Open Preview
        </Link>
      )}
    >
      <div>
        {/* removed local breadcrumb row since GlobalLayout now handles it */}
        <div className="flex mt-8 gap-8">
          {/* Content Area */}
          <div
            ref={editorRef}
            className="w-full max-w-4xl bg-white rounded-xl shadow p-8 relative"
            style={{
              minHeight: '700px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: isEditorOver ? '2px solid #3b82f6' : undefined,
              transition: 'border 0.2s',
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
              </div>
              <div className="mt-4">
                <label className="block text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Description</label>
                <textarea
                  className="w-full border rounded p-3 text-sm"
                  rows={6}
                  value={description}
                  onChange={(e)=>setDescription(e.target.value)}
                  placeholder="Write the article description..."
                />
                <div className="mt-2 flex gap-2">
                  <button
                    className="px-3 py-1 rounded border bg-blue-600 text-white"
                    onClick={async ()=>{
                      if (!id) return;
                      // PUT update to backend
                      try {
                        setSaving(true);
                        const payload = { description };
                        let res = await apiFetch(`/api/articles/${id}`, {
                          method: 'PUT',
                          credentials: 'include',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(payload),
                        });
                        if (!res.ok && (res.status === 405 || res.status === 404)) {
                          // Fallback for APIs that use POST to update
                          res = await apiFetch(`/api/articles/${id}`, {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload),
                          });
                        }
                        if (!res.ok) throw new Error('Failed to update article');
                        // Update local copy
                        setArticle(prev => prev ? { ...prev, description } : prev);
                        const t = await import('react-hot-toast');
                        t.toast.success('Description saved');
                      } catch (e) {
                        console.error(e);
                        const t = await import('react-hot-toast');
                        t.toast.error('Failed to save');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                  >{saving ? 'Saving…' : 'Save'}</button>
                  <button
                    className="px-3 py-1 rounded border bg-gray-100"
                    onClick={()=> setDescription(article?.description || '')}
                  >Reset</button>
                </div>
              </div>
            </div>

            {/* Rule B: render existing blocks; reordering handled inside DraggableBlock */}
            {contentBlocks.map((block, idx) => (
              <DraggableBlock key={block.id} id={block.id} index={idx} moveBlock={moveBlock}>
                <div className="group relative">
                  {/* Move controls on the right, show on hover */}
                  <div className="absolute -right-10 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className={`w-7 h-7 rounded border bg-white text-xs ${idx<=0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                      onClick={()=>moveUp(idx)}
                      disabled={idx<=0}
                      title="Move up"
                    >↑</button>
                    <button
                      className={`w-7 h-7 rounded border bg-white text-xs ${idx>=contentBlocks.length-1 ? 'opacity-40 cursor-not-allowed' : ''}`}
                      onClick={()=>moveDown(idx)}
                      disabled={idx>=contentBlocks.length-1}
                      title="Move down"
                    >↓</button>
                  </div>

                  {/* Legacy options button removed */}

                  {/* Block renderer */}
                  {(() => {
                    switch (block.type) {
                      case 'heading':
                        return (
                          <>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2">
                              <HoverToolbar
                                variant="heading"
                                className=""
                                level={(block.data.level ?? 1) as 1|2|3|4|5|6}
                                align={(block.data.align as 'left'|'center'|'right') || 'left'}
                                onLevelChange={(l)=>updateBlockAt(idx, { level: l })}
                                onAlignChange={(a)=>updateBlockAt(idx, { align: a })}
                                marks={(Array.isArray(block.data.marks) ? block.data.marks : []) as Array<'bold'|'italic'|'underline'|'strike'|'link'>}
                                onBold={()=>{
                                  const set = new Set<'bold'|'italic'|'underline'|'strike'|'link'>(Array.isArray(block.data.marks) ? block.data.marks as Array<'bold'|'italic'|'underline'|'strike'|'link'> : []);
                                  set.has('bold') ? set.delete('bold') : set.add('bold');
                                  updateBlockAt(idx, { marks: Array.from(set) as Array<'bold'|'italic'|'underline'|'strike'|'link'> });
                                }}
                                onItalic={()=>{
                                  const set = new Set<'bold'|'italic'|'underline'|'strike'|'link'>(Array.isArray(block.data.marks) ? block.data.marks as Array<'bold'|'italic'|'underline'|'strike'|'link'> : []);
                                  set.has('italic') ? set.delete('italic') : set.add('italic');
                                  updateBlockAt(idx, { marks: Array.from(set) as Array<'bold'|'italic'|'underline'|'strike'|'link'> });
                                }}
                                onUnderline={()=>{
                                  const set = new Set<'bold'|'italic'|'underline'|'strike'|'link'>(Array.isArray(block.data.marks) ? block.data.marks as Array<'bold'|'italic'|'underline'|'strike'|'link'> : []);
                                  set.has('underline') ? set.delete('underline') : set.add('underline');
                                  updateBlockAt(idx, { marks: Array.from(set) as Array<'bold'|'italic'|'underline'|'strike'|'link'> });
                                }}
                                onStrike={()=>{
                                  const set = new Set<'bold'|'italic'|'underline'|'strike'|'link'>(Array.isArray(block.data.marks) ? block.data.marks as Array<'bold'|'italic'|'underline'|'strike'|'link'> : []);
                                  set.has('strike') ? set.delete('strike') : set.add('strike');
                                  updateBlockAt(idx, { marks: Array.from(set) as Array<'bold'|'italic'|'underline'|'strike'|'link'> });
                                }}
                              />
                            </div>

                            <div>
                              <ToggleHeadingBlock
                                content={block.data.content ?? ''}
                                level={block.data.level ?? 1}
                                align={(block.data.align as 'left'|'center'|'right') || 'left'}
                                marks={(Array.isArray(block.data.marks) ? block.data.marks : []) as Array<'bold'|'italic'|'underline'|'strike'|'link'>}
                                onChange={(val)=> updateBlockAt(idx, { content: val })}
                              />
                            </div>
                          </>
                        );
                      case 'paragraph':
                        return (
                          <div>
                            <ParagraphRich
                              spans={block.data.spans || [{ text: block.data.content || '' }]}
                              items={block.data.items}
                              align={(block.data.align as 'left'|'center'|'right'|'justify') || 'left'}
                              transform={(block.data.transform as 'none'|'uppercase'|'lowercase'|'capitalize') || 'none'}
                              list={(block.data.list as 'none'|'ul'|'ol') || 'none'}
                              onChange={(spans)=> setParagraphSpans(idx, spans)}
                              onItemsChange={(items)=> updateBlockAt(idx, { items })}
                              onAlignChange={(a)=> updateBlockAt(idx, { align: a })}
                              onListChange={(l)=> {
                                if (l === 'ul' || l === 'ol') {
                                  const hasItems = Array.isArray(block.data.items) && block.data.items.length > 0;
                                  const initialSpans = block.data.spans || [{ text: block.data.content || '' }];
                                  // Clear paragraph-specific fields when entering list mode to avoid caret/placeholder conflicts
                                  updateBlockAt(idx, {
                                    list: l,
                                    items: hasItems ? block.data.items : [{ spans: initialSpans }],
                                    spans: undefined,
                                    content: undefined,
                                    transform: undefined,
                                  });
                                } else {
                                  // Leaving list mode, keep text by collapsing items back into one span
                                  const mergedText = Array.isArray(block.data.items) && block.data.items.length
                                    ? (block.data.items.map(it => (it.spans?.[0]?.text || '')).join('\n'))
                                    : '';
                                  updateBlockAt(idx, { list: 'none', items: undefined, spans: [{ text: mergedText }] });
                                }
                              }}
                            />
                            {/* Placeholder only for plain paragraphs */}
                            {((!block.data.list || block.data.list === 'none') && !block.data.spans && !block.data.content) && (
                              <span className="pointer-events-none absolute left-4 top-2 text-gray-400 opacity-40">Paragraph</span>
                            )}
                            {/* List toggles moved to ParagraphRich toolbar */}
                          </div>
                        );
                      case 'blockquote':
                        return (
                          <Blockquote
                            content={block.data.content ?? ''}
                            onChange={(val)=> updateBlockAt(idx, { content: val })}
                          />
                        );
                      case 'pullquote':
                        return (
                          <PullQuote
                            content={block.data.content ?? ''}
                            onChange={(val)=> updateBlockAt(idx, { content: val })}
                          />
                        );
                      case 'code':
                        return (
                          <CodeBlock
                            code={block.data.code ?? ''}
                            onChange={(val)=> updateBlockAt(idx, { code: val })}
                          />
                        );
                      case 'image':
                        return (
                          <ImageUploader
                            mode={(block.data.mode as 'single'|'gallery') || 'single'}
                            images={block.data.images || []}
                            onChange={(imgs, mode)=> updateBlockAt(idx, { images: imgs, mode })}
                          />
                        );
                      case 'video':
                        return (
                          <VideoBlock
                            url={block.data.url}
                            mode={(block.data.videoMode as 'embed'|'upload') || 'embed'}
                            onChange={(data)=> updateBlockAt(idx, { url: data.url, videoSrc: data.videoSrc, videoMode: data.mode })}
                          />
                        );
                      case 'table':
                        return (
                          <TableBlock
                            rows={block.data.rows}
                            cols={block.data.cols}
                            onChange={(cells)=> updateBlockAt(idx, { cells })}
                          />
                        );
                      case 'divider':
                        return <DividerBlock />;
                      default:
                        return null;
                    }
                  })()}
                </div>
              </DraggableBlock>
            ))}

            {/* Rule A: show exactly one end dropzone while dragging a panel item */}
            {isDraggingPanel && (
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
