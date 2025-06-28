import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

// Create the auth context
const AuthContext = createContext<ReturnType<typeof useAuth> | null>(null);

/**
 * AuthProvider component that provides authentication state to the entire app
 * Wrap your app with this provider to enable authentication throughout
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access authentication context
 * Must be used within an AuthProvider
 */
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

/**
 * Higher-order component that ensures authentication
 * Wraps components that require authentication
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => {
    const { user, loading, initialized } = useAuthContext();
    
    // Show loading while auth is initializing
    if (!initialized || loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      );
    }
    
    // Redirect to sign in if not authenticated
    if (!user) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-4">
              Please sign in to access this page.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Sign In
            </button>
          </div>
        </div>
      );
    }
    
    // Render the component if authenticated
    return <Component {...props} />;
  };
};

/**
 * Component that conditionally renders content based on auth state
 */
export const AuthGuard: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
}> = ({ children, fallback, requireAuth = true }) => {
  const { user, loading, initialized } = useAuthContext();
  
  // Show loading while auth is initializing
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }
  
  // Check authentication requirement
  const isAuthenticated = !!user;
  
  if (requireAuth && !isAuthenticated) {
    return (
      <>
        {fallback || (
          <div className="text-center p-4">
            <p className="text-gray-600">Please sign in to continue.</p>
          </div>
        )}
      </>
    );
  }
  
  if (!requireAuth && isAuthenticated) {
    return (
      <>
        {fallback || (
          <div className="text-center p-4">
            <p className="text-gray-600">You are already signed in.</p>
          </div>
        )}
      </>
    );
  }
  
  return <>{children}</>;
};