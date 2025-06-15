import { useState, useEffect } from 'react';
import { db } from '../lib/supabase';
import { Category } from '../types';
import { categories as mockCategories } from '../data/mockData';

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
        console.error('Supabase error:', fetchError);
        // Fallback to mock data
        console.log('Using mock categories as fallback');
        setCategories(mockCategories);
        setError('Using offline data. Some features may be limited.');
        return;
      }

      const transformedCategories: Category[] = (data || []).map(category => ({
        id: category.id,
        name: category.name,
        icon: category.icon,
        count: category.tools_count,
        color: category.color
      }));

      // If no data from Supabase, use mock data
      if (transformedCategories.length === 0) {
        console.log('No categories in Supabase, using mock data');
        setCategories(mockCategories);
      } else {
        setCategories(transformedCategories);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      // Fallback to mock data
      setCategories(mockCategories);
      setError('Connection error. Using offline data.');
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