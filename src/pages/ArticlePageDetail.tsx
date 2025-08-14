import React from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/GlobalLayout';
import { useEffect, useState, useRef } from 'react';
import { Article } from '@/hooks/useArticle';
import { ToggleHeadingBlock, Blockquote, PullQuote, CodeBlock, ImageUploader, VideoBlock, TableBlock, DividerBlock, ParagraphRich } from '@/components/atoms/Blocks';
import BlockPanel from '@/components/elements/BlockPanel';
import { useContentBlocks } from '@/components/func/contentBlocks';
import type { ContentBlock } from '@/components/func/contentBlocks';
import Seo from '@/elements/Seo';
import { DraggableBlock, BLOCK_TYPE } from '@/components/atoms/DraggableBlock';
import { useDrop, useDragLayer } from 'react-dnd';

type DragMeta = { level?: number } | undefined;

type DropItem = { type: string; blockType?: string; id?: string; index?: number; meta?: DragMeta };

const ArticlePageDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const { contentBlocks, setContentBlocks } = useContentBlocks();
  const [optionsOpen, setOptionsOpen] = useState<Record<string, boolean>>({});
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');

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
    fetch(`http://localhost:8000/api/articles/${id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        type ApiArticle = {
          ID?: string; id?: string;
          Title?: string; title?: string;
          Status?: string; status?: string;
          Category?: string; category?: string;
          Excerpt?: string; excerpt?: string;
          MetaDescription?: string; meta_description?: string;
          Tags?: string[]; tags?: string[];
          FeaturedImage?: string; featured_image?: string;
          [key: string]: unknown;
        };
        const a: ApiArticle = data || {};
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
          tags,
          featuredImage: a.FeaturedImage ?? a.featured_image,
        };
        setArticle(mapped);
        if (mapped.title) {
          setTitle(mapped.title);
          setSlug(slugify(mapped.title));
        }
      });
  }, [id]);

  const setFeaturedImage = (src?: string) => {
    setArticle(prev => prev ? { ...prev, featuredImage: src } : prev);
  };

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

  if (!article) return <DashboardLayout><div>Loading...</div></DashboardLayout>;

  const toggleOptions = (id: string) => setOptionsOpen(prev => ({ ...prev, [id]: !prev[id] }));

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

                  <button
                    onClick={()=>toggleOptions(block.id)}
                    className="hidden group-hover:block absolute -right-2 -top-2 z-10 bg-white border rounded px-2 py-1 text-xs shadow"
                    title="Options"
                  >
                    <i className="fas fa-sliders-h"></i>
                  </button>

                  {/* Block renderer */}
                  {(() => {
                    switch (block.type) {
                      case 'heading':
                        return (
                          <>
                            {/* Compact heading toolbar above remains */}
                            {optionsOpen[block.id] && (
                              <div className="mb-2 p-2 border rounded bg-gray-50 text-xs flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  {[1,2,3,4,5,6].map(l => (
                                    <button
                                      key={l}
                                      className={`px-2 py-1 rounded border ${l === (block.data.level ?? 1) ? 'opacity-50 cursor-not-allowed bg-white' : 'hover:bg-white'}`}
                                      disabled={l === (block.data.level ?? 1)}
                                      onClick={()=> updateBlockAt(idx, { level: l })}
                                      title={`H${l}`}
                                    >
                                      H{l}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1">
                                  <button className={`px-2 py-1 rounded border ${block.data.align==='left' ? 'bg-white' : ''}`} onClick={()=>updateBlockAt(idx, { align: 'left' })} title="Align left">⟸</button>
                                  <button className={`px-2 py-1 rounded border ${block.data.align==='center' ? 'bg-white' : ''}`} onClick={()=>updateBlockAt(idx, { align: 'center' })} title="Align center">↔</button>
                                  <button className={`px-2 py-1 rounded border ${block.data.align==='right' ? 'bg-white' : ''}`} onClick={()=>updateBlockAt(idx, { align: 'right' })} title="Align right">⟹</button>
                                </div>
                                <button className="px-2 py-1 rounded border" onClick={()=>toggleOptions(block.id)} title="Close">✕</button>
                              </div>
                            )}

                            <div>
                              <ToggleHeadingBlock
                                content={block.data.content ?? ''}
                                level={block.data.level ?? 1}
                                align={(block.data.align as 'left'|'center'|'right') || 'left'}
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
                              align={block.data.align || 'left'}
                              transform={block.data.transform || 'none'}
                              onChange={(spans)=> setParagraphSpans(idx, spans)}
                            />
                            {/* Placeholder when empty */}
                            {(!block.data.spans && !block.data.content) && (
                              <span className="pointer-events-none absolute left-4 top-2 text-gray-400 opacity-40">Paragraph</span>
                            )}
                            {optionsOpen[block.id] && (
                              <div className="mt-2 p-3 border rounded bg-gray-50 text-xs">
                                <div className="font-semibold mb-2">Paragraph Options</div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span>Align</span>
                                  <select
                                    value={block.data.align || 'left'}
                                    onChange={(e)=>updateBlockAt(idx, { align: e.target.value as 'left'|'center'|'right'|'justify' })}
                                    className="border rounded px-2 py-1"
                                  >
                                    <option value="left">Left</option>
                                    <option value="center">Center</option>
                                    <option value="right">Right</option>
                                    <option value="justify">Justify</option>
                                  </select>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span>Case</span>
                                  <select
                                    value={block.data.transform || 'none'}
                                    onChange={(e)=>updateBlockAt(idx, { transform: e.target.value as 'none'|'uppercase'|'lowercase'|'capitalize' })}
                                    className="border rounded px-2 py-1"
                                  >
                                    <option value="none">None</option>
                                    <option value="uppercase">Uppercase</option>
                                    <option value="lowercase">Lowercase</option>
                                    <option value="capitalize">Capitalize</option>
                                  </select>
                                </div>
                              </div>
                            )}
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
              <ImageUploader
                mode="single"
                images={article?.featuredImage ? [{ src: article.featuredImage }] : []}
                allowGallery={false}
                onChange={(imgs)=> setFeaturedImage(imgs[0]?.src)}
              />
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
