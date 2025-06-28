import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import EmailConfirmation from './components/EmailConfirmation';
import Hero from './components/Hero';
import SearchFilters from './components/SearchFilters';
import ToolGrid from './components/ToolGrid';
import Categories from './components/Categories';
import FeaturedTools from './components/FeaturedTools';
import Stats from './components/Stats';
import ToolDetail from './pages/ToolDetail';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import SubmitTool from './pages/SubmitTool';

import { FilterState, Tool } from './types';
import { useAuthStore } from './store/authStore';
import { useTools } from './hooks/useTools';
import { useCategories } from './hooks/useCategories';
import { db } from './lib/supabase';
import { BookmarkProvider } from './contexts/BookmarkContext';

type Page = 'home' | 'tool-detail' | 'dashboard' | 'profile' | 'submit-tool';

export default function App() {
  const { user, signOut } = useAuthStore();
  const { tools, filteredTools, loading: toolsLoading, loadTools, getTool, createTool } = useTools();
  const { categories } = useCategories();

  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [filters, setFilters] = useState<FilterState>({ category: 'all', pricing: 'all', rating: 0, featured: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [confirmationToken, setConfirmationToken] = useState<string | null>(null);

  // Check for confirmation tokens in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('confirmation_token');
    if (token && params.get('type') === 'signup') {
      setConfirmationToken(token);
      setShowEmailConfirmation(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Navigation handlers
  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
    if (page === 'home') setSelectedTool(null);
  };

  const handleToolClick = async (id: string) => {
    const tool = await getTool(id);
    setSelectedTool(tool);
    setCurrentPage('tool-detail');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadTools({ ...filters, search: query });
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    loadTools({ ...newFilters, search: searchQuery });
  };

  const handleToolSubmit = async (data: any) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const { error } = await createTool(data);
    if (!error) {
      alert('Tool submitted!');
      handleNavigation('home');
    } else {
      alert(`Error: ${(error as { message?: string }).message}`);
    }
  };

  // Render current page based on state
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'tool-detail':
        return selectedTool ? (
          <ToolDetail 
            tool={selectedTool} 
            onBack={() => handleNavigation('home')}
            currentUser={user} 
          />
        ) : <p>Loading...</p>;

      case 'dashboard':
        return user ? (
          <Dashboard 
            user={user} 
            tools={tools} 
            onToolClick={handleToolClick} 
          />
        ) : <SignInPrompt onSignIn={() => setIsAuthModalOpen(true)} />;

      case 'profile':
        return user ? (
          <Profile 
            user={user}
            onUpdateUser={async (updatedUser) => {
              await db.updateProfile(user.id, {
                name: updatedUser.name,
                email: updatedUser.email,
                avatar_url: updatedUser.avatar
              });
            }}
          />
        ) : <SignInPrompt onSignIn={() => setIsAuthModalOpen(true)} />;

      case 'submit-tool':
        return user ? (
          <SubmitTool 
            onSubmit={handleToolSubmit} 
            user={user} 
          />
        ) : <SignInPrompt onSignIn={() => setIsAuthModalOpen(true)} />;

      default:
        return (
          <>
            <Hero onSearch={handleSearch} onToolClick={handleToolClick} />
            <Stats />
            <Categories
              selectedCategory={selectedCategory}
              onCategorySelect={cat => {
                setFilters({ ...filters, category: cat });
                setSelectedCategory(cat);
              }}
              categories={categories}
            />
            <FeaturedTools tools={tools.filter(t => t.featured)} />
            <section className="py-16 px-4">
              <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
                  <h2>Discover AI Tools</h2>
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
                </motion.div>
              </div>
            </section>
          </>
        );
    }
  };

  return (
    <BookmarkProvider>
      <div>
        <Header
          currentUser={user}
          onNavigate={handleNavigation}
          onAuthClick={() => setIsAuthModalOpen(true)}
          onLogout={signOut}
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

        {showEmailConfirmation && (
          <EmailConfirmation
            token={confirmationToken || undefined}
            onComplete={() => {
              setShowEmailConfirmation(false);
              setConfirmationToken(null);
              setIsAuthModalOpen(true);
            }}
          />
        )}
        
        <Toaster position="top-center" />
      </div>
    </BookmarkProvider>
  );
}

// Sign in prompt component
const SignInPrompt: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => (
  <div className="min-h-screen flex flex-col items-center justify-center">
    <p className="mb-4">Please sign in to continue.</p>
    <button 
      onClick={onSignIn} 
      className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
    >
      Sign In
    </button>
  </div>
);