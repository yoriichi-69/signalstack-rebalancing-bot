import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ActiveSignals.css';

const ActiveSignals = ({ signals, signalsData, onExecuteSignal }) => {
  const [filter, setFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filteredSignals, setFilteredSignals] = useState([]); // ✅ Define filteredSignals state

  // ✅ Convert backend signals to frontend format
  useEffect(() => {
    const convertBackendSignals = () => {
      let signalsToProcess = [];

      // First, try to use signalsData (from backend)
      if (signalsData && typeof signalsData === 'object' && Object.keys(signalsData).length > 0) {
        signalsToProcess = Object.entries(signalsData).map(([token, data], index) => {
          const score = data.total_score || 0;
          const confidence = (data.ml_confidence || 0.5) * 100;
          
          // Determine signal type based on score
          let type = 'HOLD';
          if (score > 0.5) type = 'BUY';
          else if (score < -0.5) type = 'SELL';
          else if (Math.abs(score) < 0.1) type = 'REBALANCE';
          
          // Determine status based on confidence and score strength
          let status = 'pending';
          if (confidence > 80 && Math.abs(score) > 0.8) status = 'active';
          else if (confidence > 70 && Math.abs(score) > 0.5) status = 'ready';
          else if (confidence < 50) status = 'executed';
          
          return {
            id: `signal_${token}_${index}`,
            type: type,
            asset: token,
            price: null,
            targetPrice: null,
            confidence: Math.round(confidence),
            timeframe: confidence > 80 ? '1h' : confidence > 60 ? '4h' : '24h',
            source: 'AI Technical Analysis',
            timestamp: data.timestamp ? new Date(data.timestamp * 1000).toLocaleString() : new Date().toLocaleString(),
            status: status,
            roi: `${score > 0 ? '+' : ''}${(score * 2).toFixed(1)}%`,
            // Include raw signal data for breakdown
            total_score: score,
            ml_confidence: data.ml_confidence,
            mean_reversion: data.mean_reversion,
            momentum: data.momentum,
            volatility: data.volatility,
            breakout: data.breakout,
            token: token
          };
        });
      }
      // Fallback to signals prop
      else if (signals && Array.isArray(signals)) {
        signalsToProcess = signals;
      }
      // Fallback to mock data
      else {
        signalsToProcess = getMockSignals();
      }

      // Apply filter
      const filtered = filter === 'all' 
        ? signalsToProcess 
        : signalsToProcess.filter(signal => signal.status === filter);

      setFilteredSignals(filtered);
    };

    convertBackendSignals();
  }, [signalsData, signals, filter]); // ✅ Add dependencies

  // ✅ Mock signals for fallback
  const getMockSignals = () => [
    {
      id: 'signal_btc_1',
      type: 'BUY',
      asset: 'BTC',
      price: 45250.30,
      targetPrice: 47000,
      confidence: 85,
      timeframe: '4h',
      source: 'Technical Analysis',
      timestamp: new Date().toLocaleString(),
      status: 'active',
      roi: '+3.8%',
      total_score: 1.2,
      ml_confidence: 0.85,
      mean_reversion: 0.5,
      momentum: 0.7,
      volatility: 0.3,
      breakout: 0.4,
      token: 'BTC'
    },
    {
      id: 'signal_eth_2',
      type: 'SELL',
      asset: 'ETH',
      price: 3120.45,
      targetPrice: 2950,
      confidence: 72,
      timeframe: '1h',
      source: 'Volume Analysis',
      timestamp: new Date().toLocaleString(),
      status: 'pending',
      roi: '-5.4%',
      total_score: -0.8,
      ml_confidence: 0.72,
      mean_reversion: -0.3,
      momentum: -0.5,
      volatility: 0.6,
      breakout: -0.2,
      token: 'ETH'
    },
    {
      id: 'signal_portfolio_3',
      type: 'REBALANCE',
      asset: 'Portfolio',
      price: null,
      targetPrice: null,
      confidence: 90,
      timeframe: '24h',
      source: 'AI Optimizer',
      timestamp: new Date().toLocaleString(),
      status: 'ready',
      roi: '+2.1%',
      total_score: 0.1,
      ml_confidence: 0.9,
      mean_reversion: 0.1,
      momentum: 0.0,
      volatility: 0.2,
      breakout: 0.1,
      token: 'PORTFOLIO'
    }
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getSignalColor = (type, score) => {
    // Use score if available, otherwise use type
    if (typeof score === 'number') {
      if (score > 0.5) return '#00ff88'; // Green for bullish
      if (score < -0.5) return '#ff6b6b'; // Red for bearish
      return '#ffd700'; // Yellow for neutral
    }
    
    switch(type) {
      case 'BUY': return '#00ff88';
      case 'SELL': return '#ff6b6b';
      case 'REBALANCE': return '#ffd700';
      case 'HOLD': return '#8b5cf6';
      default: return '#8b5cf6';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#00ff88';
      case 'pending': return '#ffd700';
      case 'ready': return '#00d4ff';
      case 'executed': return '#8b5cf6';
      default: return '#666';
    }
  };

  const getSignalStrength = (score) => {
    const absScore = Math.abs(score || 0);
    if (absScore > 1.5) return 'Strong';
    if (absScore > 0.5) return 'Moderate';
    return 'Weak';
  };

  const getSignalDirection = (score) => {
    if (!score) return 'Neutral';
    if (score > 0.1) return 'Bullish';
    if (score < -0.1) return 'Bearish';
    return 'Neutral';
  };

  return (
    <motion.div 
      className="active-signals-container"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="signals-header">
        <div className="header-left">
          <h3 className="signals-title">📡 Active Signals</h3>
          <span className="signals-count">{filteredSignals.length} signals</span>
        </div>
        
        <div className="header-controls">
          <select 
            className="signal-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Signals</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="ready">Ready</option>
            <option value="executed">Executed</option>
          </select>
          
          <motion.button 
            className="refresh-btn"
            onClick={handleRefresh}
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ duration: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            🔄
          </motion.button>
        </div>
      </div>

      <div className="signals-list">
        <AnimatePresence>
          {filteredSignals && filteredSignals.length > 0 ? (
            filteredSignals.map((signal, index) => (
              <motion.div
                key={signal.id || `signal-${index}`}
                className="signal-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="signal-main">
                  <div 
                    className="signal-type-badge" 
                    style={{ backgroundColor: getSignalColor(signal.type, signal.total_score) }}
                  >
                    {signal.type}
                  </div>
                  
                  <div className="signal-info">
                    <div className="signal-asset">
                      <span className="asset-name">{signal.asset}</span>
                      <span className="signal-timeframe">{signal.timeframe}</span>
                      {signal.total_score !== undefined && (
                        <span className="signal-direction" style={{ 
                          color: getSignalColor(signal.type, signal.total_score),
                          fontSize: '0.8rem',
                          marginLeft: '0.5rem'
                        }}>
                          {getSignalDirection(signal.total_score)} • {getSignalStrength(signal.total_score)}
                        </span>
                      )}
                    </div>
                    
                    {signal.price && (
                      <div className="signal-prices">
                        <span className="current-price">${signal.price.toLocaleString()}</span>
                        {signal.targetPrice && (
                          <span className="target-price">→ ${signal.targetPrice.toLocaleString()}</span>
                        )}
                      </div>
                    )}
                    
                    {signal.total_score !== undefined && (
                      <div className="signal-score">
                        <span className="score-label">Signal Score: </span>
                        <span 
                          className="score-value"
                          style={{ color: getSignalColor(signal.type, signal.total_score) }}
                        >
                          {signal.total_score > 0 ? '+' : ''}{signal.total_score.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="signal-metrics">
                    <div className="confidence-meter">
                      <span className="confidence-label">Confidence</span>
                      <div className="confidence-bar">
                        <div 
                          className="confidence-fill"
                          style={{ 
                            width: `${signal.confidence}%`,
                            backgroundColor: signal.confidence > 80 ? '#00ff88' : signal.confidence > 60 ? '#ffd700' : '#ff6b6b'
                          }}
                        />
                      </div>
                      <span className="confidence-value">{signal.confidence}%</span>
                    </div>
                    
                    <div className="signal-roi">
                      <span className={`roi-value ${signal.roi && signal.roi.startsWith('+') ? 'positive' : 'negative'}`}>
                        {signal.roi || '0%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Signal Breakdown for Backend Signals */}
                {signal.mean_reversion !== undefined && (
                  <div className="signal-breakdown">
                    <div className="breakdown-grid">
                      <div className="breakdown-item">
                        <span className="breakdown-label">Mean Reversion:</span>
                        <span 
                          className="breakdown-value"
                          style={{ color: getSignalColor('', signal.mean_reversion) }}
                        >
                          {(signal.mean_reversion || 0).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="breakdown-item">
                        <span className="breakdown-label">Momentum:</span>
                        <span 
                          className="breakdown-value"
                          style={{ color: getSignalColor('', signal.momentum) }}
                        >
                          {(signal.momentum || 0).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="breakdown-item">
                        <span className="breakdown-label">Volatility:</span>
                        <span 
                          className="breakdown-value"
                          style={{ color: getSignalColor('', signal.volatility) }}
                        >
                          {(signal.volatility || 0).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="breakdown-item">
                        <span className="breakdown-label">Breakout:</span>
                        <span 
                          className="breakdown-value"
                          style={{ color: getSignalColor('', signal.breakout) }}
                        >
                          {(signal.breakout || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="signal-footer">
                  <div className="signal-meta">
                    <span className="signal-source">{signal.source}</span>
                    <span className="signal-time">{signal.timestamp}</span>
                  </div>
                  
                  <div className="signal-actions">
                    <div 
                      className="signal-status"
                      style={{ color: getStatusColor(signal.status) }}
                    >
                      <div 
                        className="status-dot"
                        style={{ backgroundColor: getStatusColor(signal.status) }}
                      />
                      {signal.status}
                    </div>
                    
                    {(signal.status === 'active' || signal.status === 'ready') && onExecuteSignal && (
                      <motion.button
                        className="execute-btn"
                        onClick={() => onExecuteSignal(signal)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Execute
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              className="no-signals"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="no-signals-icon">📊</div>
              <p>No {filter !== 'all' ? filter : ''} signals available</p>
              <button className="generate-signals-btn" onClick={handleRefresh}>
                Generate New Signals
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ActiveSignals;