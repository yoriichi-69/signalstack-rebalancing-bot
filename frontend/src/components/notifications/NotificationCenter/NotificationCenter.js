import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationService from '../../../services/NotificationService';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    // Initialize notifications
    setNotifications(NotificationService.getNotifications());
    setUnreadCount(NotificationService.getUnreadCount());

    // Subscribe to new notifications
    const unsubscribe = NotificationService.addEventListener('new_notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => unsubscribe();
  }, []);

  const handleMarkAsRead = (notificationId) => {
    NotificationService.markAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => prev - 1);
  };

  const handleMarkAllAsRead = () => {
    NotificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleRemoveNotification = (notificationId) => {
    NotificationService.removeNotification(notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleClearAll = () => {
    NotificationService.clearAll();
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleToggleSound = () => {
    const newSoundState = NotificationService.toggleSound();
    setSoundEnabled(newSoundState);
  };

  const getFilteredNotifications = () => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.read);
    return notifications.filter(n => n.type === filter);
  };

  const getNotificationIcon = (type) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      trade: '💹',
      price_alert: '📈',
      news: '📰',
      ai_signal: '🤖',
      market: '📊'
    };
    return icons[type] || '🔔';
  };

  const getNotificationColor = (type) => {
    const colors = {
      success: '#2ecc71',
      error: '#e74c3c',
      warning: '#f39c12',
      info: '#3498db',
      trade: '#9b59b6',
      price_alert: '#40e0d0',
      news: '#95a5a6',
      ai_signal: '#ff6b6b',
      market: '#1abc9c'
    };
    return colors[type] || '#40e0d0';
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const handleNotificationAction = (notification, action) => {
    switch (action) {
      case 'VIEW_PORTFOLIO':
        window.location.href = '/portfolio';
        break;
      case 'TRADE_NOW':
        window.location.href = '/trading';
        break;
      case 'VIEW_ANALYSIS':
        window.location.href = '/analysis';
        break;
      case 'SET_ALERT':
        // Open alert modal
        break;
      default:
        console.log('Action not implemented:', action);
    }
    
    handleMarkAsRead(notification.id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Notification Bell */}
      <motion.button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <motion.span
            className="notification-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="notification-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="notification-panel"
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div className="notification-header">
                <h3>Notifications</h3>
                <div className="header-actions">
                  <button
                    className={`sound-toggle ${soundEnabled ? 'enabled' : 'disabled'}`}
                    onClick={handleToggleSound}
                    title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
                  >
                    {soundEnabled ? '🔊' : '🔇'}
                  </button>
                  <button
                    className="close-panel"
                    onClick={() => setIsOpen(false)}
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="notification-filters">
                {['all', 'unread', 'trade', 'price_alert', 'news', 'ai_signal'].map(filterType => (
                  <button
                    key={filterType}
                    className={`filter-btn ${filter === filterType ? 'active' : ''}`}
                    onClick={() => setFilter(filterType)}
                  >
                    {filterType.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Controls */}
              <div className="notification-controls">
                <button
                  className="control-btn"
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                >
                  Mark All Read
                </button>
                <button
                  className="control-btn danger"
                  onClick={handleClearAll}
                  disabled={notifications.length === 0}
                >
                  Clear All
                </button>
              </div>

              {/* Notifications List */}
              <div className="notifications-list">
                <AnimatePresence>
                  {getFilteredNotifications().map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      className={`notification-item ${notification.read ? 'read' : 'unread'} ${notification.priority}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 300 }}
                      transition={{ delay: index * 0.05 }}
                      layout
                    >
                      <div className="notification-content">
                        <div className="notification-icon-wrapper">
                          <span 
                            className="notification-icon"
                            style={{ color: getNotificationColor(notification.type) }}
                          >
                            {notification.icon || getNotificationIcon(notification.type)}
                          </span>
                          {notification.priority === 'critical' && (
                            <div className="critical-indicator"></div>
                          )}
                        </div>

                        <div className="notification-body">
                          <div className="notification-message">
                            {notification.message}
                          </div>
                          {notification.subtitle && (
                            <div className="notification-subtitle">
                              {notification.subtitle}
                            </div>
                          )}
                          <div className="notification-time">
                            {formatTimeAgo(notification.timestamp)}
                          </div>
                        </div>

                        <div className="notification-actions">
                          {!notification.read && (
                            <button
                              className="action-btn mark-read"
                              onClick={() => handleMarkAsRead(notification.id)}
                              title="Mark as read"
                            >
                              ✓
                            </button>
                          )}
                          <button
                            className="action-btn remove"
                            onClick={() => handleRemoveNotification(notification.id)}
                            title="Remove notification"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {notification.actions && notification.actions.length > 0 && (
                        <div className="notification-action-buttons">
                          {notification.actions.map((action, actionIndex) => (
                            <button
                              key={actionIndex}
                              className="notification-action-btn"
                              onClick={() => handleNotificationAction(notification, action.action)}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Priority Indicator */}
                      {notification.priority === 'high' && (
                        <div className="priority-indicator high"></div>
                      )}
                      {notification.priority === 'critical' && (
                        <div className="priority-indicator critical"></div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {getFilteredNotifications().length === 0 && (
                  <div className="no-notifications">
                    <span className="no-notifications-icon">🔕</span>
                    <p>No notifications</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <div className="toast-container">
        <AnimatePresence>
          {notifications.slice(0, 3).filter(n => !n.read && Date.now() - n.timestamp < 5000).map(notification => (
            <motion.div
              key={`toast-${notification.id}`}
              className={`toast-notification ${notification.type} ${notification.priority}`}
              initial={{ opacity: 0, x: 300, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="toast-content">
                <span 
                  className="toast-icon"
                  style={{ color: getNotificationColor(notification.type) }}
                >
                  {notification.icon || getNotificationIcon(notification.type)}
                </span>
                <div className="toast-message">
                  <div className="toast-title">{notification.message}</div>
                  {notification.subtitle && (
                    <div className="toast-subtitle">{notification.subtitle}</div>
                  )}
                </div>
                <button
                  className="toast-close"
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  ×
                </button>
              </div>

              {notification.priority === 'critical' && (
                <div className="toast-critical-glow"></div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

export default NotificationCenter;