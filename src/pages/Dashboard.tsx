import React from 'react';
import toast from 'react-hot-toast';
import GlobalLayout from '../components/layout/GlobalLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { apiFetch } from '@/lib/api';

type CountPair = { key: string; count: number };

type Stats = {
  leads: {
    total: number;
    new: number;
    last_7_days: number;
    last_30_days: number;
    by_status: CountPair[];
    by_day: CountPair[];
    by_page: CountPair[];
  };
  content: {
    articles_published: number;
    articles_draft: number;
    services_published: number;
    services_draft: number;
    media: number;
  };
  upcoming: Array<{
    service: string;
    slug: string;
    category: string;
    starts_at: string | null;
    city: string;
    format: string;
    seats_total: number;
    seats_left: number;
    leads: number;
  }>;
};

const STATUS_LABEL: Record<string, string> = {
  new: 'Baru',
  contacted: 'Dihubungi',
  won: 'Deal',
  lost: 'Batal',
};

const dayFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });
const dateFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
});

/** The programme a lead came from, when the link carried one. */
const programOf = (path: string): string | null => {
  const match = /[?&]program=([^&]+)/.exec(path);
  return match ? decodeURIComponent(match[1]) : null;
};

const Metric: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({
  label,
  value,
  hint,
}) => (
  <div className="p-card px-4 py-3">
    <div className="text-[0.75rem] text-[var(--p-text-secondary)]">{label}</div>
    <div className="mt-1 text-[1.5rem] font-semibold leading-none tabular-nums">{value}</div>
    {hint && <div className="mt-1 text-[0.75rem] text-[var(--p-text-secondary)]">{hint}</div>}
  </div>
);

/**
 * Thirty daily counts as bars. Installing a chart library for one sparkline
 * would be more code than drawing it.
 */
const Trend: React.FC<{ days: CountPair[] }> = ({ days }) => {
  const peak = Math.max(1, ...days.map((d) => d.count));
  const label = (key: string) => dayFormat.format(new Date(`${key}T00:00:00`));

  return (
    <div>
      <div className="flex h-24 items-end gap-[3px]">
        {days.map((d) => (
          <div
            key={d.key}
            title={`${label(d.key)}: ${d.count} pesan`}
            className="flex-1 rounded-t-[2px] bg-[var(--p-link)]"
            style={{ height: `${Math.max(2, (d.count / peak) * 100)}%`, opacity: d.count ? 1 : 0.18 }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[0.75rem] text-[var(--p-text-secondary)]">
        <span>{days.length ? label(days[0].key) : ''}</span>
        <span>Puncak {peak} per hari</span>
        <span>{days.length ? label(days[days.length - 1].key) : ''}</span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiFetch('/api/stats', { credentials: 'include' });
        if (!res.ok) throw new Error('failed');
        const data = (await res.json()) as Stats;
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) toast.error('Gagal memuat statistik');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byStatus = stats?.leads.by_status ?? [];
  const byPage = stats?.leads.by_page ?? [];
  const pageMax = Math.max(1, ...byPage.map((p) => p.count));

  return (
    <GlobalLayout>
      <PageHeader
        title="Dashboard"
        badges={<Badge tone="success" dot>Live</Badge>}
        subtitle="Angka dihitung langsung dari basis data setiap kali halaman ini dibuka"
      />

      {loading && !stats ? (
        <p className="text-[0.8125rem] text-[var(--p-text-secondary)]">Memuat…</p>
      ) : !stats ? (
        <Card title="Statistik tidak tersedia">
          <p className="text-[0.8125rem] text-[var(--p-text-secondary)]">
            API tidak menjawab. Muat ulang halaman, atau periksa layanan admin-api.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Pesan masuk 7 hari"
              value={stats.leads.last_7_days}
              hint={`${stats.leads.last_30_days} dalam 30 hari`}
            />
            <Metric
              label="Belum ditangani"
              value={stats.leads.new}
              hint={`dari ${stats.leads.total} total`}
            />
            <Metric
              label="Halaman layanan tayang"
              value={stats.content.services_published}
              hint={
                stats.content.services_draft
                  ? `${stats.content.services_draft} masih draf`
                  : 'tidak ada draf'
              }
            />
            <Metric
              label="Artikel tayang"
              value={stats.content.articles_published}
              hint={
                stats.content.articles_draft
                  ? `${stats.content.articles_draft} masih draf`
                  : 'tidak ada draf'
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Card title="Pesan masuk, 30 hari terakhir">
                <Trend days={stats.leads.by_day} />
              </Card>

              <Card title="Dari halaman mana">
                {byPage.length === 0 ? (
                  <p className="text-[0.8125rem] text-[var(--p-text-secondary)]">
                    Belum ada pesan masuk.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {byPage.map((p) => {
                      const program = programOf(p.key);
                      return (
                        <li key={p.key}>
                          <div className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
                            <span className="truncate" title={p.key}>
                              {program ? (
                                <>
                                  Pendaftaran <strong>{program}</strong>
                                </>
                              ) : (
                                p.key
                              )}
                            </span>
                            <span className="tabular-nums text-[var(--p-text-secondary)]">
                              {p.count}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-[var(--p-border)]">
                            <div
                              className="h-full rounded-full bg-[var(--p-link)]"
                              style={{ width: `${(p.count / pageMax) * 100}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>

            <div className="space-y-4">
              <Card title="Batch terdekat">
                {stats.upcoming.length === 0 ? (
                  <p className="text-[0.8125rem] text-[var(--p-text-secondary)]">
                    Belum ada jadwal mendatang. Tambahkan lewat halaman Layanan.
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--p-border)] text-[0.8125rem]">
                    {stats.upcoming.map((b) => (
                      <li key={`${b.slug}-${b.starts_at}`} className="py-2.5 first:pt-0 last:pb-0">
                        <div className="font-medium">{b.service}</div>
                        <div className="text-[var(--p-text-secondary)]">
                          {b.starts_at
                            ? dateFormat.format(new Date(b.starts_at))
                            : 'tanggal belum diisi'}
                          {b.city ? ` · ${b.city}` : ''}
                        </div>
                        <div className="mt-1 tabular-nums text-[var(--p-text-secondary)]">
                          {b.leads} pendaftar · sisa {b.seats_left}
                          {b.seats_total ? `/${b.seats_total}` : ''} kursi
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card title="Status pesan">
                {byStatus.length === 0 ? (
                  <p className="text-[0.8125rem] text-[var(--p-text-secondary)]">Belum ada data.</p>
                ) : (
                  <dl className="space-y-2 text-[0.8125rem]">
                    {byStatus.map((s) => (
                      <div key={s.key} className="flex justify-between gap-3">
                        <dt className="text-[var(--p-text-secondary)]">
                          {STATUS_LABEL[s.key] ?? s.key}
                        </dt>
                        <dd className="tabular-nums">{s.count}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </Card>

              <Card title="Pustaka media">
                <p className="text-[0.8125rem] text-[var(--p-text-secondary)]">
                  {stats.content.media} berkas tersimpan.
                </p>
              </Card>
            </div>
          </div>
        </div>
      )}
    </GlobalLayout>
  );
};

export default Dashboard;
