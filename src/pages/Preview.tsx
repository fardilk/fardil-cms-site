import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToggleHeadingBlock, ParagraphBlock, Blockquote, PullQuote, CodeBlock, ImageUploader, VideoBlock, TableBlock, DividerBlock } from '@/components/atoms/Blocks';
import { apiFetch } from '@/lib/api';

type Block = { id: string; type: string; data: any };

const Preview: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiFetch(`/api/articles/${id}`, { credentials: 'include' })
      .then(res => { if (!res.ok) throw new Error('Failed to load article'); return res.json(); })
      .then((data) => {
        if (cancelled) return;
        const obj = (data && typeof data === 'object') ? data as Record<string, any> : {};
        const wrapped = (obj.data && typeof obj.data === 'object') ? obj.data
          : (obj.article && typeof obj.article === 'object') ? obj.article
          : (obj.result && typeof obj.result === 'object') ? obj.result
          : obj;
        const w = wrapped as Record<string, any>;
        const t = w.Title ?? w.title ?? '';
        setTitle(t);
        const blocksSource = w.Content?.blocks || w.content?.blocks || [];
        const normalized = Array.isArray(blocksSource) ? blocksSource.map((block:any) => {
          if (block.type === 'paragraph') {
            const content = block.data?.content ?? block.data?.text ?? '';
            return { id: crypto.randomUUID(), type: 'paragraph', data: { content } };
          }
          return { id: crypto.randomUUID(), type: block.type, data: block.data };
        }) : [];
        setBlocks(normalized);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Unknown error'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  const articleHeader = useMemo(() => (
    <header className="mb-8">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900">{title || 'Untitled'}</h1>
    </header>
  ), [title]);

  if (loading) return <div className="mx-auto max-w-3xl p-6">Loading…</div>;
  if (error) return <div className="mx-auto max-w-3xl p-6 text-red-600">{error}</div>;

  return (
    <div className="relative mx-auto max-w-3xl p-6">
      {/* X button to close preview and go back to editor */}
      <button
        onClick={() => navigate(`/artikel/${id}`)}
        className="absolute top-4 right-4 z-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full w-10 h-10 flex items-center justify-center shadow"
        title="Close preview"
        aria-label="Close preview"
      >
        <span className="text-2xl font-bold">×</span>
      </button>
      <article className="prose prose-gray">
        {articleHeader}
        {blocks.map((block) => {
          switch (block.type) {
            case 'heading':
              return <ToggleHeadingBlock key={block.id} content={block.data.content ?? ''} level={block.data.level ?? 1} />;
            case 'paragraph':
              return <ParagraphBlock key={block.id} content={block.data.content ?? ''} />;
            case 'blockquote':
              return <Blockquote key={block.id} content={block.data.content ?? ''} />;
            case 'pullquote':
              return <PullQuote key={block.id} content={block.data.content ?? ''} />;
            case 'code':
              return <CodeBlock key={block.id} code={block.data.code ?? ''} />;
            case 'image':
              // ImageUploader in preview: only show images, no upload/interaction
              return (Array.isArray(block.data.images) && block.data.images.length > 0) ? (
                <div key={block.id} className="my-3">
                  {block.data.images.map((img:any, i:number) => (
                    <img key={i} src={img.src} alt={img.alt || ''} className="max-h-48 object-contain rounded mb-2" />
                  ))}
                </div>
              ) : null;
            case 'video':
              // VideoBlock in preview: only show video if src/url, no upload/interaction
              return block.data.url ? (
                <div key={block.id} className="my-3">
                  <iframe className="w-full aspect-video rounded" src={block.data.url} title="Embedded video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              ) : null;
            case 'table':
              return <TableBlock key={block.id} rows={block.data.rows} cols={block.data.cols} />;
            case 'divider':
              return <DividerBlock key={block.id} />;
            default:
              return null;
          }
        })}
      </article>
    </div>
  );
};

export default Preview;
