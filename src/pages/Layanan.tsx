import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import GlobalLayout from '../components/layout/GlobalLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/atoms/Button';
import ActionMenu from '../components/ui/ActionMenu';
import { apiFetch } from '@/lib/api';

type Service = {
  id: number;
  slug: string;
  category: string;
  category_label: string;
  template: string;
  title: string;
  subtitle: string;
  published: boolean;
};

const templateLabel: Record<string, string> = {
  program: 'Program',
  engagement: 'Engagement',
  retainer: 'Layanan berkelanjutan',
};

const templateTone: Record<string, 'info' | 'neutral' | 'warning'> = {
  program: 'info',
  engagement: 'neutral',
  retainer: 'warning',
};

const SITE = 'https://excellenceplus.id';
const VIEW_KEY = 'layanan:view';

type ViewMode = 'list' | 'cards';

const Layanan = () => {
  const navigate = useNavigate();
  const [services, setServices] = React.useState<Service[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Remembered per browser so the choice survives a reload.
  const [view, setView] = React.useState<ViewMode>(() => {
    try {
      return localStorage.getItem(VIEW_KEY) === 'cards' ? 'cards' : 'list';
    } catch {
      return 'list';
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      // A blocked storage API is not a reason to break the page.
    }
  }, [view]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/services', { credentials: 'include' });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Gagal memuat layanan');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  // PATCH rather than PUT: the full update replaces child rows, so publishing
  // from here would delete the page's own content.
  const togglePublished = async (service: Service) => {
    const res = await apiFetch(`/api/services/${service.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ published: !service.published }),
    });
    if (!res.ok) {
      toast.error('Gagal mengubah status');
      return;
    }
    toast.success(service.published ? 'Dinonaktifkan' : 'Diaktifkan');
    await load();
  };

  const actionsFor = (s: Service) => [
    {
      label: 'Lihat layanan',
      icon: 'fa-arrow-up-right-from-square',
      href: `${SITE}/services/${s.category}/${s.slug}`,
    },
    { label: 'Edit', icon: 'fa-pen', onSelect: () => navigate(`/halaman/${s.id}`) },
    {
      label: s.published ? 'Nonaktifkan' : 'Aktifkan',
      icon: s.published ? 'fa-eye-slash' : 'fa-eye',
      onSelect: () => void togglePublished(s),
    },
  ];

  const statusBadges = (s: Service) => (
    <>
      <Badge tone={templateTone[s.template] ?? 'neutral'}>
        {templateLabel[s.template] ?? s.template}
      </Badge>
      {s.published ? <Badge tone="success" dot>Tayang</Badge> : <Badge dot>Draft</Badge>}
    </>
  );

  const byCategory = services.reduce<Record<string, Service[]>>((acc, s) => {
    (acc[s.category_label || s.category] ??= []).push(s);
    return acc;
  }, {});

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
        title="Halaman Layanan"
        subtitle="Isi halaman di bawah /services pada situs publik."
        actions={
          <>
            <div className="flex items-center gap-0.5 rounded-lg border border-[var(--p-border)] bg-[#f1f1f1] p-0.5">
              {viewButton('list', 'fa-list', 'Tampilan daftar')}
              {viewButton('cards', 'fa-grip', 'Tampilan kartu')}
            </div>
            <Button variant="primary" icon="fa-plus" onClick={() => navigate('/halaman/baru')}>
              Tambah layanan
            </Button>
          </>
        }
      />

      <Card>
        {loading ? (
          <p className="py-12 text-center text-[0.8125rem] text-[var(--p-text-secondary)]">Memuat…</p>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <i className="fa fa-layer-group mb-4 text-4xl text-[var(--p-text-disabled)]" aria-hidden="true" />
            <p className="font-medium text-[var(--p-text)]">Belum ada halaman layanan</p>
            <p className="max-w-md text-[0.8125rem] text-[var(--p-text-secondary)]">
              Buat halaman pertama dengan tombol di atas, lalu pilih templatenya.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(byCategory).map(([category, list]) => (
              <section key={category}>
                <h2 className="mb-2 text-[0.6875rem] font-medium uppercase tracking-wide text-[var(--p-text-disabled)]">
                  {category}
                </h2>

                {view === 'list' ? (
                  <div className="grid gap-3">
                    {list.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 rounded-lg border border-[var(--p-border)] px-4 py-3 hover:bg-[var(--p-surface-hover)]"
                      >
                        <Link to={`/halaman/${s.id}`} className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate font-medium text-[var(--p-text)]">{s.title}</span>
                            {statusBadges(s)}
                          </div>
                          <p className="truncate text-xs text-[var(--p-text-secondary)]">
                            /services/{s.category}/{s.slug}
                          </p>
                        </Link>
                        <ActionMenu actions={actionsFor(s)} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {list.map((s) => (
                      <div
                        key={s.id}
                        className="flex flex-col rounded-lg border border-[var(--p-border)] p-4 hover:border-[var(--p-border-strong)]"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">{statusBadges(s)}</div>
                          <ActionMenu actions={actionsFor(s)} />
                        </div>
                        <Link to={`/halaman/${s.id}`} className="min-w-0 flex-1">
                          <p className="font-medium text-[var(--p-text)]">{s.title}</p>
                          {s.subtitle && (
                            <p className="mt-1 line-clamp-2 text-[0.8125rem] text-[var(--p-text-secondary)]">
                              {s.subtitle}
                            </p>
                          )}
                          <p className="mt-2 truncate text-xs text-[var(--p-text-disabled)]">
                            /services/{s.category}/{s.slug}
                          </p>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </Card>
    </GlobalLayout>
  );
};

export default Layanan;
