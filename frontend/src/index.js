import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Enhanced service imports (moved to top)
import VoiceCommandService from './services/VoiceCommandService';
import NotificationService from './services/NotificationService';
import NewsService from './services/NewsService';
import SecurityService from './services/SecurityService';
import PerformanceMonitor from './utils/PerformanceMonitor';

// Context imports
import { ThemeProvider } from './contexts/ThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);