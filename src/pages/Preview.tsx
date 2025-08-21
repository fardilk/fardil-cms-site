import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import PureBlocks from '@/components/elements/PureBlocks';
import { loadDraft } from '@/lib/draftStore';

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

    (async () => {
      // Track whether we populated from session/draft to avoid backend overwrite
      let usedBlocks = false;
      let usedTitle = false;

      // 1) Prefer one-shot session draft from the editor (e.g., unsaved changes)
      const draftRaw = sessionStorage.getItem(`previewDraft:${id}`);
      if (draftRaw) {
        try {
          const draftBlocks = JSON.parse(draftRaw);
          if (Array.isArray(draftBlocks)) {
            setBlocks(draftBlocks);
            usedBlocks = true;
          }
        } catch {/* ignore */}
        // Clear after first use to prevent stale previews
        try { sessionStorage.removeItem(`previewDraft:${id}`); } catch { /* ignore */ }
      }

      // 2) If no session blocks or for title, load local draft (IndexedDB+localStorage)
      if (id) {
        try {
          const draft = await loadDraft(id);
          if (draft) {
            if (!usedTitle && typeof draft.title === 'string') {
              setTitle(draft.title);
              usedTitle = true;
            }
            if (!usedBlocks && Array.isArray(draft.blocks)) {
              setBlocks(draft.blocks as any);
              usedBlocks = true;
            }
          }
        } catch {/* ignore */}
      }

      // 3) Backend fallback (only fill fields we didn't already set)
      try {
        const res = await apiFetch(`/api/articles/${id}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load article');
        const data = await res.json();
        if (cancelled) return;
        const obj = (data && typeof data === 'object') ? data as Record<string, any> : {};
        const wrapped = (obj.data && typeof obj.data === 'object') ? obj.data
          : (obj.article && typeof obj.article === 'object') ? obj.article
          : (obj.result && typeof obj.result === 'object') ? obj.result
          : obj;
        const w = wrapped as Record<string, any>;
        const t = w.Title ?? w.title ?? '';
        if (!usedTitle) setTitle(t);
        if (!usedBlocks) {
          const blocksSource = w.Content?.blocks || w.content?.blocks || [];
          const normalized = Array.isArray(blocksSource) ? blocksSource.map((block:any) => {
            const t = (block?.type || '').toLowerCase();
            const d = block?.data || {};
            // Map various backend shapes into our preview schema
            if (t === 'header') {
              return {
                id: crypto.randomUUID(),
                type: 'heading',
                data: { content: d.text || d.content || '', level: d.level || 1, align: d.align }
              } as Block;
            }
            if (t === 'list') {
              const listKind = (d.style === 'ordered' || d.list === 'ol') ? 'ol' : 'ul';
              const items = Array.isArray(d.items)
                ? d.items.map((it: any) => {
                    if (typeof it === 'string') return { spans: [{ text: String(it) }] };
                    if (Array.isArray(it?.spans)) return { spans: it.spans };
                    return { spans: [{ text: String(it?.text || '') }] };
                  })
                : [];
              return { id: crypto.randomUUID(), type: 'paragraph', data: { list: listKind, items, align: d.align } } as Block;
            }
            if (t === 'paragraph') {
              // Ensure spans exist when only plain text provided
              const out: any = { ...d };
              if (!Array.isArray(out.spans) && !Array.isArray(out.items)) {
                const text = typeof out.text === 'string' ? out.text : (typeof out.content === 'string' ? out.content : '');
                out.spans = [{ text }];
              }
              return { id: crypto.randomUUID(), type: 'paragraph', data: out } as Block;
            }
            if (t === 'rawhtml' || t === 'raw' || t === 'html') {
              return { id: crypto.randomUUID(), type: 'rawhtml', data: { html: d.html || d.content || '' } } as Block;
            }
            return { id: crypto.randomUUID(), type: block.type, data: d } as Block;
          }) : [];
          setBlocks(normalized);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  // Live updates: listen for storage events from editor after Update
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!id) return;
      if (e.key === `previewLive:${id}` && typeof e.newValue === 'string') {
        try {
          const payload = JSON.parse(e.newValue);
          if (payload && Array.isArray(payload.blocks)) {
            setTitle(typeof payload.title === 'string' ? payload.title : title);
            setBlocks(payload.blocks);
          }
        } catch {/* ignore */}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [id, title]);

  const articleHeader = useMemo(() => (
    <header className="mb-6">
      <div className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900">{title || 'Untitled'}</div>
    </header>
  ), [title]);

  if (loading) return <div className="mx-auto max-w-3xl p-6">Loading…</div>;
  if (error) return <div className="mx-auto max-w-3xl p-6 text-red-600">{error}</div>;

  return (
    <div className="fixed left-1/2 top-6 transform -translate-x-1/2 w-[80vw] max-w-[1600px] pt-6 px-8 pb-6 z-50 bg-white rounded-xl shadow-xl overflow-visible">
      {/* X button to close preview and go back to editor - positioned outside the card */}
      <button
        onClick={() => navigate(`/artikel/${id}`)}
        className="absolute -top-6 right-4 z-50 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full w-10 h-10 flex items-center justify-center shadow"
        title="Close preview"
        aria-label="Close preview"
      >
        <span className="text-2xl font-bold">×</span>
      </button>
          <article className="prose prose-gray mx-auto w-full space-y-6 max-h-[calc(100vh-4rem)] overflow-auto">
        {articleHeader}
        <PureBlocks blocks={blocks} />
      </article>
    </div>
  );
};

export default Preview;
