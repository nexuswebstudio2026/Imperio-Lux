import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const nativeApiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '');
if (nativeApiBase) {
  const browserFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const requestUrl = input instanceof Request ? input.url : String(input);
    if (!requestUrl.startsWith('/api/')) return browserFetch(input, init);
    return browserFetch(`${nativeApiBase}${requestUrl}`, { ...init, credentials: 'include' });
  };
}

// Clean up service workers left behind by older PWA installations.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => void registration.unregister());
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
