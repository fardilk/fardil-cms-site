import type { ContentBlock } from '@/components/func/contentBlocks';

// Helper: create unique id
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// Convert internal blocks -> simple HTML string for the HTML tab
export function blocksToHTML(blocks: ContentBlock[]): string {
  const esc = (s: string) => s.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m] as string));
  const spanToHTML = (span: any): string => {
    let inner = esc(span.text || '');
    const marks: string[] = Array.isArray(span.marks) ? span.marks : [];
    if (marks.includes('bold')) inner = `<strong>${inner}</strong>`;
    if (marks.includes('italic')) inner = `<em>${inner}</em>`;
    if (marks.includes('underline')) inner = `<u>${inner}</u>`;
    if (marks.includes('strike')) inner = `<s>${inner}</s>`;
    if (marks.includes('link') && span.href) {
      const target = span.target ? ` target="${esc(span.target)}" rel="noopener"` : '';
      inner = `<a href="${esc(span.href)}"${target}>${inner}</a>`;
    }
    return inner;
  };

  const parts: string[] = [];
  for (const b of blocks) {
    if (b.type === 'heading') {
      const lvl = Math.min(6, Math.max(1, b.data.level || 1));
      const text = esc(b.data.content || '');
      const align = b.data.align && b.data.align !== 'left' ? ` style="text-align:${b.data.align}"` : '';
      parts.push(`<h${lvl}${align}>${text}</h${lvl}>`);
      continue;
    }
    if (b.type === 'paragraph') {
      const list = b.data.list;
      if (list === 'ul' || list === 'ol') {
        const tag = list === 'ul' ? 'ul' : 'ol';
        const items = Array.isArray(b.data.items) ? b.data.items : [];
        const align = b.data.align && b.data.align !== 'left' ? ` style="text-align:${b.data.align}"` : '';
        const lis = items.map((it) => `<li>${(it.spans || [{ text: '' }]).map(spanToHTML).join('')}</li>`).join('');
        parts.push(`<${tag}${align}>${lis}</${tag}>`);
      } else {
        const spans = Array.isArray(b.data.spans) ? b.data.spans : [{ text: b.data.content || '' }];
        const align = b.data.align && b.data.align !== 'left' ? ` style="text-align:${b.data.align}"` : '';
        parts.push(`<p${align}>${spans.map(spanToHTML).join('')}</p>`);
      }
      continue;
    }
    if (b.type === 'image') {
      const imgs = Array.isArray((b as any).data?.images) ? (b as any).data.images : [];
      if (imgs.length) {
        // Render each image as its own <img>; gallery becomes multiple siblings
        for (const im of imgs) {
          const src = String(im?.src || '');
          if (!src) continue;
          const alt = String(im?.alt || '');
          parts.push(`<img src="${esc(src)}" alt="${esc(alt)}"/>`);
        }
      }
      continue;
    }
    if (b.type === 'rawhtml') {
      // Insert raw HTML exactly as provided; do not escape
      const html = String((b as any).data?.html || '')
        .trim();
      if (html) parts.push(html);
      continue;
    }
    // Basic passthroughs for common blocks (optional):
    if (b.type === 'divider') parts.push('<hr/>');
    if (b.type === 'blockquote') parts.push(`<blockquote>${esc(b.data.content || '')}</blockquote>`);
    // Ignore others for HTML export baseline
  }
  return parts.join('\n');
}

// Parse HTML (from HTML tab) into internal blocks
export function htmlToBlocks(html: string): ContentBlock[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const collectSpans = (node: Node, active: Set<string> = new Set(), linkHref?: string, linkTarget?: string): any[] => {
    const spans: any[] = [];
    const pushText = (text: string) => {
      if (!text) return;
      const s: any = { text };
      if (active.size) s.marks = Array.from(active);
      if (s.marks?.includes('link') && linkHref) {
        s.href = linkHref;
        if (linkTarget) s.target = linkTarget;
      }
      spans.push(s);
    };

    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        pushText(child.textContent || '');
        return;
      }
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tag = el.tagName.toLowerCase();
        const next = new Set(active);
        if (tag === 'b' || tag === 'strong') next.add('bold');
        if (tag === 'i' || tag === 'em') next.add('italic');
        if (tag === 'u') next.add('underline');
        if (tag === 's' || tag === 'del') next.add('strike');
        if (tag === 'a') next.add('link');
        const href = tag === 'a' ? el.getAttribute('href') || undefined : linkHref;
        const target = tag === 'a' ? el.getAttribute('target') || undefined : linkTarget;
        spans.push(...collectSpans(el, next, href, target));
        return;
      }
      // Ignore others
    });

    return spans;
  };

  const blocks: ContentBlock[] = [];
  const body = doc.body;
  const nodes = Array.from(body.childNodes);
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.nodeType === Node.ELEMENT_NODE) {
      const el = n as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const styleAlign = (el.getAttribute('style') || '').match(/text-align\s*:\s*(left|center|right|justify)/i)?.[1]?.toLowerCase();
      const align = (styleAlign === 'left' || styleAlign === 'center' || styleAlign === 'right' || styleAlign === 'justify') ? styleAlign : undefined;
      if (/^h[1-6]$/.test(tag)) {
        const level = parseInt(tag[1], 10);
        const text = el.textContent || '';
        blocks.push({ id: uid(), type: 'heading', data: { content: text, level, align } });
        return;
      }
      if (tag === 'img') {
        // Group consecutive top-level <img> tags into one image block (gallery)
        const images: Array<{ src: string; alt?: string }> = [];
        let j = i;
        while (j < nodes.length) {
          const nn = nodes[j];
          if (nn.nodeType !== Node.ELEMENT_NODE) break;
          const e2 = nn as HTMLElement;
          if (e2.tagName.toLowerCase() !== 'img') break;
          const src = e2.getAttribute('src') || '';
          const alt = e2.getAttribute('alt') || undefined;
          if (src) images.push({ src, alt });
          j++;
        }
        if (images.length) blocks.push({ id: uid(), type: 'image', data: { images, mode: images.length > 1 ? 'gallery' : 'single' } });
        i = j - 1; // advance outer loop to last processed img
        continue;
      }
      if (tag === 'p') {
        const spans = collectSpans(el);
        blocks.push({ id: uid(), type: 'paragraph', data: { spans, list: 'none', align } });
        return;
      }
      if (tag === 'ul' || tag === 'ol') {
        const style = tag === 'ul' ? 'ul' : 'ol';
        const items: any[] = [];
        el.querySelectorAll(':scope > li').forEach((li) => {
          items.push({ spans: collectSpans(li) });
        });
        blocks.push({ id: uid(), type: 'paragraph', data: { list: style, items, align } });
        return;
      }
      if (tag === 'hr') {
        blocks.push({ id: uid(), type: 'divider', data: {} });
        return;
      }
      if (tag === 'blockquote') {
        blocks.push({ id: uid(), type: 'blockquote', data: { content: el.textContent || '' } });
        return;
      }
      // ignore unsupported tags at top-level
    }
    if (n.nodeType === Node.COMMENT_NODE || n.nodeType === Node.TEXT_NODE) {
      const text = n.textContent || '';
      if (text.trim()) {
        // Treat stray text nodes as raw HTML snippet to preserve exact content
        blocks.push({ id: uid(), type: 'rawhtml', data: { html: text } });
      }
    }
  }

  return blocks;
}
