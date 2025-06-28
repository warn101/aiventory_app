import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { initAuth, useAuthStore } from '../store/authStore';

interface AuthLoaderProps {
  children: React.ReactNode;
  splashScreen?: React.ReactNode;
}

export const AuthLoader: React.FC<AuthLoaderProps> = ({ 
  children,
  splashScreen 
}) => {
  const { loading, initialized } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);
  
  useEffect(() => {
    // Initialize auth on component mount
    const initialize = async () => {
      await initAuth();
      
      // Keep splash screen visible for at least 1 second for better UX
      setTimeout(() => {
        setShowSplash(false);
      }, 1000);
    };
    
    initialize();
  }, []);
  
  // Show splash screen while loading or for minimum duration
  if (loading || !initialized || showSplash) {
    if (splashScreen) {
      return <>{splashScreen}</>;
    }
    
    // Default splash screen
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
            AIventory
          </h1>
          <p className="text-gray-500 mt-2">Loading your AI tool inventory...</p>
        </motion.div>
      </div>
    );
  }
  
  // Render children once auth is initialized
  return <>{children}</>;
};

export default AuthLoader;