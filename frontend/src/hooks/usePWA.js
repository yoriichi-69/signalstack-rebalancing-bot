import { useState, useEffect } from 'react';

export const usePWA = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installationStatus, setInstallationStatus] = useState('not-installed');

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         window.navigator.standalone ||
                         document.referrer.includes('android-app://');
    
    setIsInstalled(isStandalone);
    setInstallationStatus(isStandalone ? 'installed' : 'not-installed');

    // Listen for install prompt
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setIsInstallable(true);
      setInstallationStatus('installable');
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallationStatus('installed');
      setDeferredPrompt(null);
    };

    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Register event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', registration);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });

      if (registration.waiting) {
        setUpdateAvailable(true);
      }

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const installApp = async () => {
    if (!deferredPrompt) {
      console.log('Install prompt not available');
      return false;
    }

    try {
      setInstallationStatus('installing');
      
      deferredPrompt.prompt();
      
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setInstallationStatus('installed');
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('User dismissed the install prompt');
        setInstallationStatus('dismissed');
        return false;
      }
    } catch (error) {
      console.error('Installation failed:', error);
      setInstallationStatus('error');
      return false;
    }
  };

  const updateApp = async () => {
    if (!updateAvailable) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  return {
    isInstallable,
    isInstalled,
    isOnline,
    updateAvailable,
    installationStatus,
    installApp,
    updateApp,
    requestNotificationPermission
  };
};

export default usePWA;