import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const StatsSection = ({ stats }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const [realStats, setRealStats] = useState({
    totalMarketCap: 0,
    totalVolume: 0,
    activeCryptos: 0,
    marketSentiment: 'loading'
  });

  useEffect(() => {
    const fetchMarketStats = async () => {
      try {
        // Fetch real market data from CoinGecko
        const response = await fetch('https://api.coingecko.com/api/v3/global');
        const data = await response.json();
        
        setRealStats({
          totalMarketCap: data.data?.total_market_cap?.usd || 2.1e12,
          totalVolume: data.data?.total_volume?.usd || 89.5e9,
          activeCryptos: data.data?.active_cryptocurrencies || 10847,
          marketSentiment: data.data?.market_cap_percentage?.btc > 45 ? 'bullish' : 'bearish'
        });
      } catch (error) {
        console.error('Error fetching market stats:', error);
        // Fallback to provided stats or defaults
        setRealStats(stats || {
          totalMarketCap: 2.1e12,
          totalVolume: 89.5e9,
          activeCryptos: 10847,
          marketSentiment: 'bullish'
        });
      }
    };

    fetchMarketStats();
    
    // Update every 5 minutes
    const interval = setInterval(fetchMarketStats, 300000);
    
    return () => clearInterval(interval);
  }, [stats]);

  const formatNumber = (num) => {
    if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  };

  const statsData = [
    {
      label: 'Total Market Cap',
      value: formatNumber(realStats.totalMarketCap),
      icon: '📈',
      color: '#00D4AA'
    },
    {
      label: 'Daily Volume',
      value: formatNumber(realStats.totalVolume),
      icon: '💰',
      color: '#FFB800'
    },
    {
      label: 'Active Cryptocurrencies',
      value: realStats.activeCryptos.toLocaleString(),
      icon: '🪙',
      color: '#FF6B6B'
    },
    {
      label: 'Market Sentiment',
      value: realStats.marketSentiment,
      icon: realStats.marketSentiment === 'bullish' ? '🚀' : realStats.marketSentiment === 'bearish' ? '📉' : '⚡',
      color: realStats.marketSentiment === 'bullish' ? '#4ECDC4' : realStats.marketSentiment === 'bearish' ? '#FF6B6B' : '#FFB800'
    }
  ];

  return (
  <section className="stats-section" ref={ref}>
    <div className="stats-container">
      <motion.div 
        className="stats-header"
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h2>Real-Time Market Intelligence</h2>
        <p>Stay ahead with live crypto market data and analytics</p>
      </motion.div>

      <div className="stats-grid">
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="stat-card"
            initial={{ opacity: 0, y: 50 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{ y: -10, scale: 1.02 }}
          >
            <div className="stat-icon" style={{ color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <h3 className="stat-value" style={{ color: stat.color }}>
                {stat.value}
              </h3>
              <p className="stat-label">{stat.label}</p>
            </div>
            <div className="stat-glow" style={{ background: `${stat.color}20` }}></div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
};

export default StatsSection;