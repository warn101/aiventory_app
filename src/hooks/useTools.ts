import { useState, useEffect } from 'react';
import { db } from '../lib/supabase';
import { Tool, FilterState } from '../types';
import { mockTools } from '../data/mockData';

export const useTools = () => {
  const [tools, setTools] = useState<Tool[]>(mockTools); // Start with mock data
  const [filteredTools, setFilteredTools] = useState<Tool[]>(mockTools);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const loadTools = async (filters?: FilterState & { search?: string }) => {
    try {
      console.log('Tools: Loading tools with filters:', filters);
      setLoading(true);
      setError(null);

      // Try to load from Supabase without aggressive timeout
      const { data, error: fetchError } = await db.getTools({
        category: filters?.category,
        pricing: filters?.pricing,
        rating: filters?.rating,
        featured: filters?.featured,
        search: filters?.search
      });

      if (fetchError) {
        console.warn('Tools: Supabase error, using mock data:', fetchError);
        const filteredMockTools = applyFiltersToMockData(mockTools, filters);
        setTools(mockTools);
        setFilteredTools(filteredMockTools);
        setIsOnline(false);
        setError('Using offline data. Some features may be limited.');
        return;
      }

      // Transform Supabase data to our Tool interface
      const transformedTools: Tool[] = (data || []).map((tool: any) => ({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        category: tool.category,
        pricing: tool.pricing,
        rating: tool.rating || 0,
        reviews: tool.reviews_count || 0,
        tags: tool.tags || [],
        image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400',
        url: tool.website_url,
        featured: tool.featured || false,
        verified: tool.verified || false,
        addedDate: tool.created_at ? tool.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        lastUpdated: tool.updated_at ? tool.updated_at.split('T')[0] : new Date().toISOString().split('T')[0]
      }));

      console.log('Tools: Loaded from Supabase:', transformedTools.length);

      if (transformedTools.length === 0) {
        console.log('Tools: No data in Supabase, using mock data');
        const filteredMockTools = applyFiltersToMockData(mockTools, filters);
        setTools(mockTools);
        setFilteredTools(filteredMockTools);
        setIsOnline(false);
        setError('No tools found in database. Showing sample data.');
      } else {
        setTools(transformedTools);
        setFilteredTools(transformedTools);
        setIsOnline(true);
        setError(null);
      }
    } catch (err) {
      console.error('Tools: Error loading tools:', err);
      
      // Always fall back to mock data gracefully
      const filteredMockTools = applyFiltersToMockData(mockTools, filters);
      setTools(mockTools);
      setFilteredTools(filteredMockTools);
      setIsOnline(false);
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
      
      // Try Supabase first without aggressive timeout
      const { data, error } = await db.getTool(id);
      
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
        rating: data.rating || 0,
        reviews: data.reviews_count || 0,
        tags: data.tags || [],
        image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400',
        url: data.website_url,
        featured: data.featured || false,
        verified: data.verified || false,
        addedDate: data.created_at ? data.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        lastUpdated: data.updated_at ? data.updated_at.split('T')[0] : new Date().toISOString().split('T')[0]
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
      
      // Validate required fields
      if (!toolData.name || !toolData.description || !toolData.category) {
        throw new Error('Missing required fields: name, description, or category');
      }
      
      const website_url = toolData.website_url || toolData.url;
      if (!website_url) {
        throw new Error('Website URL is required');
      }
      
      const toolPayload = {
        name: toolData.name.trim(),
        description: toolData.description.trim(),
        category: toolData.category,
        pricing: toolData.pricing,
        tags: toolData.tags || [],
        // image_url field removed from database schema
        website_url: website_url.trim(),
        rating: toolData.rating || 0,
        reviews_count: toolData.reviews_count || 0,
        featured: toolData.featured || false,
        verified: toolData.verified || false
      };
      
  

      const { data, error } = await db.createTool(toolPayload);

      if (error) {
        console.error('Tools: Create tool error:', error);
        throw error;
      }

      console.log('Tools: Tool created successfully');
      
      // Reload tools to get updated list
      await loadTools();
      
      return { data, error: null };
    } catch (err) {
      console.error('Tools: Error creating tool:', err);
      
      let errorMessage = 'Failed to create tool';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      return { data: null, error: errorMessage };
    }
  };

  // Load tools on mount with graceful error handling
  useEffect(() => {
    console.log('Tools: Initial load (background)');
    loadTools().catch(err => {
      console.warn('Tools: Initial load failed:', err);
      // Error is already handled in loadTools
    });
  }, []);

  return {
    tools,
    filteredTools,
    loading,
    error,
    isOnline,
    loadTools,
    getTool,
    createTool,
    refetch: () => loadTools()
  };
};