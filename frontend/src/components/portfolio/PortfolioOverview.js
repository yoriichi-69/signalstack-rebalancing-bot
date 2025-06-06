import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import './PortfolioOverview.css';

const PortfolioOverview = ({ portfolioData, timeframe }) => {
  const [activeView, setActiveView] = useState('overview');
  
  // Mock data - replace with real data
  const mockData = {
    totalValue: 125420.50,
    dayChange: 2.45,
    dayChangeAmount: 3020.15,
    allocations: [
      { name: 'BTC', value: 45, amount: 56439.23, color: '#f7931a' },
      { name: 'ETH', value: 25, amount: 31355.13, color: '#627eea' },
      { name: 'ADA', value: 15, amount: 18813.08, color: '#0033ad' },
      { name: 'DOT', value: 10, amount: 12542.05, color: '#e6007a' },
      { name: 'Others', value: 5, amount: 6271.01, color: '#8b5cf6' }
    ],
    recentTransactions: [
      { type: 'buy', asset: 'BTC', amount: 0.025, value: 1250.50, time: '2 min ago' },
      { type: 'sell', asset: 'ETH', amount: 1.5, value: 2400.75, time: '1 hour ago' },
      { type: 'rebalance', asset: 'Portfolio', amount: null, value: null, time: '3 hours ago' }
    ]
  };

  const data = portfolioData || mockData;

  return (
    <div className="portfolio-overview">
      <div className="portfolio-header">
        <div className="portfolio-title-section">
          <h2 className="portfolio-title">Portfolio Overview</h2>
          <div className="portfolio-stats">
            <div className="total-value">
              <span className="value-label">Total Value</span>
              <span className="value-amount">${data.totalValue.toLocaleString()}</span>
            </div>
            <div className="day-change">
              <span className={`change-amount ${data.dayChange >= 0 ? 'positive' : 'negative'}`}>
                {data.dayChange >= 0 ? '+' : ''}${data.dayChangeAmount.toLocaleString()}
              </span>
              <span className={`change-percentage ${data.dayChange >= 0 ? 'positive' : 'negative'}`}>
                ({data.dayChange >= 0 ? '+' : ''}{data.dayChange}%)
              </span>
            </div>
          </div>
        </div>

        <div className="view-selector">
          {['overview', 'allocations', 'transactions'].map(view => (
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

      <div className="portfolio-content">
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
                    formatter={(value) => [`${value}%`, 'Allocation']}
                    labelStyle={{ color: '#333' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="allocation-details">
              <h3>Holdings</h3>
              <div className="holdings-list">
                {data.allocations.map((asset, index) => (
                  <motion.div 
                    key={asset.name}
                    className="holding-item"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="holding-info">
                      <div className="asset-icon" style={{ backgroundColor: asset.color }}>
                        {asset.name}
                      </div>
                      <div className="asset-details">
                        <span className="asset-name">{asset.name}</span>
                        <span className="asset-percentage">{asset.value}%</span>
                      </div>
                    </div>
                    <div className="holding-value">
                      <span className="value">${asset.amount.toLocaleString()}</span>
                      <div className="allocation-bar">
                        <div 
                          className="allocation-fill"
                          style={{ 
                            width: `${asset.value}%`,
                            backgroundColor: asset.color 
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'allocations' && (
          <div className="allocations-view">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.allocations}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                />
                <Bar dataKey="amount" fill="#00ff88" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeView === 'transactions' && (
          <div className="transactions-view">
            <h3>Recent Activity</h3>
            <div className="transactions-list">
              {data.recentTransactions.map((tx, index) => (
                <motion.div 
                  key={index}
                  className="transaction-item"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={`transaction-type ${tx.type}`}>
                    {tx.type === 'buy' ? '↗' : tx.type === 'sell' ? '↙' : '⟲'}
                  </div>
                  <div className="transaction-details">
                    <span className="transaction-action">
                      {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} {tx.asset}
                    </span>
                    {tx.amount && (
                      <span className="transaction-amount">
                        {tx.amount} {tx.asset} • ${tx.value?.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <span className="transaction-time">{tx.time}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioOverview;