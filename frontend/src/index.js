import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/pwa.css'; // ADD THIS LINE - Create this file
import App from './App';

// Enhanced service imports (moved to top)
import VoiceCommandService from './services/VoiceCommandService';
import NotificationService from './services/NotificationService';
import NewsService from './services/NewsService';
import SecurityService from './services/SecurityService';
import PerformanceMonitor from './utils/PerformanceMonitor';

// Context imports
import { ThemeProvider } from './contexts/ThemeContext';

// Initialize services early (ADD THIS FUNCTION)
const initializeServices = async () => {
  try {
    // Start performance monitoring
    PerformanceMonitor.startMonitoring();
    
    // Initialize security
    await SecurityService.initializeSecurity();
    
    // Initialize other services
    console.log('Core services initialized');
  } catch (error) {
    console.error('Service initialization error:', error);
    PerformanceMonitor.logError(error);
  }
};

// PWA Service Worker Registration (ADD THIS FUNCTION)
const registerSW = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('SW registered: ', registration);
    } catch (error) {
      console.log('SW registration failed: ', error);
    }
  }
};

// Initialize app (REPLACE YOUR EXISTING ReactDOM.render WITH THIS)
const initApp = async () => {
  await initializeServices();
  await registerSW();
  
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </React.StrictMode>
  );
};

// Start the app (REPLACE YOUR EXISTING ReactDOM.render CALL)
initApp();

// Performance monitoring (ADD THIS LINE)
PerformanceMonitor.trackPageView('/');