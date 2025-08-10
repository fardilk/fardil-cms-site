import React from 'react';

type Article = {
  meta_title?: string;
  meta_description?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  tags?: unknown[];
};

const Seo = ({ article }: { article: Article }) => (
  <div className="mt-8 bg-white rounded-xl shadow p-8 max-w-3xl">
    <h2 className="text-xl font-bold mb-4">SEO Settings</h2>
    <div className="mb-4">
      <label className="block font-semibold mb-1" htmlFor="metaTitle">Meta Title</label>
      <input
        id="metaTitle"
        type="text"
        maxLength={90}
        className="w-full border rounded px-3 py-2"
        value={article.meta_title || ''}
        onChange={() => {}}
        placeholder="Enter meta title (max 90 characters)"
      />
      <div className="text-xs text-gray-500 mt-1">{(article.meta_title?.length || 0)}/90 characters</div>
    </div>
    <div className="mb-4">
      <label className="block font-semibold mb-1" htmlFor="metaDescription">Meta Description</label>
      <textarea
        id="metaDescription"
        rows={3}
        className="w-full border rounded px-3 py-2"
        value={article.meta_description || ''}
        onChange={() => {}}
        placeholder="Enter meta description"
      />
      <div className="mt-2 border rounded p-3 bg-gray-50">
        <div className="text-xs text-gray-500 mb-1">Google Preview</div>
        <div className="font-semibold text-blue-800 truncate">{article.meta_title || article.title}</div>
        <div className="text-green-700 text-xs mb-1">yourdomain.com/{article.slug || ''}</div>
        <div className="text-gray-700">{article.meta_description || article.excerpt}</div>
      </div>
    </div>
    <div className="mb-4">
      <label className="block font-semibold mb-1" htmlFor="slug">Slug</label>
      <input
        id="slug"
        type="text"
        className="w-full border rounded px-3 py-2"
        value={article.slug || ''}
        onChange={() => {}}
        placeholder="Edit slug"
      />
    </div>
    <div className="mb-4">
      <label className="block font-semibold mb-1">Tags</label>
      <div className="flex flex-wrap gap-2">
        {(Array.isArray(article.tags) ? article.tags : []).map((tag: unknown, idx: number) => {
          let label = '';
          if (typeof tag === 'string') label = tag;
          else if (tag && typeof tag === 'object') {
            const obj = tag as { Name?: string; Slug?: string; name?: string; slug?: string };
            label = obj.Name || obj.Slug || obj.name || obj.slug || '';
          }
          return label ? (
            <span key={`${label}-${idx}`} className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">{label}</span>
          ) : null;
        })}
      </div>
    </div>
  </div>
);

export default Seo;