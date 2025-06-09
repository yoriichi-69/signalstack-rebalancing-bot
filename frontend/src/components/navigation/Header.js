import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Header.css';

const Header = ({ 
  user, 
  activeAccount, 
  userAccounts, 
  onSwitchAccount, 
  onCreateAccount, 
  onLogout, 
  onToggleMobileNav, 
  theme, 
  onToggleTheme, 
  voiceCommandActive, 
  onToggleVoice, 
  isVoiceSupported,
  currentRoute,
  onNavigate
}) => {
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/portfolio', label: 'Portfolio', icon: '💼' },
    { path: '/signals', label: 'Signals', icon: '��' },
    { path: '/bots', label: 'Bots', icon: '🤖' },
    { path: '/market', label: 'Market', icon: '📈' }
  ];

  const handleNavClick = (path) => {
    console.log('Navigating to:', path);
    
    // Prevent default navigation that causes logout
    if (onNavigate && typeof onNavigate === 'function') {
      onNavigate(path);
      
      // Close the dropdown menus if they're open
      setShowUserDropdown(false);
      setShowAccountDropdown(false);
    } else {
      // If no navigation handler, update URL without reload
      window.history.pushState({}, '', path);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <motion.header 
      className={`dashboard-header theme-${theme}`}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="header-container">
        <div className="header-left">
          {/* Logo */}
          <div className="header-logo">
            <motion.h2 
              className="logo-text"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              🚀 SignalStack
            </motion.h2>
          </div>

          {/* Navigation */}
          <nav className="header-nav desktop-only">
            {navItems.map((item) => (
              <button
                key={item.path}
                className={`nav-link ${currentRoute === item.path ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNavClick(item.path);
                }}
                type="button"
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="header-right">
          {/* Mobile Menu Button */}
          <motion.button 
            className="mobile-menu-btn mobile-only"
            onClick={onToggleMobileNav}
            aria-label="Toggle mobile menu"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <span></span>
            <span></span>
            <span></span>
          </motion.button>

          {/* Header Actions */}
          <div className="header-actions">
            {/* Voice Command Button */}
            {isVoiceSupported && (
              <motion.button
                className={`voice-btn ${voiceCommandActive ? 'active' : ''}`}
                onClick={onToggleVoice}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title={voiceCommandActive ? 'Stop Voice Commands' : 'Start Voice Commands'}
              >
                🎤
              </motion.button>
            )}

            {/* Theme Toggle */}
            <motion.button
              className="theme-toggle-btn"
              onClick={onToggleTheme}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </motion.button>

            {/* Account Selector */}
            {userAccounts && userAccounts.length > 0 && (
              <div className="account-selector">
                <motion.button
                  className="account-btn"
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="account-icon">💼</span>
                  <span className="account-name">
                    {activeAccount?.name || 'Select Account'}
                  </span>
                  <span className="dropdown-arrow">▼</span>
                </motion.button>

                <AnimatePresence>
                  {showAccountDropdown && (
                    <motion.div
                      className="account-dropdown"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {userAccounts.map((account) => (
                        <button
                          key={account.id}
                          className={`account-option ${activeAccount?.id === account.id ? 'active' : ''}`}
                          onClick={() => {
                            onSwitchAccount(account.id);
                            setShowAccountDropdown(false);
                          }}
                        >
                          <span className="account-option-icon">💼</span>
                          <span className="account-option-name">{account.name}</span>
                          {activeAccount?.id === account.id && (
                            <span className="account-option-check">✓</span>
                          )}
                        </button>
                      ))}
                      <div className="account-dropdown-divider"></div>
                      <button
                        className="account-option create-new"
                        onClick={() => {
                          onCreateAccount();
                          setShowAccountDropdown(false);
                        }}
                      >
                        <span className="account-option-icon">➕</span>
                        <span className="account-option-name">Create New Portfolio</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* User Menu */}
            <div className="user-menu">
              <motion.button
                className="user-btn"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                whileHover={{ scale: 1.05 }}
              >
                <div className="user-info">
                  <span className="user-email">{user?.email || 'User'}</span>
                  <div className="user-avatar">
                    {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
                <span className="dropdown-arrow">▼</span>
              </motion.button>

              <AnimatePresence>
                {showUserDropdown && (
                  <motion.div
                    className="user-dropdown"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="user-dropdown-header">
                      <div className="user-avatar-large">
                        {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{user?.name || 'Trading User'}</div>
                        <div className="user-email-small">{user?.email || 'user@signalstack.com'}</div>
                      </div>
                    </div>
                    
                    <div className="user-dropdown-divider"></div>
                    
                    <button className="user-dropdown-item">
                      <span className="dropdown-item-icon">⚙️</span>
                      <span>Settings</span>
                    </button>
                    
                    <button className="user-dropdown-item">
                      <span className="dropdown-item-icon">👤</span>
                      <span>Profile</span>
                    </button>
                    
                    <button className="user-dropdown-item">
                      <span className="dropdown-item-icon">🔔</span>
                      <span>Notifications</span>
                    </button>
                    
                    <button className="user-dropdown-item">
                      <span className="dropdown-item-icon">❓</span>
                      <span>Help & Support</span>
                    </button>
                    
                    <div className="user-dropdown-divider"></div>
                    
                    <button 
                      className="user-dropdown-item logout"
                      onClick={handleLogout}
                    >
                      <span className="dropdown-item-icon">🚪</span>
                      <span>Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="header-status">
        {voiceCommandActive && (
          <motion.div 
            className="status-indicator voice-active"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <span className="status-icon">🎤</span>
            <span className="status-text">Voice Active</span>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default Header;