import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Auto-recover from chunk loading errors after new deployments
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[PWA] Preload error detected, reloading fresh bundle...', event);
  window.location.reload();
});

window.addEventListener('error', (event) => {
  const msg = event?.message || '';
  if (
    msg.includes('dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Expected a JavaScript module script')
  ) {
    console.warn('[PWA] Stale chunk script error detected, auto-reloading...', msg);
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
