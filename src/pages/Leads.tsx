import React from 'react';
import toast from 'react-hot-toast';
import GlobalLayout from '../components/layout/GlobalLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/atoms/Button';
import { apiFetch } from '@/lib/api';

type Lead = {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  source_path: string;
  kind: string;
  company_address: string;
  division: string;
  position: string;
  city: string;
  certificate_address: string;
  referral_source: string;
  status: string;
  note: string;
  created_at: string;
};

type Tone = 'neutral' | 'success' | 'warning' | 'critical' | 'info';

const STATUSES: Array<{ value: string; label: string; tone: Tone }> = [
  { value: 'new', label: 'Baru', tone: 'info' },
  { value: 'contacted', label: 'Dihubungi', tone: 'warning' },
  { value: 'won', label: 'Deal', tone: 'success' },
  { value: 'lost', label: 'Batal', tone: 'critical' },
];

const statusMeta = (value: string) =>
  STATUSES.find((s) => s.value === value) ?? { value, label: value, tone: 'neutral' as Tone };

/** Fields the registration form collects, in the order it asks for them. */
const REGISTRATION_FIELDS: Array<[keyof Lead, string]> = [
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

const Leads = () => {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [newCount, setNewCount] = React.useState(0);
  const [total, setTotal] = React.useState(0);
  const [filter, setFilter] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [openId, setOpenId] = React.useState<number | null>(null);
  const [noteDraft, setNoteDraft] = React.useState('');

  const load = React.useCallback(async (status: string) => {
    setLoading(true);
    try {
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      const res = await apiFetch(`/api/leads${query}`, { credentials: 'include' });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setLeads(Array.isArray(data.items) ? data.items : []);
      setNewCount(data.new_count ?? 0);
      setTotal(data.total ?? 0);
    } catch {
      toast.error('Gagal memuat pesan masuk');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load(filter);
  }, [filter, load]);

  const patch = async (lead: Lead, body: Record<string, unknown>) => {
    const res = await apiFetch(`/api/leads/${lead.id}`, {
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
    await load(filter);
  };

  const open = (lead: Lead) => {
    const next = openId === lead.id ? null : lead.id;
    setOpenId(next);
    setNoteDraft(next === null ? '' : lead.note ?? '');
  };

  return (
    <GlobalLayout wide>
      <PageHeader
        title="Pesan Masuk"
        badges={newCount > 0 ? <Badge tone="info" dot>{newCount} baru</Badge> : undefined}
        subtitle={`${total} pesan dari formulir kontak di situs`}
        actions={
          <Button icon="fa-rotate" onClick={() => void load(filter)}>
            Muat ulang
          </Button>
        }
      />

      <Card flush>
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--p-border)] px-4 py-2.5">
          <button
            type="button"
            onClick={() => setFilter('')}
            className={`rounded-lg px-2.5 py-1 text-[0.8125rem] ${filter === '' ? 'bg-[#e3e3e3] font-semibold' : 'hover:bg-[#f1f1f1]'}`}
          >
            Semua
          </button>
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setFilter(s.value)}
              className={`rounded-lg px-2.5 py-1 text-[0.8125rem] ${filter === s.value ? 'bg-[#e3e3e3] font-semibold' : 'hover:bg-[#f1f1f1]'}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-12 text-center text-[0.8125rem] text-[var(--p-text-secondary)]">Memuat…</p>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <i className="fa fa-inbox mb-4 text-4xl text-[var(--p-text-disabled)]" aria-hidden="true" />
            <p className="font-medium text-[var(--p-text)]">Belum ada pesan</p>
            <p className="text-[0.8125rem] text-[var(--p-text-secondary)]">
              Pesan dari formulir kontak di situs akan muncul di sini.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--p-border)]">
            {leads.map((lead) => {
              const meta = statusMeta(lead.status);
              const expanded = openId === lead.id;
              const wa = waLink(lead.phone);

              return (
                <li key={lead.id}>
                  <button
                    type="button"
                    onClick={() => open(lead)}
                    aria-expanded={expanded}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[var(--p-surface-hover)]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-[var(--p-text)]">{lead.name}</span>
                        <Badge tone={meta.tone} dot={lead.status === 'new'}>
                          {meta.label}
                        </Badge>
                        {lead.kind === 'registration' && (
                          <Badge tone="success">Pendaftaran</Badge>
                        )}
                        {lead.company && (
                          <span className="text-xs text-[var(--p-text-secondary)]">{lead.company}</span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[0.8125rem] text-[var(--p-text-secondary)]">
                        {lead.message ||
                          (lead.kind === 'registration'
                            ? [lead.position, lead.city].filter(Boolean).join(' · ')
                            : '')}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-[var(--p-text-secondary)]">
                      {dateFormat.format(new Date(lead.created_at))}
                    </span>
                  </button>

                  {expanded && (
                    <div className="border-t border-[var(--p-border)] bg-[#fafafa] px-4 py-4">
                      <div className="grid gap-4 lg:grid-cols-3">
                        <dl className="space-y-1.5 text-[0.8125rem] lg:col-span-1">
                          <div className="flex gap-2">
                            <dt className="w-20 shrink-0 text-[var(--p-text-secondary)]">Email</dt>
                            <dd className="min-w-0 break-all">
                              <a className="text-[var(--p-link)] hover:underline" href={`mailto:${lead.email}`}>
                                {lead.email}
                              </a>
                            </dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="w-20 shrink-0 text-[var(--p-text-secondary)]">Telepon</dt>
                            <dd className="min-w-0">
                              {wa ? (
                                <a
                                  className="text-[var(--p-link)] hover:underline"
                                  href={wa}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {lead.phone}
                                </a>
                              ) : (
                                lead.phone
                              )}
                            </dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="w-20 shrink-0 text-[var(--p-text-secondary)]">Halaman</dt>
                            <dd className="min-w-0 break-all">{lead.source_path || '-'}</dd>
                          </div>
                        </dl>

                        <div className="space-y-3 lg:col-span-2">
                          {lead.kind === 'registration' && (
                            <dl className="grid gap-1.5 rounded-lg border border-[var(--p-border)] bg-white p-3 text-[0.8125rem] sm:grid-cols-2">
                              {REGISTRATION_FIELDS.map(([field, label]) => (
                                <div key={field} className="flex gap-2">
                                  <dt className="w-32 shrink-0 text-[var(--p-text-secondary)]">
                                    {label}
                                  </dt>
                                  <dd className="min-w-0">{String(lead[field] || '-')}</dd>
                                </div>
                              ))}
                            </dl>
                          )}
                          {lead.message && (
                            <p className="whitespace-pre-wrap rounded-lg border border-[var(--p-border)] bg-white p-3 text-[0.8125rem]">
                              {lead.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {STATUSES.map((s) => (
                          <Button
                            key={s.value}
                            variant={lead.status === s.value ? 'primary' : 'secondary'}
                            onClick={() => void patch(lead, { status: s.value })}
                          >
                            {s.label}
                          </Button>
                        ))}
                        {wa && (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#cdcdcd] bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-[#303030] hover:bg-[#f7f7f7]"
                          >
                            <i className="fa fa-comments" aria-hidden="true" />
                            Balas via WhatsApp
                          </a>
                        )}
                      </div>

                      <div className="mt-4">
                        <label className="p-label" htmlFor={`note-${lead.id}`}>
                          Catatan internal
                        </label>
                        <textarea
                          id={`note-${lead.id}`}
                          rows={2}
                          className="p-field"
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                        />
                        <div className="mt-2">
                          <Button
                            variant="secondary"
                            disabled={noteDraft === (lead.note ?? '')}
                            onClick={() => void patch(lead, { note: noteDraft })}
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

export default Leads;
