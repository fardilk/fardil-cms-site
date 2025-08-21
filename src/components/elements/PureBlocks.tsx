import React from 'react';
import { spansToHTML } from '@/components/atoms/rich/utils';

export type PureBlock = { id?: string; type: string; data: any };

export const PureBlocks: React.FC<{ blocks: PureBlock[] } > = ({ blocks }) => {
  return (
    <>
      {blocks.map((block) => {
        const key = block.id || Math.random().toString(36).slice(2);
        const t = (block.type || '').toLowerCase();
        if (t === 'heading' || t === 'header') {
          const lvl = Math.min(6, Math.max(1, Number(block.data?.level) || 1));
          const tag = (`h${lvl}` as unknown) as string;
          const text = String(block.data?.content ?? block.data?.text ?? '');
          const align = (block.data?.align as 'left'|'center'|'right'|'justify'|undefined) || 'left';
          const sizeClass = (
            lvl === 1 ? 'text-4xl md:text-5xl' :
            lvl === 2 ? 'text-3xl md:text-4xl' :
            lvl === 3 ? 'text-2xl md:text-3xl' :
            lvl === 4 ? 'text-xl md:text-2xl' :
            'text-lg'
          );
          return React.createElement(tag, { key, className: `${sizeClass} my-2`, style: { textAlign: align } }, text);
        }
        if (t === 'paragraph') {
          const list = block.data?.list as 'none'|'ul'|'ol'|undefined;
          if (list === 'ul' || list === 'ol') {
            const items = Array.isArray(block.data?.items) ? block.data.items : [];
            const Tag = list as 'ul'|'ol';
            const listClass = list === 'ul' ? 'list-disc list-outside pl-6 my-2' : 'list-decimal list-outside pl-6 my-2';
            return React.createElement(
              Tag,
              { key, className: listClass, style: { textAlign: (block.data?.align as any) || 'left' } },
              items.map((it: any, i: number) => React.createElement('li', { key: i, className: 'my-1', dangerouslySetInnerHTML: { __html: spansToHTML(Array.isArray(it?.spans) ? it.spans : [{ text: String(it?.text || '') }]) } }))
            );
          }
          const spans = Array.isArray(block.data?.spans) ? block.data.spans : [{ text: String(block.data?.content || '') }];
          return <p key={key} style={{ textAlign: (block.data?.align as any) || 'left' }} dangerouslySetInnerHTML={{ __html: spansToHTML(spans as any) }} />;
        }
        if (t === 'blockquote') {
          return <blockquote key={key} className="italic border-l-4 border-gray-300 pl-4 ml-2 text-gray-700">{String(block.data?.content || '')}</blockquote>;
        }
        if (t === 'pullquote') {
          return <div key={key} className="my-4"><div className="italic text-xl font-semibold text-gray-800">“{String(block.data?.content || '')}”</div></div>;
        }
  // 'code' block removed — rawhtml (Code Snippet) renders via raw HTML
        if (t === 'rawhtml') {
          const html = String(block.data?.html || '');
          return <div key={key} dangerouslySetInnerHTML={{ __html: html }} />;
        }
        if (t === 'image') {
          const imgs = Array.isArray(block.data?.images) ? block.data.images : [];
          if (!imgs.length) return null;
          return (
            <div key={key} className="my-4 grid gap-3" style={{ gridTemplateColumns: imgs.length > 1 ? 'repeat(auto-fill, minmax(220px, 1fr))' : '1fr' }}>
              {imgs.map((img: any, i: number) => (
                <img key={i} src={img?.src} alt={img?.alt || ''} className="w-full h-auto rounded border border-gray-200" />
              ))}
            </div>
          );
        }
        if (t === 'video') {
          const url = block.data?.url as string | undefined;
          return url ? (
            <div key={key} className="my-3">
              <iframe className="w-full aspect-video rounded" src={url} title="Embedded video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          ) : null;
        }
        if (t === 'table') {
          const rows = Number(block.data?.rows) || 0;
          const cols = Number(block.data?.cols) || 0;
          const cells: string[][] = Array.isArray(block.data?.cells) ? block.data.cells : Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));
          return (
            <div key={key} className="my-3 overflow-auto"><table className="min-w-full border-collapse"><tbody>
              {cells.map((row, r) => (
                <tr key={r}>{row.map((cell, c) => (<td key={c} className="border border-gray-300 p-2 text-sm">{cell}</td>))}</tr>
              ))}
            </tbody></table></div>
          );
        }
        if (t === 'divider') return <hr key={key} />;
        return null;
      })}
    </>
  );
};

export default PureBlocks;
