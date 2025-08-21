import type { RichSpan } from './types';
import { normalizeSpans, sameMarkSig } from './utils';

export const parseNode = (
  node: Node,
  active: { bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean; href?: string; target?: string },
  out: RichSpan[]
) => {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    if (!text) return;
    const marks: NonNullable<RichSpan['marks']> = [];
    if (active.bold) marks.push('bold');
    if (active.italic) marks.push('italic');
    if (active.underline) marks.push('underline');
    if (active.strike) marks.push('strike');
    if (active.href) marks.push('link');
    const last = out[out.length - 1];
    if (last && sameMarkSig(last, { text: '', marks, href: active.href, target: active.target })) {
      last.text += text;
    } else {
      out.push({ text, marks: marks.length ? marks : undefined, href: active.href, target: active.target });
    }
    return;
  }
  if (!(node instanceof Element)) {
    node.childNodes.forEach((n) => parseNode(n, active, out));
    return;
  }
  const tag = node.tagName.toLowerCase();
  const next = { ...active };
  if (tag === 'strong' || tag === 'b') next.bold = true;
  if (tag === 'em' || tag === 'i') next.italic = true;
  if (tag === 'u') next.underline = true;
  if (tag === 's' || tag === 'strike') next.strike = true;
  if (tag === 'a') {
    next.href = (node as HTMLAnchorElement).getAttribute('href') || undefined;
    const target = (node as HTMLAnchorElement).getAttribute('target') || undefined;
    next.target = target || undefined;
  }
  node.childNodes.forEach((n) => parseNode(n, next, out));
};

export const rootToSpans = (root: HTMLElement | null): RichSpan[] => {
  if (!root) return [{ text: '' }];
  const arr: RichSpan[] = [];
  root.childNodes.forEach((n) => parseNode(n, {}, arr));
  return normalizeSpans(arr);
};
