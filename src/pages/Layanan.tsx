import React from 'react';
import toast from 'react-hot-toast';
import GlobalLayout from '../components/layout/GlobalLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
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

const Layanan = () => {
  const [services, setServices] = React.useState<Service[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/services', { credentials: 'include' });
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        if (!cancelled) setServices(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) toast.error('Gagal memuat layanan');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byCategory = services.reduce<Record<string, Service[]>>((acc, s) => {
    (acc[s.category_label || s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <GlobalLayout>
      <PageHeader
        title="Halaman Layanan"
        subtitle="Isi halaman di bawah /services pada situs publik."
      />
      <Card>

        {loading ? (
          <p className="py-12 text-center text-[0.8125rem] text-[var(--p-text-secondary)]">Memuat…</p>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <i className="fa fa-layer-group mb-4 text-4xl text-[var(--p-text-disabled)]" aria-hidden="true" />
            <p className="font-medium text-[var(--p-text)]">Belum ada halaman layanan</p>
            <p className="max-w-md text-[0.8125rem] text-[var(--p-text-secondary)]">
              Formulir untuk ketiga template layanan sedang disiapkan. Halaman yang sudah
              dibuat akan muncul di sini, dikelompokkan per kategori.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(byCategory).map(([category, list]) => (
              <section key={category}>
                <h2 className="mb-2 text-[0.6875rem] font-medium uppercase tracking-wide text-[var(--p-text-disabled)]">
                  {category}
                </h2>
                <div className="grid gap-3">
                  {list.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-[var(--p-border)] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-[var(--p-text)]">{s.title}</span>
                          <Badge tone={templateTone[s.template] ?? 'neutral'}>
                            {templateLabel[s.template] ?? s.template}
                          </Badge>
                          {s.published ? (
                            <Badge tone="success" dot>Tayang</Badge>
                          ) : (
                            <Badge dot>Draft</Badge>
                          )}
                        </div>
                        <p className="truncate text-xs text-[var(--p-text-secondary)]">
                          /services/{s.category}/{s.slug}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </Card>
    </GlobalLayout>
  );
};

export default Layanan;
