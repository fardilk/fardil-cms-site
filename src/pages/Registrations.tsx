import React from 'react';
import toast from 'react-hot-toast';
import GlobalLayout from '../components/layout/GlobalLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/atoms/Button';
import ActionMenu from '../components/ui/ActionMenu';
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

type Schedule = {
  starts_at: string | null;
  ends_at: string | null;
  city: string;
  format: string;
  price: string;
};

type Service = {
  slug: string;
  title: string;
  schedules: Schedule[];
  plans: Array<{ price: string }>;
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
  ['company', 'Instansi/perusahaan'],
  ['company_address', 'Alamat perusahaan'],
  ['division', 'Divisi/departemen'],
  ['position', 'Jabatan'],
  ['city', 'Kota domisili'],
  ['certificate_address', 'Alamat kirim sertifikat'],
  ['referral_source', 'Mendapat info dari'],
];

const dateTime = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Jakarta',
});

const dateOnly = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
});

/** Digits only, with the leading zero swapped for the country code. */
const waNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
};

/** The programme slug the registration was submitted against. */
const programSlug = (path: string): string | null => {
  const match = /[?&]program=([^&]+)/.exec(path);
  return match ? decodeURIComponent(match[1]) : null;
};

/** Bracketed text is an editor's note in the CMS, never a figure to quote. */
const usable = (value?: string) =>
  value && /\d/.test(value) && !value.includes('[') ? value.trim() : '';

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
  const [services, setServices] = React.useState<Record<string, Service>>({});
  const [loading, setLoading] = React.useState(true);
  const [detail, setDetail] = React.useState<Registration | null>(null);
  const [noteDraft, setNoteDraft] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/leads?stage=${stage}&limit=200`, { credentials: 'include' });
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

  // Programme titles, dates and prices: a row reads by name, and the invoice
  // message can quote the batch without anyone retyping it.
  React.useEffect(() => {
    let cancelled = false;
    apiFetch('/api/services', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((list: Service[]) => {
        if (cancelled || !Array.isArray(list)) return;
        setServices(Object.fromEntries(list.map((s) => [s.slug, s])));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const patch = async (row: Registration, body: Record<string, unknown>, message = 'Tersimpan') => {
    const res = await apiFetch(`/api/leads/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      toast.error('Gagal menyimpan perubahan');
      return false;
    }
    toast.success(message);
    setDetail(null);
    void load();
    return true;
  };

  const serviceOf = (row: Registration) => {
    const slug = programSlug(row.source_path);
    return slug ? (services[slug] ?? null) : null;
  };

  const programName = (row: Registration) =>
    serviceOf(row)?.title ?? programSlug(row.source_path) ?? '—';

  /**
   * The invoice message, built from the batch the person registered for. It is
   * a prefilled WhatsApp draft, not a generated document: nothing here creates
   * an invoice number or records an amount received.
   */
  const invoiceText = (row: Registration) => {
    const service = serviceOf(row);
    const schedule = service?.schedules?.find((s) => s.starts_at) ?? null;
    const price = usable(schedule?.price) || usable(service?.plans?.[0]?.price);

    // Only the facts we actually hold: a missing date or price leaves out its
    // line rather than printing a blank one.
    const facts = [
      schedule?.starts_at
        ? `Jadwal: ${dateOnly.format(new Date(schedule.starts_at))}${schedule.city ? ` (${schedule.city})` : ''}`
        : '',
      price ? `Investasi: ${price}` : '',
      row.company ? `Atas nama: ${row.company}` : '',
    ].filter(Boolean);

    return [
      `Halo ${row.name}, terima kasih sudah mendaftar program ${programName(row)} di Excellence Plus Indonesia.`,
      ...(facts.length ? ['', ...facts] : []),
      '',
      'Berikut kami kirimkan invoice untuk pembayarannya. Kursi kami konfirmasi setelah pembayaran diterima.',
    ].join('\n');
  };

  const sendInvoice = async (row: Registration, via: 'wa' | 'email') => {
    const body = invoiceText(row);
    const number = waNumber(row.phone);

    if (via === 'wa' && number) {
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(body)}`, '_blank', 'noopener');
    } else {
      const subject = `Invoice pendaftaran ${programName(row)} — Excellence Plus Indonesia`;
      window.location.href = `mailto:${row.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    // Recorded so the next person to open this row knows it was already sent.
    const stamp = `Invoice dikirim ${dateTime.format(new Date())} via ${via === 'wa' ? 'WhatsApp' : 'email'}.`;
    await patch(
      row,
      { status: 'contacted', note: row.note ? `${row.note}\n${stamp}` : stamp },
      'Draft invoice dibuka, status jadi Diproses',
    );
  };

  const actionsFor = (row: Registration) =>
    stage === 'permintaan'
      ? [
          { label: 'Lihat detail', icon: 'fa-eye', onSelect: () => openDetail(row) },
          {
            label: 'Proses jadi peserta',
            icon: 'fa-user-check',
            onSelect: () => void patch(row, { status: 'enrolled' }, 'Dipindahkan ke Peserta'),
          },
          {
            label: 'Kirim invoice via WhatsApp',
            icon: 'fa-comments',
            onSelect: () => void sendInvoice(row, 'wa'),
          },
          {
            label: 'Kirim invoice via email',
            icon: 'fa-envelope',
            onSelect: () => void sendInvoice(row, 'email'),
          },
          {
            label: 'Tandai batal',
            icon: 'fa-xmark',
            danger: true,
            onSelect: () => void patch(row, { status: 'lost' }, 'Ditandai batal'),
          },
        ]
      : [
          { label: 'Lihat detail', icon: 'fa-eye', onSelect: () => openDetail(row) },
          {
            label: 'Kirim pesan WhatsApp',
            icon: 'fa-comments',
            href: waNumber(row.phone) ? `https://wa.me/${waNumber(row.phone)}` : undefined,
          },
          {
            label: 'Kembalikan ke permintaan',
            icon: 'fa-rotate-left',
            onSelect: () => void patch(row, { status: 'contacted' }, 'Dikembalikan ke Permintaan'),
          },
        ];

  const openDetail = (row: Registration) => {
    setDetail(row);
    setNoteDraft(row.note ?? '');
  };

  const copy = COPY[stage];
  const th = 'px-4 py-2.5 text-left text-[0.75rem] font-semibold text-[var(--p-text-secondary)]';
  const td = 'px-4 py-3 align-top text-[0.8125rem]';

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
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="border-b border-[var(--p-border)] bg-[#fafafa]">
                <tr>
                  <th className={th}>Tanggal</th>
                  <th className={th}>Nama</th>
                  <th className={th}>Instansi</th>
                  <th className={th}>Program</th>
                  <th className={th}>Kontak</th>
                  {stage === 'permintaan' && <th className={th}>Status</th>}
                  <th className={`${th} w-10`}>
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const meta = STATUS_META[row.status] ?? {
                    label: row.status,
                    tone: 'neutral' as Tone,
                  };
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-[var(--p-border)] last:border-0 hover:bg-[var(--p-surface-hover)]"
                    >
                      <td className={`${td} whitespace-nowrap text-[var(--p-text-secondary)]`}>
                        {dateTime.format(new Date(row.created_at))}
                      </td>
                      <td className={td}>
                        <button
                          type="button"
                          onClick={() => openDetail(row)}
                          className="font-medium text-[var(--p-link)] hover:underline"
                        >
                          {row.name}
                        </button>
                        <div className="text-[var(--p-text-secondary)]">{row.position || '—'}</div>
                      </td>
                      <td className={td}>
                        {row.company || '—'}
                        <div className="text-[var(--p-text-secondary)]">{row.city}</div>
                      </td>
                      <td className={td}>{programName(row)}</td>
                      <td className={td}>
                        <a
                          className="text-[var(--p-link)] hover:underline"
                          href={`mailto:${row.email}`}
                        >
                          {row.email}
                        </a>
                        <div className="text-[var(--p-text-secondary)]">{row.phone}</div>
                      </td>
                      {stage === 'permintaan' && (
                        <td className={td}>
                          <Badge tone={meta.tone} dot={row.status === 'new'}>
                            {meta.label}
                          </Badge>
                        </td>
                      )}
                      <td className={`${td} text-right`}>
                        <div className="flex justify-end">
                          <ActionMenu actions={actionsFor(row)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Tutup detail"
            className="absolute inset-0 bg-black/25"
            onClick={() => setDetail(null)}
          />
          <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-[var(--p-border)] bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--p-border)] px-4 py-3">
              <div>
                <h2 className="font-semibold text-[var(--p-text)]">{detail.name}</h2>
                <p className="text-[0.75rem] text-[var(--p-text-secondary)]">
                  {programName(detail)} · {dateTime.format(new Date(detail.created_at))}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                aria-label="Tutup"
                className="rounded-lg px-2 py-1 text-[var(--p-text-secondary)] hover:bg-[#f1f1f1]"
              >
                <i className="fa fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 px-4 py-4">
              <dl className="space-y-1.5 text-[0.8125rem]">
                <div className="flex gap-2">
                  <dt className="w-36 shrink-0 text-[var(--p-text-secondary)]">Email</dt>
                  <dd className="min-w-0 break-all">
                    <a
                      className="text-[var(--p-link)] hover:underline"
                      href={`mailto:${detail.email}`}
                    >
                      {detail.email}
                    </a>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-36 shrink-0 text-[var(--p-text-secondary)]">No. handphone</dt>
                  <dd className="min-w-0">
                    {waNumber(detail.phone) ? (
                      <a
                        className="text-[var(--p-link)] hover:underline"
                        href={`https://wa.me/${waNumber(detail.phone)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {detail.phone}
                      </a>
                    ) : (
                      detail.phone
                    )}
                  </dd>
                </div>
                {DETAILS.map(([field, label]) => (
                  <div key={field} className="flex gap-2">
                    <dt className="w-36 shrink-0 text-[var(--p-text-secondary)]">{label}</dt>
                    <dd className="min-w-0">{String(detail[field] || '—')}</dd>
                  </div>
                ))}
                <div className="flex gap-2">
                  <dt className="w-36 shrink-0 text-[var(--p-text-secondary)]">Halaman</dt>
                  <dd className="min-w-0 break-all">{detail.source_path || '—'}</dd>
                </div>
              </dl>

              {detail.message && (
                <div>
                  <div className="mb-1 text-[0.75rem] text-[var(--p-text-secondary)]">
                    Catatan pendaftar
                  </div>
                  <p className="whitespace-pre-wrap rounded-lg border border-[var(--p-border)] bg-[#fafafa] p-3 text-[0.8125rem]">
                    {detail.message}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {stage === 'permintaan' ? (
                  <>
                    <Button
                      variant="primary"
                      onClick={() =>
                        void patch(detail, { status: 'enrolled' }, 'Dipindahkan ke Peserta')
                      }
                    >
                      Proses jadi peserta
                    </Button>
                    <Button variant="secondary" onClick={() => void sendInvoice(detail, 'wa')}>
                      Kirim invoice
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => void patch(detail, { status: 'lost' }, 'Ditandai batal')}
                    >
                      Batal
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      void patch(detail, { status: 'contacted' }, 'Dikembalikan ke Permintaan')
                    }
                  >
                    Kembalikan ke permintaan
                  </Button>
                )}
              </div>

              <div>
                <label className="p-label" htmlFor={`note-${detail.id}`}>
                  Catatan internal
                </label>
                <textarea
                  id={`note-${detail.id}`}
                  rows={3}
                  className="p-field"
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                />
                <div className="mt-2">
                  <Button
                    variant="secondary"
                    disabled={noteDraft === (detail.note ?? '')}
                    onClick={() => void patch(detail, { note: noteDraft }, 'Catatan tersimpan')}
                  >
                    Simpan catatan
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </GlobalLayout>
  );
};

export default Registrations;
