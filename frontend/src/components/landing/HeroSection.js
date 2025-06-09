import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const HeroSection = ({ onLogin }) => {
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch real-time crypto prices for the correct cryptos
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // Updated API call for the cryptos you want
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,dogecoin,ripple&vs_currencies=usd&include_24hr_change=true'
        );
        const data = await response.json();
        
        setCryptoPrices({
          bitcoin: {
            price: data.bitcoin?.usd || 104890.85,
            change: data.bitcoin?.usd_24h_change || 0.52
          },
          ethereum: {
            price: data.ethereum?.usd || 2488.80,
            change: data.ethereum?.usd_24h_change || -0.14
          },
          solana: {
            price: data.solana?.usd || 152.25,
            change: data.solana?.usd_24h_change || 1.93
          },
          dogecoin: {
            price: data.dogecoin?.usd || 0.185,
            change: data.dogecoin?.usd_24h_change || 3.23
          },
          ripple: {
            price: data.ripple?.usd || 2.18,
            change: data.ripple?.usd_24h_change || 0.40
          }
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching prices:', error);
        // Fallback to current real prices from your image
        setCryptoPrices({
          bitcoin: { price: 104890.85, change: 0.52 },
          ethereum: { price: 2488.80, change: -0.14 },
          solana: { price: 152.25, change: 1.93 },
          dogecoin: { price: 0.185, change: 3.23 },
          ripple: { price: 2.18, change: 0.40 }
        });
        setLoading(false);
      }
    };

    fetchPrices();
    
    // Update prices every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price) => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  };

  const formatChange = (change) => {
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
  };

  // Updated crypto data to match your image
  const cryptoData = [
    {
      symbol: 'bitcoin',
      name: 'Bitcoin',
      displayName: 'BITCOIN',
      icon: '₿',
      color: '#f7931a',
      position: { top: '10%', right: '15%' },
      delay: 0
    },
    {
      symbol: 'ethereum',
      name: 'Ethereum', 
      displayName: 'ETHER',
      icon: 'Ξ',
      color: '#627eea',
      position: { bottom: '25%', left: '10%' },
      delay: 0.2
    },
    {
      symbol: 'solana',
      name: 'Solana',
      displayName: 'SOLANA', 
      icon: '◎',
      color: '#9945ff',
      position: { top: '40%', right: '5%' },
      delay: 0.4
    },
    {
      symbol: 'dogecoin',
      name: 'Dogecoin',
      displayName: 'DOGECOIN',
      icon: 'Ð',
      color: '#c2a633',
      position: { bottom: '10%', right: '25%' },
      delay: 0.6
    },
    {
      symbol: 'ripple',
      name: 'XRP',
      displayName: 'XRP',
      icon: '◈',
      color: '#23292f',
      position: { top: '25%', left: '5%' },
      delay: 0.8
    }
  ];

  return (
    <section className="hero-section">
      <div className="hero-container">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="hero-title">
            <span className="gradient-text">CryptoRizz</span>
            <br />
            Your Gateway to Crypto Intelligence
          </h1>
          
          <p className="hero-subtitle">
            Advanced crypto analytics, real-time market data, and intelligent trading insights 
            all in one powerful platform. Professional portfolio rebalancing made simple.
          </p>
          
          <div className="hero-buttons">
            <motion.button 
              className="btn-primary"
              onClick={onLogin}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
            
            <motion.button 
              className="btn-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View Demo
            </motion.button>
          </div>
        </motion.div>
        
        <motion.div 
          className="hero-visual"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="floating-cards">
            {cryptoData.map((crypto) => {
              const priceData = cryptoPrices[crypto.symbol];
              
              return (
                <motion.div
                  key={crypto.symbol}
                  className={`crypto-card ${crypto.symbol}`}
                  style={{
                    position: 'absolute',
                    ...crypto.position
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: crypto.delay
                  }}
                  whileHover={{ 
                    scale: 1.1,
                    y: -10,
                    transition: { duration: 0.3 }
                  }}
                  // REMOVED the annoying disappearing animation
                >
                  <div 
                    className="crypto-icon"
                    style={{ background: `linear-gradient(135deg, ${crypto.color}, ${crypto.color}dd)` }}
                  >
                    {crypto.icon}
                  </div>
                  <div className="crypto-info">
                    <span className="crypto-name">{crypto.displayName}</span>
                    {loading ? (
                      <span className="crypto-price">Loading...</span>
                    ) : priceData ? (
                      <>
                        <span className="crypto-price">
                          {formatPrice(priceData.price)}
                        </span>
                        <span className={`crypto-change ${priceData.change >= 0 ? 'positive' : 'negative'}`}>
                          {formatChange(priceData.change)}
                        </span>
                      </>
                    ) : (
                      <span className="crypto-price">N/A</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
      
      <div className="hero-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>
    </section>
  );
};

export default HeroSection;