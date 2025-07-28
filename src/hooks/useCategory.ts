import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export type CategoryType = {
    id: number;
    name: string;
    [key: string]: unknown;
    slug?: string;
};

type UseCategoryReturn = {
    categories: CategoryType[];
    refresh: () => Promise<void>;
    loading: boolean;
    error: string;
};

export function useCategory(): UseCategoryReturn {
    const [categories, setCategories] = useState<CategoryType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchCategories = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiFetch('/api/categories');
            if (!response.ok) throw new Error('Failed to fetch categories');
            const data = await response.json();
            // Map Go API fields if needed
            type ApiCategory = {
                ID?: number;
                Name?: string;
                id?: number;
                name?: string;
                Slug?: string;
                slug?: string;
                [key: string]: unknown;
            };

            const mapped = Array.isArray(data)
                ? data.map((cat: ApiCategory) => ({
                    id: cat.ID ?? cat.id,
                    name: cat.Name ?? cat.name,
                    slug: cat.Slug ?? cat.slug,
                    ...cat,
                }))
                : [];
            setCategories(mapped);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Unknown error');
            }
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const refresh = async () => {
        await fetchCategories();
    };

    return { categories, refresh, loading, error };
}