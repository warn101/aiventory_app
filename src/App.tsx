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
import { FilterState } from './types';
import { useAuth } from './hooks/useAuth';
import { useTools } from './hooks/useTools';
import { useCategories } from './hooks/useCategories';

type Page = 'home' | 'tool-detail' | 'dashboard' | 'profile' | 'submit-tool';

function App() {
  const { user, loading: authLoading } = useAuth();
  const { tools, filteredTools, loading: toolsLoading, loadTools, getTool, createTool } = useTools();
  const { categories, loading: categoriesLoading } = useCategories();
  
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    pricing: 'all',
    rating: 0,
    featured: false
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [appReady, setAppReady] = useState(false);

  // Set app as ready after a short delay to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('App: Setting ready state to true');
      setAppReady(true);
    }, 1000); // 1 second max wait

    return () => clearTimeout(timer);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('App State Debug:', {
      authLoading,
      toolsLoading,
      categoriesLoading,
      appReady,
      toolsCount: tools.length,
      filteredToolsCount: filteredTools.length,
      categoriesCount: categories.length,
      currentPage,
      user: user ? 'logged in' : 'not logged in'
    });
  }, [authLoading, toolsLoading, categoriesLoading, appReady, tools, filteredTools, categories, currentPage, user]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadTools({ ...filters, search: query });
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    loadTools({ ...newFilters, search: searchQuery });
  };

  const handleToolClick = async (toolId: string) => {
    console.log('Tool clicked:', toolId);
    setSelectedToolId(toolId);
    try {
      const tool = await getTool(toolId);
      console.log('Tool loaded:', tool);
      setSelectedTool(tool);
      setCurrentPage('tool-detail');
    } catch (error) {
      console.error('Error loading tool:', error);
    }
  };

  const handleNavigation = (page: Page) => {
    console.log('Navigating to:', page);
    setCurrentPage(page);
    if (page === 'home') {
      setSelectedToolId(null);
      setSelectedTool(null);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const newFilters = { ...filters, category: categoryId };
    setFilters(newFilters);
    loadTools({ ...newFilters, search: searchQuery });
  };

  const handleToolSubmit = async (toolData: any) => {
    try {
      const { error } = await createTool(toolData);
      if (!error) {
        handleNavigation('home');
      }
    } catch (error) {
      console.error('Error submitting tool:', error);
    }
  };

  // Show loading only if auth is still loading AND app is not ready
  if (authLoading && !appReady) {
    console.log('App: Showing loading screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AIventory...</p>
        </div>
      </div>
    );
  }

  console.log('App: Rendering main content');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'tool-detail':
        if (!selectedTool) {
          return (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading tool details...</p>
              </div>
            </div>
          );
        }
        return (
          <ToolDetail 
            tool={selectedTool} 
            onBack={() => handleNavigation('home')}
            currentUser={user}
          />
        );
      
      case 'dashboard':
        if (!user) {
          return (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-600 mb-4">Please sign in to access your dashboard</p>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>
          );
        }
        return (
          <Dashboard 
            user={user}
            tools={tools}
            onToolClick={handleToolClick}
          />
        );
      
      case 'profile':
        if (!user) {
          return (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-600 mb-4">Please sign in to access your profile</p>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>
          );
        }
        return (
          <Profile 
            user={user}
            onUpdateUser={() => {}} // This will be handled by the useAuth hook
          />
        );
      
      case 'submit-tool':
        return (
          <SubmitTool 
            onSubmit={handleToolSubmit}
          />
        );
      
      default:
        return (
          <>
            <Hero />
            <Stats />
            <Categories 
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
              categories={categories}
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
                  loading={toolsLoading}
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
        currentUser={user}
        onNavigate={handleNavigation}
        onAuthClick={() => setIsAuthModalOpen(true)}
        onLogout={() => {}} // Handled by useAuth hook
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
      />
    </div>
  );
}

export default App;