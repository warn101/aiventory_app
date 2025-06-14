import React from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Star, DollarSign, Sparkles } from 'lucide-react';
import { FilterState } from '../types';

interface SearchFiltersProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterState) => void;
  filters: FilterState;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ onSearch, onFilterChange, filters }) => {
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'text-generation', label: 'Text Generation' },
    { value: 'image-generation', label: 'Image Generation' },
    { value: 'developer-tools', label: 'Developer Tools' },
    { value: 'productivity', label: 'Productivity' },
    { value: 'video-editing', label: 'Video Editing' },
    { value: 'audio-tools', label: 'Audio Tools' },
    { value: 'data-analysis', label: 'Data Analysis' },
    { value: 'design-tools', label: 'Design Tools' }
  ];

  const pricingOptions = [
    { value: 'all', label: 'All Pricing' },
    { value: 'free', label: 'Free' },
    { value: 'freemium', label: 'Freemium' },
    { value: 'paid', label: 'Paid' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Search Bar */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search AI tools, categories, or use cases..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 lg:gap-6">
          {/* Category Filter */}
          <div className="min-w-[200px]">
            <select
              value={filters.category}
              onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
              className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all bg-white"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Pricing Filter */}
          <div className="min-w-[150px]">
            <select
              value={filters.pricing}
              onChange={(e) => onFilterChange({ ...filters, pricing: e.target.value })}
              className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all bg-white"
            >
              {pricingOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div className="min-w-[150px]">
            <select
              value={filters.rating}
              onChange={(e) => onFilterChange({ ...filters, rating: Number(e.target.value) })}
              className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all bg-white"
            >
              <option value={0}>All Ratings</option>
              <option value={4}>4+ Stars</option>
              <option value={4.5}>4.5+ Stars</option>
              <option value={4.8}>4.8+ Stars</option>
            </select>
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.featured}
                onChange={(e) => onFilterChange({ ...filters, featured: e.target.checked })}
                className="sr-only"
              />
              <div className={`relative w-12 h-6 rounded-full transition-colors ${
                filters.featured ? 'bg-primary-600' : 'bg-gray-200'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  filters.featured ? 'translate-x-6' : 'translate-x-0'
                }`}></div>
              </div>
              <span className="text-sm font-medium text-gray-700 flex items-center">
                <Sparkles className="h-4 w-4 mr-1 text-yellow-500" />
                Featured
              </span>
            </label>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SearchFilters;