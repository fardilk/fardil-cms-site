import type { RichSpan } from './types';

export const sameMarkSig = (a?: RichSpan, b?: RichSpan) =>
  !!a && !!b &&
  (a.marks?.join('|') || '') === (b.marks?.join('|') || '') &&
  (a.href || '') === (b.href || '') &&
  (a.target || '') === (b.target || '');

export const normalizeSpans = (sp: RichSpan[]): RichSpan[] => {
  const out: RichSpan[] = [];
  for (const s of sp) {
    if (!s.text) continue;
    const last = out[out.length - 1];
    if (last && sameMarkSig(last, s)) {
      last.text += s.text;
    } else {
      out.push({ text: s.text, marks: s.marks ? [...s.marks] : undefined, href: s.href, target: s.target });
    }
  }
  return out.length ? out : [{ text: '' }];
};

export const escapeHtml = (t: string) => t
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

export const spansToHTML = (arr: RichSpan[]) =>
  arr
    .map((s) => {
      let html = escapeHtml(s.text || '');
      if (s.marks?.includes('bold')) html = `<strong>${html}</strong>`;
      if (s.marks?.includes('italic')) html = `<em>${html}</em>`;
      if (s.marks?.includes('underline')) html = `<u>${html}</u>`;
      if (s.marks?.includes('strike')) html = `<s>${html}</s>`;
      if ((s.marks?.includes('link') || s.href) && s.href) {
        const tgt = s.target ? ` target="${s.target}" rel="${s.target === '_blank' ? 'noopener noreferrer' : ''}"` : '';
        html = `<a href="${s.href}"${tgt}>${html}</a>`;
      }
      return html;
    })
    .join('');
