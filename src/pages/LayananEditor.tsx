import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import GlobalLayout from '../components/layout/GlobalLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/atoms/Button';
import RepeatableList from '../components/ui/RepeatableList';
import MediaField from '../components/ui/MediaField';
import { TextField, TextArea, SelectField, Toggle } from '../components/ui/Field';
import SectionArranger from '../components/ui/SectionArranger';
import { apiFetch } from '@/lib/api';
import { CATEGORIES, TEMPLATES, templateDef, slugify } from '@/lib/serviceTemplates';
import type { GroupKey } from '@/lib/serviceTemplates';
import { defaultSections, mergeSections } from '@/lib/pageSections';
import type { SectionSetting } from '@/lib/pageSections';

type Row = { id?: number; position: number };
type Highlight = Row & { icon: string; title: string; body: string };
type Step = Row & { title: string; body: string; meta: string };
type Outcome = Row & { icon: string; text: string };
type Metric = Row & { label: string; value: string };
type Faq = Row & { question: string; answer: string };
type Plan = Row & { name: string; price: string; note: string; highlighted: boolean; features: string[] };
type Proof = Row & {
  kind: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  result: string;
  image: string;
};
type Schedule = Row & {
  starts_at: string | null;
  ends_at: string | null;
  city: string;
  format: string;
  seats_total: number;
  seats_left: number;
  price: string;
  register_url: string;
};

type Service = {
  id?: number;
  slug: string;
  category: string;
  category_label: string;
  template: string;
  title: string;
  subtitle: string;
  published: boolean;
  sort_order: number;
  meta_title: string;
  meta_description: string;
  canonical_url: string;
  og_image: string;
  hero_eyebrow: string;
  hero_headline: string;
  hero_subheadline: string;
  hero_image: string;
  primary_cta_text: string;
  primary_cta_href: string;
  secondary_cta_text: string;
  secondary_cta_href: string;
  intro: string;
  sections: SectionSetting[];
  audience: string;
  card_image: string;
  rating_score: number;
  rating_count: number;
  cta_title: string;
  cta_subtitle: string;
  highlights: Highlight[];
  steps: Step[];
  outcomes: Outcome[];
  metrics: Metric[];
  faqs: Faq[];
  plans: Plan[];
  proofs: Proof[];
  schedules: Schedule[];
};

const emptyService = (): Service => ({
  slug: '',
  category: 'training',
  category_label: 'Training',
  template: 'program',
  title: '',
  subtitle: '',
  published: false,
  sort_order: 0,
  meta_title: '',
  meta_description: '',
  canonical_url: '',
  og_image: '',
  hero_eyebrow: '',
  hero_headline: '',
  hero_subheadline: '',
  hero_image: '',
  primary_cta_text: '',
  primary_cta_href: '',
  secondary_cta_text: '',
  secondary_cta_href: '',
  intro: '',
  sections: defaultSections('program'),
  audience: '',
  card_image: '',
  rating_score: 0,
  rating_count: 0,
  cta_title: '',
  cta_subtitle: '',
  highlights: [],
  steps: [],
  outcomes: [],
  metrics: [],
  faqs: [],
  plans: [],
  proofs: [],
  schedules: [],
});

/** The API rejects a payload without these, so catch it before the round trip. */
const validate = (s: Service): string | null => {
  if (!s.title.trim()) return 'Judul wajib diisi';
  if (!s.slug.trim()) return 'Slug wajib diisi';
  if (!s.category.trim()) return 'Kategori wajib dipilih';
  return null;
};

/** Positions are the render order on the site, so they are written from the array. */
const withPositions = <T extends Row>(rows: T[]): T[] =>
  rows.map((row, i) => ({ ...row, position: i }));

/** Shared by the Save button and by autosave, so the two cannot drift apart. */
const buildPayload = (s: Service): Service => ({
  ...s,
  highlights: withPositions(s.highlights),
  steps: withPositions(s.steps),
  outcomes: withPositions(s.outcomes),
  metrics: withPositions(s.metrics),
  faqs: withPositions(s.faqs),
  plans: withPositions(s.plans),
  proofs: withPositions(s.proofs),
  schedules: withPositions(s.schedules),
});

