import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Menu, X, User, BookOpen, Star, Plus, Home, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface HeaderProps {
  currentUser: any | null;
  onNavigate: (page: 'home' | 'dashboard' | 'profile' | 'submit-tool') => void;
  onAuthClick: () => void;
  onLogout: () => void;
  currentPage: string;
}

const Header: React.FC<HeaderProps> = ({ 
  currentUser, 
  onNavigate, 
  onAuthClick, 
  onLogout,
  currentPage 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { loading, initialized } = useAuthStore();

  const navigationItems = [
    { id: 'home', label: 'Discover', icon: Home },
    ...(currentUser ? [{ id: 'submit-tool', label: 'Submit Tool', icon: Plus }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => onNavigate('home')}
          >
            <div className="relative">
              <Brain className="h-8 w-8 text-primary-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                AIventory
              </h1>
              <p className="text-xs text-gray-500 -mt-1">AI Tool Discovery</p>
            </div>
          </motion.div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as any)}
                className={`flex items-center space-x-2 font-medium transition-colors ${
                  currentPage === item.id
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Actions - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {loading && !initialized ? (
              <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
            ) : currentUser ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <img
                    src={currentUser.avatar || "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100"}
                    alt={currentUser.name || "User"}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="font-medium text-gray-900">{currentUser.name || "User"}</span>
                </motion.button>

                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
                  >
                    <button
                      onClick={() => {
                        onNavigate('dashboard');
                        setIsProfileMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Dashboard</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('profile');
                        setIsProfileMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('submit-tool');
                        setIsProfileMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Submit Tool</span>
                    </button>
                    <hr className="my-2" />
                    <button
                      onClick={() => {
                        onLogout();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAuthClick}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Sign In
              </motion.button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 py-4"
          >
            <div className="flex flex-col space-y-4">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id as any);
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center space-x-2 font-medium ${
                    currentPage === item.id
                      ? 'text-primary-600'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              ))}
              
              <div className="pt-4 border-t border-gray-200">
                {loading && !initialized ? (
                  <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse"></div>
                ) : currentUser ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 p-2">
                      <img
                        src={currentUser.avatar || "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100"}
                        alt={currentUser.name || "User"}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="font-medium text-gray-900">{currentUser.name || "User"}</span>
                    </div>
                    <button
                      onClick={() => {
                        onNavigate('dashboard');
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 w-full text-left text-gray-700 hover:text-primary-600"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Dashboard</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('profile');
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 w-full text-left text-gray-700 hover:text-primary-600"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('submit-tool');
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 w-full text-left text-gray-700 hover:text-primary-600"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Submit Tool</span>
                    </button>
                    <button
                      onClick={() => {
                        onLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left text-red-600 hover:text-red-700"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onAuthClick();
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default Header;