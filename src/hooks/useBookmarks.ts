// DEPRECATED: This hook is now a lightweight wrapper around BookmarkContext
// Use useBookmarkContext directly for better performance

import { useBookmarkContext } from '../contexts/BookmarkContext';

/**
 * @deprecated Use useBookmarkContext directly for better performance.
 * This hook is kept for backward compatibility only.
 */
export const useBookmarks = () => {
  console.warn('⚠️ useBookmarks is deprecated. Use useBookmarkContext for better performance.');
  return useBookmarkContext();
};

// Re-export the optimized hook for migration
export { useBookmarkContext, useBookmarks as useBookmarksLegacy } from '../contexts/BookmarkContext';