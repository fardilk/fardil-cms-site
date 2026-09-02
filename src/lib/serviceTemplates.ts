/**
 * The three service templates and what each one calls its sections.
 *
 * The repeating groups are deliberately shared in the database: a curriculum
 * module, a delivery phase and an SLA stage are all "ordered item with a title,
 * a body and a short qualifier". Only the labels and the help text differ, so
 * they live here rather than in three near-identical forms.
 */

export type GroupKey =
  | 'highlights'
  | 'steps'
  | 'outcomes'
  | 'metrics'
  | 'faqs'
  | 'plans'
  | 'proofs'
  | 'schedules';

export type GroupCopy = {
  title: string;
  help: string;
  addLabel: string;
  /** Placeholder for ServiceStep.meta, whose meaning changes per template. */
  metaLabel?: string;
  metaPlaceholder?: string;
};

export type TemplateDef = {
  value: string;
  label: string;
  audience: string;
  /** Groups rendered, in the order the form shows them. */
  groups: GroupKey[];
  copy: Partial<Record<GroupKey, GroupCopy>>;
};

const shared: Partial<Record<GroupKey, GroupCopy>> = {
  metrics: {
    title: 'Angka Kunci',
    help: 'Angka pendek yang membangun kepercayaan. Kosongkan jika belum ada data nyata.',
    addLabel: 'Tambah angka',
  },
  faqs: {
    title: 'Pertanyaan Umum',
    help: 'Jawab keberatan yang paling sering muncul sebelum calon klien menanyakannya.',
    addLabel: 'Tambah pertanyaan',
  },
  proofs: {
    title: 'Bukti',
    help: 'Testimoni bernama atau studi kasus berangka. Ini bagian yang paling menjual.',
    addLabel: 'Tambah bukti',
  },
};

export const TEMPLATES: TemplateDef[] = [
  {
    value: 'program',
    label: 'Program',
    audience: 'Training dan Coaching — pembelajaran terjadwal, ada harga, bisa didaftar.',
    groups: ['highlights', 'outcomes', 'steps', 'schedules', 'plans', 'proofs', 'metrics', 'faqs'],
    copy: {
      ...shared,
      highlights: {
        title: 'Untuk Siapa',
        help: 'Gambarkan pesertanya, bukan materinya. Contoh: "Supervisor yang baru diangkat".',
        addLabel: 'Tambah persona',
      },
      outcomes: {
        title: 'Hasil Belajar',
        help: 'Tulis sebagai perilaku kerja, bukan topik. Bukan "materi komunikasi", tapi "bisa memberi feedback korektif tanpa merusak hubungan".',
        addLabel: 'Tambah hasil',
      },
      steps: {
        title: 'Silabus',
        help: 'Modul beserta durasi dan metodenya.',
        addLabel: 'Tambah modul',
        metaLabel: 'Durasi',
        metaPlaceholder: '4 jam',
      },
      schedules: {
        title: 'Jadwal Batch',
        help: 'Batch yang masih terbuka. Kosongkan kalau hanya melayani in-house.',
        addLabel: 'Tambah batch',
      },
      plans: {
        title: 'Investasi',
        help: 'Harga public dan in-house, beserta apa saja yang termasuk.',
        addLabel: 'Tambah paket',
      },
    },
  },
  {
    value: 'engagement',
    label: 'Engagement',
    audience: 'Consultancy — proyek dengan scope, ditawarkan bukan diberi harga tetap.',
    groups: ['highlights', 'steps', 'outcomes', 'schedules', 'plans', 'proofs', 'metrics', 'faqs'],
    copy: {
      ...shared,
      highlights: {
        title: 'Gejala yang Dikenali',
        help: 'Keluhan spesifik calon klien. Kalau dia mengangguk di sini, sisanya tinggal formalitas.',
        addLabel: 'Tambah gejala',
      },
      steps: {
        title: 'Tahapan Kerja',
        help: 'Fase pengerjaan beserta durasi dan keluarannya.',
        addLabel: 'Tambah fase',
        metaLabel: 'Durasi',
        metaPlaceholder: 'Minggu 1-2',
      },
      outcomes: {
        title: 'Deliverable',
        help: 'Barang nyata yang klien terima: SOP, matriks kompetensi, dashboard.',
        addLabel: 'Tambah deliverable',
      },
      schedules: {
        title: 'Jadwal Sesi',
        help: 'Tanggal yang sudah dibuka. Untuk coaching, ini jadwal sesi; kosongkan bila seluruhnya by appointment.',
        addLabel: 'Tambah jadwal',
      },
      plans: {
        title: 'Paket & Investasi',
        help: 'Audit singkat, proyek penuh, retainer, atau paket sesi coaching.',
        addLabel: 'Tambah paket',
      },
    },
  },
  {
    value: 'retainer',
    label: 'Layanan Berkelanjutan',
    audience: 'Executive Search dan EOR — jasa berjalan dengan SLA dan konsekuensi hukum.',
    groups: ['highlights', 'steps', 'outcomes', 'plans', 'proofs', 'metrics', 'faqs'],
    copy: {
      ...shared,
      highlights: {
        title: 'Cakupan Layanan',
        help: 'Level jabatan, industri, dan wilayah yang dilayani.',
        addLabel: 'Tambah cakupan',
      },
      steps: {
        title: 'Proses ber-SLA',
        help: 'Tiap tahap dengan komitmen waktu yang berani Anda janjikan.',
        addLabel: 'Tambah tahap',
        metaLabel: 'SLA',
        metaPlaceholder: '3 hari kerja',
      },
      outcomes: {
        title: 'Kepatuhan & Jaminan',
        help: 'BPJS, PPh21, PKWT/PKWTT, garansi penggantian. Ini yang menenangkan pembeli.',
        addLabel: 'Tambah poin',
      },
      plans: {
        title: 'Model Biaya',
        help: 'Persentase gaji tahunan, atau biaya per karyawan per bulan.',
        addLabel: 'Tambah skema',
      },
    },
  },
];

export const templateDef = (value: string): TemplateDef =>
  TEMPLATES.find((t) => t.value === value) ?? TEMPLATES[0];

/** Categories the public site routes under /services/:category. */
export const CATEGORIES = [
  { slug: 'training', label: 'Training', template: 'program' },
  { slug: 'consultancy', label: 'Consultancy', template: 'engagement' },
  { slug: 'coaching', label: 'Coaching', template: 'engagement' },
  { slug: 'executive-search', label: 'Executive Search & Recruitment', template: 'retainer' },
  { slug: 'employer-of-record', label: 'Employer of Record (EOR)', template: 'retainer' },
];

/** Mirrors the slug rules the site uses, so a page lands where the menu links. */
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
