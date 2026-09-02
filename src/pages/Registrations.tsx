import React from 'react';
import toast from 'react-hot-toast';
import GlobalLayout from '../components/layout/GlobalLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/atoms/Button';
import { apiFetch } from '@/lib/api';

type Registration = {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  company_address: string;
  division: string;
  position: string;
  city: string;
  certificate_address: string;
  referral_source: string;
  message: string;
  source_path: string;
  status: string;
  note: string;
  created_at: string;
};

type Stage = 'permintaan' | 'peserta';

type Tone = 'neutral' | 'success' | 'warning' | 'critical' | 'info';

const STATUS_META: Record<string, { label: string; tone: Tone }> = {
  new: { label: 'Baru', tone: 'info' },
  contacted: { label: 'Diproses', tone: 'warning' },
  enrolled: { label: 'Peserta', tone: 'success' },
  lost: { label: 'Batal', tone: 'critical' },
};

const DETAILS: Array<[keyof Registration, string]> = [
  ['company', 'Instansi'],
  ['company_address', 'Alamat perusahaan'],
  ['division', 'Divisi'],
  ['position', 'Jabatan'],
  ['city', 'Kota domisili'],
  ['certificate_address', 'Kirim sertifikat'],
  ['referral_source', 'Info dari'],
];

const dateFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Jakarta',
});

/** Digits only, with the leading zero swapped for the country code. */
const waLink = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  return `https://wa.me/${digits.startsWith('0') ? `62${digits.slice(1)}` : digits}`;
};

/** The programme slug the registration was submitted against. */
const programSlug = (path: string): string | null => {
  const match = /[?&]program=([^&]+)/.exec(path);
  return match ? decodeURIComponent(match[1]) : null;
};

const COPY: Record<Stage, { title: string; subtitle: string; empty: string; hint: string }> = {
  permintaan: {
    title: 'Permintaan Pendaftaran',
    subtitle: 'Pendaftaran yang masuk dan belum dikonfirmasi bayar',
    empty: 'Belum ada permintaan pendaftaran',
    hint: 'Pendaftaran dari formulir di situs akan muncul di sini.',
  },
  peserta: {
    title: 'Peserta',
    subtitle: 'Sudah membayar dan terjadwal di batch',
    empty: 'Belum ada peserta',
    hint: 'Sebuah permintaan menjadi peserta setelah ditandai sudah bayar.',
  },
};

const Registrations: React.FC<{ stage: Stage }> = ({ stage }) => {
  const [rows, setRows] = React.useState<Registration[]>([]);
  const [programs, setPrograms] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [openId, setOpenId] = React.useState<number | null>(null);
  const [noteDraft, setNoteDraft] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/leads?stage=${stage}&limit=200`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setRows(Array.isArray(data.items) ? data.items : []);
    } catch {
      toast.error('Gagal memuat data pendaftaran');
    } finally {
      setLoading(false);
    }
  }, [stage]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Programme titles, so a row reads "Sertifikasi Trainer" rather than a slug.
  React.useEffect(() => {
    let cancelled = false;
    apiFetch('/api/services', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        if (cancelled || !Array.isArray(list)) return;
        setPrograms(
          Object.fromEntries(list.map((s: { slug: string; title: string }) => [s.slug, s.title])),
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const open = (row: Registration) => {
    const next = openId === row.id ? null : row.id;
    setOpenId(next);
    setNoteDraft(next === null ? '' : (row.note ?? ''));
  };

  const patch = async (row: Registration, body: Record<string, unknown>) => {
    const res = await apiFetch(`/api/leads/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      toast.error('Gagal menyimpan perubahan');
      return;
    }
    toast.success('Tersimpan');
    void load();
  };

  const copy = COPY[stage];

  return (
    <GlobalLayout wide>
      <PageHeader
        title={copy.title}
        badges={
          rows.length > 0 ? (
            <Badge tone={stage === 'peserta' ? 'success' : 'info'}>{rows.length}</Badge>
          ) : undefined
        }
        subtitle={copy.subtitle}
        actions={
          <Button icon="fa-rotate" onClick={() => void load()}>
            Muat ulang
          </Button>
        }
      />

      <Card flush>
        {loading ? (
          <p className="py-12 text-center text-[0.8125rem] text-[var(--p-text-secondary)]">
            Memuat…
          </p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <i
              className="fa fa-clipboard-list mb-4 text-4xl text-[var(--p-text-disabled)]"
              aria-hidden="true"
            />
            <p className="font-medium text-[var(--p-text)]">{copy.empty}</p>
            <p className="text-[0.8125rem] text-[var(--p-text-secondary)]">{copy.hint}</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--p-border)]">
            {rows.map((row) => {
              const meta = STATUS_META[row.status] ?? { label: row.status, tone: 'neutral' as Tone };
              const expanded = openId === row.id;
              const wa = waLink(row.phone);
              const slug = programSlug(row.source_path);

              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => open(row)}
                    aria-expanded={expanded}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[var(--p-surface-hover)]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-[var(--p-text)]">{row.name}</span>
                        <Badge tone={meta.tone} dot={row.status === 'new'}>
                          {meta.label}
                        </Badge>
                        {slug && (
                          <span className="text-xs text-[var(--p-text-secondary)]">
                            {programs[slug] ?? slug}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[0.8125rem] text-[var(--p-text-secondary)]">
                        {[row.position, row.company, row.city].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-[var(--p-text-secondary)]">
                      {dateFormat.format(new Date(row.created_at))}
                    </span>
                  </button>

                  {expanded && (
                    <div className="border-t border-[var(--p-border)] bg-[#fafafa] px-4 py-4">
                      <div className="grid gap-4 lg:grid-cols-3">
                        <dl className="space-y-1.5 text-[0.8125rem]">
                          <div className="flex gap-2">
                            <dt className="w-28 shrink-0 text-[var(--p-text-secondary)]">Email</dt>
                            <dd className="min-w-0 break-all">
                              <a
                                className="text-[var(--p-link)] hover:underline"
                                href={`mailto:${row.email}`}
                              >
                                {row.email}
                              </a>
                            </dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="w-28 shrink-0 text-[var(--p-text-secondary)]">
                              Telepon
                            </dt>
                            <dd className="min-w-0">
                              {wa ? (
                                <a
                                  className="text-[var(--p-link)] hover:underline"
                                  href={wa}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {row.phone}
                                </a>
                              ) : (
                                row.phone
                              )}
                            </dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="w-28 shrink-0 text-[var(--p-text-secondary)]">
                              Program
                            </dt>
                            <dd className="min-w-0">{slug ? (programs[slug] ?? slug) : '-'}</dd>
                          </div>
                        </dl>

                        <dl className="grid gap-1.5 rounded-lg border border-[var(--p-border)] bg-white p-3 text-[0.8125rem] lg:col-span-2">
                          {DETAILS.map(([field, label]) => (
                            <div key={field} className="flex gap-2">
                              <dt className="w-32 shrink-0 text-[var(--p-text-secondary)]">
                                {label}
                              </dt>
                              <dd className="min-w-0">{String(row[field] || '-')}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>

                      {row.message && (
                        <p className="mt-3 whitespace-pre-wrap rounded-lg border border-[var(--p-border)] bg-white p-3 text-[0.8125rem]">
                          {row.message}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {stage === 'permintaan' ? (
                          <>
                            <Button
                              variant="primary"
                              onClick={() => void patch(row, { status: 'enrolled' })}
                            >
                              Sudah bayar &amp; terjadwal
                            </Button>
                            <Button
                              variant={row.status === 'contacted' ? 'primary' : 'secondary'}
                              onClick={() => void patch(row, { status: 'contacted' })}
                            >
                              Sedang diproses
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => void patch(row, { status: 'lost' })}
                            >
                              Batal
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="secondary"
                            onClick={() => void patch(row, { status: 'contacted' })}
                          >
                            Kembalikan ke permintaan
                          </Button>
                        )}
                        {wa && (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#cdcdcd] bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-[#303030] hover:bg-[#f7f7f7]"
                          >
                            <i className="fa fa-comments" aria-hidden="true" />
                            Hubungi via WhatsApp
                          </a>
                        )}
                      </div>

                      <div className="mt-4">
                        <label className="p-label" htmlFor={`note-${row.id}`}>
                          Catatan internal
                        </label>
                        <textarea
                          id={`note-${row.id}`}
                          rows={2}
                          className="p-field"
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                        />
                        <div className="mt-2">
                          <Button
                            variant="secondary"
                            disabled={noteDraft === (row.note ?? '')}
                            onClick={() => void patch(row, { note: noteDraft })}
                          >
                            Simpan catatan
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </GlobalLayout>
  );
};

export default Registrations;
