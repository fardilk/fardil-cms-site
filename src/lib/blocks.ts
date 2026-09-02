/**
 * Block model for the article editor.
 *
 * One block per list item, the way Notion does it, so reordering is a single
 * move rather than surgery inside an array of strings. Stored as
 * `{ blocks: [{ type, data }] }`, which is the shape the API already holds.
 *
 * Inline formatting is markdown in the stored text rather than contentEditable
 * HTML. contentEditable is the usual source of unfixable cursor and paste bugs,
 * and plain text survives being read by anything else later.
 */

export type BlockType =
  | 'paragraph'
  | 'heading'
  | 'bulleted_list_item'
  | 'numbered_list_item'
  | 'quote'
  | 'callout'
  | 'code'
  | 'divider'
  | 'image';

export type BlockData = {
  text?: string;
  level?: 2 | 3;
  icon?: string;
  language?: string;
  url?: string;
  caption?: string;
  alt?: string;
};

export type Block = {
  /** Local only: React keys and drag identity. Not persisted. */
  key: string;
  type: BlockType;
  data: BlockData;
};

export type BlockSpec = {
  type: BlockType;
  label: string;
  hint: string;
  icon: string;
  /** Typed at the start of an empty block to convert it, like Notion. */
  shortcut?: string;
  level?: 2 | 3;
  /** Blocks without text are not edited through a textarea. */
  textless?: boolean;
};

export const BLOCK_SPECS: BlockSpec[] = [
  { type: 'paragraph', label: 'Teks', hint: 'Paragraf biasa', icon: 'fa-align-left' },
  { type: 'heading', level: 2, label: 'Judul Besar', hint: 'Pemisah bagian utama', icon: 'fa-heading', shortcut: '# ' },
  { type: 'heading', level: 3, label: 'Judul Kecil', hint: 'Sub-bagian', icon: 'fa-heading', shortcut: '## ' },
  { type: 'bulleted_list_item', label: 'Daftar Titik', hint: 'Poin tanpa urutan', icon: 'fa-list-ul', shortcut: '- ' },
  { type: 'numbered_list_item', label: 'Daftar Angka', hint: 'Langkah berurutan', icon: 'fa-list-ol', shortcut: '1. ' },
  { type: 'quote', label: 'Kutipan', hint: 'Kutipan atau penekanan', icon: 'fa-quote-left', shortcut: '> ' },
  { type: 'callout', label: 'Sorotan', hint: 'Catatan penting berikon', icon: 'fa-lightbulb' },
  { type: 'code', label: 'Kode', hint: 'Cuplikan kode', icon: 'fa-code', shortcut: '```' },
  { type: 'divider', label: 'Pemisah', hint: 'Garis horizontal', icon: 'fa-minus', shortcut: '---', textless: true },
  { type: 'image', label: 'Gambar', hint: 'Dari pustaka media', icon: 'fa-image', textless: true },
];

export const specFor = (block: Block): BlockSpec =>
  BLOCK_SPECS.find(
    (s) => s.type === block.type && (s.level === undefined || s.level === block.data.level),
  ) ?? BLOCK_SPECS[0];

let counter = 0;
export const newKey = () => `b${Date.now().toString(36)}${(counter += 1).toString(36)}`;

export const makeBlock = (type: BlockType = 'paragraph', data: BlockData = {}): Block => ({
  key: newKey(),
  type,
  data: type === 'heading' ? { level: 2, text: '', ...data } : { text: '', ...data },
});

/** The API stores blocks without the local key; add one when loading. */
export const fromStored = (raw: unknown): Block[] => {
  const blocks = (raw as { blocks?: Array<{ type: string; data?: BlockData }> })?.blocks;
  if (!Array.isArray(blocks) || blocks.length === 0) return [makeBlock()];
  return blocks.map((b) => ({
    key: newKey(),
    type: (BLOCK_SPECS.some((s) => s.type === b.type) ? b.type : 'paragraph') as BlockType,
    data: b.data ?? {},
  }));
};

export const toStored = (blocks: Block[]) => ({
  blocks: blocks
    // An empty trailing paragraph is an editing artefact, not content.
    .filter((b, i) => !(i === blocks.length - 1 && b.type === 'paragraph' && !b.data.text?.trim()))
    .map(({ type, data }) => ({ type, data })),
});

/** Rough reading time, used to prefill the field rather than to be exact. */
export const readingMinutes = (blocks: Block[]): number => {
  const words = blocks
    .map((b) => b.data.text ?? '')
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

/** First paragraph, trimmed, for prefilling the excerpt. */
export const firstParagraph = (blocks: Block[], max = 160): string => {
  const text = blocks.find((b) => b.type === 'paragraph' && b.data.text?.trim())?.data.text ?? '';
  const plain = text.replace(/[*_`]/g, '').trim();
  return plain.length > max ? `${plain.slice(0, max - 1)}…` : plain;
};

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, 'dan')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
