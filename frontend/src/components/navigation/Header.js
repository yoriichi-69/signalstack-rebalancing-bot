import React from 'react';
import { motion } from 'framer-motion';
import './Header.css';

const Header = () => {
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    window.location.href = '/';
  };

  const userEmail = localStorage.getItem('userEmail') || 'User';

  return (
    <motion.header 
      className="dashboard-header"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="header-container">
        <div className="header-logo">
          <h2 className="logo-text">CryptoRizz</h2>
        </div>
        
        <nav className="header-nav">
          <a href="/dashboard" className="nav-link active">Dashboard</a>
          <a href="/portfolio" className="nav-link">Portfolio</a>
          <a href="/analytics" className="nav-link">Analytics</a>
          <a href="/settings" className="nav-link">Settings</a>
        </nav>
        
        <div className="header-user">
          <div className="user-info">
            <span className="user-email">{userEmail}</span>
            <div className="user-avatar">
              {userEmail.charAt(0).toUpperCase()}
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;