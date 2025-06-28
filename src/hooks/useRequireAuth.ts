import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

interface UseRequireAuthOptions {
  redirectTo?: string;
  onAuthorized?: () => void;
}

/**
 * Hook to require authentication for protected routes
 * Redirects to login page if user is not authenticated
 */
export const useRequireAuth = (options: UseRequireAuthOptions = {}) => {
  const { redirectTo = '/', onAuthorized } = options;
  const { user, loading, initialized, isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    // Only check after auth is initialized and not loading
    if (!initialized || loading) return;
    
    if (!isAuthenticated()) {
      // Redirect to login page if not authenticated
      window.location.href = redirectTo;
    } else if (onAuthorized) {
      // Call onAuthorized callback if provided
      onAuthorized();
    }
  }, [user, loading, initialized, redirectTo, onAuthorized, isAuthenticated]);
  
  return { user, loading, initialized, isAuthenticated: isAuthenticated() };
};

export default useRequireAuth;