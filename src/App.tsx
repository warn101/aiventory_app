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
import { mockTools } from './data/mockData';

type Page = 'home' | 'tool-detail' | 'dashboard' | 'profile' | 'submit-tool';

export default function App() {
  const { user: authUser, loading: authLoading, signOut } = useAuthStore();
  const { categories } = useCategories();
  const [tools, setTools] = useState<Tool[]>(mockTools);
  const [filteredTools, setFilteredTools] = useState<Tool[]>(mockTools);
  const [toolsLoading, setToolsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [filters, setFilters] = useState<FilterState>({ category: 'all', pricing: 'all', rating: 0, featured: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [confirmationToken, setConfirmationToken] = useState<string | null>(null);

  // Load tools from API or mock data
  useEffect(() => {
    const loadTools = async () => {
      setToolsLoading(true);
      try {
        const { data, error } = await db.getTools();
        if (error || !data || data.length === 0) {
          console.log('Using mock data for tools');
          setTools(mockTools);
          setFilteredTools(mockTools);
        } else {
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
          setTools(transformedTools);
          setFilteredTools(transformedTools);
        }
      } catch (err) {
        console.error('Error loading tools:', err);
        setTools(mockTools);
        setFilteredTools(mockTools);
      } finally {
        setToolsLoading(false);
      }
    };

    loadTools();
  }, []);

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
    try {
      const { data, error } = await db.getTool(id);
      if (error || !data) {
        const mockTool = mockTools.find(t => t.id === id);
        if (mockTool) {
          setSelectedTool(mockTool);
        } else {
          console.error('Tool not found');
          return;
        }
      } else {
        const tool: Tool = {
          id: data.id,
          name: data.name,
          description: data.description,
          category: data.category,
          pricing: data.pricing,
          rating: data.rating || 0,
          reviews: data.reviews_count || 0,
          tags: data.tags || [],
          image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400',
          url: data.website_url,
          featured: data.featured || false,
          verified: data.verified || false,
          addedDate: data.created_at || new Date().toISOString(),
          lastUpdated: data.updated_at || new Date().toISOString()
        };
        setSelectedTool(tool);
      }
      setCurrentPage('tool-detail');
    } catch (error) {
      console.error('Error fetching tool:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters({ ...filters, search: query });
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    applyFilters({ ...newFilters, search: searchQuery });
  };

  const applyFilters = (filters: FilterState & { search?: string }) => {
    let filtered = [...tools];
    
    // Category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(tool => tool.category === filters.category);
    }
    
    // Pricing filter
    if (filters.pricing && filters.pricing !== 'all') {
      filtered = filtered.filter(tool => tool.pricing === filters.pricing);
    }
    
    // Rating filter
    if (filters.rating && filters.rating > 0) {
      filtered = filtered.filter(tool => tool.rating >= filters.rating);
    }
    
    // Featured filter
    if (filters.featured) {
      filtered = filtered.filter(tool => tool.featured);
    }
    
    // Search filter
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(tool => 
        tool.name.toLowerCase().includes(query) || 
        tool.description.toLowerCase().includes(query) ||
        tool.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    setFilteredTools(filtered);
  };

  const handleToolSubmit = async (data: Database['public']['Tables']['tools']['Insert']) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    
    try {
      const { error } = await db.createTool(data);
      if (error) {
        throw new Error(error.message || 'Failed to submit tool');
      }
      
      // Refresh tools list
      const { data: newTools, error: fetchError } = await db.getTools();
      if (!fetchError && newTools) {
        const transformedTools: Tool[] = newTools.map((tool: any) => ({
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
        setTools(transformedTools);
        setFilteredTools(transformedTools);
      }
      
      alert('Tool submitted!');
      handleNavigation('home');
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
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
            {/* Check if tools array exists and has items before filtering */}
            {tools && tools.length > 0 && (
              <FeaturedTools tools={tools.filter(t => t && t.featured)} />
            )}
            <section className="py-16 px-4">
              <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Discover AI Tools</h2>
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
        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
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