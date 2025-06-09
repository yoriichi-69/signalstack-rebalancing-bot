import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import './AdvancedPortfolio.css';

const AdvancedPortfolio = ({ portfolioData, onRebalance }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [portfolioMetrics, setPortfolioMetrics] = useState({});
  const [performanceData, setPerformanceData] = useState([]);
  const [rebalanceRecommendations, setRebalanceRecommendations] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    generatePortfolioMetrics();
    generatePerformanceData();
    generateRebalanceRecommendations();
  }, [portfolioData]);

  const generatePortfolioMetrics = () => {
    const mockHoldings = [
      { symbol: 'BTC', name: 'Bitcoin', amount: 0.5, value: 52392.74, allocation: 35.2, change24h: 2.45, apy: 12.5 },
      { symbol: 'ETH', name: 'Ethereum', amount: 8.2, value: 25642.90, allocation: 24.8, change24h: -1.23, apy: 18.7 },
      { symbol: 'SOL', name: 'Solana', amount: 95.5, value: 14544.75, allocation: 15.6, change24h: 4.87, apy: 25.3 },
      { symbol: 'ADA', name: 'Cardano', amount: 12500, value: 8750.00, allocation: 12.1, change24h: 1.92, apy: 8.9 },
      { symbol: 'DOT', name: 'Polkadot', amount: 850, value: 5525.00, allocation: 7.8, change24h: -0.65, apy: 14.2 },
      { symbol: 'AVAX', name: 'Avalanche', amount: 125, value: 4375.00, allocation: 4.5, change24h: 3.21, apy: 22.1 }
    ];

    const totalValue = mockHoldings.reduce((sum, asset) => sum + asset.value, 0);
    const totalChange = mockHoldings.reduce((sum, asset) => sum + (asset.value * asset.change24h / 100), 0);
    const averageAPY = mockHoldings.reduce((sum, asset) => sum + (asset.apy * asset.allocation / 100), 0);

    setPortfolioMetrics({
      totalValue,
      totalChange,
      totalChangePercent: (totalChange / totalValue) * 100,
      averageAPY,
      holdings: mockHoldings,
      diversificationScore: 85,
      riskScore: 'Moderate',
      sharpeRatio: 1.85
    });
  };

  const generatePerformanceData = () => {
    const days = 30;
    const baseValue = 111250;
    const data = [];
    
    for (let i = 0; i < days; i++) {
      const volatility = 0.03;
      const trend = 0.0015;
      const randomChange = (Math.random() - 0.5) * volatility;
      const value = i === 0 ? baseValue : data[i-1].value * (1 + trend + randomChange);
      
      data.push({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        value: value,
        change: i === 0 ? 0 : ((value - data[i-1].value) / data[i-1].value) * 100
      });
    }
    
    setPerformanceData(data);
  };

  const generateRebalanceRecommendations = () => {
    setRebalanceRecommendations([
      {
        type: 'overweight',
        asset: 'BTC',
        current: 35.2,
        target: 30.0,
        action: 'Reduce by 5.2%',
        reason: 'Bitcoin allocation exceeds target weight',
        impact: 'Medium',
        urgency: 'Low'
      },
      {
        type: 'underweight',
        asset: 'ETH',
        current: 24.8,
        target: 28.0,
        action: 'Increase by 3.2%',
        reason: 'Ethereum below optimal allocation',
        impact: 'High',
        urgency: 'Medium'
      },
      {
        type: 'opportunity',
        asset: 'SOL',
        current: 15.6,
        target: 18.0,
        action: 'Consider increasing',
        reason: 'Strong recent performance and momentum',
        impact: 'Medium',
        urgency: 'Low'
      }
    ]);
  };

  const performanceChart = {
    labels: performanceData.map(d => d.date),
    datasets: [{
      label: 'Portfolio Value',
      data: performanceData.map(d => d.value),
      borderColor: '#40e0d0',
      backgroundColor: 'rgba(64, 224, 208, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#40e0d0',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 8
    }]
  };

  const allocationChart = {
    labels: portfolioMetrics.holdings?.map(h => h.symbol) || [],
    datasets: [{
      data: portfolioMetrics.holdings?.map(h => h.allocation) || [],
      backgroundColor: [
        'rgba(247, 147, 26, 0.8)',
        'rgba(98, 126, 234, 0.8)',
        'rgba(153, 69, 255, 0.8)',
        'rgba(46, 204, 113, 0.8)',
        'rgba(52, 152, 219, 0.8)',
        'rgba(230, 126, 34, 0.8)'
      ],
      borderColor: [
        '#f7931a', '#627eea', '#9945ff', '#2ecc71', '#3498db', '#e67e22'
      ],
      borderWidth: 2,
      hoverOffset: 10
    }]
  };

  const handleAssetClick = (asset) => {
    setSelectedAsset(asset);
  };

  const handleRebalance = async () => {
    setIsAnalyzing(true);
    // Simulate rebalance analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      onRebalance && onRebalance(rebalanceRecommendations);
    }, 2000);
  };

  const getChangeColor = (change) => {
    return change >= 0 ? '#2ecc71' : '#e74c3c';
  };

  const getRiskColor = (risk) => {
    switch(risk.toLowerCase()) {
      case 'low': return '#2ecc71';
      case 'moderate': return '#f39c12';
      case 'high': return '#e74c3c';
      default: return '#3498db';
    }
  };

  return (
    <div className="advanced-portfolio">
      {/* Portfolio Header */}
      <motion.div 
        className="portfolio-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="portfolio-stats">
          <div className="stat-card main-stat">
            <div className="stat-value">
              ${portfolioMetrics.totalValue?.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </div>
            <div className="stat-label">Total Portfolio Value</div>
            <div 
              className="stat-change"
              style={{ color: getChangeColor(portfolioMetrics.totalChangePercent) }}
            >
              {portfolioMetrics.totalChangePercent >= 0 ? '+' : ''}
              {portfolioMetrics.totalChangePercent?.toFixed(2)}% (24h)
            </div>
          </div>

          <div className="secondary-stats">
            <div className="stat-item">
              <span className="stat-number">{portfolioMetrics.averageAPY?.toFixed(1)}%</span>
              <span className="stat-text">Avg APY</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{portfolioMetrics.diversificationScore}</span>
              <span className="stat-text">Diversification</span>
            </div>
            <div className="stat-item">
              <span 
                className="stat-number"
                style={{ color: getRiskColor(portfolioMetrics.riskScore) }}
              >
                {portfolioMetrics.riskScore}
              </span>
              <span className="stat-text">Risk Level</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{portfolioMetrics.sharpeRatio}</span>
              <span className="stat-text">Sharpe Ratio</span>
            </div>
          </div>
        </div>

        <div className="portfolio-actions">
          <motion.button
            className="action-btn primary"
            onClick={handleRebalance}
            disabled={isAnalyzing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isAnalyzing ? (
              <>
                <motion.div 
                  className="spinner"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Analyzing...
              </>
            ) : (
              <>⚖️ Auto Rebalance</>
            )}
          </motion.button>
          
          <motion.button
            className="action-btn secondary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📊 Generate Report
          </motion.button>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="portfolio-tabs">
        {['overview', 'holdings', 'performance', 'rebalance'].map(tab => (
          <motion.button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="portfolio-content">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              className="overview-grid"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="chart-section performance-chart">
                <h3>📈 Portfolio Performance (30D)</h3>
                <div className="chart-container">
                  <Line 
                    ref={chartRef}
                    data={performanceChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          mode: 'index',
                          intersect: false,
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          borderColor: '#40e0d0',
                          borderWidth: 1
                        }
                      },
                      scales: {
                        x: { 
                          display: true,
                          ticks: { color: '#a0a0a0', maxTicksLimit: 7 },
                          grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        y: { 
                          display: true,
                          ticks: { 
                            color: '#a0a0a0',
                            callback: (value) => `$${value.toLocaleString()}`
                          },
                          grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                      },
                      interaction: {
                        intersect: false,
                        mode: 'index'
                      }
                    }}
                  />
                </div>
              </div>

              <div className="chart-section allocation-chart">
                <h3>🎯 Asset Allocation</h3>
                <div className="chart-container">
                  <Doughnut 
                    data={allocationChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: { 
                            color: '#ffffff',
                            usePointStyle: true,
                            padding: 20
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              return `${context.label}: ${context.parsed.toFixed(1)}%`;
                            }
                          }
                        }
                      },
                      cutout: '60%'
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'holdings' && (
            <motion.div
              key="holdings"
              className="holdings-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {portfolioMetrics.holdings?.map((asset, index) => (
                <motion.div
                  key={asset.symbol}
                  className="asset-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  onClick={() => handleAssetClick(asset)}
                >
                  <div className="asset-header">
                    <div className="asset-info">
                      <div className="asset-symbol">{asset.symbol}</div>
                      <div className="asset-name">{asset.name}</div>
                    </div>
                    <div className="asset-allocation">
                      {asset.allocation.toFixed(1)}%
                    </div>
                  </div>

                  <div className="asset-metrics">
                    <div className="metric">
                      <span className="metric-label">Holdings</span>
                      <span className="metric-value">{asset.amount} {asset.symbol}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Value</span>
                      <span className="metric-value">${asset.value.toLocaleString()}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">24h Change</span>
                      <span 
                        className="metric-value"
                        style={{ color: getChangeColor(asset.change24h) }}
                      >
                        {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">APY</span>
                      <span className="metric-value apy">{asset.apy.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="asset-actions">
                    <button className="asset-action-btn buy">Buy</button>
                    <button className="asset-action-btn sell">Sell</button>
                    <button className="asset-action-btn stake">Stake</button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'rebalance' && (
            <motion.div
              key="rebalance"
              className="rebalance-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="rebalance-header">
                <h3>🎯 Rebalancing Recommendations</h3>
                <div className="last-rebalance">
                  Last rebalanced: <span>2 hours ago</span>
                </div>
              </div>

              <div className="recommendations-list">
                {rebalanceRecommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    className={`recommendation-card ${rec.type}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="rec-header">
                      <div className="rec-asset">
                        <span className="rec-symbol">{rec.asset}</span>
                        <span className={`rec-badge ${rec.urgency.toLowerCase()}`}>
                          {rec.urgency}
                        </span>
                      </div>
                      <div className="rec-impact">{rec.impact} Impact</div>
                    </div>

                    <div className="rec-details">
                      <div className="allocation-bars">
                        <div className="allocation-bar">
                          <span>Current: {rec.current.toFixed(1)}%</span>
                          <div className="bar">
                            <div 
                              className="fill current"
                              style={{ width: `${(rec.current / 40) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="allocation-bar">
                          <span>Target: {rec.target.toFixed(1)}%</span>
                          <div className="bar">
                            <div 
                              className="fill target"
                              style={{ width: `${(rec.target / 40) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rec-footer">
                      <div className="rec-reason">{rec.reason}</div>
                      <div className="rec-action">
                        <strong>{rec.action}</strong>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="rebalance-actions">
                <motion.button
                  className="rebalance-btn execute"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ⚡ Execute All Recommendations
                </motion.button>
                <motion.button
                  className="rebalance-btn preview"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  👁️ Preview Changes
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Asset Detail Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            className="asset-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAsset(null)}
          >
            <motion.div
              className="asset-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>{selectedAsset.name} ({selectedAsset.symbol})</h3>
                <button 
                  className="close-btn"
                  onClick={() => setSelectedAsset(null)}
                >
                  ×
                </button>
              </div>
              <div className="modal-content">
                <div className="asset-detail-stats">
                  <div className="detail-stat">
                    <label>Current Holdings</label>
                    <value>{selectedAsset.amount} {selectedAsset.symbol}</value>
                  </div>
                  <div className="detail-stat">
                    <label>USD Value</label>
                    <value>${selectedAsset.value.toLocaleString()}</value>
                  </div>
                  <div className="detail-stat">
                    <label>Portfolio Weight</label>
                    <value>{selectedAsset.allocation.toFixed(2)}%</value>
                  </div>
                  <div className="detail-stat">
                    <label>24h Performance</label>
                    <value style={{ color: getChangeColor(selectedAsset.change24h) }}>
                      {selectedAsset.change24h >= 0 ? '+' : ''}{selectedAsset.change24h.toFixed(2)}%
                    </value>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedPortfolio;