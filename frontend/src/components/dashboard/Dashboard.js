import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PortfolioOverview from '../portfolio/PortfolioOverview';
import ActiveSignals from './ActiveSignals';
import PerformanceChart from './PerformanceChart';
import QuickActions from './QuickActions';
import MarketOverview from './MarketOverview';
import './Dashboard.css';

const Dashboard = ({ activeAccount, portfolioData, signalsData, marketData }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1500);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div 
      className="dashboard-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Dashboard Header */}
      <motion.div className="dashboard-header" variants={itemVariants}>
        <div className="header-content">
          <div className="welcome-section">
            <h1 className="dashboard-title">
              Welcome back, <span className="user-name">{activeAccount?.name || 'Trader'}</span>
            </h1>
            <p className="dashboard-subtitle">
              Here's what's happening with your portfolio today
            </p>
          </div>
          
          <div className="timeframe-selector">
            {['1h', '4h', '24h', '7d', '30d'].map(timeframe => (
              <motion.button
                key={timeframe}
                className={`timeframe-btn ${selectedTimeframe === timeframe ? 'active' : ''}`}
                onClick={() => setSelectedTimeframe(timeframe)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {timeframe}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Portfolio Overview - Full Width */}
        <motion.div className="grid-item portfolio-section" variants={itemVariants}>
          <PortfolioOverview 
            portfolioData={portfolioData}
            timeframe={selectedTimeframe}
          />
        </motion.div>

        {/* Performance Chart */}
        <motion.div className="grid-item performance-section" variants={itemVariants}>
          <PerformanceChart 
            data={portfolioData?.performance}
            timeframe={selectedTimeframe}
          />
        </motion.div>

        {/* Active Signals */}
        <motion.div className="grid-item signals-section" variants={itemVariants}>
          <ActiveSignals 
            signals={signalsData}
            onExecuteSignal={(signal) => console.log('Execute signal:', signal)}
          />
        </motion.div>

        {/* Market Overview */}
        <motion.div className="grid-item market-section" variants={itemVariants}>
          <MarketOverview marketData={marketData} />
        </motion.div>

        {/* Quick Actions */}
        <motion.div className="grid-item actions-section" variants={itemVariants}>
          <QuickActions 
            onCreateStrategy={() => console.log('Create strategy')}
            onRebalance={() => console.log('Rebalance')}
            onAnalyze={() => console.log('Analyze')}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

const DashboardSkeleton = () => (
  <div className="dashboard-skeleton">
    <div className="skeleton-header">
      <div className="skeleton-title"></div>
      <div className="skeleton-subtitle"></div>
    </div>
    <div className="skeleton-grid">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="skeleton-item">
          <div className="skeleton-content"></div>
        </div>
      ))}
    </div>
  </div>
);

export default Dashboard;