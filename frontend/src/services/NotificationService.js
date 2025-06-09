/* filepath: frontend/src/services/NotificationService.js */
class NotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = new Map();
    this.soundEnabled = true;
    this.browserNotifications = false;
    this.maxNotifications = 50;
    this.soundCache = new Map();
    
    this.initializeBrowserNotifications();
    this.preloadSounds();
  }

  async initializeBrowserNotifications() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.browserNotifications = permission === 'granted';
    }
  }

  preloadSounds() {
    const sounds = {
      success: '/sounds/success.mp3',
      error: '/sounds/error.mp3',
      warning: '/sounds/warning.mp3',
      info: '/sounds/info.mp3',
      trade: '/sounds/trade.mp3',
      price_alert: '/sounds/price_alert.mp3',
      notification: '/sounds/notification.mp3'
    };

    Object.entries(sounds).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      this.soundCache.set(key, audio);
    });
  }

  // Main notification method
  notify(type, message, options = {}) {
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: Date.now(),
      read: false,
      priority: options.priority || 'normal',
      persistent: options.persistent || false,
      actionable: options.actionable || false,
      actions: options.actions || [],
      metadata: options.metadata || {},
      ...options
    };

    // Add to notifications array
    this.notifications.unshift(notification);
    
    // Limit notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    // Play sound
    if (this.soundEnabled) {
      this.playSound(type);
    }

    // Show browser notification
    if (this.browserNotifications && options.browserNotification !== false) {
      this.showBrowserNotification(notification);
    }

    // Notify listeners
    this.notifyListeners('new_notification', notification);

    // Auto-remove non-persistent notifications
    if (!notification.persistent) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, options.duration || 5000);
    }

    return notification;
  }

  // Specialized notification methods
  success(message, options = {}) {
    return this.notify('success', message, {
      ...options,
      icon: '✅',
      sound: 'success'
    });
  }

  error(message, options = {}) {
    return this.notify('error', message, {
      ...options,
      icon: '❌',
      sound: 'error',
      priority: 'high',
      persistent: true
    });
  }

  warning(message, options = {}) {
    return this.notify('warning', message, {
      ...options,
      icon: '⚠️',
      sound: 'warning',
      priority: 'medium'
    });
  }

  info(message, options = {}) {
    return this.notify('info', message, {
      ...options,
      icon: 'ℹ️',
      sound: 'info'
    });
  }

  // Trading-specific notifications
  tradeExecuted(symbol, type, amount, price) {
    return this.notify('trade', 
      `${type.toUpperCase()} order executed: ${amount} ${symbol} at $${price}`, {
      icon: type === 'buy' ? '🟢' : '🔴',
      sound: 'trade',
      priority: 'high',
      persistent: true,
      metadata: { symbol, type, amount, price },
      actions: [
        { label: 'View Portfolio', action: 'VIEW_PORTFOLIO' },
        { label: 'View Order', action: 'VIEW_ORDER' }
      ]
    });
  }

  priceAlert(symbol, price, targetPrice, direction) {
    const message = `${symbol} ${direction === 'above' ? 'crossed above' : 'dropped below'} $${targetPrice}. Current: $${price}`;
    
    return this.notify('price_alert', message, {
      icon: direction === 'above' ? '📈' : '📉',
      sound: 'price_alert',
      priority: 'high',
      persistent: true,
      metadata: { symbol, price, targetPrice, direction },
      actions: [
        { label: 'Trade Now', action: 'TRADE_NOW' },
        { label: 'Set New Alert', action: 'SET_ALERT' }
      ]
    });
  }

  marketAlert(title, message, severity = 'info') {
    return this.notify('market', `${title}: ${message}`, {
      icon: severity === 'critical' ? '🚨' : '📊',
      sound: severity === 'critical' ? 'error' : 'info',
      priority: severity === 'critical' ? 'critical' : 'medium',
      persistent: severity === 'critical',
      metadata: { title, severity }
    });
  }

  newsAlert(headline, source, sentiment = 'neutral') {
    const icons = {
      positive: '📈',
      negative: '📉',
      neutral: '📰'
    };

    return this.notify('news', headline, {
      icon: icons[sentiment],
      sound: 'notification',
      subtitle: `Source: ${source}`,
      metadata: { source, sentiment },
      actions: [
        { label: 'Read More', action: 'READ_NEWS' },
        { label: 'Analyze Impact', action: 'ANALYZE_IMPACT' }
      ]
    });
  }

  // AI Signal notifications
  aiSignal(signal) {
    const confidenceColor = signal.confidence > 80 ? '🔥' : 
                           signal.confidence > 60 ? '⚡' : 'ℹ️';
    
    return this.notify('ai_signal', 
      `AI Signal: ${signal.action} ${signal.symbol} (${signal.confidence}% confidence)`, {
      icon: confidenceColor,
      sound: signal.confidence > 80 ? 'price_alert' : 'info',
      priority: signal.confidence > 80 ? 'high' : 'normal',
      persistent: signal.confidence > 80,
      metadata: signal,
      actions: [
        { label: 'Execute Trade', action: 'EXECUTE_TRADE' },
        { label: 'View Analysis', action: 'VIEW_ANALYSIS' }
      ]
    });
  }

  // Browser notification
  showBrowserNotification(notification) {
    if (!this.browserNotifications) return;

    const browserNotif = new Notification(notification.message, {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: notification.type,
      renotify: true,
      requireInteraction: notification.persistent,
      actions: notification.actions?.slice(0, 2) || []
    });

    browserNotif.onclick = () => {
      this.notifyListeners('notification_click', notification);
      browserNotif.close();
    };

    if (notification.actions?.length > 0) {
      browserNotif.onactionclick = (event) => {
        this.notifyListeners('notification_action', {
          notification,
          action: event.action
        });
      };
    }
  }

  // Sound management
  playSound(type) {
    const audio = this.soundCache.get(type) || this.soundCache.get('notification');
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.warn('Could not play sound:', e));
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  // Notification management
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifyListeners('notification_read', notification);
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners('all_notifications_read');
  }

  removeNotification(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index > -1) {
      const removed = this.notifications.splice(index, 1)[0];
      this.notifyListeners('notification_removed', removed);
    }
  }

  clearAll() {
    this.notifications = [];
    this.notifyListeners('all_notifications_cleared');
  }

  // Getters
  getNotifications() {
    return this.notifications;
  }

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  getNotificationsByType(type) {
    return this.notifications.filter(n => n.type === type);
  }

  // Event system
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
      }
    };
  }

  notifyListeners(event, data = {}) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Batch notifications for multiple price alerts
  batchPriceAlerts(alerts) {
    if (alerts.length === 0) return;
    
    if (alerts.length === 1) {
      const alert = alerts[0];
      return this.priceAlert(alert.symbol, alert.price, alert.targetPrice, alert.direction);
    }

    const summary = `${alerts.length} price alerts triggered`;
    const details = alerts.map(a => `${a.symbol}: $${a.price}`).join(', ');
    
    return this.notify('batch_price_alert', summary, {
      icon: '📊',
      sound: 'price_alert',
      priority: 'high',
      persistent: true,
      subtitle: details,
      metadata: { alerts },
      actions: [
        { label: 'View All', action: 'VIEW_ALL_ALERTS' },
        { label: 'Trading Dashboard', action: 'TRADING_DASHBOARD' }
      ]
    });
  }
}

export default new NotificationService();