import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// V1 Imports (Keep your existing functionality)
import VirtualAccount from './utils/VirtualAccount';
import PriceService from './services/PriceService';
import SignalService from './services/SignalService';
import AuthService from './services/AuthService';
import LoginForm from './components/LoginForm';
import SortableTable from './components/SortableTable';
import LoadingSpinner from './components/LoadingSpinner';
import StrategyComparison from './components/StrategyComparison';
import { PortfolioValueChart, TokenWeightsChart } from './components/PortfolioChart';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import strategies from './utils/StrategyService';

// V2 Imports (New professional components)
import Header from './components/navigation/Header';
import MobileNav from './components/layout/MobileNav';
import Dashboard from './components/dashboard/Dashboard';
import LandingPage from './components/landing/LandingPage';

// Enhanced V3 Imports (New services and features - Voice removed)
import NotificationService from './services/NotificationService';
import NewsService from './services/NewsService';
import SecurityService from './services/SecurityService';
import PerformanceMonitor from './utils/PerformanceMonitor';
import { useTheme } from './contexts/ThemeContext';

// PWA Imports
import { motion, AnimatePresence } from 'framer-motion';
import usePWA from './hooks/usePWA';

// PWA Components
const PWAInstallPrompt = ({ onInstall, onDismiss, isVisible }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        className="pwa-install-prompt"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
      >
        <div className="install-content">
          <h3>📱 Install SignalStack</h3>
          <p>Get the full app experience with offline access and push notifications</p>
          <div className="install-actions">
            <button className="btn-install" onClick={onInstall}>
              Install App
            </button>
            <button className="btn-dismiss" onClick={onDismiss}>
              Not Now
            </button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const OfflineIndicator = ({ isOnline }) => (
  <AnimatePresence>
    {!isOnline && (
      <motion.div
        className="offline-indicator"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
      >
        <span>📡 You're offline - Using cached data</span>
      </motion.div>
    )}
  </AnimatePresence>
);

const PWAUpdatePrompt = ({ onUpdate, onDismiss, isVisible }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        className="pwa-update-prompt"
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
      >
        <div className="update-content">
          <h3>🔄 Update Available</h3>
          <p>A new version of SignalStack is ready to install</p>
          <div className="update-actions">
            <button className="btn-update" onClick={onUpdate}>
              Update Now
            </button>
            <button className="btn-dismiss" onClick={onDismiss}>
              Later
            </button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

function App() {
  // V1 Authentication state (Keep existing)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userAccounts, setUserAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  
  // V1 App state (Keep existing)
  const [account, setAccount] = useState(null);
  const [virtualAccount, setVirtualAccount] = useState(null);
  const [prices, setPrices] = useState({});
  const [signals, setSignals] = useState({});
  const [targetWeights, setTargetWeights] = useState({});
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [isLoadingSignals, setIsLoadingSignals] = useState(false);
  const [txHistory, setTxHistory] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [activeStrategy, setActiveStrategy] = useState('signalBased');

  // V2 UI state (New for professional UI)
  const [currentRoute, setCurrentRoute] = useState('/dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [user, setUser] = useState(null);

  // V3 Enhanced state (Voice-related state removed)
  const [newsData, setNewsData] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});

  // PWA State
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  // Hooks
  const { theme, toggleTheme } = useTheme();
  const { 
    isInstalled, 
    isInstallable, 
    installApp, 
    isOnline, 
    updateAvailable, 
    updateApp,
    installationStatus,
    requestNotificationPermission
  } = usePWA();

  // PWA Handlers
  const handlePWAInstall = useCallback(async () => {
    const success = await installApp();
    if (success) {
      setShowInstallPrompt(false);
      NotificationService.success('App installed successfully! 🎉');
      
      const notificationGranted = await requestNotificationPermission();
      if (notificationGranted) {
        NotificationService.success('Push notifications enabled! 🔔');
      }
    }
  }, [installApp, requestNotificationPermission]);

  const handlePWAUpdate = useCallback(async () => {
    await updateApp();
    setShowUpdatePrompt(false);
  }, [updateApp]);

  // V3 News update handler
  const handleNewsUpdate = useCallback((news) => {
    setNewsData(prevNews => [news, ...prevNews.slice(0, 19)]);
    
    if (news.priority === 'high') {
      NotificationService.info(`Breaking: ${news.title}`, {
        persistent: true,
        actions: [
          { label: 'Read More', action: () => setCurrentRoute('/news') },
          { label: 'Dismiss', action: 'dismiss' }
        ]
      });
    }
  }, []);

  // V3 Security event handler
  const handleSecurityEvent = useCallback((event) => {
    setSecurityAlerts(prev => [event, ...prev.slice(0, 9)]);
    
    if (event.severity === 'high' || event.severity === 'critical') {
      NotificationService.warning(`Security Alert: ${event.message}`, {
        persistent: true,
        priority: 'high'
      });
    }
  }, []);

  // PWA useEffect hooks
  useEffect(() => {
    if (isInstallable && !isInstalled) {
      setTimeout(() => setShowInstallPrompt(true), 5000);
    }
  }, [isInstallable, isInstalled]);

  useEffect(() => {
    if (updateAvailable) {
      setShowUpdatePrompt(true);
    }
  }, [updateAvailable]);

  // V1 Initialize app (Voice services removed)
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsAppLoading(true);
        
        // V3: Initialize enhanced services (Voice removed)
        PerformanceMonitor.startMonitoring();
        await SecurityService.initializeSecurity();
        NotificationService.initialize();
        
        // V3: Setup news stream
        NewsService.addEventListener('news_update', handleNewsUpdate);
        NewsService.startNewsStream();
        
        // V3: Setup security monitoring
        SecurityService.addEventListener('security_event', handleSecurityEvent);
        
        // V1: Check authentication status
        const authStatus = AuthService.isAuthenticated();
        setIsAuthenticated(authStatus);
        
        if (authStatus) {
          // V1: Load user accounts
          const accounts = AuthService.getAccounts();
          setUserAccounts(accounts);
          
          // V2: Create user object for new header
          setUser({
            id: 1,
            name: accounts[0]?.name || 'Trading User',
            email: 'user@signalstack.com'
          });
          
          if (accounts.length === 0) {
            const result = AuthService.createAccount("Main Trading Account");
            if (result.success) {
              setUserAccounts([result.account]);
              setActiveAccount(result.account);
            }
          } else {
            setActiveAccount(accounts[0]);
          }
        } else {
          // V1: For demo mode, create virtual account
          const vAccount = new VirtualAccount();
          setVirtualAccount(vAccount);
          setTxHistory(vAccount.getTransactionHistory());
          setPortfolioHistory(vAccount.portfolioHistory || []);
          
          // V2: Set demo user for header
          setUser({
            id: 0,
            name: 'Demo User',
            email: 'demo@signalstack.com'
          });
        }
        
        // V1: Start price updates
        PriceService.startRealTimeUpdates();
        
        // V1: Subscribe to price updates
        const unsubscribe = PriceService.subscribe((latestPrices) => {
          setPrices(latestPrices);
          if (virtualAccount) {
            const value = virtualAccount.getPortfolioValue(latestPrices);
            setPortfolioValue(value);
          }
        });
        
        // V1: Fetch signals
        await fetchSignalData();
        
        // V3: Track app initialization
        PerformanceMonitor.trackUserInteraction('app_initialized');
        
        // V2: Hide loading after everything is ready
        setTimeout(() => setIsAppLoading(false), 1000);
        
        return () => {
          PriceService.stopRealTimeUpdates();
          unsubscribe();
          NewsService.stopNewsStream();
          SecurityService.removeEventListener('security_event', handleSecurityEvent);
          PerformanceMonitor.stopMonitoring();
        };
      } catch (error) {
        console.error('Failed to initialize app:', error);
        NotificationService.error('Failed to initialize app');
        setIsAppLoading(false);
      }
    };

    initializeApp();
  }, [handleNewsUpdate, handleSecurityEvent]);
  
  // V1: Keep all your existing functions
  const fetchSignalData = async () => {
    setIsLoadingSignals(true);
    try {
      const signalData = await SignalService.fetchLatestSignals();
      setSignals(signalData);
      
      const weights = await SignalService.fetchTargetWeights();
      setTargetWeights(weights);
      
      NotificationService.success("Signals updated successfully");
    } catch (error) {
      console.error("Error fetching signal data:", error);
      NotificationService.error("Failed to fetch signals");
    } finally {
      setIsLoadingSignals(false);
    }
  };
  
  const executeVirtualRebalance = async () => {
    if (!virtualAccount) return;
    
    try {
      setIsRebalancing(true);
      const result = virtualAccount.executeRebalance(targetWeights, prices);
      setTxHistory(virtualAccount.getTransactionHistory());
      setPortfolioHistory(virtualAccount.portfolioHistory || []);
      
      PerformanceMonitor.trackUserInteraction('portfolio_rebalance', {
        newValue: result.newValue,
        timestamp: Date.now()
      });
      
      NotificationService.success(`Rebalancing complete! Portfolio value: $${result.newValue.toFixed(2)}`);
    } catch (error) {
      console.error("Error executing rebalance:", error);
      NotificationService.error("Rebalancing failed: " + error.message);
    } finally {
      setIsRebalancing(false);
    }
  };
  
  const resetVirtualAccount = () => {
    if (virtualAccount) {
      if (window.confirm("Are you sure you want to reset your virtual account?")) {
        virtualAccount.reset();
        setTxHistory(virtualAccount.getTransactionHistory());
        setPortfolioHistory([]);
        setPortfolioValue(virtualAccount.getPortfolioValue(prices));
        
        PerformanceMonitor.trackUserInteraction('account_reset');
        NotificationService.info("Virtual account has been reset");
      }
    }
  };
  
  const applyStrategy = (strategyKey, weights) => {
    setTargetWeights(weights);
    setActiveStrategy(strategyKey);
    
    PerformanceMonitor.trackUserInteraction('strategy_applied', { strategy: strategyKey });
    NotificationService.success(`Applied ${strategies[strategyKey].getName()} strategy`);
  };
  
  // V1: Keep existing auth functions, enhance for V2 & V3
  const handleLoginSuccess = (credentials) => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userEmail', credentials?.email || 'user@signalstack.com');
    
    setIsAuthenticated(true);
    const accounts = AuthService.getAccounts();
    setUserAccounts(accounts);
    
    setUser({
      id: 1,
      name: accounts[0]?.name || 'Trading User',
      email: credentials?.email || 'user@signalstack.com'
    });
    
    PerformanceMonitor.trackUserInteraction('user_login');
    SecurityService.logSecurityEvent('user_login_success');
    
    if (accounts.length > 0) {
      setActiveAccount(accounts[0]);
    } else {
      const result = AuthService.createAccount("Main Trading Account");
      if (result.success) {
        setUserAccounts([result.account]);
        setActiveAccount(result.account);
      }
    }
  };
  
  const handleLogout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUserAccounts([]);
    setActiveAccount(null);
    setUser(null);
    
    PerformanceMonitor.trackUserInteraction('user_logout');
    SecurityService.logSecurityEvent('user_logout');
    NotificationService.info('You have been logged out');
  };
  
  const createNewAccount = () => {
    const name = prompt("Enter portfolio name:");
    if (name) {
      const result = AuthService.createAccount(name);
      if (result.success) {
        setUserAccounts([...userAccounts, result.account]);
        setActiveAccount(result.account);
        
        PerformanceMonitor.trackUserInteraction('account_created');
        NotificationService.success("New portfolio created!");
      } else {
        NotificationService.error("Failed to create portfolio");
      }
    }
  };
  
  const switchAccount = (accountId) => {
    const account = userAccounts.find(acc => acc.id === parseInt(accountId));
    if (account) {
      setActiveAccount(account);
      PerformanceMonitor.trackUserInteraction('account_switched');
    }
  };

  // V2: New navigation functions
  const handleNavigate = (route) => {
    setCurrentRoute(route);
    setIsMobileNavOpen(false);
    PerformanceMonitor.trackPageView(route);
  };

  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };

  // V2: Create portfolio data for new Dashboard
  const createPortfolioData = () => {
    if (!virtualAccount) return null;
    
    const balances = virtualAccount.getBalances();
    const totalValue = portfolioValue;
    
    return {
      totalValue: totalValue,
      dayChange: 2.45,
      dayChangeAmount: totalValue * 0.0245,
      allocations: Object.entries(balances).map(([token, balance]) => ({
        name: token,
        value: ((balance * (prices[token] || 0)) / totalValue * 100) || 0,
        amount: balance * (prices[token] || 0),
        color: getTokenColor(token)
      })).filter(item => item.value > 0),
      performance: portfolioHistory,
      recentTransactions: txHistory.slice(0, 5).map(tx => ({
        type: tx.type,
        asset: tx.toToken,
        amount: tx.amountTo,
        value: tx.amountTo * (prices[tx.toToken] || 0),
        time: new Date(tx.timestamp).toLocaleString()
      }))
    };
  };

  const getTokenColor = (token) => {
    const colors = {
      'BTC': '#f7931a',
      'ETH': '#627eea',
      'ADA': '#0033ad',
      'DOT': '#e6007a',
      'USDC': '#2775ca'
    };
    return colors[token] || '#8b5cf6';
  };

  // V3: Enhanced loading screen
  if (isAppLoading) {
    return (
      <div className="app-loading">
        <motion.div 
          className="loading-container"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="loading-logo">
            <div className="signal-waves">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <h1 className="loading-title">SignalStack</h1>
          <p className="loading-subtitle">Initializing your trading dashboard...</p>
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
          
          <div className="loading-status">
            {!isOnline && <span className="status-offline">📴 Offline Mode</span>}
            {isInstallable && <span className="status-installable">📱 App Ready to Install</span>}
            {updateAvailable && <span className="status-update">🔄 Update Available</span>}
          </div>
        </motion.div>
      </div>
    );
  }

  // V1: Login screen (Replace with Landing Page)
  if (!isAuthenticated) {
    return (
      <div className="app">
        <LandingPage onLoginSuccess={handleLoginSuccess}/>
        
        <div id="notification-root"></div>
        
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        
        <OfflineIndicator isOnline={isOnline} />
        
        <PWAInstallPrompt 
          isVisible={showInstallPrompt && isInstallable && !isInstalled}
          onInstall={handlePWAInstall}
          onDismiss={() => setShowInstallPrompt(false)}
        />

        <PWAUpdatePrompt 
          isVisible={showUpdatePrompt}
          onUpdate={handlePWAUpdate}
          onDismiss={() => setShowUpdatePrompt(false)}
        />

        <div className="app-status">
          {!isOnline && (
            <div className="status-item offline">
              📡 Offline Mode
            </div>
          )}
        </div>
      </div>
    );
  }

  // V2: Main authenticated app
  return (
    <div className={`app ${theme}`}>
      {/* V2: New Professional Header (Voice props removed) */}
      <Header 
        user={user}
        activeAccount={activeAccount}
        userAccounts={userAccounts}
        onSwitchAccount={switchAccount}
        onCreateAccount={createNewAccount}
        onLogout={handleLogout}
        onToggleMobileNav={toggleMobileNav}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* V2: Mobile Navigation */}
      <MobileNav 
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
      />

      {/* V2: Main Content with Route Management */}
      <main className="app-content">
        <AnimatePresence mode="wait">
          {currentRoute === '/dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Dashboard 
                activeAccount={activeAccount}
                portfolioData={createPortfolioData()}
                signalsData={signals}
                marketData={newsData}
                securityAlerts={securityAlerts}
                performanceMetrics={performanceMetrics}
              />
            </motion.div>
          )}

          {currentRoute === '/portfolio' && (
            <motion.div
              key="portfolio"
              className="legacy-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="dashboard-grid legacy-grid">
                <section className="dashboard-card portfolio-section">
                  <h2>Virtual Portfolio</h2>
                  <div className="portfolio-list">
                    {virtualAccount && Object.entries(virtualAccount.getBalances()).map(([token, balance]) => (
                      <div key={token} className="portfolio-item">
                        <span className="token-name">{token}</span>
                        <span className="token-balance">{balance.toFixed(token === 'USDC' ? 2 : 6)}</span>
                        <span className="token-value">
                          ${(balance * (prices[token] || 0)).toFixed(2)}
                        </span>
                        <span className="token-price">
                          ${(prices[token] || 0).toFixed(token === 'USDC' ? 2 : 2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="dashboard-card target-section">
                  <h2>Recommended Portfolio</h2>
                  <div className="targets-list">
                    {Object.entries(targetWeights).map(([token, weight]) => (
                      <div key={token} className="target-item">
                        <span className="token-name">{token}</span>
                        <span className="token-weight">{weight}%</span>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={executeVirtualRebalance} 
                    className="rebalance-button"
                    disabled={isRebalancing}
                  >
                    {isRebalancing ? (
                      <>Rebalancing... <LoadingSpinner size={20} /></>
                    ) : (
                      'Virtual Rebalance'
                    )}
                  </button>
                  
                  <button 
                    onClick={resetVirtualAccount}
                    style={{ marginTop: '10px', backgroundColor: '#e74c3c' }}
                  >
                    Reset Demo Account
                  </button>
                </section>
              </div>
            </motion.div>
          )}

          {currentRoute === '/signals' && (
            <motion.div
              key="signals"
              className="legacy-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="dashboard-grid legacy-grid">
                <section className="dashboard-card signals-section">
                  <h2>
                    Signal Analysis
                    <button 
                      onClick={fetchSignalData} 
                      style={{ float: 'right', padding: '5px 10px', fontSize: '0.9rem' }}
                      disabled={isLoadingSignals}
                    >
                      {isLoadingSignals ? 'Updating...' : 'Refresh Signals'}
                    </button>
                  </h2>
                  
                  {isLoadingSignals ? (
                    <LoadingSpinner />
                  ) : (
                    <div className="signals-list">
                      {Object.entries(signals).map(([token, data]) => (
                        <div key={token} className="signal-item">
                          <h3>{token} - ${(prices[token] || 0).toFixed(2)}</h3>
                          <div className="signal-details">
                            <div className="signal-score">
                              <span>Total Score: </span>
                              <span className={`score-value ${data.total_score > 0 ? 'positive' : data.total_score < 0 ? 'negative' : ''}`}>
                                {data.total_score}
                              </span>
                            </div>
                            <div className="signal-indicators">
                              <div>Mean Reversion: {data.mean_reversion}</div>
                              <div>Momentum: {data.momentum}</div>
                              <div>Volatility: {data.volatility}</div>
                              <div>Breakout: {data.breakout}</div>
                            </div>
                            <div className="ml-confidence">
                              <span>ML Confidence: </span>
                              <span className={`confidence-value ${data.ml_confidence > 0.6 ? 'positive' : data.ml_confidence < 0.4 ? 'negative' : ''}`}>
                                {(data.ml_confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="dashboard-card strategy-section">
                  <StrategyComparison 
                    signals={signals}
                    prices={prices}
                    onApplyStrategy={applyStrategy}
                  />
                </section>
              </div>
            </motion.div>
          )}

          {currentRoute === '/analytics' && (
            <motion.div
              key="analytics"
              className="legacy-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="dashboard-grid legacy-grid">
                <section className="dashboard-card chart-section">
                  <h2>Portfolio Performance</h2>
                  <PortfolioValueChart portfolioHistory={portfolioHistory} />
                  
                  <h3 className="chart-title-secondary">Weight Distribution</h3>
                  <TokenWeightsChart 
                    tokens={Object.keys(targetWeights)}
                    currentWeights={Object.keys(targetWeights).map(token => {
                      const balance = virtualAccount?.getBalances()[token] || 0;
                      const value = balance * (prices[token] || 0);
                      return ((value / portfolioValue) * 100) || 0;
                    })}
                    targetWeights={Object.values(targetWeights)}
                  />
                </section>

                <section className="dashboard-card history-section">
                  <h2>Transaction History</h2>
                  {txHistory.length === 0 ? (
                    <p className="empty-history">No transactions yet</p>
                  ) : (
                    <SortableTable 
                      columns={[
                        { key: 'type', label: 'Type' },
                        { key: 'fromToken', label: 'From' },
                        { key: 'toToken', label: 'To' },
                        { 
                          key: 'amountFrom', 
                          label: 'Amount From',
                          render: (item) => item.amountFrom.toFixed(6)
                        },
                        { 
                          key: 'amountTo', 
                          label: 'Amount To',
                          render: (item) => item.amountTo.toFixed(6)
                        },
                        {
                          key: 'timestamp',
                          label: 'Time',
                          render: (item) => new Date(item.timestamp).toLocaleTimeString()
                        }
                      ]}
                      data={txHistory}
                      defaultSortColumn="timestamp"
                    />
                  )}
                </section>
              </div>
            </motion.div>
          )}

          {currentRoute === '/news' && (
            <motion.div
              key="news"
              className="news-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="dashboard-grid">
                <section className="dashboard-card news-section">
                  <h2>Market News</h2>
                  <div className="news-list">
                    {newsData.length === 0 ? (
                      <p>Loading latest market news...</p>
                    ) : (
                      newsData.map((news, index) => (
                        <div key={index} className="news-item">
                          <h3>{news.title}</h3>
                          <p>{news.summary}</p>
                          <div className="news-meta">
                            <span className="news-source">{news.source}</span>
                            <span className="news-time">{new Date(news.timestamp).toLocaleString()}</span>
                            {news.priority === 'high' && (
                              <span className="news-priority">🔥 Breaking</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </motion.div>
          )}

          {!['dashboard', 'portfolio', 'signals', 'analytics', 'news'].includes(currentRoute.split('/')[1]) && (
            <motion.div
              key="other"
              className="route-placeholder"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="placeholder-content">
                <h2>Coming Soon</h2>
                <p>This section is under development</p>
                <p className="current-route">Current route: {currentRoute}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* PWA Components */}
      <OfflineIndicator isOnline={isOnline} />
      
      <PWAInstallPrompt 
        isVisible={showInstallPrompt && isInstallable && !isInstalled}
        onInstall={handlePWAInstall}
        onDismiss={() => setShowInstallPrompt(false)}
      />

      <PWAUpdatePrompt 
        isVisible={showUpdatePrompt}
        onUpdate={handlePWAUpdate}
        onDismiss={() => setShowUpdatePrompt(false)}
      />

      {/* Status indicators (Voice indicator removed) */}
      <div className="app-status">
        {!isOnline && (
          <div className="status-item offline">
            📡 Offline Mode
          </div>
        )}
        {isRebalancing && (
          <div className="status-item rebalancing">
            ⚖️ Rebalancing...
          </div>
        )}
      </div>

      {/* Notification containers */}
      <div id="notification-root"></div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default App;