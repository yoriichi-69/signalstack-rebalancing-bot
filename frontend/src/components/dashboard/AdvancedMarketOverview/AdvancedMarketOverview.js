import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import './AdvancedMarketOverview.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdvancedMarketOverview = () => {
  const [activeView, setActiveView] = useState('overview');
  const [marketData, setMarketData] = useState({});
  const [heatmapData, setHeatmapData] = useState([]);
  const [fearGreedIndex, setFearGreedIndex] = useState(68);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateMockData();
    const interval = setInterval(generateMockData, 5000);
    return () => clearInterval(interval);
  }, []);

  const generateMockData = () => {
    const topCryptos = [
      { symbol: 'BTC', name: 'Bitcoin', price: 104785.48, change: 0.52, marketCap: 2.06e12, volume: 28.4e9, color: '#f7931a' },
      { symbol: 'ETH', name: 'Ethereum', price: 3128.45, change: -0.14, marketCap: 376e9, volume: 15.2e9, color: '#627eea' },
      { symbol: 'BNB', name: 'BNB', price: 647.21, change: 0.83, marketCap: 94e9, volume: 2.1e9, color: '#f3ba2f' },
      { symbol: 'SOL', name: 'Solana', price: 152.25, change: 1.93, marketCap: 70e9, volume: 3.2e9, color: '#9945ff' },
      { symbol: 'XRP', name: 'Ripple', price: 2.18, change: 0.40, marketCap: 123e9, volume: 8.5e9, color: '#23292f' },
      { symbol: 'DOGE', name: 'Dogecoin', price: 0.185, change: 3.23, marketCap: 27e9, volume: 1.8e9, color: '#c2a633' }
    ];

    setMarketData({
      totalMarketCap: 2.1e12,
      totalVolume: 89.5e9,
      btcDominance: 42.5,
      activeCryptos: 10847,
      topGainers: topCryptos.filter(c => c.change > 0).slice(0, 3),
      topLosers: topCryptos.filter(c => c.change < 0).slice(0, 3),
      topCryptos
    });

    setHeatmapData(topCryptos.map(crypto => ({
      ...crypto,
      size: crypto.marketCap,
      intensity: Math.abs(crypto.change)
    })));

    setFearGreedIndex(Math.floor(Math.random() * 100));
    setIsLoading(false);
  };

  const marketCapChart = {
    labels: ['Bitcoin', 'Ethereum', 'Others'],
    datasets: [{
      data: [42.5, 18.3, 39.2],
      backgroundColor: [
        'rgba(247, 147, 26, 0.8)',
        'rgba(98, 126, 234, 0.8)',
        'rgba(64, 224, 208, 0.8)'
      ],
      borderColor: [
        '#f7931a',
        '#627eea',
        '#40e0d0'
      ],
      borderWidth: 2
    }]
  };

  const volumeChart = {
    labels: ['1h', '2h', '3h', '4h', '5h', '6h'],
    datasets: [{
      label: 'Volume (B)',
      data: [85.2, 92.1, 78.9, 89.5, 94.3, 87.6],
      backgroundColor: 'rgba(64, 224, 208, 0.1)',
      borderColor: '#40e0d0',
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  };

  const getFearGreedColor = (index) => {
    if (index < 25) return '#e74c3c';
    if (index < 45) return '#f39c12';
    if (index < 55) return '#f1c40f';
    if (index < 75) return '#2ecc71';
    return '#3498db';
  };

  const getFearGreedLabel = (index) => {
    if (index < 25) return 'Extreme Fear';
    if (index < 45) return 'Fear';
    if (index < 55) return 'Neutral';
    if (index < 75) return 'Greed';
    return 'Extreme Greed';
  };

  if (isLoading) {
    return (
      <div className="advanced-market-loading">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          ⚡
        </motion.div>
      </div>
    );
  }

  return (
    <div className="advanced-market-overview">
      <motion.div 
        className="market-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="header-left">
          <h2>Market Overview</h2>
          <div className="market-stats-quick">
            <div className="stat-item">
              <span className="stat-label">Market Cap</span>
              <span className="stat-value">${(marketData.totalMarketCap / 1e12).toFixed(2)}T</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">24h Volume</span>
              <span className="stat-value">${(marketData.totalVolume / 1e9).toFixed(1)}B</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">BTC Dominance</span>
              <span className="stat-value">{marketData.btcDominance}%</span>
            </div>
          </div>
        </div>
        
        <div className="view-toggles">
          {['overview', 'heatmap', 'gainers'].map(view => (
            <motion.button
              key={view}
              className={`view-toggle ${activeView === view ? 'active' : ''}`}
              onClick={() => setActiveView(view)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="market-content">
        <AnimatePresence mode="wait">
          {activeView === 'overview' && (
            <motion.div
              key="overview"
              className="overview-grid"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Fear & Greed Index */}
              <motion.div className="fear-greed-card glass-card">
                <h3>Fear & Greed Index</h3>
                <div className="fear-greed-meter">
                  <div 
                    className="meter-fill"
                    style={{ 
                      width: `${fearGreedIndex}%`,
                      background: getFearGreedColor(fearGreedIndex)
                    }}
                  />
                  <div className="meter-value" style={{ color: getFearGreedColor(fearGreedIndex) }}>
                    {fearGreedIndex}
                  </div>
                </div>
                <p className="fear-greed-label">{getFearGreedLabel(fearGreedIndex)}</p>
              </motion.div>

              {/* Market Cap Distribution */}
              <motion.div className="chart-card glass-card">
                <h3>Market Cap Distribution</h3>
                <div className="chart-container">
                  <Doughnut 
                    data={marketCapChart}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: { color: '#fff' }
                        }
                      }
                    }}
                  />
                </div>
              </motion.div>

              {/* Volume Chart */}
              <motion.div className="chart-card glass-card large">
                <h3>24h Volume Trend</h3>
                <div className="chart-container">
                  <Line 
                    data={volumeChart}
                    options={{
                      responsive: true,
                      scales: {
                        x: { ticks: { color: '#fff' } },
                        y: { ticks: { color: '#fff' } }
                      },
                      plugins: {
                        legend: { display: false }
                      }
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeView === 'heatmap' && (
            <motion.div
              key="heatmap"
              className="heatmap-container"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="crypto-heatmap">
                {heatmapData.map((crypto, index) => (
                  <motion.div
                    key={crypto.symbol}
                    className={`heatmap-cell ${crypto.change >= 0 ? 'positive' : 'negative'}`}
                    style={{
                      width: `${Math.max(100, crypto.marketCap / 1e9 * 2)}px`,
                      height: `${Math.max(80, crypto.marketCap / 1e9 * 1.5)}px`,
                      backgroundColor: crypto.change >= 0 
                        ? `rgba(46, 204, 113, ${Math.min(0.8, crypto.intensity / 10)})` 
                        : `rgba(231, 76, 60, ${Math.min(0.8, crypto.intensity / 10)})`
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, zIndex: 10 }}
                  >
                    <div className="cell-content">
                      <div className="crypto-symbol">{crypto.symbol}</div>
                      <div className="crypto-change">
                        {crypto.change >= 0 ? '+' : ''}{crypto.change.toFixed(2)}%
                      </div>
                      <div className="crypto-price">
                        ${crypto.price.toLocaleString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeView === 'gainers' && (
            <motion.div
              key="gainers"
              className="gainers-losers-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="gainers-section">
                <h3>🚀 Top Gainers</h3>
                {marketData.topGainers?.map((crypto, index) => (
                  <motion.div
                    key={crypto.symbol}
                    className="crypto-item gainer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="crypto-info">
                      <span className="symbol">{crypto.symbol}</span>
                      <span className="name">{crypto.name}</span>
                    </div>
                    <div className="crypto-price">${crypto.price.toLocaleString()}</div>
                    <div className="crypto-change positive">
                      +{crypto.change.toFixed(2)}%
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="losers-section">
                <h3>📉 Top Losers</h3>
                {marketData.topLosers?.map((crypto, index) => (
                  <motion.div
                    key={crypto.symbol}
                    className="crypto-item loser"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="crypto-info">
                      <span className="symbol">{crypto.symbol}</span>
                      <span className="name">{crypto.name}</span>
                    </div>
                    <div className="crypto-price">${crypto.price.toLocaleString()}</div>
                    <div className="crypto-change negative">
                      {crypto.change.toFixed(2)}%
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdvancedMarketOverview;