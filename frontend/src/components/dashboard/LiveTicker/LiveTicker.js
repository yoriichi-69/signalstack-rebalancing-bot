import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RealtimeDataService from '../../../services/RealtimeDataService';
import './LiveTicker.css';

const LiveTicker = () => {
  const [tickerData, setTickerData] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [speed, setSpeed] = useState(50); // pixels per second

  useEffect(() => {
    // Subscribe to real-time price updates
    const unsubscribe = RealtimeDataService.subscribe('price_update', ({ symbol, data }) => {
      setTickerData(prev => {
        const existingIndex = prev.findIndex(item => item.symbol === symbol);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...data,
            trend: data.price > prev[existingIndex].price ? 'up' : 
                   data.price < prev[existingIndex].price ? 'down' : 'neutral'
          };
          return updated;
        } else {
          return [...prev, { ...data, trend: 'neutral' }];
        }
      });
    });

    // Start the price stream
    RealtimeDataService.startPriceStream();

    return () => {
      unsubscribe();
      RealtimeDataService.stopPriceStream();
    };
  }, []);

  const formatPrice = (price) => {
    return price >= 1 ? `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` 
                     : `$${price.toFixed(6)}`;
  };

  const formatChange = (change) => {
    const formatted = Math.abs(change).toFixed(2);
    return `${change >= 0 ? '+' : '-'}${formatted}%`;
  };

  return (
    <div className={`live-ticker-container ${!isVisible ? 'hidden' : ''}`}>
      <div className="ticker-header">
        <div className="ticker-controls">
          <button 
            className="ticker-toggle"
            onClick={() => setIsVisible(!isVisible)}
          >
            📊
          </button>
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span className="live-text">LIVE</span>
          </div>
        </div>
      </div>

      <div className="ticker-track">
        <motion.div 
          className="ticker-content"
          animate={{ x: [-1000, 1000] }}
          transition={{ 
            duration: tickerData.length * 2,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {tickerData.map((item, index) => (
            <motion.div 
              key={`${item.symbol}-${index}`}
              className={`ticker-item ${item.trend}`}
              initial={{ scale: 1 }}
              animate={{ 
                scale: item.trend !== 'neutral' ? [1, 1.05, 1] : 1 
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="ticker-symbol">{item.symbol}</div>
              <div className="ticker-price">{formatPrice(item.price)}</div>
              <div className={`ticker-change ${item.change24h >= 0 ? 'positive' : 'negative'}`}>
                {formatChange(item.change24h)}
              </div>
              <div className="ticker-volume">
                Vol: ${(item.volume24h / 1e9).toFixed(1)}B
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default LiveTicker;