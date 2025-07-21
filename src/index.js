import React from 'react';
import { createRoot } from 'react-dom/client'; // Correct import for React 18+
import './index.css'; // Assuming you have an index.css file for global styles
import App from './App'; // Import your App component

// Find the root DOM element where your React app will be mounted
const container = document.getElementById('root');

// Create a root for the React application
const root = createRoot(container);

// Render your App component into the root
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
