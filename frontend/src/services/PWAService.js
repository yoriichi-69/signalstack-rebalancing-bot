/* filepath: frontend/src/services/PWAService.js */
import NotificationService from './NotificationService';

class PWAService {
  constructor() {
    this.isInstalled = false;
    this.deferredPrompt = null;
    this.serviceWorker = null;
    this.updateAvailable = false;
    this.isOnline = navigator.onLine;
    this.installPromptShown = false;
    
    this.initializePWA();
  }

  async initializePWA() {
    // Register service worker
    await this.registerServiceWorker();
    
    // Setup install prompt
    this.setupInstallPrompt();
    
    // Setup offline/online detection
    this.setupConnectivityMonitoring();
    
    // Setup push notifications
    this.setupPushNotifications();
    
    // Setup app shortcuts
    this.setupAppShortcuts();
    
    // Check if app is installed
    this.checkInstallStatus();
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.serviceWorker = registration;
        
        console.log('Service Worker registered:', registration);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.updateAvailable = true;
              this.showUpdateNotification();
            }
          });
        });
        
        // Listen for waiting service worker
        if (registration.waiting) {
          this.updateAvailable = true;
          this.showUpdateNotification();
        }
        
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      
      // Show install prompt after user has been on site for 30 seconds
      setTimeout(() => {
        if (!this.installPromptShown && !this.isInstalled) {
          this.showInstallPrompt();
        }
      }, 30000);
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      
      NotificationService.success('SignalStack installed successfully! 🚀', {
        duration: 5000
      });
      
      // Track installation
      this.trackEvent('app_installed');
    });
  }

  async showInstallPrompt() {
    if (!this.deferredPrompt || this.installPromptShown) return;
    
    this.installPromptShown = true;
    
    const notification = NotificationService.notify('install_prompt',
      'Install SignalStack for the best experience!', {
      persistent: true,
      icon: '📱',
      actions: [
        { label: 'Install', action: 'INSTALL_APP' },
        { label: 'Later', action: 'DISMISS_INSTALL' }
      ],
      metadata: { type: 'install_prompt' }
    });

    // Listen for action
    NotificationService.addEventListener('notification_action', async ({ notification, action }) => {
      if (notification.metadata?.type === 'install_prompt') {
        if (action === 'INSTALL_APP') {
          await this.installApp();
        }
        NotificationService.removeNotification(notification.id);
      }
    });
  }

  async installApp() {
    if (!this.deferredPrompt) return;

    try {
      const { outcome } = await this.deferredPrompt.prompt();
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        this.trackEvent('install_accepted');
      } else {
        console.log('User dismissed the install prompt');
        this.trackEvent('install_dismissed');
      }
      
      this.deferredPrompt = null;
    } catch (error) {
      console.error('Install prompt failed:', error);
    }
  }

  setupConnectivityMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      NotificationService.success('You are back online! 🌐', {
        duration: 3000
      });
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      NotificationService.warning('You are offline. Some features may be limited. 📱', {
        duration: 5000,
        persistent: true
      });
    });
  }

  async setupPushNotifications() {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        this.subscribeToPushNotifications();
      }
    }
  }

  async subscribeToPushNotifications() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY || 'demo-vapid-key')
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      console.log('Push notifications subscribed:', subscription);
    } catch (error) {
      console.error('Push notification subscription failed:', error);
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async sendSubscriptionToServer(subscription) {
    // Mock API call to save subscription
    console.log('Sending push subscription to server:', subscription);
    return Promise.resolve({ success: true });
  }

  setupAppShortcuts() {
    // Dynamic shortcuts based on user activity
    if ('navigator' in window && 'setAppBadge' in navigator) {
      // Set app badge for unread notifications
      NotificationService.addEventListener('new_notification', () => {
        const unreadCount = NotificationService.getUnreadCount();
        navigator.setAppBadge(unreadCount);
      });
    }
  }

  checkInstallStatus() {
    // Check if app is in standalone mode
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone ||
                      document.referrer.includes('android-app://');
  }

  showUpdateNotification() {
    NotificationService.notify('app_update',
      'A new version of SignalStack is available!', {
      persistent: true,
      icon: '🔄',
      actions: [
        { label: 'Update Now', action: 'UPDATE_APP' },
        { label: 'Later', action: 'DISMISS_UPDATE' }
      ],
      metadata: { type: 'app_update' }
    });

    // Listen for update action
    NotificationService.addEventListener('notification_action', ({ notification, action }) => {
      if (notification.metadata?.type === 'app_update') {
        if (action === 'UPDATE_APP') {
          this.updateApp();
        }
        NotificationService.removeNotification(notification.id);
      }
    });
  }

  async updateApp() {
    if (!this.serviceWorker || !this.serviceWorker.waiting) return;

    try {
      // Tell the waiting service worker to skip waiting
      this.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page to activate the new service worker
      window.location.reload();
    } catch (error) {
      console.error('App update failed:', error);
      NotificationService.error('Update failed. Please refresh the page manually.');
    }
  }

  async syncOfflineData() {
    if (!this.isOnline) return;

    try {
      // Sync any offline data
      const offlineData = this.getOfflineData();
      
      if (offlineData.length > 0) {
        NotificationService.info('Syncing offline data...', { duration: 2000 });
        
        // Send offline data to server
        await this.sendOfflineDataToServer(offlineData);
        
        // Clear offline data
        this.clearOfflineData();
        
        NotificationService.success('Offline data synced successfully!', { duration: 3000 });
      }
    } catch (error) {
      console.error('Offline data sync failed:', error);
      NotificationService.error('Failed to sync offline data');
    }
  }

  getOfflineData() {
    const data = localStorage.getItem('offline_data');
    return data ? JSON.parse(data) : [];
  }

  saveOfflineData(data) {
    const existingData = this.getOfflineData();
    existingData.push({
      ...data,
      timestamp: Date.now(),
      synced: false
    });
    localStorage.setItem('offline_data', JSON.stringify(existingData));
  }

  clearOfflineData() {
    localStorage.removeItem('offline_data');
  }

  async sendOfflineDataToServer(data) {
    // Mock API call
    console.log('Sending offline data to server:', data);
    return Promise.resolve({ success: true });
  }

  // Share API
  async shareContent(shareData) {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        this.trackEvent('content_shared', { method: 'native' });
      } catch (error) {
        console.error('Share failed:', error);
        this.fallbackShare(shareData);
      }
    } else {
      this.fallbackShare(shareData);
    }
  }

  fallbackShare(shareData) {
    // Copy to clipboard as fallback
    const text = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
    navigator.clipboard.writeText(text).then(() => {
      NotificationService.success('Content copied to clipboard!', { duration: 3000 });
      this.trackEvent('content_shared', { method: 'clipboard' });
    });
  }

  // File System Access
  async saveFile(data, filename, type = 'application/json') {
    if ('showSaveFilePicker' in window) {
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'JSON files',
            accept: { 'application/json': ['.json'] }
          }]
        });

        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();

        NotificationService.success('File saved successfully!', { duration: 3000 });
        return true;
      } catch (error) {
        console.error('File save failed:', error);
        return false;
      }
    } else {
      // Fallback: download as blob
      this.downloadFile(data, filename, type);
      return true;
    }
  }

  downloadFile(data, filename, type) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Background Sync
  async scheduleBackgroundSync(tag) {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log('Background sync scheduled:', tag);
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }

  // Performance Monitoring
  trackEvent(eventName, data = {}) {
    // Track PWA-specific events
    console.log('PWA Event:', eventName, data);
    
    // In production, send to analytics service
    if (window.gtag) {
      window.gtag('event', eventName, data);
    }
  }

  // Utility methods
  isStandalone() {
    return this.isInstalled;
  }

  canInstall() {
    return !!this.deferredPrompt;
  }

  supportsFeature(feature) {
    const features = {
      'push': 'Notification' in window && 'serviceWorker' in navigator,
      'share': 'share' in navigator,
      'clipboard': 'clipboard' in navigator,
      'fileSystem': 'showSaveFilePicker' in window,
      'backgroundSync': 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      'badging': 'setAppBadge' in navigator
    };
    
    return features[feature] || false;
  }

  getConnectionInfo() {
    return {
      online: this.isOnline,
      connectionType: navigator.connection?.effectiveType || 'unknown',
      downlink: navigator.connection?.downlink || 0,
      rtt: navigator.connection?.rtt || 0
    };
  }

  // Manifest management
  async updateManifest(updates) {
    try {
      // Dynamic manifest updates would go here
      console.log('Manifest updates:', updates);
      return true;
    } catch (error) {
      console.error('Manifest update failed:', error);
      return false;
    }
  }
}

export default new PWAService();