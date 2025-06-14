import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header';
import Hero from './components/Hero';
import SearchFilters from './components/SearchFilters';
import ToolGrid from './components/ToolGrid';
import Categories from './components/Categories';
import FeaturedTools from './components/FeaturedTools';
import Stats from './components/Stats';
import Footer from './components/Footer';
import { mockTools } from './data/mockData';
import { Tool, Category, FilterState } from './types';

function App() {
  const [tools, setTools] = useState<Tool[]>(mockTools);
  const [filteredTools, setFilteredTools] = useState<Tool[]>(mockTools);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    pricing: 'all',
    rating: 0,
    featured: false
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterTools(query, filters);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    filterTools(searchQuery, newFilters);
  };

  const filterTools = (query: string, currentFilters: FilterState) => {
    let filtered = [...tools];

    // Search filter
    if (query) {
      filtered = filtered.filter(tool =>
        tool.name.toLowerCase().includes(query.toLowerCase()) ||
        tool.description.toLowerCase().includes(query.toLowerCase()) ||
        tool.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    }

    // Category filter
    if (currentFilters.category !== 'all') {
      filtered = filtered.filter(tool => tool.category === currentFilters.category);
    }

    // Pricing filter
    if (currentFilters.pricing !== 'all') {
      filtered = filtered.filter(tool => tool.pricing === currentFilters.pricing);
    }

    // Rating filter
    if (currentFilters.rating > 0) {
      filtered = filtered.filter(tool => tool.rating >= currentFilters.rating);
    }

    // Featured filter
    if (currentFilters.featured) {
      filtered = filtered.filter(tool => tool.featured);
    }

    setFilteredTools(filtered);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      <main>
        <Hero />
        <Stats />
        <Categories 
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />
        <FeaturedTools tools={tools.filter(tool => tool.featured)} />
        
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Discover AI Tools
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Explore our comprehensive catalog of AI tools, curated for every use case
              </p>
            </motion.div>

            <SearchFilters 
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
              filters={filters}
            />
            
            <ToolGrid 
              tools={filteredTools}
              loading={false}
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default App;