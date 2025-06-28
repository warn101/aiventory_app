import React, { useState, useEffect } from 'react';
import { db } from '../lib/supabase';
import { Category } from '../types';
import { categories as mockCategories } from '../data/mockData';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>(mockCategories); // Start with mock data
  const [loading, setLoading] = useState(false); // Don't start loading
  const [error, setError] = useState<string | null>(null);
  const [isLoadingRef, setIsLoadingRef] = useState(false); // Prevent concurrent requests

  const loadCategories = async () => {
    // Prevent concurrent requests
    if (isLoadingRef) {
      console.log('Categories: Already loading, skipping...');
      return;
    }
    
    try {
      console.log('Categories: Loading categories...');
      setIsLoadingRef(true);
      setLoading(true);
      setError(null);

      // Try to load from Supabase with 5s timeout (connection test showed <300ms)
      const timeoutPromise = new Promise((resolve) => 
        setTimeout(() => resolve({ data: null, error: new Error('Categories load timeout') }), 5000)
      );

      const categoriesPromise = db.getCategories();

      const { data, error: fetchError } = await Promise.race([categoriesPromise, timeoutPromise]) as any;

      if (fetchError) {
        console.warn('Categories: Using offline data due to:', fetchError.message);
        setCategories(mockCategories);
        setError(null); // Don't show error to user, just use fallback
        return;
      }

      const transformedCategories: Category[] = (data || []).map((category: any) => ({
        id: category.id,
        name: category.name,
        icon: category.icon,
        count: category.tools_count,
        color: category.color
      }));

      console.log('Categories: Loaded from Supabase:', transformedCategories.length);

      if (transformedCategories.length === 0) {
        console.log('Categories: No categories in Supabase, using mock data');
        setCategories(mockCategories);
      } else {
        setCategories(transformedCategories);
      }
    } catch (err) {
      console.error('Categories: Error loading categories:', err);
      setCategories(mockCategories);
      setError('Connection error. Using offline data.');
    } finally {
      setLoading(false);
      setIsLoadingRef(false);
    }
  };

  // Load categories on mount but don't block UI
  useEffect(() => {
    console.log('Categories: Initial load (background)');
    loadCategories(); // This runs in background, UI shows mock data immediately
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: loadCategories
  };
};