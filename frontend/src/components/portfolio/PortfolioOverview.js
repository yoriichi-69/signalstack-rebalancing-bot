import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, LineChart, Line } from 'recharts';
import './PortfolioOverview.css';
import AdvancedRebalancePanel from '../AdvancedRebalancePanel';
import VirtualTradingTerminal from '../virtual_trading/VirtualTradingTerminal';
import AccountService from '../../services/AccountService';
import axios from 'axios';

const PortfolioOverview = ({ portfolioData, timeframe }) => {
  const [activeView, setActiveView] = useState('overview');
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [pnlState, setPnlState] = useState({ value: 0, direction: 'none' });
    const fetchCryptoPrices = async () => {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,cardano,ripple,dogecoin,shiba-inu,avalanche-2,chainlink,polkadot,tether,usd-coin&vs_currencies=usd');
      const remoteData = response.data;
      const prices = {};
        // Map CoinGecko IDs to our symbols
      if (remoteData.bitcoin) prices.BTC = remoteData.bitcoin.usd;
      if (remoteData.ethereum) prices.ETH = remoteData.ethereum.usd;
      if (remoteData.solana) prices.SOL = remoteData.solana.usd;
      if (remoteData.binancecoin) prices.BNB = remoteData.binancecoin.usd;
      if (remoteData.cardano) prices.ADA = remoteData.cardano.usd;
      if (remoteData.ripple) prices.XRP = remoteData.ripple.usd;
      if (remoteData.dogecoin) prices.DOGE = remoteData.dogecoin.usd;
      if (remoteData['shiba-inu']) prices.SHIB = remoteData['shiba-inu'].usd;
      if (remoteData['avalanche-2']) prices.AVAX = remoteData['avalanche-2'].usd;
      if (remoteData.chainlink) prices.LINK = remoteData.chainlink.usd;
      if (remoteData.polkadot) prices.DOT = remoteData.polkadot.usd;
      if (remoteData.tether) prices.USDT = remoteData.tether.usd;
      if (remoteData['usd-coin']) prices.USDC = remoteData['usd-coin'].usd;
      
      setCryptoPrices(prices);
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
        // Set fallback prices to prevent calculation errors
      const fallbackPrices = {
        BTC: 45000,
        ETH: 3000,
        ADA: 0.5,
        DOT: 8,
        USDC: 1,
        USDT: 1
      };
      setCryptoPrices(fallbackPrices);
    }
  };
    const mockData = {
    totalValue: 19332.97,
    pnlAmount: 21.40,
    pnlPercent: 0.02,
    allocations: [
      { name: 'BTC', value: 94, amount: 18000, color: '#f7931a' },
      { name: 'ETH', value: 6, amount: 1200, color: '#627eea' },
      { name: 'DOT', value: 0, amount: 5, color: '#e6007a' }
    ],
  };

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        setLoading(true);
        const accountData = await AccountService.getAccount();
        setAccount(accountData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching account data:", err);
        setLoading(false);
      }
    };

    fetchAccountData();
    fetchCryptoPrices();
    
    const dataInterval = setInterval(fetchAccountData, 60000);
    const priceInterval = setInterval(fetchCryptoPrices, 30000);
    
    return () => {
      clearInterval(dataInterval);
      clearInterval(priceInterval);
    };
  }, []);  const preparedData = useMemo(() => {    // Use real account data if available, regardless of crypto prices
    if (!account) {
      return mockData;
    }

    let totalAssetsValue = 0;
    const assetMap = {};
    
    // Safely process account bots
    if (account.bots && Array.isArray(account.bots)) {
      account.bots.forEach(bot => {
          if (bot.assets) {
              Object.entries(bot.assets).forEach(([asset, amount]) => {
                  if (!assetMap[asset.toUpperCase()]) {
                      assetMap[asset.toUpperCase()] = { amount: 0, value: 0, color: '#8b5cf6' };
                  }
                  assetMap[asset.toUpperCase()].amount += amount;
              });
          }
      });
    }

    const allocations = [];
    
    // Calculate asset values using available prices, fallback to 0 if price not available
    Object.entries(assetMap).forEach(([asset, data]) => {
      const price = asset.toUpperCase() === 'USD' ? 1 : (cryptoPrices[asset.toUpperCase()] || 0);
      data.value = data.amount * price;
      totalAssetsValue += data.value;    });    
    
    // FIXED CALCULATION: Use bot portfolio values directly instead of asset values
    let totalBotsValue = 0;
    if (account.bots && Array.isArray(account.bots)) {
      account.bots.forEach(bot => {
        totalBotsValue += bot.portfolio_value || 0;
      });
    }
    
    // Calculate total value as remaining cash balance + current bot values
    const totalValue = (account.balance || 0) + totalBotsValue;
    
    // Use performance history for accurate PnL if available
    let pnlAmount = 0;
    let pnlPercent = 0;
    
    if (account.performance_history && account.performance_history.length > 0) {
      // Use the latest performance data from backend
      const latestPerformance = account.performance_history[account.performance_history.length - 1];
      pnlAmount = latestPerformance.pnl || 0;
      pnlPercent = latestPerformance.pnl_percent || 0;
    } else {
      // Fallback calculation
      const originalBalance = 100000; // Default initial balance
      pnlAmount = totalValue - originalBalance;
      pnlPercent = originalBalance > 0 ? (pnlAmount / originalBalance) * 100 : 0;
    }
      if (totalAssetsValue > 0) {
      Object.entries(assetMap).forEach(([asset, data]) => {
        let color = '#8b5cf6';
        if (asset === 'BTC') color = '#f7931a';
        else if (asset === 'ETH') color = '#627eea';
        else if (asset === 'DOT') color = '#e6007a';
        else if (asset === 'ADA') color = '#0033ad';
        else if (asset === 'USDC') color = '#2775ca';
        allocations.push({
          name: asset,
          value: (data.value / totalAssetsValue) * 100,
          amount: data.value,
          color
        });
      });
    }
    
    allocations.sort((a, b) => b.value - a.value);
    
    return {
      totalValue: totalValue || 0,
      pnlAmount: pnlAmount || 0,
      pnlPercent: pnlPercent || 0,
      allocations: allocations.length > 0 ? allocations : mockData.allocations,
    };
  }, [account, cryptoPrices]);
  useEffect(() => {
    const currentPnlAmount = preparedData.pnlAmount || 0;
    if (currentPnlAmount !== pnlState.value && pnlState.value !== 0) {
        const direction = currentPnlAmount > pnlState.value ? 'up' : 'down';
        setPnlState({ value: currentPnlAmount, direction });

        const timer = setTimeout(() => {
            setPnlState(prevState => ({ ...prevState, direction: 'none' }));
        }, 1500);

        return () => clearTimeout(timer);
    } else if (pnlState.value === 0 && currentPnlAmount !== 0) {
        setPnlState({ value: currentPnlAmount, direction: 'none' });
    }
  }, [preparedData.pnlAmount, pnlState.value]);
    const data = preparedData;

  // Generate performance chart data
  const generatePerformanceData = () => {
    if (!account || !account.performance_history) return [];
    
    return account.performance_history.map(record => ({
      time: new Date(record.timestamp * 1000).toLocaleDateString(),
      value: record.total_value,
      pnl: record.pnl || (record.total_value - (record.total_initial || account.initial_balance || 100000)),
      pnlPercent: record.pnl_percent || 
        ((record.total_value / (record.total_initial || account.initial_balance || 100000) - 1) * 100)
    }));
  };

  const performanceData = generatePerformanceData();

  // Add loading state
  if (loading || !account) {
    return (
      <div className="portfolio-overview enhanced">
        <div className="portfolio-header">
          <div className="portfolio-title-section">
            <h2 className="portfolio-title">Portfolio Overview</h2>
            <div className="portfolio-stats">
              <div className="total-value">
                <span className="value-label">Loading...</span>
                <span className="value-amount">Please wait</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div>Loading portfolio data...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="portfolio-overview enhanced">
        <div className="portfolio-header">
          <div className="portfolio-title-section">
            <h2 className="portfolio-title">Portfolio Overview</h2>
            <div className="portfolio-stats">              <div className="total-value">
                <span className="value-label">Total Value</span>
                <span className="value-amount">${(data.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="day-change">
                <span className={`change-amount ${(data.pnlAmount || 0) >= 0 ? 'positive' : 'negative'} pnl-ticker--${pnlState.direction}`}>
                  {(data.pnlAmount || 0) >= 0 ? '+' : ''}${(data.pnlAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`change-percentage ${(data.pnlAmount || 0) >= 0 ? 'positive' : 'negative'}`}>
                  ({(data.pnlPercent || 0).toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="view-selector">
            {['overview', 'allocations', 'analytics'].map(view => (
              <motion.button
                key={view}
                className={`view-btn ${activeView === view ? 'active' : ''}`}
                onClick={() => setActiveView(view)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>        {/* Enhanced Metrics Dashboard */}
        <div className="portfolio-metrics-grid">
          <motion.div className="metric-card primary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <h3>Available Balance</h3>
              <div className="metric-value">${((account?.balance) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="metric-subtitle">Ready to invest</div>
            </div>
          </motion.div>

          <motion.div className="metric-card secondary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="metric-icon">🤖</div>
            <div className="metric-content">
              <h3>Active Bots</h3>
              <div className="metric-value">{account?.bots ? account.bots.filter(bot => bot.status === 'active').length : 0}</div>
              <div className="metric-subtitle">Trading strategies</div>
            </div>
          </motion.div>

          <motion.div className="metric-card tertiary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="metric-icon">📊</div>            <div className="metric-content">
              <h3>Invested Capital</h3>
              <div className="metric-value">${(data.totalInitialFunds || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="metric-subtitle">In active strategies</div>
            </div>
          </motion.div>

          <motion.div className="metric-card quaternary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="metric-icon">⚡</div>
            <div className="metric-content">
              <h3>Performance</h3>              <div className={`metric-value ${(data.pnlAmount || 0) >= 0 ? 'positive' : 'negative'}`}>
                {(data.pnlPercent || 0) >= 0 ? '+' : ''}{(data.pnlPercent || 0).toFixed(2)}%
              </div>
              <div className="metric-subtitle">Since inception</div>
            </div>
          </motion.div>
        </div>        <AnimatePresence mode="wait">
          <motion.div 
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="portfolio-content"
          >
            {activeView === 'overview' && (
              <div className="overview-grid">
                {/* Portfolio Performance Chart */}
                <div className="chart-container performance-chart">
                  <h3>Portfolio Performance</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${(value || 0).toLocaleString()}`, 'Portfolio Value']} />
                      <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#performanceGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Asset Allocation Pie Chart */}
                <div className="chart-container allocation-chart">
                  <h3>Asset Allocation</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.allocations}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${(value || 0).toFixed(1)}%`}
                      >
                        {data.allocations.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${(value || 0).toFixed(1)}%`, 'Allocation']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Holdings Breakdown */}
                <div className="holdings-list">
                  <h3>Holdings Breakdown</h3>
                  {data.allocations.map((item, index) => (
                    <motion.div 
                      key={item.name}
                      className="holding-item enhanced"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="holding-header">
                        <div className="asset-info">
                          <div className="asset-icon" style={{ backgroundColor: item.color }}>
                            {item.name.substring(0, 3)}
                          </div>
                          <div className="asset-details">
                            <span className="asset-name">{item.name}</span>
                            <span className="asset-percentage">{(item.value || 0).toFixed(1)}%</span>
                          </div>
                        </div>                        <div className="asset-value">
                          ${(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="holding-bar">
                        <motion.div 
                          className="holding-bar-inner" 
                          style={{ backgroundColor: item.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value || 0}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            {activeView === 'allocations' && (
              <div className="allocations-grid">
                <div className="allocation-details">
                  <h3>Detailed Asset Allocation</h3>
                  <div className="allocation-table">
                    {data.allocations.map((asset, index) => (
                      <motion.div 
                        key={asset.name}
                        className="allocation-row"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="allocation-asset">
                          <div className="asset-icon" style={{ backgroundColor: asset.color }}>
                            {asset.name.substring(0, 3)}
                          </div>
                          <span className="asset-name">{asset.name}</span>
                        </div>                        <div className="allocation-metrics">
                          <div className="allocation-percentage">{(asset.value || 0).toFixed(1)}%</div>
                          <div className="allocation-value">${(asset.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                        <div className="allocation-bar">
                          <motion.div 
                            className="allocation-fill"
                            style={{ backgroundColor: asset.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${asset.value || 0}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <div className="rebalancing-suggestions">
                  <h3>Rebalancing Insights</h3>
                  <div className="suggestion-card">
                    <div className="suggestion-icon">🎯</div>
                    <div className="suggestion-content">
                      <h4>Portfolio Balance</h4>
                      <p>Your portfolio appears well-diversified across {data.allocations.length} assets.</p>
                    </div>
                  </div>
                  <div className="suggestion-card">
                    <div className="suggestion-icon">⚖️</div>
                    <div className="suggestion-content">
                      <h4>Risk Assessment</h4>
                      <p>Current allocation shows moderate risk with balanced exposure.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeView === 'analytics' && (
              <div className="analytics-grid">
                <div className="analytics-chart">
                  <h3>Performance Analytics</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <XAxis dataKey="time" />
                      <YAxis />                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'pnl' ? `$${(value || 0).toLocaleString()}` : `${(value || 0).toFixed(2)}%`,
                          name === 'pnl' ? 'P&L' : 'P&L %'
                        ]}
                      />
                      <Line type="monotone" dataKey="pnl" stroke="#10b981" strokeWidth={2} name="pnl" />
                      <Line type="monotone" dataKey="pnlPercent" stroke="#3b82f6" strokeWidth={2} name="pnlPercent" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="performance-metrics">
                  <h3>Key Metrics</h3>
                  <div className="metrics-grid">                    <div className="metric-item">
                      <span className="metric-label">Total Return</span>
                      <span className={`metric-value ${(data.pnlAmount || 0) >= 0 ? 'positive' : 'negative'}`}>
                        {(data.pnlAmount || 0) >= 0 ? '+' : ''}{(data.pnlPercent || 0).toFixed(2)}%
                      </span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Net Profit/Loss</span>
                      <span className={`metric-value ${(data.pnlAmount || 0) >= 0 ? 'positive' : 'negative'}`}>
                        {(data.pnlAmount || 0) >= 0 ? '+' : ''}${(data.pnlAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>                    <div className="metric-item">
                      <span className="metric-label">Invested</span>
                      <span className="metric-value">${(data.totalInitialFunds || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div><div className="metric-item">
                      <span className="metric-label">Available</span>
                      <span className="metric-value">${((account?.balance) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <div className="portfolio-health">
                  <h3>Portfolio Health Score</h3>
                  <div className="health-score">                    <div className="score-circle">
                      <div className="score-value">
                        {(data.pnlPercent || 0) >= 0 ? 
                          ((data.pnlPercent || 0) > 10 ? 'A+' : (data.pnlPercent || 0) > 5 ? 'A' : 'B+') :
                          ((data.pnlPercent || 0) > -5 ? 'B' : (data.pnlPercent || 0) > -10 ? 'C' : 'D')
                        }
                      </div>
                    </div>
                    <div className="health-details">
                      <p>
                        {(data.pnlPercent || 0) >= 0 ? 
                          'Your portfolio is performing well with positive returns.' :
                          'Your portfolio is experiencing some volatility but this is normal in crypto markets.'
                        }
                      </p>
                    </div>
                  </div>                </div>
              </div>
            )}
            {activeView === 'analytics' && (
              <div className="analytics-grid">
                <div className="allocation-chart">
                  <h3>Asset Allocation</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.allocations}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {data.allocations.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>                      <Tooltip 
                        formatter={(value) => [`${(value || 0).toFixed(2)}%`, 'Allocation']}
                        labelStyle={{ color: '#333' }}
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(148, 163, 184, 0.3)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="holdings-list">
                  <h3>Holdings</h3>
                  {data.allocations.map((item, index) => (
                    <motion.div 
                      key={index} 
                      className="holding-item"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="holding-info">
                        <div className="holding-icon" style={{ backgroundColor: item.color }}>{item.name}</div>
                        <div className="holding-name">{item.name}</div>
                        <div className="holding-percentage">{(item.value || 0).toFixed(2)}%</div>
                      </div>                      <div className="holding-value">
                        ${(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <div className="holding-bar">
                          <div className="holding-bar-inner" style={{ width: `${item.value || 0}%`, backgroundColor: item.color }}></div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            {activeView === 'allocations' && (
              <div>
                Detailed allocations view coming soon.
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <AdvancedRebalancePanel portfolioData={portfolioData} />
      <VirtualTradingTerminal account={account} />
    </>
  );
};

export default PortfolioOverview;