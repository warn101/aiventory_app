import { supabase } from '../lib/supabase';

/**
 * Singleton SessionManager class that provides proactive session management
 * Prevents authentication failures by ensuring sessions are always valid
 */
export class SessionManager {
  private static instance: SessionManager;
  private refreshPromise: Promise<boolean> | null = null;
  private lastValidationTime = 0;
  private validationCacheDuration = 30000; // 30 seconds cache

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Ensures the current session is valid and refreshes if needed
   * Returns true if session is valid, false if user needs to sign in
   */
  async ensureValidSession(): Promise<boolean> {
    try {
      // Use cached result if validation was recent
      const now = Date.now();
      if (now - this.lastValidationTime < this.validationCacheDuration) {
        console.log('🔄 Using cached session validation');
        return true;
      }

      // If already refreshing, wait for that operation
      if (this.refreshPromise) {
        console.log('⏳ Waiting for ongoing session refresh...');
        return await this.refreshPromise;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error getting session:', error.message);
        return false;
      }

      if (!session) {
        console.log('❌ No session found - user needs to sign in');
        return false;
      }

      // Check if session expires within next 5 minutes (300 seconds)
      const expiresAt = session.expires_at || 0;
      const currentTime = Math.floor(Date.now() / 1000);
      const fiveMinutesFromNow = currentTime + 300;

      if (expiresAt <= fiveMinutesFromNow) {
        console.log('🔄 Session expires soon, refreshing...', {
          expiresAt: new Date(expiresAt * 1000).toISOString(),
          currentTime: new Date(currentTime * 1000).toISOString(),
          secondsUntilExpiry: expiresAt - currentTime
        });
        
        // Start refresh operation
        this.refreshPromise = this.performRefresh();
        const result = await this.refreshPromise;
        this.refreshPromise = null;
        
        if (result) {
          this.lastValidationTime = now;
        }
        
        return result;
      }

      console.log('✅ Session is valid', {
        expiresAt: new Date(expiresAt * 1000).toISOString(),
        secondsUntilExpiry: expiresAt - currentTime
      });
      
      this.lastValidationTime = now;
      return true;
    } catch (error) {
      console.error('💥 Session validation failed:', error);
      this.refreshPromise = null;
      return false;
    }
  }

  /**
   * Performs the actual session refresh operation
   */
  private async performRefresh(): Promise<boolean> {
    try {
      console.log('🔄 Attempting to refresh session...');
      
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Session refresh failed:', error.message);
        return false;
      }

      if (!session) {
        console.log('❌ Session refresh returned no session');
        return false;
      }

      console.log('✅ Session refreshed successfully', {
        newExpiresAt: new Date((session.expires_at || 0) * 1000).toISOString(),
        userId: session.user.id
      });
      
      return true;
    } catch (error) {
      console.error('💥 Session refresh error:', error);
      return false;
    }
  }

  /**
   * Gets a valid session, ensuring it's refreshed if needed
   * Throws an error if unable to obtain a valid session
   */
  async getValidSession() {
    const isValid = await this.ensureValidSession();
    if (!isValid) {
      throw new Error('Unable to obtain valid session. Please sign in again.');
    }
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      throw new Error('Session validation failed. Please sign in again.');
    }
    
    return session;
  }

  /**
   * Gets the current user if session is valid
   */
  async getCurrentUser() {
    try {
      const session = await this.getValidSession();
      return session.user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Checks if user is currently authenticated with a valid session
   */
  async isAuthenticated(): Promise<boolean> {
    return await this.ensureValidSession();
  }

  /**
   * Forces a session refresh regardless of expiry time
   */
  async forceRefresh(): Promise<boolean> {
    console.log('🔄 Forcing session refresh...');
    this.lastValidationTime = 0; // Clear cache
    this.refreshPromise = this.performRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    return result;
  }

  /**
   * Clears the validation cache, forcing next validation to check server
   */
  clearCache(): void {
    this.lastValidationTime = 0;
    console.log('🗑️ Session validation cache cleared');
  }

  /**
   * Gets session info for debugging
   */
  async getSessionInfo() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return {
          exists: false,
          error: error?.message || 'No session'
        };
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;
      const secondsUntilExpiry = expiresAt - currentTime;
      const minutesUntilExpiry = Math.floor(secondsUntilExpiry / 60);

      return {
        exists: true,
        userId: session.user.id,
        email: session.user.email,
        expiresAt: new Date(expiresAt * 1000).toISOString(),
        secondsUntilExpiry,
        minutesUntilExpiry,
        isExpired: secondsUntilExpiry <= 0,
        needsRefresh: secondsUntilExpiry <= 300 // 5 minutes
      };
    } catch (error) {
      return {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// Add global access for debugging (development only)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).sessionManager = sessionManager;
}