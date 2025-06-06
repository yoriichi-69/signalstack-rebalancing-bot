import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MarketOverview.css';

const MarketOverview = ({ marketData }) => {
  const [selectedMarket, setSelectedMarket] = useState('crypto');
  const [isLive, setIsLive] = useState(true);

  // Mock market data - replace with real API data
  const mockMarketData = {
    crypto: {
      totalMarketCap: 2.1e12,
      totalVolume: 89.5e9,
      btcDominance: 42.5,
      activeCryptos: 10847,
      marketSentiment: 'bullish',
      topGainers: [
        { symbol: 'BTC', name: 'Bitcoin', price: 45250.30, change: 3.45, volume: '28.4B' },
        { symbol: 'ETH', name: 'Ethereum', price: 3120.45, change: 5.23, volume: '15.2B' },
        { symbol: 'BNB', name: 'Binance Coin', price: 425.67, change: 2.18, volume: '2.1B' },
        { symbol: 'ADA', name: 'Cardano', price: 1.25, change: 8.91, volume: '1.8B' }
      ],
      topLosers: [
        { symbol: 'DOGE', name: 'Dogecoin', price: 0.0821, change: -4.23, volume: '890M' },
        { symbol: 'SHIB', name: 'Shiba Inu', price: 0.000024, change: -6.12, volume: '456M' }
      ],
      fearGreedIndex: 68
    },
    indices: {
      sp500: { value: 4587.23, change: 0.85 },
      nasdaq: { value: 15234.67, change: 1.23 },
      dow: { value: 35678.90, change: 0.45 },
      vix: { value: 18.45, change: -2.34 }
    }
  };

  const data = marketData || mockMarketData;
  const currentData = data[selectedMarket] || data.crypto;

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate live price updates
      if (isLive) {
        // Add small random changes to prices
        console.log('Live update...');
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  const getSentimentColor = (sentiment) => {
    switch(sentiment) {
      case 'bullish': return '#00ff88';
      case 'bearish': return '#ff6b6b';
      case 'neutral': return '#ffd700';
      default: return '#8b5cf6';
    }
  };

  const getFearGreedColor = (index) => {
    if (index < 25) return '#ff6b6b'; // Extreme Fear
    if (index < 45) return '#ff9500'; // Fear
    if (index < 55) return '#ffd700'; // Neutral
    if (index < 75) return '#9ccc65'; // Greed
    return '#00ff88'; // Extreme Greed
  };

  const getFearGreedLabel = (index) => {
    if (index < 25) return 'Extreme Fear';
    if (index < 45) return 'Fear';
    if (index < 55) return 'Neutral';
    if (index < 75) return 'Greed';
    return 'Extreme Greed';
  };

  return (
    <motion.div 
      className="market-overview-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="market-header">
        <div className="header-left">
          <h3 className="market-title">Market Overview</h3>
          <div className="live-indicator">
            <div className={`live-dot ${isLive ? 'active' : ''}`}></div>
            <span className="live-text">Live</span>
          </div>
        </div>

        <div className="market-selector">
          {['crypto', 'indices'].map(market => (
            <motion.button
              key={market}
              className={`market-btn ${selectedMarket === market ? 'active' : ''}`}
              onClick={() => setSelectedMarket(market)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {market === 'crypto' ? '₿' : '📈'} {market.charAt(0).toUpperCase() + market.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="market-content">
        {selectedMarket === 'crypto' && (
          <div className="crypto-overview">
            {/* Market Stats */}
            <div className="market-stats-grid">
              <div className="stat-card">
                <span className="stat-label">Market Cap</span>
                <span className="stat-value">${(currentData.totalMarketCap / 1e12).toFixed(2)}T</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">24h Volume</span>
                <span className="stat-value">${(currentData.totalVolume / 1e9).toFixed(1)}B</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">BTC Dominance</span>
                <span className="stat-value">{currentData.btcDominance}%</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Active Cryptos</span>
                <span className="stat-value">{currentData.activeCryptos.toLocaleString()}</span>
              </div>
            </div>

            {/* Fear & Greed Index */}
            <div className="fear-greed-section">
              <h4 className="section-title">Fear & Greed Index</h4>
              <div className="fear-greed-display">
                <div className="fear-greed-gauge">
                  <div className="gauge-background">
                    <div 
                      className="gauge-fill"
                      style={{ 
                        width: `${currentData.fearGreedIndex}%`,
                        backgroundColor: getFearGreedColor(currentData.fearGreedIndex)
                      }}
                    ></div>
                  </div>
                  <div className="gauge-info">
                    <span className="gauge-value">{currentData.fearGreedIndex}</span>
                    <span 
                      className="gauge-label"
                      style={{ color: getFearGreedColor(currentData.fearGreedIndex) }}
                    >
                      {getFearGreedLabel(currentData.fearGreedIndex)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Movers */}
            <div className="top-movers">
              <div className="movers-section">
                <h4 className="section-title">Top Gainers</h4>
                <div className="movers-list">
                  {currentData.topGainers.slice(0, 3).map((coin, index) => (
                    <motion.div
                      key={coin.symbol}
                      className="mover-item gainer"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="coin-info">
                        <span className="coin-symbol">{coin.symbol}</span>
                        <span className="coin-price">${coin.price.toLocaleString()}</span>
                      </div>
                      <div className="coin-change positive">
                        +{coin.change.toFixed(2)}%
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="movers-section">
                <h4 className="section-title">Top Losers</h4>
                <div className="movers-list">
                  {currentData.topLosers.map((coin, index) => (
                    <motion.div
                      key={coin.symbol}
                      className="mover-item loser"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="coin-info">
                        <span className="coin-symbol">{coin.symbol}</span>
                        <span className="coin-price">${coin.price.toLocaleString()}</span>
                      </div>
                      <div className="coin-change negative">
                        {coin.change.toFixed(2)}%
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMarket === 'indices' && (
          <div className="indices-overview">
            <div className="indices-grid">
              {Object.entries(data.indices).map(([key, index]) => (
                <motion.div
                  key={key}
                  className="index-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="index-name">{key.toUpperCase()}</span>
                  <span className="index-value">{index.value.toLocaleString()}</span>
                  <span className={`index-change ${index.change >= 0 ? 'positive' : 'negative'}`}>
                    {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)}%
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Market Sentiment Indicator */}
      <div className="market-sentiment">
        <span className="sentiment-label">Market Sentiment:</span>
        <span 
          className="sentiment-value"
          style={{ color: getSentimentColor(currentData.marketSentiment) }}
        >
          {currentData.marketSentiment?.charAt(0).toUpperCase() + currentData.marketSentiment?.slice(1) || 'Neutral'}
        </span>
      </div>
    </motion.div>
  );
};

export default MarketOverview;