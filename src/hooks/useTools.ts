import { useState, useEffect } from 'react';
import { db } from '../lib/supabase';
import { Tool, FilterState } from '../types';
import { mockTools } from '../data/mockData';

export const useTools = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTools = async (filters?: FilterState & { search?: string }) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await db.getTools({
        category: filters?.category,
        pricing: filters?.pricing,
        rating: filters?.rating,
        featured: filters?.featured,
        search: filters?.search
      });

      if (fetchError) {
        console.error('Supabase error:', fetchError);
        // Fallback to mock data if Supabase fails
        console.log('Using mock data as fallback');
        setTools(mockTools);
        setFilteredTools(mockTools);
        setError('Using offline data. Some features may be limited.');
        return;
      }

      const transformedTools: Tool[] = (data || []).map(tool => ({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        category: tool.category,
        pricing: tool.pricing,
        rating: tool.rating,
        reviews: tool.reviews_count,
        tags: tool.tags,
        image: tool.image_url,
        url: tool.website_url,
        featured: tool.featured,
        verified: tool.verified,
        addedDate: tool.created_at.split('T')[0],
        lastUpdated: tool.updated_at.split('T')[0]
      }));

      // If no data from Supabase, use mock data
      if (transformedTools.length === 0) {
        console.log('No data in Supabase, using mock data');
        setTools(mockTools);
        setFilteredTools(mockTools);
      } else {
        setTools(transformedTools);
        setFilteredTools(transformedTools);
      }
    } catch (err) {
      console.error('Error loading tools:', err);
      // Fallback to mock data
      setTools(mockTools);
      setFilteredTools(mockTools);
      setError('Connection error. Using offline data.');
    } finally {
      setLoading(false);
    }
  };

  const getTool = async (id: string): Promise<Tool | null> => {
    try {
      const { data, error } = await db.getTool(id);
      
      if (error || !data) {
        // Fallback to mock data
        const mockTool = mockTools.find(tool => tool.id === id);
        return mockTool || null;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        pricing: data.pricing,
        rating: data.rating,
        reviews: data.reviews_count,
        tags: data.tags,
        image: data.image_url,
        url: data.website_url,
        featured: data.featured,
        verified: data.verified,
        addedDate: data.created_at.split('T')[0],
        lastUpdated: data.updated_at.split('T')[0]
      };
    } catch (err) {
      console.error('Error getting tool:', err);
      // Fallback to mock data
      const mockTool = mockTools.find(tool => tool.id === id);
      return mockTool || null;
    }
  };

  const createTool = async (toolData: any) => {
    try {
      const { data, error } = await db.createTool({
        name: toolData.name,
        description: toolData.description,
        category: toolData.category,
        pricing: toolData.pricing,
        tags: toolData.tags,
        image_url: toolData.image || 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400',
        website_url: toolData.url,
        featured: false,
        verified: false
      });

      if (error) {
        throw error;
      }

      // Reload tools to get updated list
      await loadTools();
      
      return { data, error: null };
    } catch (err) {
      console.error('Error creating tool:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Failed to create tool' };
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  return {
    tools,
    filteredTools,
    loading,
    error,
    loadTools,
    getTool,
    createTool,
    refetch: () => loadTools()
  };
};