import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, User, BookmarkCheck } from 'lucide-react';
import { Tool } from '../types';
import { useBookmarkSuggestion } from '../hooks/useBookmarkSuggestion';
import { useAuth } from '../hooks/useAuth';
import BookmarkSuggestion from './BookmarkSuggestion';

// Sample tools for demonstration
const sampleTools: Tool[] = [
  {
    id: 'demo-1',
    name: 'AI Writing Assistant Pro',
    description: 'Advanced AI-powered writing tool with grammar checking and style suggestions.',
    category: 'writing',
    pricing: 'freemium',
    rating: 4.7,
    reviews: 2840,
    tags: ['writing', 'grammar', 'ai', 'productivity'],
    image: 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=400',
    url: 'https://example.com/ai-writing',
    featured: true,
    verified: true,
    addedDate: '2024-01-15',
    lastUpdated: '2024-01-15'
  },
  {
    id: 'demo-2',
    name: 'CodeGen AI',
    description: 'AI code generation tool that helps developers write better code faster.',
    category: 'development',
    pricing: 'paid',
    rating: 4.5,
    reviews: 1560,
    tags: ['coding', 'ai', 'development', 'automation'],
    image: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=400',
    url: 'https://example.com/codegen',
    featured: false,
    verified: true,
    addedDate: '2024-01-10',
    lastUpdated: '2024-01-10'
  },
  {
    id: 'demo-3',
    name: 'Visual AI Designer',
    description: 'Create stunning visuals and graphics with AI-powered design assistance.',
    category: 'design',
    pricing: 'freemium',
    rating: 4.8,
    reviews: 3200,
    tags: ['design', 'graphics', 'ai', 'creativity'],
    image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400',
    url: 'https://example.com/visual-ai',
    featured: true,
    verified: true,
    addedDate: '2024-01-12',
    lastUpdated: '2024-01-12'
  }
];

interface BookmarkSuggestionDemoProps {
  className?: string;
}

const BookmarkSuggestionDemo: React.FC<BookmarkSuggestionDemoProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { userInterests, refreshUserData, loading } = useBookmarkSuggestion();
  const [selectedTool, setSelectedTool] = useState<Tool>(sampleTools[0]);
  const [demoVariant, setDemoVariant] = useState<'card' | 'inline' | 'tooltip'>('card');

  if (!user) {
    return (
      <div className={`bg-gray-50 rounded-xl p-8 text-center ${className}`}>
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign In Required</h3>
        <p className="text-gray-600">
          Sign in to see personalized bookmark suggestions based on your interests.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              Bookmark Suggestion Demo
            </h2>
            <p className="opacity-90">
              See how our AI suggests bookmarks based on your preferences
            </p>
          </div>
          <button
            onClick={refreshUserData}
            disabled={loading}
            className="bg-white/20 hover:bg-white/30 disabled:opacity-50 p-2 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* User Interests Summary */}
        {userInterests && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Your Interests Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Favorite Categories:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {userInterests.preferredCategories.slice(0, 3).map((category, i) => (
                    <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      #{i + 1} {category}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Preferred Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {userInterests.preferredTags.slice(0, 4).map((tag, i) => (
                    <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Tool to Test
            </label>
            <select
              value={selectedTool.id}
              onChange={(e) => {
                const tool = sampleTools.find(t => t.id === e.target.value);
                if (tool) setSelectedTool(tool);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sampleTools.map(tool => (
                <option key={tool.id} value={tool.id}>
                  {tool.name} ({tool.category})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suggestion Variant
            </label>
            <select
              value={demoVariant}
              onChange={(e) => setDemoVariant(e.target.value as 'card' | 'inline' | 'tooltip')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="card">Card (Full Featured)</option>
              <option value="inline">Inline (Compact)</option>
              <option value="tooltip">Tooltip (Minimal)</option>
            </select>
          </div>
        </div>

        {/* Tool Preview */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-900 mb-2">Testing Tool:</h4>
          <div className="flex items-center gap-4">
            <img
              src={selectedTool.image}
              alt={selectedTool.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h5 className="font-medium text-gray-900">{selectedTool.name}</h5>
              <p className="text-sm text-gray-600 mb-2">{selectedTool.description}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {selectedTool.category}
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  {selectedTool.pricing}
                </span>
                <span className="text-gray-500">⭐ {selectedTool.rating}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Suggestion Demo */}
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Live Suggestion Preview
          </h4>
          
          <div className={demoVariant === 'tooltip' ? 'relative inline-block' : ''}>
            <BookmarkSuggestion
              tool={selectedTool}
              variant={demoVariant}
              showOnlyWhenSuggested={false}
              className={demoVariant === 'tooltip' ? 'relative' : ''}
            />
            
            {demoVariant === 'tooltip' && (
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 mt-2">
                <p className="text-sm text-gray-600">
                  Tooltip variant would appear on hover over this area
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">How to Use:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Bookmark some tools to build your interest profile</li>
            <li>• Leave reviews to help the system understand your preferences</li>
            <li>• Suggestions will become more accurate over time</li>
            <li>• Try different tools and variants to see how suggestions change</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BookmarkSuggestionDemo;