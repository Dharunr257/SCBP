import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>SmartClass Booking Platform</h1>
      <p>This is the root of the project. The frontend application is in the <code>/frontend</code> directory.</p>
      <p>Run <code>npm run dev:frontend</code> and <code>npm run dev:backend</code> in separate terminals to start the application locally.</p>
    </div>
  </React.StrictMode>
);