import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { logoUrl as faviconUrl } from './components/Icons';

// Set favicon dynamically so Vite can handle the asset path
const faviconLink = document.createElement('link');
faviconLink.rel = 'icon';
faviconLink.href = faviconUrl;
document.head.appendChild(faviconLink);


function renderApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Ensure the DOM is fully loaded before trying to render the React app.
// This prevents race conditions where the script executes before the #root element is available.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  // DOMContentLoaded has already fired
  renderApp();
}