import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// V2 Imports (New professional components - create these)
import Header from './components/layout/Header';
import MobileNav from './components/layout/MobileNav';
import Dashboard from './components/dashboard/Dashboard';

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

  // V1 Initialize app (Keep existing logic, enhance with V2)
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // V2: Show loading screen
        setIsAppLoading(true);
        
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
        
        // V2: Hide loading after everything is ready
        setTimeout(() => setIsAppLoading(false), 1000);
        
        return () => {
          PriceService.stopRealTimeUpdates();
          unsubscribe();
        };
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsAppLoading(false);
      }
    };

    initializeApp();
  }, []);
  
  // V1: Keep all your existing functions
  const fetchSignalData = async () => {
    setIsLoadingSignals(true);
    try {
      const signalData = await SignalService.fetchLatestSignals();
      setSignals(signalData);
      
      const weights = await SignalService.fetchTargetWeights();
      setTargetWeights(weights);
      
      toast.success("Signals updated successfully");
    } catch (error) {
      console.error("Error fetching signal data:", error);
      toast.error("Failed to fetch signals");
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
      toast.success(`Rebalancing complete! Portfolio value: $${result.newValue.toFixed(2)}`);
    } catch (error) {
      console.error("Error executing rebalance:", error);
      toast.error("Rebalancing failed: " + error.message);
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
        toast.info("Virtual account has been reset");
      }
    }
  };
  
  const applyStrategy = (strategyKey, weights) => {
    setTargetWeights(weights);
    setActiveStrategy(strategyKey);
    toast.success(`Applied ${strategies[strategyKey].getName()} strategy`);
  };
  
  // V1: Keep existing auth functions, enhance for V2
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    const accounts = AuthService.getAccounts();
    setUserAccounts(accounts);
    
    // V2: Set user for header
    setUser({
      id: 1,
      name: accounts[0]?.name || 'Trading User',
      email: 'user@signalstack.com'
    });
    
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
  };
  
  const createNewAccount = () => {
    const name = prompt("Enter portfolio name:");
    if (name) {
      const result = AuthService.createAccount(name);
      if (result.success) {
        setUserAccounts([...userAccounts, result.account]);
        setActiveAccount(result.account);
        toast.success("New portfolio created!");
      } else {
        toast.error("Failed to create portfolio");
      }
    }
  };
  
  const switchAccount = (accountId) => {
    const account = userAccounts.find(acc => acc.id === parseInt(accountId));
    if (account) {
      setActiveAccount(account);
    }
  };

  // V2: New navigation functions
  const handleNavigate = (route) => {
    setCurrentRoute(route);
    setIsMobileNavOpen(false);
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
      dayChange: 2.45, // You can calculate this from portfolioHistory
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

  // V2: Loading screen (New professional loading)
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
        </motion.div>
      </div>
    );
  }

  // V1: Login screen (Keep existing, but with better styling)
  if (!isAuthenticated) {
    return (
      <div className="app">
        <div className="login-wrapper">
          <motion.div 
            className="login-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="login-header">
              <div className="login-logo">
                <div className="signal-waves">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <h1>SignalStack</h1>
              </div>
              <p>Professional Portfolio Rebalancer</p>
            </div>
            <LoginForm onSuccess={handleLoginSuccess} />
          </motion.div>
        </div>
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

  // V2: Main authenticated app with new professional UI
  return (
    <div className="app">
      {/* V2: New Professional Header */}
      <Header 
        user={user}
        activeAccount={activeAccount}
        userAccounts={userAccounts}
        onSwitchAccount={switchAccount}
        onCreateAccount={createNewAccount}
        onLogout={handleLogout}
        onToggleMobileNav={toggleMobileNav}
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
                marketData={null}
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
              {/* V1: Your existing portfolio view */}
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
              {/* V1: Your existing signals view */}
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
              {/* V1: Your existing charts and history */}
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

          {/* Placeholder for other routes */}
          {!['dashboard', 'portfolio', 'signals', 'analytics'].includes(currentRoute.split('/')[1]) && (
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

      {/* V1: Keep existing toast notifications */}
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