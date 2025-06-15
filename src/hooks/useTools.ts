import { useState, useEffect } from 'react';
import { db } from '../lib/supabase';
import { Tool, FilterState } from '../types';
import { mockTools } from '../data/mockData';

export const useTools = () => {
  const [tools, setTools] = useState<Tool[]>(mockTools); // Start with mock data
  const [filteredTools, setFilteredTools] = useState<Tool[]>(mockTools);
  const [loading, setLoading] = useState(false); // Don't start loading
  const [error, setError] = useState<string | null>(null);

  const loadTools = async (filters?: FilterState & { search?: string }) => {
    try {
      console.log('Tools: Loading tools with filters:', filters);
      setLoading(true);
      setError(null);

      // Try to load from Supabase with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Tools load timeout')), 3000)
      );

      const toolsPromise = db.getTools({
        category: filters?.category,
        pricing: filters?.pricing,
        rating: filters?.rating,
        featured: filters?.featured,
        search: filters?.search
      });

      const { data, error: fetchError } = await Promise.race([toolsPromise, timeoutPromise]) as any;

      if (fetchError) {
        console.error('Tools: Supabase error:', fetchError);
        // Use mock data with filters applied
        const filteredMockTools = applyFiltersToMockData(mockTools, filters);
        setTools(mockTools);
        setFilteredTools(filteredMockTools);
        setError('Using offline data. Some features may be limited.');
        return;
      }

      const transformedTools: Tool[] = (data || []).map((tool: any) => ({
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

      console.log('Tools: Loaded from Supabase:', transformedTools.length);

      if (transformedTools.length === 0) {
        console.log('Tools: No data in Supabase, using mock data');
        const filteredMockTools = applyFiltersToMockData(mockTools, filters);
        setTools(mockTools);
        setFilteredTools(filteredMockTools);
      } else {
        setTools(transformedTools);
        setFilteredTools(transformedTools);
      }
    } catch (err) {
      console.error('Tools: Error loading tools:', err);
      // Always fall back to mock data
      const filteredMockTools = applyFiltersToMockData(mockTools, filters);
      setTools(mockTools);
      setFilteredTools(filteredMockTools);
      setError('Connection error. Using offline data.');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersToMockData = (tools: Tool[], filters?: FilterState & { search?: string }) => {
    if (!filters) return tools;

    return tools.filter(tool => {
      // Category filter
      if (filters.category && filters.category !== 'all' && tool.category !== filters.category) {
        return false;
      }

      // Pricing filter
      if (filters.pricing && filters.pricing !== 'all' && tool.pricing !== filters.pricing) {
        return false;
      }

      // Rating filter
      if (filters.rating && filters.rating > 0 && tool.rating < filters.rating) {
        return false;
      }

      // Featured filter
      if (filters.featured && !tool.featured) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = `${tool.name} ${tool.description} ${tool.tags.join(' ')}`.toLowerCase();
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  };

  const getTool = async (id: string): Promise<Tool | null> => {
    try {
      console.log('Tools: Getting tool:', id);
      
      // Try Supabase first with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Get tool timeout')), 2000)
      );
      
      const toolPromise = db.getTool(id);
      
      const { data, error } = await Promise.race([toolPromise, timeoutPromise]) as any;
      
      if (error || !data) {
        console.log('Tools: Tool not found in Supabase, checking mock data');
        const mockTool = mockTools.find(tool => tool.id === id);
        return mockTool || null;
      }

      const transformedTool: Tool = {
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

      console.log('Tools: Tool loaded from Supabase:', transformedTool);
      return transformedTool;
    } catch (err) {
      console.error('Tools: Error getting tool:', err);
      const mockTool = mockTools.find(tool => tool.id === id);
      return mockTool || null;
    }
  };

  const createTool = async (toolData: any) => {
    try {
      console.log('Tools: Creating tool:', toolData);
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

      console.log('Tools: Tool created successfully');
      // Reload tools to get updated list
      await loadTools();
      
      return { data, error: null };
    } catch (err) {
      console.error('Tools: Error creating tool:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Failed to create tool' };
    }
  };

  // Load tools on mount but don't block UI
  useEffect(() => {
    console.log('Tools: Initial load (background)');
    loadTools(); // This runs in background, UI shows mock data immediately
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