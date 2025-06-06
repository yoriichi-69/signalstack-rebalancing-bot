import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './Header.css';

const Header = ({ user, activeAccount, userAccounts, onSwitchAccount, onCreateAccount, onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <motion.header 
      className="modern-header"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="header-container">
        <div className="header-left">
          <motion.div 
            className="logo-container"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="logo-icon">
              <div className="signal-waves">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <h1 className="logo-text">SignalStack</h1>
          </motion.div>
          
          <nav className="main-nav">
            <NavItem href="#dashboard" icon="dashboard">Dashboard</NavItem>
            <NavItem href="#portfolio" icon="portfolio">Portfolio</NavItem>
            <NavItem href="#signals" icon="signals">Signals</NavItem>
            <NavItem href="#strategies" icon="strategies">Strategies</NavItem>
            <NavItem href="#analytics" icon="analytics">Analytics</NavItem>
          </nav>
        </div>

        <div className="header-right">
          <div className="account-controls">
            <select 
              className="account-selector"
              value={activeAccount?.id || ''} 
              onChange={(e) => onSwitchAccount(e.target.value)}
            >
              {userAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
            
            <motion.button 
              className="btn-create-account"
              onClick={onCreateAccount}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="icon">+</span>
            </motion.button>
          </div>

          <div className="user-profile" onClick={() => setIsProfileOpen(!isProfileOpen)}>
            <div className="avatar">
              <span>{user?.name?.charAt(0) || 'U'}</span>
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-email">{user?.email || 'user@example.com'}</span>
            </div>
            <div className={`dropdown-arrow ${isProfileOpen ? 'open' : ''}`}>▼</div>
            
            {isProfileOpen && (
              <motion.div 
                className="profile-dropdown"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="dropdown-item">Settings</div>
                <div className="dropdown-item">Security</div>
                <div className="dropdown-item">API Keys</div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item logout" onClick={onLogout}>Logout</div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

const NavItem = ({ href, icon, children }) => (
  <motion.a 
    href={href} 
    className={`nav-item ${icon}`}
    whileHover={{ y: -2 }}
    whileTap={{ y: 0 }}
  >
    <span className="nav-icon"></span>
    {children}
  </motion.a>
);

export default Header;