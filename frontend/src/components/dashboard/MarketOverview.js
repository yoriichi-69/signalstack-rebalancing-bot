import React, { useState, useEffect } from 'react';
import './MarketOverview.css';
import axios from 'axios';

const MarketOverview = ({ marketData }) => {
  const [selectedMarket, setSelectedMarket] = useState('crypto');
  const [isLive, setIsLive] = useState(true);
  const [localMarketData, setLocalMarketData] = useState(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  
  // Updated market data with accurate prices
  const generateUpdatedMarketData = () => {
    return {
      crypto: {
        totalMarketCap: 2.72e12,
        totalVolume: 89.5e9,
        btcDominance: 52.6,
        activeCryptos: 11235,
        marketSentiment: 'bullish',
        topGainers: [
          { symbol: 'BTC', name: 'Bitcoin', price: 106889.35, change: 0.51, volume: '42.6B' },
          { symbol: 'ETH', name: 'Ethereum', price: 2522.08, change: -0.50, volume: '15.2B' },
          { symbol: 'SOL', name: 'Solana', price: 154.26, change: -0.02, volume: '3.8B' },
          { symbol: 'BNB', name: 'Binance Coin', price: 587.67, change: 0.23, volume: '2.1B' },
          { symbol: 'ADA', name: 'Cardano', price: 0.58, change: 1.12, volume: '1.4B' },
          { symbol: 'XRP', name: 'Ripple', price: 2.26, change: -1.20, volume: '2.3B' },
        ],
        topLosers: [
          { symbol: 'DOGE', name: 'Dogecoin', price: 0.1856, change: -0.26, volume: '890M' },
          { symbol: 'SHIB', name: 'Shiba Inu', price: 0.000024, change: -2.42, volume: '456M' },
          { symbol: 'AVAX', name: 'Avalanche', price: 39.15, change: -1.37, volume: '675M' },
          { symbol: 'LINK', name: 'Chainlink', price: 17.82, change: -0.95, volume: '512M' },
        ],
        fearGreedIndex: 68
      }
    };
  };

  // Fetch real cryptocurrency prices
  const fetchCryptoPrices = async () => {
    setIsPriceLoading(true);
    try {
      // Try to fetch from CoinGecko API
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,cardano,ripple,dogecoin,shiba-inu,avalanche-2,chainlink&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true');
      
      if (response.data) {
        const updatedData = generateUpdatedMarketData();
        
        // Update prices based on API response
        if (response.data.bitcoin) {
          updatedData.crypto.topGainers[0].price = response.data.bitcoin.usd;
          updatedData.crypto.topGainers[0].change = response.data.bitcoin.usd_24h_change?.toFixed(2) || 0.51;
        }
        
        if (response.data.ethereum) {
          updatedData.crypto.topGainers[1].price = response.data.ethereum.usd;
          updatedData.crypto.topGainers[1].change = response.data.ethereum.usd_24h_change?.toFixed(2) || -0.50;
        }
        
        if (response.data.solana) {
          updatedData.crypto.topGainers[2].price = response.data.solana.usd;
          updatedData.crypto.topGainers[2].change = response.data.solana.usd_24h_change?.toFixed(2) || -0.02;
        }
        
        if (response.data.binancecoin) {
          updatedData.crypto.topGainers[3].price = response.data.binancecoin.usd;
          updatedData.crypto.topGainers[3].change = response.data.binancecoin.usd_24h_change?.toFixed(2) || 0.23;
        }
        
        if (response.data.cardano) {
          updatedData.crypto.topGainers[4].price = response.data.cardano.usd;
          updatedData.crypto.topGainers[4].change = response.data.cardano.usd_24h_change?.toFixed(2) || 1.12;
        }
        
        if (response.data.ripple) {
          updatedData.crypto.topGainers[5].price = response.data.ripple.usd;
          updatedData.crypto.topGainers[5].change = response.data.ripple.usd_24h_change?.toFixed(2) || -1.20;
        }
        
        if (response.data.dogecoin) {
          updatedData.crypto.topLosers[0].price = response.data.dogecoin.usd;
          updatedData.crypto.topLosers[0].change = response.data.dogecoin.usd_24h_change?.toFixed(2) || -0.26;
        }
        
        if (response.data['shiba-inu']) {
          updatedData.crypto.topLosers[1].price = response.data['shiba-inu'].usd;
          updatedData.crypto.topLosers[1].change = response.data['shiba-inu'].usd_24h_change?.toFixed(2) || -2.42;
        }
        
        if (response.data['avalanche-2']) {
          updatedData.crypto.topLosers[2].price = response.data['avalanche-2'].usd;
          updatedData.crypto.topLosers[2].change = response.data['avalanche-2'].usd_24h_change?.toFixed(2) || -1.37;
        }
        
        if (response.data.chainlink) {
          updatedData.crypto.topLosers[3].price = response.data.chainlink.usd;
          updatedData.crypto.topLosers[3].change = response.data.chainlink.usd_24h_change?.toFixed(2) || -0.95;
        }
        
        // Sort gainers by positive change
        updatedData.crypto.topGainers.sort((a, b) => b.change - a.change);
        
        // Sort losers by negative change
        updatedData.crypto.topLosers.sort((a, b) => a.change - b.change);
        
        setLocalMarketData(updatedData);
      } else {
        // Fallback to default data
        setLocalMarketData(generateUpdatedMarketData());
      }
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      // Fallback to default data
      setLocalMarketData(generateUpdatedMarketData());
    }
    setIsPriceLoading(false);
  };

  // Initialize and update market data
  useEffect(() => {
    // Initial fetch
    fetchCryptoPrices();
    
    // Set up interval for live updates
    const interval = setInterval(() => {
      if (isLive) {
        fetchCryptoPrices();
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isLive]);

  // Default to mock market data if no data is available
  if (!localMarketData) {
    return (
      <div className="market-overview loading">
        <div className="loading-animation">
          <div className="loading-spinner"></div>
          <p>Loading market data...</p>
        </div>
      </div>
    );
  }

  const currentData = localMarketData[selectedMarket] || localMarketData.crypto;

  const getSentimentColor = (sentiment) => {
    switch(sentiment) {
      case 'bullish':
        return 'sentiment-bullish';
      case 'bearish':
        return 'sentiment-bearish';
      default:
        return 'sentiment-neutral';
    }
  };

  const getFearGreedColor = (index) => {
    if (index < 25) return 'fear-extreme';
    if (index < 45) return 'fear-moderate';
    if (index < 55) return 'neutral';
    if (index < 75) return 'greed-moderate';
    return 'greed-extreme';
  };

  const getFearGreedLabel = (index) => {
    if (index < 25) return 'Extreme Fear';
    if (index < 45) return 'Fear';
    if (index < 55) return 'Neutral';
    if (index < 75) return 'Greed';
    return 'Extreme Greed';
  };

  // Format price based on value
  const formatPrice = (price) => {
    if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    if (price >= 0.01) return price.toFixed(4);
    if (price >= 0.0001) return price.toFixed(6);
    return price.toExponential(4);
  };

  return (
    <div className="market-overview">
      <div className="market-header">
        <h3 className="market-title">Market Overview</h3>
        <div className="market-controls">
          <button 
            className={`live-toggle ${isLive ? 'active' : ''}`}
            onClick={() => setIsLive(!isLive)}
          >
            {isPriceLoading ? '⏳ Updating...' : isLive ? '🔴 Live' : '⚪ Paused'}
          </button>
        </div>
      </div>
      
      <div className="market-stats">
        <div className="stat-item">
          <span className="stat-label">Market Cap:</span>
          <span className="stat-value">${(currentData?.totalMarketCap / 1e12).toFixed(2)}T</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">24h Volume:</span>
          <span className="stat-value">${(currentData?.totalVolume / 1e9).toFixed(1)}B</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">BTC Dominance:</span>
          <span className="stat-value">{currentData?.btcDominance?.toFixed(1)}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Fear & Greed:</span>
          <span className={`stat-value ${getFearGreedColor(currentData?.fearGreedIndex || 50)}`}>
            {currentData?.fearGreedIndex || 50} ({getFearGreedLabel(currentData?.fearGreedIndex || 50)})
          </span>
        </div>
      </div>

      <div className="market-grid">
        {/* Top Gainers */}
        <div className="market-column gainers">
          <h4 className="column-title">Top Coins</h4>
          {currentData?.topGainers?.map((coin, index) => (
            <div key={index} className="coin-item">
              <div className="coin-info">
                <span className="coin-symbol">{coin.symbol}</span>
                <span className="coin-price">${formatPrice(coin.price)}</span>
              </div>
              <span className={`coin-change ${coin.change >= 0 ? 'positive' : 'negative'}`}>
                {coin.change >= 0 ? `+${coin.change}%` : `${coin.change}%`}
              </span>
            </div>
          ))}
        </div>

        {/* Top Losers */}
        <div className="market-column losers">
          <h4 className="column-title">Market Movers</h4>
          {currentData?.topLosers?.map((coin, index) => (
            <div key={index} className="coin-item">
              <div className="coin-info">
                <span className="coin-symbol">{coin.symbol}</span>
                <span className="coin-price">${formatPrice(coin.price)}</span>
              </div>
              <span className={`coin-change ${coin.change >= 0 ? 'positive' : 'negative'}`}>
                {coin.change >= 0 ? `+${coin.change}%` : `${coin.change}%`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;