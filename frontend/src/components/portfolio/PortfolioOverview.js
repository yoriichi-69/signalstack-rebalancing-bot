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
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,cardano,ripple,dogecoin,shiba-inu,avalanche-2,chainlink,polkadot,tether&vs_currencies=usd');
      const remoteData = response.data;
      const prices = {};
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
      setCryptoPrices(prices);
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
    }
  };
  
  const mockData = {
    totalValue: 19332.97,
    pnlAmount: -81056.60,
    pnlPercent: -81.06,
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
  }, []);

  const preparedData = useMemo(() => {
    if (!account || Object.keys(cryptoPrices).length === 0) return mockData;

    let totalAssetsValue = 0;
    const assetMap = {};
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

    const totalInitialFunds = account.bots.reduce((sum, bot) => sum + (bot.allocated_fund || 0), 0);
    
    const allocations = [];
    Object.entries(assetMap).forEach(([asset, data]) => {
      const price = asset.toUpperCase() === 'USD' ? 1 : (cryptoPrices[asset.toUpperCase()] || 0);
      data.value = data.amount * price;
      totalAssetsValue += data.value;
    });

    // Calculate total value as the sum of account balance and all asset values
    const totalValue = (account.balance || 0) + totalAssetsValue;
    
    // Calculate PnL correctly - this is the difference between current total value and initial funds
    const pnlAmount = totalValue - (account.initial_balance || totalInitialFunds);
    const pnlPercent = (account.initial_balance || totalInitialFunds) > 0 ? 
      (pnlAmount / (account.initial_balance || totalInitialFunds)) * 100 : 0;
    
    if (totalAssetsValue > 0) {
      Object.entries(assetMap).forEach(([asset, data]) => {
        let color = '#8b5cf6';
        if (asset === 'BTC') color = '#f7931a';
        else if (asset === 'ETH') color = '#627eea';
        else if (asset === 'DOT') color = '#e6007a';
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
      totalValue,
      pnlAmount,
      pnlPercent,
      allocations: allocations.length > 0 ? allocations : mockData.allocations,
    };
  }, [account, cryptoPrices]);

  useEffect(() => {
    if (preparedData.pnlAmount !== pnlState.value && pnlState.value !== 0) {
        const direction = preparedData.pnlAmount > pnlState.value ? 'up' : 'down';
        setPnlState({ value: preparedData.pnlAmount, direction });

        const timer = setTimeout(() => {
            setPnlState(prevState => ({ ...prevState, direction: 'none' }));
        }, 1500);

        return () => clearTimeout(timer);
    } else if (pnlState.value === 0 && preparedData.pnlAmount !== 0) {
        setPnlState({ value: preparedData.pnlAmount, direction: 'none' });
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

  return (
    <>
      <div className="portfolio-overview enhanced">
        <div className="portfolio-header">
          <div className="portfolio-title-section">
            <h2 className="portfolio-title">Portfolio Overview</h2>
            <div className="portfolio-stats">
              <div className="total-value">
                <span className="value-label">Total Value</span>
                <span className="value-amount">${data.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="day-change">
                <span className={`change-amount ${data.pnlAmount >= 0 ? 'positive' : 'negative'} pnl-ticker--${pnlState.direction}`}>
                  {data.pnlAmount >= 0 ? '+' : ''}${data.pnlAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`change-percentage ${data.pnlAmount >= 0 ? 'positive' : 'negative'}`}>
                  ({data.pnlPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="view-selector">
            {['overview', 'allocations'].map(view => (
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
        </div>

        <AnimatePresence mode="wait">
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
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value.toFixed(2)}%`, 'Allocation']}
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
                        <div className="holding-percentage">{item.value.toFixed(2)}%</div>
                      </div>
                      <div className="holding-value">
                        ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <div className="holding-bar">
                          <div className="holding-bar-inner" style={{ width: `${item.value}%`, backgroundColor: item.color }}></div>
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