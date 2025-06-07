import React, { useState, useEffect } from 'react';

const MarketOverview = ({ marketData }) => {
  const [selectedMarket, setSelectedMarket] = useState('crypto');
  const [isLive, setIsLive] = useState(true);

  // useEffect MUST come before any early returns
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate live price updates
      if (isLive) {
        // Your existing code here
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

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

  // Use mockMarketData as fallback
  const data = marketData || mockMarketData;
  const currentData = data?.[selectedMarket] || data?.crypto || {};

  // Safety check after defining currentData
  if (!currentData || Object.keys(currentData).length === 0) {
    return <div>Loading market data...</div>;
  }

  const getSentimentColor = (sentiment) => {
    switch(sentiment) {
      case 'bullish':
        return 'text-green-500';
      case 'bearish':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getFearGreedColor = (index) => {
    if (index < 25) return 'text-red-500';
    if (index < 45) return 'text-orange-500';
    if (index < 55) return 'text-yellow-500';
    if (index < 75) return 'text-green-500';
    return 'text-blue-500';
  };

  const getFearGreedLabel = (index) => {
    if (index < 25) return 'Extreme Fear';
    if (index < 45) return 'Fear';
    if (index < 55) return 'Neutral';
    if (index < 75) return 'Greed';
    return 'Extreme Greed';
  };

  return (
    <div className="market-overview">
      <div className="market-stats">
        <div className="stat-item">
          <span>Total Market Cap:</span>
          <span>${currentData?.totalMarketCap?.toLocaleString() || 'N/A'}</span>
        </div>
        <div className="stat-item">
          <span>Total Volume:</span>
          <span>${currentData?.totalVolume?.toLocaleString() || 'N/A'}</span>
        </div>
        <div className="stat-item">
          <span>BTC Dominance:</span>
          <span>{currentData?.btcDominance || 'N/A'}%</span>
        </div>
        <div className="stat-item">
          <span>Fear & Greed Index:</span>
          <span className={getFearGreedColor(currentData?.fearGreedIndex || 50)}>
            {currentData?.fearGreedIndex || 'N/A'} ({getFearGreedLabel(currentData?.fearGreedIndex || 50)})
          </span>
        </div>
      </div>

      {/* Top Gainers */}
      {currentData?.topGainers && (
        <div className="top-gainers">
          <h3>Top Gainers</h3>
          {currentData.topGainers.map((coin, index) => (
            <div key={index} className="coin-item">
              <span>{coin.symbol}</span>
              <span>${coin.price}</span>
              <span className="text-green-500">+{coin.change}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Top Losers */}
      {currentData?.topLosers && (
        <div className="top-losers">
          <h3>Top Losers</h3>
          {currentData.topLosers.map((coin, index) => (
            <div key={index} className="coin-item">
              <span>{coin.symbol}</span>
              <span>${coin.price}</span>
              <span className="text-red-500">{coin.change}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketOverview;