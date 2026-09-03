import { templateDef } from './serviceTemplates';

/**
 * The bands a service page is made of, as the panel arranges them.
 *
 * The eight repeating groups already have their own editors; this is the layer
 * above them — which band appears, in what order, under what heading and on
 * what background. Two bands are not repeating groups at all: the opening
 * paragraph and the closing call to action.
 */

export type SectionKey =
  | 'intro'
  | 'metrics'
  | 'highlights'
  | 'outcomes'
  | 'steps'
  | 'schedules'
  | 'plans'
  | 'proofs'
  | 'faqs'
  | 'cta';

export type SectionTone = 'auto' | 'white' | 'muted' | 'dark';

export type SectionSetting = {
  key: SectionKey;
  /** Empty means the heading the site uses for this template. */
  title: string;
  subtitle: string;
  tone: SectionTone;
  enabled: boolean;
};

export const TONES: Array<{ value: SectionTone; label: string }> = [
  { value: 'auto', label: 'Otomatis (selang-seling)' },
  { value: 'white', label: 'Putih' },
  { value: 'muted', label: 'Abu muda' },
  { value: 'dark', label: 'Gelap' },
];

/** What each band is, in the panel's words. */
export const SECTION_META: Record<SectionKey, { label: string; help: string }> = {
  intro: {
    label: 'Paragraf Pembuka',
    help: 'Isinya diambil dari kolom "Pembuka" di kartu Dasar.',
  },
  metrics: { label: 'Angka Kunci', help: 'Kartu angka pendek.' },
  highlights: { label: 'Untuk Siapa / Cakupan', help: 'Kartu bergambar ikon.' },
  outcomes: { label: 'Hasil / Deliverable', help: 'Daftar poin bercentang.' },
  steps: { label: 'Silabus / Tahapan', help: 'Daftar bernomor urut.' },
  schedules: { label: 'Jadwal Batch', help: 'Kartu jadwal dengan tombol reservasi.' },
  plans: { label: 'Investasi / Paket', help: 'Kolom harga.' },
  proofs: { label: 'Testimoni', help: 'Kutipan peserta beserta ringkasan rating.' },
  faqs: { label: 'Pertanyaan Umum', help: 'Daftar tanya jawab yang bisa dibuka tutup.' },
  cta: { label: 'Ajakan Penutup', help: 'Blok terakhir sebelum footer.' },
};

const blank = (key: SectionKey, enabled = true): SectionSetting => ({
  key,
  title: '',
  subtitle: '',
  tone: 'auto',
  enabled,
});

/**
 * The arrangement a service starts with.
 *
 * The order of the repeating groups is the one the template already uses in
 * this editor, so what an author fills in top to bottom is what the page shows
 * top to bottom. The opening paragraph and the closing block bracket it.
 */
export const defaultSections = (template: string): SectionSetting[] => [
  blank('intro'),
  ...templateDef(template).groups.map((key) => blank(key as SectionKey)),
  blank('cta'),
];

/**
 * Reconcile what was saved with what the template offers.
 *
 * A saved arrangement is kept as the author left it, including the order and
 * anything switched off. Bands that did not exist when it was saved are
 * appended rather than dropped, so adding a section to a template never
 * silently hides it from pages that already exist.
 */
export const mergeSections = (
  saved: SectionSetting[] | null | undefined,
  template: string,
): SectionSetting[] => {
  const defaults = defaultSections(template);
  if (!saved?.length) return defaults;

  const known = new Set(Object.keys(SECTION_META) as SectionKey[]);
  const kept = saved.filter((s) => known.has(s.key)).map((s) => ({ ...blank(s.key), ...s }));
  const present = new Set(kept.map((s) => s.key));

  return [...kept, ...defaults.filter((d) => !present.has(d.key))];
};
