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

import { FilterState, Tool, User as AppUser } from './types';
import { useAuthStore } from './store/authStore';
import { useCategories } from './hooks/useCategories';
import { Database } from './types/database';
import { db } from './lib/supabase';

type Page = 'home' | 'tool-detail' | 'dashboard' | 'profile' | 'submit-tool';

export default function App() {
  const { user: authUser, loading: authLoading, signOut } = useAuthStore();
  const { tools, filteredTools, loading: toolsLoading, loadTools, getTool, createTool } = useCategories();
  const { categories } = useCategories();

  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [filters, setFilters] = useState<FilterState>({ category: 'all', pricing: 'all', rating: 0, featured: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [confirmationToken, setConfirmationToken] = useState<string | null>(null);

  // 🗂️ 1️⃣ Properly transform `authUser` → `User`
  const user: AppUser | null = authUser
    ? {
        ...authUser,
        reviews: authUser.reviews?.map(r => ({
          id: r.id,
          toolId: r.tool_id,
          userId: r.user_id,
          rating: r.rating,
          comment: r.comment,
          date: r.created_at?.split('T')[0] || '',
          helpful: r.helpful_count
        })) || []
      }
    : null;

  // 📨 2️⃣ Handle confirmation tokens
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('confirmation_token');
    if (token && params.get('type') === 'signup') {
      setConfirmationToken(token);
      setShowEmailConfirmation(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // ⏳ 3️⃣ Splash load guard
  useEffect(() => {
    const timer = setTimeout(() => setAppReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // 🔀 4️⃣ Navigation handlers
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

  const handleToolSubmit = async (data: Database['public']['Tables']['tools']['Insert']) => {
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

  if (authLoading && !appReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  // 🧭 5️⃣ Correctly typed pages
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'tool-detail':
        return selectedTool ? (
          <ToolDetail 
            tool={selectedTool} 
            onBack={() => handleNavigation('home')}
            currentUser={user} // ✅ typed properly
          />
        ) : <p>Loading...</p>;

      case 'dashboard':
        return user ? (
          <Dashboard 
            user={user} 
            tools={tools} 
            onToolClick={handleToolClick} 
          />
        ) : <SignInPrompt />;

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
        ) : <SignInPrompt />;

      case 'submit-tool':
        return user ? (
          <SubmitTool 
            onSubmit={handleToolSubmit} 
            user={user} 
          />
        ) : <SignInPrompt />;

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

  const SignInPrompt = () => (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <p className="mb-4">Please sign in to continue.</p>
      <button 
        onClick={() => setIsAuthModalOpen(true)} 
        className="btn-primary"
      >
        Sign In
      </button>
    </div>
  );

  return (
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
  );
}