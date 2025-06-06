import React, { useState, useEffect } from 'react';
import './App.css';
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

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userAccounts, setUserAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  
  // App state
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

  // Initialize app
  useEffect(() => {
    // Check authentication status
    const authStatus = AuthService.isAuthenticated();
    setIsAuthenticated(authStatus);
    
    if (authStatus) {
      // Load user accounts
      const accounts = AuthService.getAccounts();
      setUserAccounts(accounts);
      
      // If no accounts exist, create default one
      if (accounts.length === 0) {
        const result = AuthService.createAccount("Default Portfolio");
        if (result.success) {
          setUserAccounts([result.account]);
          setActiveAccount(result.account);
        }
      } else {
        // Set first account as active
        setActiveAccount(accounts[0]);
      }
    } else {
      // For demo mode, create virtual account
      const vAccount = new VirtualAccount();
      setVirtualAccount(vAccount);
      setTxHistory(vAccount.getTransactionHistory());
      setPortfolioHistory(vAccount.portfolioHistory || []);
    }
    
    // Start price updates
    PriceService.startRealTimeUpdates();
    
    // Subscribe to price updates
    const unsubscribe = PriceService.subscribe((latestPrices) => {
      setPrices(latestPrices);
      if (virtualAccount) {
        const value = virtualAccount.getPortfolioValue(latestPrices);
        setPortfolioValue(value);
      }
    });
    
    // Fetch signals
    fetchSignalData();
    
    // Cleanup
    return () => {
      PriceService.stopRealTimeUpdates();
      unsubscribe();
    };
  }, []);
  
  // Connect wallet (unchanged)
  const connectWallet = async () => {
    // Your existing wallet connection code
  };
  
  // Fetch signal data from backend
  const fetchSignalData = async () => {
    setIsLoadingSignals(true);
    try {
      // Fetch signals from backend API
      const signalData = await SignalService.fetchLatestSignals();
      setSignals(signalData);
      
      // Fetch target weights
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
  
  // Execute virtual rebalance
  const executeVirtualRebalance = async () => {
    if (!virtualAccount) return;
    
    try {
      setIsRebalancing(true);
      
      // Execute rebalance on virtual account
      const result = virtualAccount.executeRebalance(targetWeights, prices);
      
      // Update transaction history
      setTxHistory(virtualAccount.getTransactionHistory());
      setPortfolioHistory(virtualAccount.portfolioHistory || []);
      
      // Show toast notification instead of alert
      toast.success(`Rebalancing complete! Portfolio value: $${result.newValue.toFixed(2)}`);
      
    } catch (error) {
      console.error("Error executing rebalance:", error);
      toast.error("Rebalancing failed: " + error.message);
    } finally {
      setIsRebalancing(false);
    }
  };
  
  // Reset virtual account
  const resetVirtualAccount = () => {
    if (virtualAccount) {
      if (window.confirm("Are you sure you want to reset your virtual account? All balances and history will be erased.")) {
        virtualAccount.reset();
        setTxHistory(virtualAccount.getTransactionHistory());
        setPortfolioHistory([]);
        setPortfolioValue(virtualAccount.getPortfolioValue(prices));
        toast.info("Virtual account has been reset");
      }
    }
  };
  
  // Apply selected strategy
  const applyStrategy = (strategyKey, weights) => {
    setTargetWeights(weights);
    setActiveStrategy(strategyKey);
    toast.success(`Applied ${strategies[strategyKey].getName()} strategy`);
  };
  
  // Handle login success
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    const accounts = AuthService.getAccounts();
    setUserAccounts(accounts);
    
    if (accounts.length > 0) {
      setActiveAccount(accounts[0]);
    } else {
      const result = AuthService.createAccount("Default Portfolio");
      if (result.success) {
        setUserAccounts([result.account]);
        setActiveAccount(result.account);
      }
    }
  };
  
  // Logout
  const handleLogout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUserAccounts([]);
    setActiveAccount(null);
  };
  
  // Create new account
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
  
  // Switch account
  const switchAccount = (accountId) => {
    const account = userAccounts.find(acc => acc.id === accountId);
    if (account) {
      setActiveAccount(account);
    }
  };
  
  return (
    <div className="App">
      {!isAuthenticated ? (
        <div>
          <header className="App-header">
            <h1>SignalStack Portfolio Rebalancer</h1>
          </header>
          
          <main className="App-main">
            <LoginForm onSuccess={handleLoginSuccess} />
          </main>
        </div>
      ) : (
        <div>
          <header className="App-header">
            <div className="header-left">
              <h1>SignalStack Portfolio Rebalancer</h1>
            </div>
            <div className="header-right">
              <div className="account-selector">
                <select 
                  value={activeAccount?.id || ''} 
                  onChange={(e) => switchAccount(e.target.value)}
                >
                  {userAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
                <button className="btn-small" onClick={createNewAccount}>+</button>
              </div>
              <button onClick={handleLogout} className="btn-logout">Logout</button>
            </div>
          </header>
          
          <main className="App-main">
            <div className="dashboard-grid">
              {/* Virtual Portfolio Section */}
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
              
              {/* Signals Section */}
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
              
              {/* Target Weights Section */}
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
              
              {/* Transaction History as Sortable Table */}
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
              
              {/* Portfolio Charts Section */}
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
              
              {/* Strategy Comparison Section */}
              <section className="dashboard-card strategy-section">
                <StrategyComparison 
                  signals={signals}
                  prices={prices}
                  onApplyStrategy={applyStrategy}
                />
              </section>
            </div>
          </main>
        </div>
      )}
      
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