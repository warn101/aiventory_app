# Supabase Bookmarks 406 Error - Complete Solution

## 🔍 Root Cause Analysis

The **406 Not Acceptable** error when fetching bookmarks from Supabase typically occurs due to:

1. **Missing Accept Header**: Supabase REST API expects `Accept: application/json` header
2. **Authentication Issues**: Missing or invalid authorization headers
3. **RLS Policy Conflicts**: Row Level Security policies blocking access
4. **Malformed Query**: Incorrect query parameters or syntax
5. **Content-Type Mismatch**: Server cannot provide content in requested format

## ✅ Correct Implementation

### 1. Supabase JavaScript Client (Recommended)

```typescript
// Enhanced getBookmarks function with proper error handling
const getBookmarks = async (userId: string) => {
  try {
    console.log('🔍 Fetching bookmarks for user:', userId);
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }
    
    // Fetch bookmarks with joined tool data
    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        id,
        user_id,
        tool_id,
        created_at,
        tools (
          id,
          name,
          description,
          category,
          pricing,
          rating,
          reviews_count,
          tags,
          website_url,
          featured,
          verified,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }
    
    console.log('✅ Bookmarks fetched successfully:', data?.length || 0);
    return { data: data || [], error: null };
    
  } catch (err) {
    console.error('💥 Exception fetching bookmarks:', err);
    return { 
      data: [], 
      error: err instanceof Error ? err : new Error('Unknown error occurred')
    };
  }
};
```

### 2. Simple Bookmarks Only (No Joins)

```typescript
const getBookmarksSimple = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data: data || [], error: null };
    
  } catch (err) {
    console.error('Error fetching bookmarks:', err);
    return { data: [], error: err };
  }
};
```

### 3. REST API with Fetch (Alternative)

```typescript
const getBookmarksREST = async (userId: string) => {
  try {
    // Get current session for auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No valid session found');
    }
    
    const response = await fetch(
      `${supabaseUrl}/rest/v1/bookmarks?user_id=eq.${userId}&select=*,tools(*)`,
      {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    return { data, error: null };
    
  } catch (err) {
    console.error('REST API error:', err);
    return { data: [], error: err };
  }
};
```

## 🛠️ Enhanced useBookmarks Hook

```typescript
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useBookmarks = () => {
  const { user } = useAuth();
  const [bookmarkedTools, setBookmarkedTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBookmarks = useCallback(async () => {
    if (!user?.id) {
      setBookmarkedTools([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('bookmarks')
        .select('tool_id')
        .eq('user_id', user.id);
      
      if (fetchError) {
        throw fetchError;
      }
      
      setBookmarkedTools(data?.map(b => b.tool_id) || []);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load bookmarks';
      console.error('Error loading bookmarks:', errorMessage);
      setError(errorMessage);
      setBookmarkedTools([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const getBookmarksWithTools = useCallback(async () => {
    if (!user?.id) return [];
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('bookmarks')
        .select(`
          id,
          user_id,
          tool_id,
          created_at,
          tools (
            id,
            name,
            description,
            category,
            pricing,
            rating,
            reviews_count,
            tags,
            website_url,
            featured,
            verified,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      return data?.map(bookmark => bookmark.tools).filter(Boolean) || [];
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load bookmarks with tools';
      console.error('Error loading bookmarks with tools:', errorMessage);
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const toggleBookmark = async (toolId: string) => {
    if (!user?.id) {
      const error = new Error('User not authenticated');
      setError(error.message);
      return { error };
    }

    try {
      setError(null);
      const isBookmarked = bookmarkedTools.includes(toolId);
      
      if (isBookmarked) {
        // Remove bookmark
        const { error: deleteError } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('tool_id', toolId);
        
        if (deleteError) throw deleteError;
        
        setBookmarkedTools(prev => prev.filter(id => id !== toolId));
      } else {
        // Add bookmark
        const { error: insertError } = await supabase
          .from('bookmarks')
          .insert({ user_id: user.id, tool_id: toolId });
        
        if (insertError) throw insertError;
        
        setBookmarkedTools(prev => [...prev, toolId]);
      }
      
      return { error: null };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle bookmark';
      console.error('Error toggling bookmark:', errorMessage);
      setError(errorMessage);
      return { error: new Error(errorMessage) };
    }
  };

  // Auto-load bookmarks when user changes
  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  return {
    bookmarkedTools,
    loading,
    error,
    loadBookmarks,
    getBookmarksWithTools,
    toggleBookmark,
    isBookmarked: (toolId: string) => bookmarkedTools.includes(toolId)
  };
};
```

## 🚨 Error Handling & Fallback UX

### 1. Component with Error States

```tsx
import React from 'react';
import { useBookmarks } from '../hooks/useBookmarks';
import { AlertCircle, RefreshCw } from 'lucide-react';

const BookmarksPage: React.FC = () => {
  const { 
    bookmarkedTools, 
    loading, 
    error, 
    loadBookmarks, 
    getBookmarksWithTools 
  } = useBookmarks();
  
  const [tools, setTools] = useState([]);
  const [fetchingTools, setFetchingTools] = useState(false);

  const handleLoadBookmarkedTools = async () => {
    setFetchingTools(true);
    try {
      const bookmarkedToolsData = await getBookmarksWithTools();
      setTools(bookmarkedToolsData);
    } catch (err) {
      console.error('Failed to load bookmarked tools:', err);
    } finally {
      setFetchingTools(false);
    }
  };

  // Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Failed to Load Bookmarks
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadBookmarks}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  // Loading State
  if (loading || fetchingTools) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">
          {loading ? 'Loading bookmarks...' : 'Loading tools...'}
        </span>
      </div>
    );
  }

  // Empty State
  if (bookmarkedTools.length === 0) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Bookmarks Yet
        </h3>
        <p className="text-gray-600">
          Start exploring tools and bookmark your favorites!
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          My Bookmarks ({bookmarkedTools.length})
        </h2>
        <button
          onClick={handleLoadBookmarkedTools}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Load Full Details
        </button>
      </div>
      
      {/* Render tools grid here */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map(tool => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
};
```

## 🔧 Debugging Steps

### 1. Check Authentication
```typescript
const debugAuth = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  console.log('Session:', session);
  console.log('Auth Error:', error);
};
```

### 2. Test Simple Query
```typescript
const testSimpleQuery = async () => {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .limit(1);
  
  console.log('Simple query result:', { data, error });
};
```

### 3. Check RLS Policies
```sql
-- In Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'bookmarks';
```

## 📋 Checklist

- [ ] ✅ Supabase client properly configured
- [ ] ✅ User authentication verified
- [ ] ✅ RLS policies allow user access
- [ ] ✅ Proper error handling implemented
- [ ] ✅ Loading states managed
- [ ] ✅ Fallback UX for errors
- [ ] ✅ TypeScript types aligned
- [ ] ✅ Console logging for debugging

## 🎯 Key Takeaways

1. **Always use Supabase JS client** over raw fetch for better error handling
2. **Include proper authentication checks** before making queries
3. **Handle all error states** with user-friendly messages
4. **Use loading states** for better UX
5. **Test with simple queries first** before complex joins
6. **Check RLS policies** if getting permission errors
7. **Log errors properly** for debugging

This solution addresses the 406 error and provides a robust, production-ready bookmark system with comprehensive error handling and fallback UX.