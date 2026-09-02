import DashboardLayout from '@/components/layout/GlobalLayout';
import { useState } from 'react';
import { useArticle } from '../hooks/useArticle';
import { useNavigate } from 'react-router-dom';
import { imageURL } from '@/lib/api';
import ImageWithFallback from '@/components/atoms/ImageWithFallback';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/atoms/Button';

const statusStyles: Record<string, string> = {
  active: 'bg-[#cdfee1] text-[#0c5132]',
  archived: 'bg-[#e3e3e3] text-[#303030]',
  deleted: 'bg-[#f1f1f1] text-[#8a8a8a]',
  draft: 'bg-[#ffd6a4] text-[#5e4200]',
};

const truncate = (str: string, n: number) =>
  str.length > n ? str.slice(0, n - 1) + '…' : str;

const ArticlePage = () => {
  const [page, setPage] = useState(1);
  const perPage = 8;
  const navigate = useNavigate();

  const { articles, loading, error } = useArticle();

  // Use DB reference for field names
  const validArticles = Array.isArray(articles)
    ? articles.filter(a => a && typeof a.title === 'string')
    : [];
  const sortedArticles = validArticles.sort((a, b) => a.title.localeCompare(b.title));
  const pagedArticles = sortedArticles.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(sortedArticles.length / perPage);

  return (
    <DashboardLayout wide>
      <PageHeader
        title="Artikel"
        subtitle="Tulisan yang tayang di /blog"
        actions={
          <Button variant="primary" icon="fa-plus" onClick={() => navigate('/artikel/baru')}>
            Tulis artikel
          </Button>
        }
      />
      <Card>
        {loading && <div className="text-center py-8">Loading...</div>}
        {error && <div className="text-center py-8 text-red-500">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {pagedArticles.map(article => (
            <div key={article.id} className="relative flex flex-col overflow-hidden rounded-lg border border-[var(--p-border)] bg-white transition hover:border-[var(--p-border-strong)]">
              {/* Status label */}
              <span
                className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold z-10 ${
                  statusStyles[
                    (article.status?.toLowerCase() || 'draft')
                  ] || 'bg-gray-200 text-gray-600'
                }`}
              >
                {article.status || 'draft'}
              </span>
              {/* Image */}
              <div className="w-full aspect-video bg-gray-200 rounded-t-lg overflow-hidden flex items-center justify-center">
                <ImageWithFallback
                  src={article.featuredImage ? imageURL(article.featuredImage) : ''}
                  alt={article.title}
                  className="object-cover w-full h-full"
                  iconClassName="text-4xl"
                />
              </div>
              <div className="p-4 flex-1 flex flex-col">
                {/* Category */}
                {article.category && (
                  <span className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">
                    {article.category}
                  </span>
                )}
                {/* Title */}
                <h2 className="text-lg font-semibold mb-2 text-blue-700">{article.title}</h2>
                {/* Par */}
                <p className="text-gray-500 mb-2 flex-1">
                  {truncate(article.excerpt || article.meta_description || '', 60)}
                </p>
                {/* Tags */}
                {Array.isArray(article.tags) && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {article.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="rounded-lg bg-[#e3e3e3] px-2 py-0.5 text-xs text-[var(--p-text)]">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {/* See Details Button */}
                <button
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#303030] px-3 py-1.5 text-[0.8125rem] font-medium text-white hover:bg-[#1a1a1a]"
                  onClick={() => navigate(`/artikel/${article.id}`)}
                >
                  Lihat
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* Pagination Controls */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Showing {(page - 1) * perPage + 1}
            -{Math.min(page * perPage, sortedArticles.length)} of {sortedArticles.length}
          </span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded border bg-gray-100 text-gray-700 cursor-pointer disabled:opacity-50"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </button>
            <button
              className="px-3 py-1 rounded border bg-gray-100 text-gray-700 cursor-pointer disabled:opacity-50"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default ArticlePage;
