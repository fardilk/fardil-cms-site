import { useEffect, useState } from 'react';

export type Article = {
  id: string;
  title: string;
  status?: string;
  category?: string;
  excerpt?: string;
  meta_description?: string;
  description?: string;
  tags?: string[];
  featuredImage?: string;
  // other fields...
};

export function useArticle() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch('http://localhost:8000/api/articles', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch articles');
        return res.json();
      })
      .then(data => {
        // Map backend fields to frontend Article type (like useCategory)
        type ApiArticle = {
          ID?: string;
          id?: string;
          Title?: string;
          title?: string;
          Status?: string;
          status?: string;
          Category?: string;
          category?: string;
          Excerpt?: string;
          excerpt?: string;
          MetaDescription?: string;
          meta_description?: string;
          Description?: string;
          description?: string;
          Body?: string;
          body?: string;
          Content?: string;
          content?: string;
          Tags?: string[];
          tags?: string[];
          FeaturedImage?: string;
          featured_image?: string;
        };

        const mapped = Array.isArray(data)
          ? data.map((a: ApiArticle) => ({
              id: a.ID ?? a.id,
              title: a.Title ?? a.title,
              status: a.Status ?? a.status,
              category: a.Category ?? a.category,
              excerpt: a.Excerpt ?? a.excerpt,
              meta_description: a.MetaDescription ?? a.meta_description,
              description: a.Description ?? a.description ?? a.Body ?? a.body ?? a.Content ?? a.content,
              tags: a.Tags ?? a.tags,
              featuredImage: a.FeaturedImage ?? a.featured_image,
              ...a,
            }))
          : [];
        setArticles(mapped);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { articles, loading, error };
}