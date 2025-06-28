import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AuthLoader from './components/AuthLoader.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthLoader>
      <App />
    </AuthLoader>
  </StrictMode>
);