import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import GlobalLayout from '@/components/layout/GlobalLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/atoms/Button';
import ActionMenu from '@/components/ui/ActionMenu';
import ImageWithFallback from '@/components/atoms/ImageWithFallback';
import { apiFetch, imageURL } from '@/lib/api';
import { useArticle, statusName, isPublished } from '@/hooks/useArticle';
import type { Article } from '@/hooks/useArticle';

const SITE = 'https://excellenceplus.id';
const VIEW_KEY = 'artikel:view';
const PER_PAGE = 12;

type Tone = 'neutral' | 'success' | 'warning' | 'critical' | 'info';
type ViewMode = 'grid' | 'list';

const STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Draf', tone: 'warning' },
  PUBLISHED: { label: 'Tayang', tone: 'success' },
  ARCHIVED: { label: 'Arsip', tone: 'neutral' },
  DELETED: { label: 'Dibuang', tone: 'critical' },
};

const dateFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
});

const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

const ArticlePage = () => {
  const navigate = useNavigate();
  const { articles, loading, error, reload } = useArticle();
  const [page, setPage] = React.useState(1);
  const [filter, setFilter] = React.useState('');

  const [view, setView] = React.useState<ViewMode>(() => {
    try {
      return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      // Blocked storage is not a reason to break the page.
    }
  }, [view]);

  const setStatus = async (article: Article, status: 'DRAFT' | 'PUBLISHED') => {
    // PATCH, not PUT: the list holds summary fields and a full update would
    // blank the article body it does not carry.
    const res = await apiFetch(`/api/articles/${article.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error('Gagal mengubah status');
      return;
    }
    toast.success(status === 'PUBLISHED' ? 'Diterbitkan' : 'Dikembalikan ke draf');
    await reload();
  };

  const remove = async (article: Article) => {
    if (!window.confirm(`Buang artikel "${article.title}"?`)) return;
    const res = await apiFetch(`/api/articles/${article.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      toast.error('Gagal membuang artikel');
      return;
    }
    toast.success('Dibuang');
    await reload();
  };

  const actionsFor = (a: Article) => [
    // Only offered once published: a draft has no page on the site to open.
    ...(isPublished(a) && a.slug
      ? [
          {
            label: 'Lihat di situs',
            icon: 'fa-arrow-up-right-from-square',
            href: `${SITE}/blog/${a.slug}`,
          },
        ]
      : []),
    { label: 'Edit', icon: 'fa-pen', onSelect: () => navigate(`/artikel/${a.id}`) },
    isPublished(a)
      ? { label: 'Jadikan draf', icon: 'fa-eye-slash', onSelect: () => void setStatus(a, 'DRAFT') }
      : { label: 'Terbitkan', icon: 'fa-eye', onSelect: () => void setStatus(a, 'PUBLISHED') },
    { label: 'Buang', icon: 'fa-trash', danger: true, onSelect: () => void remove(a) },
  ];

  const statusBadge = (a: Article) => {
    const meta = STATUS[statusName(a)] ?? { label: statusName(a), tone: 'neutral' as Tone };
    return (
      <Badge tone={meta.tone} dot={isPublished(a)}>
        {meta.label}
      </Badge>
    );
  };

  const filtered = filter ? articles.filter((a) => statusName(a) === filter) : articles;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const paged = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const summary = (a: Article) => truncate(a.excerpt || a.meta_description || '', 90);

  const meta = (a: Article) =>
    [
      a.published_at ? dateFormat.format(new Date(a.published_at)) : null,
      a.reading_time ? `${a.reading_time} menit baca` : null,
    ]
      .filter(Boolean)
      .join(' · ');

  const viewButton = (mode: ViewMode, icon: string, label: string) => (
    <button
      type="button"
      onClick={() => setView(mode)}
      aria-label={label}
      aria-pressed={view === mode}
      className={`flex h-7 w-8 items-center justify-center rounded-md text-xs ${
        view === mode ? 'bg-white text-[var(--p-text)] shadow-sm' : 'text-[var(--p-text-secondary)]'
      }`}
    >
      <i className={`fa ${icon}`} aria-hidden="true" />
    </button>
  );

  return (
    <GlobalLayout wide>
      <PageHeader
        title="Artikel"
        subtitle="Tulisan yang tayang di /blog"
        actions={
          <>
            <div className="flex items-center gap-0.5 rounded-lg border border-[var(--p-border)] bg-[#f1f1f1] p-0.5">
              {viewButton('grid', 'fa-grip', 'Tampilan kartu')}
              {viewButton('list', 'fa-list', 'Tampilan daftar')}
            </div>
            <Button variant="primary" icon="fa-plus" onClick={() => navigate('/artikel/baru')}>
              Tulis artikel
            </Button>
          </>
        }
      />

      <Card flush>
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--p-border)] px-4 py-2.5">
          {[
            { value: '', label: 'Semua' },
            { value: 'PUBLISHED', label: 'Tayang' },
            { value: 'DRAFT', label: 'Draf' },
          ].map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setFilter(f.value);
                setPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 text-[0.8125rem] ${
                filter === f.value ? 'bg-[#e3e3e3] font-semibold' : 'hover:bg-[#f1f1f1]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {loading ? (
            <p className="py-12 text-center text-[0.8125rem] text-[var(--p-text-secondary)]">Memuat…</p>
          ) : error ? (
            <p className="py-12 text-center text-[0.8125rem] text-[var(--p-critical)]">{error}</p>
          ) : paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <i className="fa fa-newspaper mb-4 text-4xl text-[var(--p-text-disabled)]" aria-hidden="true" />
              <p className="font-medium text-[var(--p-text)]">Belum ada artikel</p>
              <p className="text-[0.8125rem] text-[var(--p-text-secondary)]">
                Mulai dengan tombol Tulis artikel di atas.
              </p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {paged.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col overflow-hidden rounded-lg border border-[var(--p-border)] bg-white transition hover:border-[var(--p-border-strong)]"
                >
                  {/* The card itself opens the editor, so nothing competes with it. */}
                  <Link to={`/artikel/${a.id}`} className="block">
                    <ImageWithFallback
                      src={a.featured_image ? imageURL(a.featured_image) : ''}
                      alt={a.alt_text || a.title}
                      className="aspect-video w-full bg-[#fafafa] object-cover"
                      iconClassName="text-3xl"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col p-3">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {statusBadge(a)}
                        {a.categories?.map((c) => (
                          <span key={c.id} className="text-xs text-[var(--p-text-secondary)]">
                            {c.name}
                          </span>
                        ))}
                      </div>
                      <ActionMenu actions={actionsFor(a)} />
                    </div>
                    <Link to={`/artikel/${a.id}`} className="min-w-0 flex-1">
                      <h2 className="font-medium text-[var(--p-text)]">{a.title}</h2>
                      {summary(a) && (
                        <p className="mt-1 text-[0.8125rem] text-[var(--p-text-secondary)]">
                          {summary(a)}
                        </p>
                      )}
                    </Link>
                    {meta(a) && <p className="mt-2 text-xs text-[var(--p-text-disabled)]">{meta(a)}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-2">
              {paged.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-lg border border-[var(--p-border)] px-3 py-2.5 hover:bg-[var(--p-surface-hover)]"
                >
                  <ImageWithFallback
                    src={a.featured_image ? imageURL(a.featured_image) : ''}
                    alt={a.alt_text || a.title}
                    className="h-12 w-16 shrink-0 rounded bg-[#fafafa] object-cover"
                    iconClassName="text-sm"
                  />
                  <Link to={`/artikel/${a.id}`} className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium text-[var(--p-text)]">{a.title}</span>
                      {statusBadge(a)}
                      {a.categories?.map((c) => (
                        <span key={c.id} className="text-xs text-[var(--p-text-secondary)]">
                          {c.name}
                        </span>
                      ))}
                    </div>
                    <p className="truncate text-xs text-[var(--p-text-secondary)]">
                      {[`/blog/${a.slug}`, meta(a)].filter(Boolean).join(' · ')}
                    </p>
                  </Link>
                  <ActionMenu actions={actionsFor(a)} />
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button disabled={current === 1} onClick={() => setPage(current - 1)}>
                Sebelumnya
              </Button>
              <span className="text-[0.8125rem] text-[var(--p-text-secondary)]">
                {current} / {totalPages}
              </span>
              <Button disabled={current === totalPages} onClick={() => setPage(current + 1)}>
                Berikutnya
              </Button>
            </div>
          )}
        </div>
      </Card>
    </GlobalLayout>
  );
};

export default ArticlePage;
