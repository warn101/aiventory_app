# Dashboard Performance Optimization - Implementation Guide

This guide provides step-by-step instructions for implementing the dashboard performance optimizations.

## Overview

The optimization system includes:
- Database query optimization with proper indexing
- Smart caching with React Query integration
- Component-level performance improvements
- Real-time performance monitoring

## Implementation Steps

### 1. Database Optimization

First, apply the database indexes and optimizations:

```sql
-- Add indexes for bookmark queries
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created 
ON bookmarks(user_id, created_at DESC);

-- Add covering index for bookmark + tool info
CREATE INDEX IF NOT EXISTS idx_bookmarks_with_tool_info 
ON bookmarks(user_id) 
INCLUDE (tool_id, created_at);

-- Add indexes for tools filtering
CREATE INDEX IF NOT EXISTS idx_tools_category_featured 
ON tools(category, featured, rating DESC);
```

### 2. Component Integration

Replace your current Dashboard component:

```typescript
// Replace in your routing
import DashboardOptimized from './pages/DashboardOptimized';

// In your route configuration
<Route path="/dashboard" element={<DashboardOptimized />} />
```

### 3. Performance Monitoring

Enable performance monitoring:

```typescript
import { usePerformanceMonitor } from '../utils/performanceDiagnostics';

function Dashboard() {
  const performanceMonitor = usePerformanceMonitor('dashboard');
  
  // Monitor API calls
  const fetchData = async () => {
    const endMeasurement = performanceMonitor.measureApiCall();
    try {
      const data = await api.getData();
      return data;
    } finally {
      endMeasurement();
    }
  };
}
```

## Expected Results

- **Load Time**: Reduced from 25s+ to under 2 seconds
- **Cache Hits**: 80%+ cache hit rate after initial load
- **API Calls**: Reduced by 70% through intelligent caching
- **User Experience**: Instant feedback with optimistic updates

## Monitoring

Use the performance diagnostics to monitor improvements:

```typescript
const diagnostics = new PerformanceDiagnostics();
diagnostics.getMetrics(); // View current performance metrics
```

## Troubleshooting

### Common Issues

1. **Slow queries**: Verify indexes are applied
2. **Cache misses**: Check localStorage availability
3. **Memory leaks**: Monitor component unmounting

### Debug Mode

Enable debug logging:

```typescript
const DEBUG = process.env.NODE_ENV === 'development';
if (DEBUG) {
  console.log('Performance metrics:', metrics);
}
```

## 🔧 Implementation Steps

### Step 1: Update Your App.tsx (or main component)

```tsx
import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import YourMainComponent from './components/YourMainComponent';

function App() {
  return (
    <AuthProvider>
      <YourMainComponent />
    </AuthProvider>
  );
}

export default App;
```

### Step 2: Update Components to Use New Auth Context

Replace existing `useAuth()` calls with `useAuthContext()`:

```tsx
// Before
import { useAuth } from '../hooks/useAuth';
const { user, loading } = useAuth();

// After
import { useAuthContext } from '../contexts/AuthContext';
const { user, loading, initialized, isAuthenticated } = useAuthContext();
```

### Step 3: Update Your Sign-In Component

```tsx
import React, { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';

const SignInForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await signIn(email, password);
    if (error) {
      console.error('Sign in failed:', error.message);
      // Handle error (show toast, etc.)
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Signing In...' : 'Sign In'}
      </button>
    </form>
  );
};
```

### Step 4: Protect Routes with Authentication

```tsx
import { AuthGuard } from '../contexts/AuthContext';

// Protect a component
const ProtectedComponent = () => {
  return (
    <AuthGuard>
      <div>This content requires authentication</div>
    </AuthGuard>
  );
};

// Or use the HOC pattern
import { withAuth } from '../contexts/AuthContext';
const ProtectedComponent = withAuth(() => {
  return <div>This content requires authentication</div>;
});
```

### Step 5: Update Storage Upload Components

The `ImageUpload` component has already been updated, but for other upload components:

```tsx
import { useAuthContext } from '../contexts/AuthContext';

const FileUpload = () => {
  const { isAuthenticated, rehydrateSession } = useAuthContext();

  const handleUpload = async (file: File) => {
    // Ensure valid session
    if (!isAuthenticated()) {
      await rehydrateSession();
    }
    
    // Proceed with upload using enhanced supabaseStorage.ts
    // The storage functions now handle session validation internally
  };
};
```

## 🔍 Key Features

### 1. Automatic Session Rehydration
- App automatically restores user session on page reload
- Handles expired sessions with automatic refresh
- Graceful fallback when refresh fails

### 2. Real-time Auth State Management
- Listens to all Supabase auth events (SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT, etc.)
- Updates UI immediately when auth state changes
- Prevents race conditions with proper state synchronization

### 3. Session-Aware Storage Uploads
- Validates session before every upload
- Automatically refreshes expired sessions
- Provides clear error messages for auth failures

### 4. Comprehensive Error Handling
- Detailed logging for debugging
- User-friendly error messages
- Graceful degradation when auth fails

## 🧪 Testing the Implementation

### Test Scenarios:

1. **Fresh Login**
   - Sign in → Should work immediately
   - Upload avatar → Should work without errors

2. **Page Reload**
   - Sign in → Reload page → Should remain signed in
   - Upload avatar after reload → Should work

3. **Session Expiration**
   - Wait for session to expire (~1 hour)
   - Try upload → Should auto-refresh and work
   - If refresh fails → Should show clear error message

4. **Network Issues**
   - Disconnect internet → Try upload → Should show appropriate error
   - Reconnect → Should work again

## 🚨 Important Notes

### Environment Variables
Ensure your `.env` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Dashboard Settings
1. **Auth Settings** → Enable "Persist sessions"
2. **Storage** → Ensure RLS policies allow authenticated users
3. **Auth** → Check JWT expiry settings (default 1 hour)

### Migration from Old Auth Hook
1. Keep your existing `useAuth` hook for backward compatibility
2. Gradually migrate components to use `useAuthContext`
3. Test each component after migration
4. Remove old hook once all components are migrated

## 🎯 Best Practices

1. **Always check `initialized`** before rendering auth-dependent UI
2. **Use `isAuthenticated()`** instead of just checking `user` existence
3. **Handle loading states** properly to avoid UI flicker
4. **Implement proper error boundaries** for auth failures
5. **Test session expiration scenarios** regularly

## 🔧 Troubleshooting

### Common Issues:

1. **"useAuthContext must be used within an AuthProvider"**
   - Ensure your app is wrapped with `<AuthProvider>`

2. **Session still expires quickly**
   - Check Supabase dashboard JWT settings
   - Verify environment variables are correct

3. **Upload still fails with auth error**
   - Check browser console for detailed error logs
   - Verify RLS policies in Supabase dashboard

4. **Infinite loading state**
   - Check network connectivity
   - Verify Supabase URL and keys are correct

This implementation provides a robust, production-ready authentication system that handles all the edge cases and provides excellent user experience.