import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MobileNav.css';

const MobileNav = ({ isOpen, onClose, currentRoute, onNavigate }) => {
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  const navigationItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: '📊',
      route: '/dashboard',
      description: 'Portfolio overview and insights'
    },
    {
      id: 'portfolio',
      title: 'Portfolio',
      icon: '💼',
      route: '/portfolio',
      description: 'Manage your investments',
      submenu: [
        { title: 'Overview', route: '/portfolio/overview' },
        { title: 'Holdings', route: '/portfolio/holdings' },
        { title: 'Transactions', route: '/portfolio/transactions' }
      ]
    },
    {
      id: 'signals',
      title: 'Signals',
      icon: '📡',
      route: '/signals',
      description: 'Trading signals and alerts',
      submenu: [
        { title: 'Active Signals', route: '/signals/active' },
        { title: 'Signal History', route: '/signals/history' },
        { title: 'Create Alert', route: '/signals/create' }
      ]
    },
    {
      id: 'strategies',
      title: 'Strategies',
      icon: '🧠',
      route: '/strategies',
      description: 'Trading strategies and automation',
      submenu: [
        { title: 'My Strategies', route: '/strategies/my' },
        { title: 'Create Strategy', route: '/strategies/create' },
        { title: 'Backtest', route: '/strategies/backtest' }
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: '📈',
      route: '/analytics',
      description: 'Performance analysis and reports'
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: '⚙️',
      route: '/settings',
      description: 'Account and app preferences'
    }
  ];

  const handleNavigate = (route) => {
    onNavigate(route);
    onClose();
  };

  const toggleSubmenu = (itemId) => {
    setActiveSubmenu(activeSubmenu === itemId ? null : itemId);
  };

  const menuVariants = {
    closed: {
      x: '100%',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 40
      }
    },
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 40
      }
    }
  };

  const itemVariants = {
    closed: { x: 50, opacity: 0 },
    open: (i) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="mobile-nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Navigation Menu */}
          <motion.div
            className="mobile-nav-container"
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            {/* Header */}
            <div className="mobile-nav-header">
              <div className="nav-logo">
                <div className="logo-icon">
                  <div className="signal-waves">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <span className="logo-text">SignalStack</span>
              </div>
              
              <motion.button
                className="nav-close-btn"
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>
            </div>

            {/* Navigation Items */}
            <div className="mobile-nav-content">
              <div className="nav-items">
                {navigationItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className="nav-item-wrapper"
                    custom={index}
                    variants={itemVariants}
                    initial="closed"
                    animate="open"
                  >
                    <div
                      className={`nav-item ${currentRoute === item.route ? 'active' : ''}`}
                      onClick={() => {
                        if (item.submenu) {
                          toggleSubmenu(item.id);
                        } else {
                          handleNavigate(item.route);
                        }
                      }}
                    >
                      <div className="nav-item-main">
                        <div className="nav-item-left">
                          <span className="nav-icon">{item.icon}</span>
                          <div className="nav-text">
                            <span className="nav-title">{item.title}</span>
                            <span className="nav-description">{item.description}</span>
                          </div>
                        </div>
                        
                        {item.submenu && (
                          <motion.div
                            className="nav-arrow"
                            animate={{ rotate: activeSubmenu === item.id ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            ▶
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Submenu */}
                    <AnimatePresence>
                      {item.submenu && activeSubmenu === item.id && (
                        <motion.div
                          className="nav-submenu"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {item.submenu.map((subItem, subIndex) => (
                            <motion.div
                              key={subItem.route}
                              className={`nav-subitem ${currentRoute === subItem.route ? 'active' : ''}`}
                              onClick={() => handleNavigate(subItem.route)}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: subIndex * 0.05 }}
                              whileHover={{ x: 4 }}
                            >
                              {subItem.title}
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="mobile-nav-stats">
                <div className="stat-item">
                  <span className="stat-value">₿ 2.45</span>
                  <span className="stat-label">Total BTC</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">$125.4K</span>
                  <span className="stat-label">Portfolio Value</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">+3.8%</span>
                  <span className="stat-label">24h Change</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mobile-nav-footer">
              <div className="user-info">
                <div className="user-avatar">
                  <span>U</span>
                </div>
                <div className="user-details">
                  <span className="user-name">Trading Account</span>
                  <span className="user-email">user@example.com</span>
                </div>
              </div>
              
              <motion.button
                className="logout-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Logout
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileNav;