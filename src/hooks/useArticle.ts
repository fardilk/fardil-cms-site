import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export type ArticleCategory = { id: number; name: string; slug: string };
export type ArticleTag = { id: number; name: string; slug: string };

/**
 * Mirrors what the API actually returns. The previous shape guessed at
 * `status`, `category` and `featuredImage`, none of which exist in the
 * response, so the list showed every article as a draft with no image and no
 * category no matter what was stored.
 */
export type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  meta_description?: string;
  featured_image?: string;
  alt_text?: string;
  reading_time?: number;
  is_featured?: boolean;
  published_at?: string | null;
  created_at?: string;
  status_id?: number;
  status_detail?: { id: number; name: string };
  categories?: ArticleCategory[];
  tags?: ArticleTag[];
};

export const statusName = (a: Article): string => a.status_detail?.name ?? 'DRAFT';
export const isPublished = (a: Article): boolean => statusName(a) === 'PUBLISHED';

export function useArticle() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/articles', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch articles');
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : []);
    } catch {
      setError('Gagal memuat artikel');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { articles, loading, error, reload };
}
