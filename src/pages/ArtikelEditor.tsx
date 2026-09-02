import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import GlobalLayout from '../components/layout/GlobalLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/atoms/Button';
import ImageWithFallback from '../components/atoms/ImageWithFallback';
import { TextField, TextArea, Toggle } from '../components/ui/Field';
import BlockEditor from '../components/editor/BlockEditor';
import { useMediaPicker } from '../components/ui/useMediaPicker';
import { apiFetch, imageURL } from '@/lib/api';
import {
  fromStored,
  toStored,
  makeBlock,
  readingMinutes,
  firstParagraph,
  slugify,
} from '@/lib/blocks';
import type { Block } from '@/lib/blocks';

type Category = { id: number; name: string; slug: string };

type Article = {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  meta_title: string;
  meta_description: string;
  featured_image: string;
  alt_text: string;
  canonical_url: string;
  reading_time: number;
  is_featured: boolean;
  published_at: string | null;
  status_id: number;
  status_detail?: { id: number; name: string };
  categories: Category[];
  content: unknown;
};

const empty = (): Article => ({
  title: '',
  slug: '',
  excerpt: '',
  meta_title: '',
  meta_description: '',
  featured_image: '',
  alt_text: '',
  canonical_url: '',
  reading_time: 0,
  is_featured: false,
  published_at: null,
  status_id: 0,
  categories: [],
  content: { blocks: [] },
});

const ArtikelEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'baru';

  const [article, setArticle] = React.useState<Article>(empty);
  const [blocks, setBlocks] = React.useState<Block[]>([makeBlock()]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(!isNew);
  const [saving, setSaving] = React.useState(false);
  const [slugTouched, setSlugTouched] = React.useState(!isNew);

  const { pick, modal } = useMediaPicker();

  const baseline = React.useRef('');
  const latest = React.useRef<{ article: Article; blocks: Block[]; id?: string; dirty: boolean }>({
    article: empty(),
    blocks: [],
    id,
    dirty: false,
  });

  React.useEffect(() => {
    apiFetch('/api/categories', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => undefined);
  }, []);

  React.useEffect(() => {
    if (isNew) {
      baseline.current = JSON.stringify({ article: empty(), blocks: [] });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/api/articles/${id}`, { credentials: 'include' });
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        if (cancelled) return;
        const loaded: Article = { ...empty(), ...data, categories: data.categories ?? [] };
        const loadedBlocks = fromStored(data.content);
        setArticle(loaded);
        setBlocks(loadedBlocks);
        baseline.current = JSON.stringify({ article: loaded, blocks: loadedBlocks });
      } catch {
        if (!cancelled) toast.error('Gagal memuat artikel');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  const dirty =
    baseline.current !== '' && JSON.stringify({ article, blocks }) !== baseline.current;

  React.useEffect(() => {
    latest.current = { article, blocks, id, dirty };
  }, [article, blocks, id, dirty]);

  React.useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!latest.current.dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Leaving mid-draft saves rather than discards. Status is never touched, so
  // an autosave cannot publish anything.
  React.useEffect(
    () => () => {
      const current = latest.current;
      if (!current.dirty || !current.article.title.trim()) return;
      const creating = !current.id || current.id === 'baru';
      apiFetch(creating ? '/api/articles' : `/api/articles/${current.id}`, {
        method: creating ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...current.article,
          content: toStored(current.blocks),
        }),
      })
        .then((res) => {
          if (res.ok) toast.success('Tersimpan sebagai draf');
        })
        .catch(() => undefined);
    },
    [],
  );

  const set = <K extends keyof Article>(key: K, value: Article[K]) =>
    setArticle((prev) => ({ ...prev, [key]: value }));

  const onTitleChange = (value: string) =>
    setArticle((prev) => ({
      ...prev,
      title: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));

  const save = async () => {
    if (!article.title.trim()) {
      toast.error('Judul wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...article,
        slug: article.slug || slugify(article.title),
        // Filled from the draft when left blank, rather than shipping empty SEO.
        excerpt: article.excerpt || firstParagraph(blocks),
        reading_time: article.reading_time || readingMinutes(blocks),
        content: toStored(blocks),
      };

      const res = await apiFetch(isNew ? '/api/articles' : `/api/articles/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? 'Gagal menyimpan');
        return;
      }

      const saved = await res.json();
      baseline.current = JSON.stringify({ article: { ...article, ...payload }, blocks });
      toast.success('Tersimpan');
      if (isNew) navigate(`/artikel/${saved.id}`, { replace: true });
      else setArticle((prev) => ({ ...prev, ...saved, categories: saved.categories ?? [] }));
    } catch {
      toast.error('Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (isNew) {
      toast.error('Simpan dulu sebelum menerbitkan');
      return;
    }
    const res = await apiFetch(`/api/articles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error('Gagal mengubah status');
      return;
    }
    const saved = await res.json();
    setArticle((prev) => ({ ...prev, ...saved, categories: saved.categories ?? [] }));
    toast.success(status === 'PUBLISHED' ? 'Diterbitkan' : 'Dikembalikan ke draf');
  };

  const toggleCategory = (category: Category) =>
    setArticle((prev) => ({
      ...prev,
      categories: prev.categories.some((c) => c.id === category.id)
        ? prev.categories.filter((c) => c.id !== category.id)
        : [...prev.categories, category],
    }));

  const published = article.status_detail?.name === 'PUBLISHED';

  if (loading) {
    return (
      <GlobalLayout>
        <p className="py-16 text-center text-[0.8125rem] text-[var(--p-text-secondary)]">Memuat…</p>
      </GlobalLayout>
    );
  }

  return (
    <GlobalLayout wide>
      {modal}

      <PageHeader
        title={article.title || 'Artikel baru'}
        onBack={() => navigate('/artikel')}
        badges={published ? <Badge tone="success" dot>Tayang</Badge> : <Badge dot>Draf</Badge>}
        subtitle={article.slug ? `/blog/${article.slug}` : 'Belum punya alamat'}
        actions={
          <>
            {dirty && <span className="text-xs text-[var(--p-text-secondary)]">Belum tersimpan</span>}
            {!isNew &&
              (published ? (
                <Button onClick={() => void setStatus('DRAFT')}>Jadikan draf</Button>
              ) : (
                <Button onClick={() => void setStatus('PUBLISHED')}>Terbitkan</Button>
              ))}
            <Button
              variant="primary"
              onClick={() => void save()}
              disabled={saving}
              icon={saving ? 'fa-spinner fa-spin' : undefined}
            >
              {saving ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <input
              value={article.title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Judul artikel"
              className="mb-4 w-full border-0 bg-transparent p-0 text-3xl font-semibold text-[var(--p-text)] outline-none placeholder:text-[var(--p-text-disabled)]"
              style={{ fontFamily: 'inherit' }}
            />
            <BlockEditor blocks={blocks} onChange={setBlocks} pickImage={pick} />
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Gambar Utama">
            <ImageWithFallback
              src={article.featured_image ? imageURL(article.featured_image) : ''}
              alt={article.alt_text}
              className="mb-3 h-32 w-full rounded-lg border border-[var(--p-border)] object-cover"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                icon="fa-images"
                onClick={async () => {
                  const url = await pick();
                  if (url) set('featured_image', url);
                }}
              >
                Pilih gambar
              </Button>
              {article.featured_image && (
                <Button variant="plain" onClick={() => set('featured_image', '')}>
                  Hapus
                </Button>
              )}
            </div>
            <div className="mt-3">
              <TextField
                label="Teks alternatif"
                hint="Dibaca pembaca tunanetra dan mesin pencari."
                value={article.alt_text}
                onChange={(v) => set('alt_text', v)}
              />
            </div>
          </Card>

          <Card title="Kategori">
            {categories.length === 0 ? (
              <p className="text-[0.8125rem] text-[var(--p-text-secondary)]">
                Belum ada kategori. Buat dulu di menu Kategori.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => {
                  const on = article.categories.some((x) => x.id === c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c)}
                      className={`rounded-lg px-2.5 py-1 text-[0.8125rem] ${
                        on ? 'bg-[#303030] text-white' : 'bg-[#f1f1f1] text-[var(--p-text)] hover:bg-[#e3e3e3]'
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          <Card title="SEO">
            <div className="space-y-3">
              <TextField
                label="Slug"
                hint="Bagian akhir alamat. Hindari mengubah setelah tayang."
                value={article.slug}
                onChange={(v) => {
                  setSlugTouched(true);
                  set('slug', slugify(v));
                }}
              />
              <TextArea
                label="Ringkasan"
                rows={3}
                hint="Muncul di daftar blog. Diambil dari paragraf pertama bila dikosongkan."
                value={article.excerpt}
                onChange={(v) => set('excerpt', v)}
              />
              <TextArea
                label="Meta description"
                rows={3}
                value={article.meta_description}
                onChange={(v) => set('meta_description', v)}
              />
              <TextField
                label="Waktu baca (menit)"
                type="number"
                hint={`Dihitung otomatis sekitar ${readingMinutes(blocks)} menit bila dikosongkan.`}
                value={String(article.reading_time || '')}
                onChange={(v) => set('reading_time', Number(v) || 0)}
              />
              <Toggle
                label="Tandai sebagai unggulan"
                checked={article.is_featured}
                onChange={(v) => set('is_featured', v)}
              />
            </div>
          </Card>
        </div>
      </div>
    </GlobalLayout>
  );
};

export default ArtikelEditor;
