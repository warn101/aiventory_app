import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AuthLoader from './components/AuthLoader.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { BookmarkProvider } from './contexts/BookmarkContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AuthLoader>
        <BookmarkProvider>
          <App />
        </BookmarkProvider>
      </AuthLoader>
    </AuthProvider>
  </StrictMode>
);