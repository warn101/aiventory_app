import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Hero from './components/Hero';
import SearchFilters from './components/SearchFilters';
import ToolGrid from './components/ToolGrid';
import Categories from './components/Categories';
import FeaturedTools from './components/FeaturedTools';
import Stats from './components/Stats';
import Footer from './components/Footer';
import ToolDetail from './pages/ToolDetail';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import SubmitTool from './pages/SubmitTool';
import AuthModal from './components/AuthModal';
import { mockTools } from './data/mockData';
import { Tool, Category, FilterState, User } from './types';

type Page = 'home' | 'tool-detail' | 'dashboard' | 'profile' | 'submit-tool';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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

  const handleToolClick = (toolId: string) => {
    setSelectedToolId(toolId);
    setCurrentPage('tool-detail');
  };

  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
    if (page === 'home') {
      setSelectedToolId(null);
    }
  };

  const handleLogin = (userData: User) => {
    setCurrentUser(userData);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'tool-detail':
        const selectedTool = tools.find(tool => tool.id === selectedToolId);
        return selectedTool ? (
          <ToolDetail 
            tool={selectedTool} 
            onBack={() => handleNavigation('home')}
            currentUser={currentUser}
          />
        ) : null;
      
      case 'dashboard':
        return currentUser ? (
          <Dashboard 
            user={currentUser}
            tools={tools}
            onToolClick={handleToolClick}
          />
        ) : null;
      
      case 'profile':
        return currentUser ? (
          <Profile 
            user={currentUser}
            onUpdateUser={setCurrentUser}
          />
        ) : null;
      
      case 'submit-tool':
        return (
          <SubmitTool 
            onSubmit={(toolData) => {
              const newTool: Tool = {
                ...toolData,
                id: Date.now().toString(),
                rating: 0,
                reviews: 0,
                featured: false,
                verified: false,
                addedDate: new Date().toISOString().split('T')[0],
                lastUpdated: new Date().toISOString().split('T')[0]
              };
              setTools([...tools, newTool]);
              setFilteredTools([...filteredTools, newTool]);
              handleNavigation('home');
            }}
          />
        );
      
      default:
        return (
          <>
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
                  onToolClick={handleToolClick}
                />
              </div>
            </section>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header 
        currentUser={currentUser}
        onNavigate={handleNavigation}
        onAuthClick={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        currentPage={currentPage}
      />
      
      <main>
        <AnimatePresence mode="wait">
          {renderCurrentPage()}
        </AnimatePresence>
      </main>
      
      {currentPage === 'home' && <Footer />}
      
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}

export default App;