import React, { useState } from 'react';
import { useBookmarkContext } from '../contexts/BookmarkContext';
import { AlertCircle, RefreshCw, Bookmark, BookmarkCheck } from 'lucide-react';
import { Tool } from '../types';

const BookmarksTest: React.FC = () => {
  const {
    bookmarkedTools,
    loading,
    error,
    refreshBookmarks,
    getBookmarksWithTools,
    clearAllBookmarks,
    toggleBookmark,
    isBookmarked
  } = useBookmarkContext();
  
  const [tools, setTools] = useState<Tool[]>([]);
  const [fetchingTools, setFetchingTools] = useState(false);
  const [testToolId, setTestToolId] = useState('test-tool-123');

  const handleLoadBookmarkedTools = async () => {
    setFetchingTools(true);
    try {
      const bookmarkedToolsData = await getBookmarksWithTools();
      // Transform the data to match the Tool type
      const transformedTools = bookmarkedToolsData.flat().map(tool => ({
        id: tool.id || '',
        name: tool.name || '',
        description: tool.description || '',
        category: tool.category || '',
        pricing: tool.pricing || 'free',
        rating: tool.rating || 0,
        reviews: tool.reviews || 0,
        tags: tool.tags || [],
        image: '',
        url: tool.url || '',
        featured: tool.featured || false,
        verified: tool.verified || false,
        addedDate: tool.addedDate || '',
        lastUpdated: tool.lastUpdated || ''
      }));
      setTools(transformedTools);
      console.log('Loaded bookmarked tools:', transformedTools);
    } catch (err) {
      console.error('Failed to load bookmarked tools:', err);
    } finally {
      setFetchingTools(false);
    }
  };

  const handleToggleBookmark = async () => {
    console.log('🔄 Testing bookmark toggle for tool:', testToolId);
    console.log('📊 Current bookmarked tools:', bookmarkedTools);
    console.log('🎯 Is currently bookmarked:', isBookmarked(testToolId));
    
    const result = await toggleBookmark(testToolId);
    
    if (result.error) {
      console.error('❌ Toggle bookmark failed:', result.error.message);
      alert(`Bookmark toggle failed: ${result.error.message}`);
    } else {
      console.log('✅ Toggle bookmark successful');
      console.log('📊 Updated bookmarked tools:', bookmarkedTools);
    }
  };

  // Error State
  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to Load Bookmarks
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refreshBookmarks}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Bookmarks Test Component
        </h2>
        
        {/* Status Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">Total Bookmarks</h3>
            <p className="text-2xl font-bold text-blue-600">{bookmarkedTools.length}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900">Loading State</h3>
            <p className="text-lg text-green-600">
              {loading || fetchingTools ? 'Loading...' : 'Ready'}
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900">Error State</h3>
            <p className="text-lg text-purple-600">
              {error ? 'Error' : 'No Errors'}
            </p>
          </div>
        </div>

        {/* Test Controls */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={refreshBookmarks}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Reload Bookmarks
            </button>
            
            <button
              onClick={handleLoadBookmarkedTools}
              disabled={fetchingTools}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${fetchingTools ? 'animate-spin' : ''}`} />
              Load Full Tool Data
            </button>
          </div>

          {/* Test Bookmark Toggle */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="text"
              value={testToolId}
              onChange={(e) => setTestToolId(e.target.value)}
              placeholder="Enter tool ID to test"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleToggleBookmark}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isBookmarked(testToolId)
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
              }`}
            >
              {isBookmarked(testToolId) ? (
                <>
                  <BookmarkCheck className="w-4 h-4" />
                  Remove Bookmark
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  Add Bookmark
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bookmarked Tool IDs */}
        {bookmarkedTools.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Bookmarked Tool IDs:
            </h3>
            <div className="flex flex-wrap gap-2">
              {bookmarkedTools.map(toolId => (
                <span
                  key={toolId}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {toolId}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Full Tool Data */}
        {tools.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Full Bookmarked Tools Data:
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg overflow-auto">
              <pre className="text-sm text-gray-700">
                {JSON.stringify(tools, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Empty State */}
        {bookmarkedTools.length === 0 && !loading && !error && (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Bookmarks Yet
            </h3>
            <p className="text-gray-600">
              Test the bookmark functionality using the controls above!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarksTest;
