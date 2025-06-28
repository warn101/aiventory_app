import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Zap, Globe, X } from 'lucide-react';
import { db } from '../lib/supabase';
import { Tool } from '../types';
import ToolCard from './ToolCard';

interface HeroProps {
  onSearch?: (query: string) => void;
  onToolClick?: (id: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onSearch, onToolClick }) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Tool[]>([]);
  const [suggestions, setSuggestions] = useState<Tool[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced search for live suggestions
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const { data, error } = await db.getTools({ search: searchQuery });
        if (!error && data) {
          const transformedTools: Tool[] = data.slice(0, 5).map((tool: any) => ({
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
            addedDate: tool.created_at || new Date().toISOString(),
            lastUpdated: tool.updated_at || new Date().toISOString()
          }));
          setSuggestions(transformedTools);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    }, 300),
    []
  );

  // Handle input change with debounced suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  // Handle explore button click
  const handleExplore = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setShowSuggestions(false);

    try {
      const { data, error } = await db.getTools({ search: query });
      if (!error && data) {
        const transformedTools: Tool[] = data.map((tool: any) => ({
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
          addedDate: tool.created_at || new Date().toISOString(),
          lastUpdated: tool.updated_at || new Date().toISOString()
        }));
        setSearchResults(transformedTools);
        setShowResults(true);
        
        // Call parent search handler if provided
        if (onSearch) {
          onSearch(query);
        }
      }
    } catch (error) {
      console.error('Error searching tools:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (tool: Tool) => {
    setQuery(tool.name);
    setShowSuggestions(false);
    if (onToolClick) {
      onToolClick(tool.id);
    }
  };

  // Clear search results
  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
    setSuggestions([]);
    setShowResults(false);
    setShowSuggestions(false);
  };

  // Handle keyboard events
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleExplore();
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Debounce utility function
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  return (
    <section className="relative py-20 px-4 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 via-accent-500/5 to-purple-600/10"></div>
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="inline-flex items-center space-x-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Discover the Future of AI</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Every AI Tool
              <br />
              <span className="bg-gradient-to-r from-primary-600 via-accent-500 to-purple-600 bg-clip-text text-transparent">
                Curated & Accessible
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Discover, track, and share the best AI tools through intelligent curation and community collaboration. 
              Your gateway to the AI revolution starts here.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Search AI tools, categories, or use cases..."
                  className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none bg-white/80 backdrop-blur-sm transition-all duration-200"
                />
                {query && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
                
                {/* Live Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto"
                    >
                      {suggestions.map((tool) => (
                        <button
                          key={tool.id}
                          onClick={() => handleSuggestionClick(tool)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
                        >
                          <div className="font-medium text-gray-900">{tool.name}</div>
                          <div className="text-sm text-gray-600 truncate">{tool.description}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                              {tool.category}
                            </span>
                            <span className="text-xs text-gray-500">{tool.pricing}</span>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExplore}
                disabled={isSearching || !query.trim()}
                className="bg-primary-600 text-white px-8 py-4 rounded-xl hover:bg-primary-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
              >
                {isSearching ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Searching...
                  </div>
                ) : (
                  'Explore Now'
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Search Results Section */}
          <AnimatePresence>
            {showResults && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-12 mb-16"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Search Results for "{query}"
                    </h2>
                    <p className="text-gray-600">
                      Found {searchResults.length} tool{searchResults.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={clearSearch}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Clear Results
                  </button>
                </div>

                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {searchResults.map((tool, index) => (
                      <motion.div
                        key={tool.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <ToolCard
                           tool={tool}
                           onToolClick={() => onToolClick?.(tool.id)}
                         />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 text-gray-400 rounded-full mb-4">
                      <Search className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No tools found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Try adjusting your search terms or explore our categories below.
                    </p>
                    <button
                      onClick={clearSearch}
                      className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Browse All Tools
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feature Cards - Only show when not displaying search results */}
          {!showResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-xl mb-4">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant Discovery</h3>
              <p className="text-gray-600">Find the perfect AI tool for any use case with intelligent search and filtering.</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-100 text-accent-600 rounded-xl mb-4">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Curated Quality</h3>
              <p className="text-gray-600">Access a constantly updated, high-quality catalog of verified AI tools.</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-xl mb-4">
                <Globe className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Community Driven</h3>
              <p className="text-gray-600">Leverage collective intelligence for reviews and recommendations.</p>
            </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
