import { useState, useEffect } from 'react';
import { db } from '../lib/supabase';
import { Category } from '../types';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await db.getCategories();

      if (fetchError) {
        throw fetchError;
      }

      const transformedCategories: Category[] = (data || []).map(category => ({
        id: category.id,
        name: category.name,
        icon: category.icon,
        count: category.tools_count,
        color: category.color
      }));

      setCategories(transformedCategories);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: loadCategories
  };
};