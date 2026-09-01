import React from 'react';
import toast from 'react-hot-toast';
import GlobalLayout from '../components/layout/GlobalLayout';
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

const templateStyle: Record<string, string> = {
  program: 'bg-blue-50 text-blue-700',
  engagement: 'bg-purple-50 text-purple-700',
  retainer: 'bg-amber-50 text-amber-700',
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
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Halaman Layanan</h1>
            <p className="text-sm text-gray-500 mt-1">
              Isi halaman di bawah /services pada situs publik.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500 py-12 text-center">Memuat…</p>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <i className="fa fa-layer-group text-5xl text-gray-300 mb-4" aria-hidden="true" />
            <p className="text-gray-600 font-medium">Belum ada halaman layanan</p>
            <p className="text-gray-400 text-sm max-w-md">
              Formulir untuk ketiga template layanan sedang disiapkan. Halaman yang sudah
              dibuat akan muncul di sini, dikelompokkan per kategori.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(byCategory).map(([category, list]) => (
              <section key={category}>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
                  {category}
                </h2>
                <div className="grid gap-3">
                  {list.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 truncate">{s.title}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full ${templateStyle[s.template] ?? 'bg-gray-100 text-gray-600'}`}>
                            {templateLabel[s.template] ?? s.template}
                          </span>
                          {!s.published && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                              Draft
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
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
      </div>
    </GlobalLayout>
  );
};

export default Layanan;