// <input type="datetime-local"> wants 'YYYY-MM-DDTHH:mm'; the API speaks RFC 3339.
const toLocalInput = (iso: string | null) => (iso ? iso.slice(0, 16) : '');
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

const LayananEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'baru';

  const [service, setService] = React.useState<Service>(emptyService);
  const [loading, setLoading] = React.useState(!isNew);
  const [saving, setSaving] = React.useState(false);
  // A slug that was already published must not silently move and 404 the old URL.
  const [slugTouched, setSlugTouched] = React.useState(!isNew);

  // Snapshot of the last saved state. Anything different from it is unsaved
  // work, which is what autosave and the close warning key off.
  const baseline = React.useRef<string>('');
  const latest = React.useRef<{ service: Service; id?: string; dirty: boolean }>({
    service: emptyService(),
    id,
    dirty: false,
  });

  React.useEffect(() => {
    if (isNew) {
      baseline.current = JSON.stringify(emptyService());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/api/services/${id}`, { credentials: 'include' });
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        if (cancelled) return;
        const loaded: Service = {
          ...emptyService(),
          ...data,
          highlights: data.highlights ?? [],
          steps: data.steps ?? [],
          outcomes: data.outcomes ?? [],
          metrics: data.metrics ?? [],
          faqs: data.faqs ?? [],
          plans: (data.plans ?? []).map((p: Plan) => ({
            ...p,
            features: Array.isArray(p.features) ? p.features : [],
          })),
          proofs: data.proofs ?? [],
          schedules: data.schedules ?? [],
          sections: mergeSections(data.sections, data.template),
        };
        setService(loaded);
        baseline.current = JSON.stringify(loaded);
      } catch {
        if (!cancelled) toast.error('Gagal memuat layanan');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  const dirty = baseline.current !== '' && JSON.stringify(service) !== baseline.current;

  React.useEffect(() => {
    latest.current = { service, id, dirty };
  }, [service, id, dirty]);

  // Closing the tab cannot be intercepted with a save, so warn instead.
  React.useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!latest.current.dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Navigating away inside the panel saves rather than discards.
  //
  // `published` is never altered here: a new page was created as a draft and
  // stays one, and an existing page keeps whatever state its author chose. An
  // autosave must never be the thing that publishes something.
  React.useEffect(
    () => () => {
      const { service: current, id: currentId, dirty: isDirty } = latest.current;
      if (!isDirty || validate(current)) return;
      const creating = !currentId || currentId === 'baru';
      apiFetch(creating ? '/api/services' : `/api/services/${currentId}`, {
        method: creating ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(buildPayload(current)),
      })
        .then((res) => {
          if (res.ok) {
            toast.success(
              current.published ? 'Perubahan tersimpan' : 'Tersimpan sebagai draft',
            );
          }
        })
        .catch(() => undefined);
    },
    [],
  );

  const set = <K extends keyof Service>(key: K, value: Service[K]) =>
    setService((prev) => ({ ...prev, [key]: value }));

  // A different template offers a different set of bands. Reconcile rather than
  // reset, so an author who has already reordered or renamed keeps that work.
  const onTemplateChange = (template: string) =>
    setService((prev) => ({
      ...prev,
      template,
      sections: mergeSections(prev.sections, template),
    }));

  const onTitleChange = (value: string) => {
    setService((prev) => ({
      ...prev,
      title: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  };

  const onCategoryChange = (slug: string) => {
    const cat = CATEGORIES.find((c) => c.slug === slug);
    if (!cat) return;
    setService((prev) => ({
      ...prev,
      category: cat.slug,
      category_label: cat.label,
      // Suggest the template that fits the category; still overridable below.
      template: prev.id ? prev.template : cat.template,
    }));
  };

  const save = async () => {
    const problem = validate(service);
    if (problem) {
      toast.error(problem);
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch(isNew ? '/api/services' : `/api/services/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(buildPayload(service)),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? 'Gagal menyimpan');
        return;
      }

      const saved = await res.json();
      baseline.current = JSON.stringify(service);
      toast.success('Tersimpan');
      if (isNew) navigate(`/halaman/${saved.id}`, { replace: true });
      else setService((prev) => ({ ...prev, ...saved }));
    } catch {
      toast.error('Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const def = templateDef(service.template);
  const copy = (key: GroupKey) =>
    def.copy[key] ?? { title: key, help: '', addLabel: 'Tambah' };

  const groups: Record<GroupKey, React.ReactNode> = {
    highlights: (
      <RepeatableList<Highlight>
        {...copy('highlights')}
        items={service.highlights}
        onChange={(v) => set('highlights', v)}
        blank={() => ({ position: 0, icon: '', title: '', body: '' })}
        summary={(i) => i.title}
      >
        {(item, update) => (
          <>
            <TextField label="Judul" value={item.title} onChange={(v) => update({ title: v })} />
            <TextArea label="Penjelasan" value={item.body} onChange={(v) => update({ body: v })} />
            <TextField
              label="Ikon"
              hint="Nama ikon Font Awesome, contoh: fa-user-tie"
              value={item.icon}
              onChange={(v) => update({ icon: v })}
            />
          </>
        )}
      </RepeatableList>
    ),
    steps: (
      <RepeatableList<Step>
        {...copy('steps')}
        items={service.steps}
        onChange={(v) => set('steps', v)}
        blank={() => ({ position: 0, title: '', body: '', meta: '' })}
        summary={(i) => [i.title, i.meta].filter(Boolean).join(' · ')}
      >
        {(item, update) => (
          <>
            <TextField label="Judul" value={item.title} onChange={(v) => update({ title: v })} />
            <TextArea label="Isi" value={item.body} onChange={(v) => update({ body: v })} />
            <TextField
              label={copy('steps').metaLabel ?? 'Keterangan'}
              placeholder={copy('steps').metaPlaceholder}
              value={item.meta}
              onChange={(v) => update({ meta: v })}
            />
          </>
        )}
      </RepeatableList>
    ),
    outcomes: (
      <RepeatableList<Outcome>
        {...copy('outcomes')}
        items={service.outcomes}
        onChange={(v) => set('outcomes', v)}
        blank={() => ({ position: 0, icon: '', text: '' })}
        summary={(i) => i.text}
      >
        {(item, update) => (
          <>
            <TextArea label="Poin" rows={2} value={item.text} onChange={(v) => update({ text: v })} />
            <TextField
              label="Ikon"
              hint="Opsional. Contoh: fa-check"
              value={item.icon}
              onChange={(v) => update({ icon: v })}
            />
          </>
        )}
      </RepeatableList>
    ),
    metrics: (
      <RepeatableList<Metric>
        {...copy('metrics')}
        items={service.metrics}
        onChange={(v) => set('metrics', v)}
        blank={() => ({ position: 0, label: '', value: '' })}
        summary={(i) => [i.value, i.label].filter(Boolean).join(' — ')}
      >
        {(item, update) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Angka" placeholder="15+" value={item.value} onChange={(v) => update({ value: v })} />
            <TextField label="Keterangan" placeholder="Tahun pengalaman" value={item.label} onChange={(v) => update({ label: v })} />
          </div>
        )}
      </RepeatableList>
    ),
    faqs: (
      <RepeatableList<Faq>
        {...copy('faqs')}
        items={service.faqs}
        onChange={(v) => set('faqs', v)}
        blank={() => ({ position: 0, question: '', answer: '' })}
        summary={(i) => i.question}
      >
        {(item, update) => (
          <>
            <TextField label="Pertanyaan" value={item.question} onChange={(v) => update({ question: v })} />
            <TextArea label="Jawaban" value={item.answer} onChange={(v) => update({ answer: v })} />
          </>
        )}
      </RepeatableList>
    ),
    plans: (
      <RepeatableList<Plan>
        {...copy('plans')}
        items={service.plans}
        onChange={(v) => set('plans', v)}
        blank={() => ({ position: 0, name: '', price: '', note: '', highlighted: false, features: [] })}
        summary={(i) => [i.name, i.price].filter(Boolean).join(' — ')}
      >
        {(item, update) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Nama paket" value={item.name} onChange={(v) => update({ name: v })} />
              <TextField label="Harga" placeholder="Rp 4.500.000 / peserta" value={item.price} onChange={(v) => update({ price: v })} />
            </div>
            <TextField label="Catatan" value={item.note} onChange={(v) => update({ note: v })} />
            <TextArea
              label="Yang termasuk"
              hint="Satu item per baris."
              rows={4}
              value={item.features.join('\n')}
              onChange={(v) => update({ features: v.split('\n').map((x) => x.trim()).filter(Boolean) })}
            />
            <Toggle
              label="Tandai sebagai paket unggulan"
              checked={item.highlighted}
              onChange={(v) => update({ highlighted: v })}
            />
          </>
        )}
      </RepeatableList>
    ),
    proofs: (
      <RepeatableList<Proof>
        {...copy('proofs')}
        items={service.proofs}
        onChange={(v) => set('proofs', v)}
        blank={() => ({ position: 0, kind: 'testimonial', name: '', role: '', company: '', quote: '', result: '', image: '' })}
        summary={(i) => [i.name, i.company].filter(Boolean).join(' · ')}
      >
        {(item, update) => (
          <>
            <SelectField
              label="Jenis"
              value={item.kind}
              onChange={(v) => update({ kind: v })}
              options={[
                { value: 'testimonial', label: 'Testimoni' },
                { value: 'case', label: 'Studi kasus' },
              ]}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <TextField label="Nama" value={item.name} onChange={(v) => update({ name: v })} />
              <TextField label="Jabatan" value={item.role} onChange={(v) => update({ role: v })} />
              <TextField label="Perusahaan" value={item.company} onChange={(v) => update({ company: v })} />
            </div>
            <TextArea label="Kutipan" value={item.quote} onChange={(v) => update({ quote: v })} />
            <TextField
              label="Hasil"
              hint="Angka jauh lebih meyakinkan. Contoh: turnover turun 18% dalam 6 bulan."
              value={item.result}
              onChange={(v) => update({ result: v })}
            />
            <MediaField label="Foto" value={item.image} onChange={(v) => update({ image: v })} />
          </>
        )}
      </RepeatableList>
    ),
    schedules: (
      <RepeatableList<Schedule>
        {...copy('schedules')}
        items={service.schedules}
        onChange={(v) => set('schedules', v)}
        blank={() => ({
          position: 0, starts_at: null, ends_at: null, city: '', format: 'public',
          seats_total: 0, seats_left: 0, price: '', register_url: '',
        })}
        summary={(i) => [i.starts_at?.slice(0, 10), i.city].filter(Boolean).join(' · ')}
      >
        {(item, update) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Mulai"
                type="datetime-local"
                value={toLocalInput(item.starts_at)}
                onChange={(v) => update({ starts_at: fromLocalInput(v) })}
              />
              <TextField
                label="Selesai"
                type="datetime-local"
                value={toLocalInput(item.ends_at)}
                onChange={(v) => update({ ends_at: fromLocalInput(v) })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Kota" value={item.city} onChange={(v) => update({ city: v })} />
              <SelectField
                label="Format"
                value={item.format}
                onChange={(v) => update({ format: v })}
                options={[
                  { value: 'public', label: 'Public' },
                  { value: 'in-house', label: 'In-house' },
                  { value: 'online', label: 'Online' },
                ]}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <TextField
                label="Kuota"
                type="number"
                value={String(item.seats_total)}
                onChange={(v) => update({ seats_total: Number(v) || 0 })}
              />
              <TextField
                label="Sisa kursi"
                type="number"
                value={String(item.seats_left)}
                onChange={(v) => update({ seats_left: Number(v) || 0 })}
              />
              <TextField label="Harga" value={item.price} onChange={(v) => update({ price: v })} />
            </div>
            <TextField
              label="Tautan pendaftaran"
              placeholder="/home/contact"
              value={item.register_url}
              onChange={(v) => update({ register_url: v })}
            />
          </>
        )}
      </RepeatableList>
    ),
  };

  if (loading) {
    return (
      <GlobalLayout>
        <p className="py-16 text-center text-[0.8125rem] text-[var(--p-text-secondary)]">Memuat…</p>
      </GlobalLayout>
    );
  }

  return (
    <GlobalLayout wide>
      <PageHeader
        title={service.title || 'Layanan baru'}
        onBack={() => navigate('/halaman')}
        badges={
          <>
            <Badge tone="info">{def.label}</Badge>
            {service.published ? <Badge tone="success" dot>Tayang</Badge> : <Badge dot>Draft</Badge>}
          </>
        }
        subtitle={service.slug ? `/services/${service.category}/${service.slug}` : def.audience}
        actions={
          <>
            {dirty && (
              <span className="text-xs text-[var(--p-text-secondary)]">Belum tersimpan</span>
            )}
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
        <div className="space-y-4 lg:col-span-2">
          <Card title="Dasar">
            <div className="space-y-3">
              <TextField label="Judul" required value={service.title} onChange={onTitleChange} />
              <TextArea
                label="Subjudul"
                rows={2}
                hint="Satu kalimat hasil yang didapat pembeli."
                value={service.subtitle}
                onChange={(v) => set('subtitle', v)}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField
                  label="Kategori"
                  required
                  value={service.category}
                  onChange={onCategoryChange}
                  options={CATEGORIES.map((c) => ({ value: c.slug, label: c.label }))}
                />
                <TextField
                  label="Slug"
                  required
                  hint="Bagian akhir alamat halaman. Hindari mengubah setelah tayang."
                  value={service.slug}
                  onChange={(v) => {
                    setSlugTouched(true);
                    set('slug', slugify(v));
                  }}
                />
              </div>
              <SelectField
                label="Template"
                hint={def.audience}
                value={service.template}
                onChange={onTemplateChange}
                options={TEMPLATES.map((t) => ({ value: t.value, label: t.label }))}
              />
              <TextArea
                label="Pembuka"
                hint="Paragraf singkat di atas bagian pertama. Opsional."
                value={service.intro}
                onChange={(v) => set('intro', v)}
              />
            </div>
          </Card>

          <Card title="Hero">
            <div className="space-y-3">
              <TextField label="Eyebrow" placeholder="Training • Excellence Plus Indonesia" value={service.hero_eyebrow} onChange={(v) => set('hero_eyebrow', v)} />
              <TextField label="Judul hero" hint="Kosongkan untuk memakai judul di atas." value={service.hero_headline} onChange={(v) => set('hero_headline', v)} />
              <TextArea label="Subjudul hero" rows={2} value={service.hero_subheadline} onChange={(v) => set('hero_subheadline', v)} />
              <MediaField label="Gambar hero" value={service.hero_image} onChange={(v) => set('hero_image', v)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField label="Tombol utama" placeholder="Konsultasi Gratis" value={service.primary_cta_text} onChange={(v) => set('primary_cta_text', v)} />
                <TextField label="Tautan tombol utama" placeholder="/home/contact" value={service.primary_cta_href} onChange={(v) => set('primary_cta_href', v)} />
                <TextField label="Tombol kedua" placeholder="Unduh Silabus" value={service.secondary_cta_text} onChange={(v) => set('secondary_cta_text', v)} />
                <TextField label="Tautan tombol kedua" value={service.secondary_cta_href} onChange={(v) => set('secondary_cta_href', v)} />
              </div>
            </div>
          </Card>

          {def.groups.map((key) => (
            <React.Fragment key={key}>{groups[key]}</React.Fragment>
          ))}

          <Card title="Ajakan Penutup">
            <div className="space-y-3">
              <TextField
                label="Judul"
                hint="Kosongkan untuk memakai kalimat bawaan yang menyebut judul layanan."
                placeholder={`Bicarakan kebutuhan ${service.title || 'layanan'} Anda`}
                value={service.cta_title}
                onChange={(v) => set('cta_title', v)}
              />
              <TextArea
                label="Keterangan"
                rows={2}
                placeholder="Konsultasi awal tanpa biaya. Kami balas dalam 1x24 jam kerja."
                value={service.cta_subtitle}
                onChange={(v) => set('cta_subtitle', v)}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Publikasi">
            <div className="space-y-3">
              <Toggle
                label="Tayangkan di situs"
                hint="Draft tetap tersimpan tapi tidak ikut saat situs dibangun."
                checked={service.published}
                onChange={(v) => set('published', v)}
              />
              <TextField
                label="Urutan"
                type="number"
                hint="Makin kecil makin atas dalam kategorinya."
                value={String(service.sort_order)}
                onChange={(v) => set('sort_order', Number(v) || 0)}
              />
            </div>
          </Card>

          <SectionArranger
            value={service.sections}
            onChange={(v) => set('sections', v)}
            filled={{
              highlights: service.highlights.length > 0,
              steps: service.steps.length > 0,
              outcomes: service.outcomes.length > 0,
              metrics: service.metrics.length > 0,
              faqs: service.faqs.length > 0,
              plans: service.plans.length > 0,
              proofs: service.proofs.length > 0,
              schedules: service.schedules.length > 0,
            }}
          />

          <Card title="Kartu di Katalog">
            <div className="space-y-3">
              <TextArea
                label="Cocok untuk"
                rows={2}
                hint='Satu kalimat "siapa yang cocok". Tampil di kartu beranda dan di pilihan program pada form reservasi.'
                placeholder="Supervisor, manajer baru, dan calon pemimpin tim."
                value={service.audience}
                onChange={(v) => set('audience', v)}
              />
              <MediaField
                label="Gambar kartu"
                hint="Kosongkan untuk memakai gambar hero. Tanpa keduanya, kartu memakai gambar buatan."
                value={service.card_image}
                onChange={(v) => set('card_image', v)}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Rating"
                  type="number"
                  hint="0 sampai 5. Isi 0 kalau belum ada."
                  value={String(service.rating_score)}
                  onChange={(v) => set('rating_score', Number(v) || 0)}
                />
                <TextField
                  label="Jumlah penilai"
                  type="number"
                  value={String(service.rating_count)}
                  onChange={(v) => set('rating_count', Number(v) || 0)}
                />
              </div>
              <p className="text-xs text-[var(--p-text-secondary)]">
                Rating hanya tampil kalau keduanya diisi. Angka ini klaim tentang peserta nyata,
                jadi isi hanya dari penilaian yang benar-benar masuk.
              </p>
            </div>
          </Card>

          <Card title="SEO">
            <div className="space-y-3">
              <TextField label="Meta title" hint="Kosongkan untuk memakai judul." value={service.meta_title} onChange={(v) => set('meta_title', v)} />
              <TextArea
                label="Meta description"
                rows={3}
                hint="Sekitar 150 karakter, kalimat yang membuat orang mengklik."
                value={service.meta_description}
                onChange={(v) => set('meta_description', v)}
              />
              <MediaField label="Gambar share" hint="Muncul saat tautan dibagikan." value={service.og_image} onChange={(v) => set('og_image', v)} />
              <TextField label="Canonical URL" hint="Isi hanya jika halaman ini menduplikasi halaman lain." value={service.canonical_url} onChange={(v) => set('canonical_url', v)} />
            </div>
          </Card>
        </div>
      </div>
    </GlobalLayout>
  );
};

export default LayananEditor;
