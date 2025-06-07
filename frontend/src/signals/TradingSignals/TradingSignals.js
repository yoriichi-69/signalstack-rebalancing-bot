import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SignalService from '../../../services/SignalService';
import NotificationService from '../../../services/NotificationService';
import './TradingSignals.css';

const TradingSignals = () => {
  const [signals, setSignals] = useState([]);
  const [activeSignal, setActiveSignal] = useState(null);
  const [signalHistory, setSignalHistory] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [filterCriteria, setFilterCriteria] = useState({
    confidence: 70,
    timeframe: 'all',
    asset: 'all',
    signalType: 'all'
  });
  const [isAutoTrading, setIsAutoTrading] = useState(false);
  const [signalSettings, setSignalSettings] = useState({
    minConfidence: 80,
    maxRisk: 5,
    autoExecute: false
  });

  useEffect(() => {
    initializeSignalService();
    
    // Subscribe to real-time signals
    const unsubscribe = SignalService.subscribe('new_signal', handleNewSignal);
    
    return () => {
      unsubscribe();
      SignalService.stopSignalStream();
    };
  }, []);

  const initializeSignalService = async () => {
    try {
      await SignalService.startSignalStream();
      
      // Load initial signals and history
      const initialSignals = SignalService.getActiveSignals();
      const history = SignalService.getSignalHistory(50);
      const metrics = SignalService.getPerformanceMetrics();
      
      setSignals(initialSignals);
      setSignalHistory(history);
      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error('Failed to initialize signal service:', error);
    }
  };

  const handleNewSignal = useCallback((signal) => {
    setSignals(prev => [signal, ...prev.slice(0, 19)]); // Keep latest 20
    
    // Show notification for high-confidence signals
    if (signal.confidence >= signalSettings.minConfidence) {
      NotificationService.aiSignal(signal);
    }
    
    // Auto-execute if enabled and conditions met
    if (signalSettings.autoExecute && 
        signal.confidence >= signalSettings.minConfidence &&
        signal.risk <= signalSettings.maxRisk) {
      executeSignal(signal);
    }
  }, [signalSettings]);

  const executeSignal = async (signal) => {
    try {
      const result = await SignalService.executeSignal(signal.id, {
        amount: calculateTradeAmount(signal),
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit
      });
      
      NotificationService.success(
        `Signal executed: ${signal.action} ${signal.symbol}`,
        { metadata: { signalId: signal.id, result } }
      );
      
      // Update signal status
      setSignals(prev => 
        prev.map(s => s.id === signal.id ? { ...s, status: 'executed' } : s)
      );
    } catch (error) {
      NotificationService.error(
        `Failed to execute signal: ${error.message}`,
        { metadata: { signalId: signal.id } }
      );
    }
  };

  const calculateTradeAmount = (signal) => {
    const baseAmount = 1000; // Base trade amount
    const confidenceMultiplier = signal.confidence / 100;
    const riskMultiplier = 1 - (signal.risk / 100);
    
    return baseAmount * confidenceMultiplier * riskMultiplier;
  };

  const dismissSignal = (signalId) => {
    SignalService.dismissSignal(signalId);
    setSignals(prev => prev.filter(s => s.id !== signalId));
  };

  const getSignalIcon = (type) => {
    const icons = {
      'buy': '🟢',
      'sell': '🔴',
      'hold': '🟡',
      'bullish': '📈',
      'bearish': '📉',
      'neutral': '➖',
      'breakout': '🚀',
      'reversal': '🔄',
      'momentum': '⚡'
    };
    return icons[type] || '📊';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return '#2ecc71';
    if (confidence >= 80) return '#f39c12';
    if (confidence >= 70) return '#3498db';
    if (confidence >= 60) return '#9b59b6';
    return '#95a5a6';
  };

  const getRiskColor = (risk) => {
    if (risk <= 2) return '#2ecc71';
    if (risk <= 5) return '#f39c12';
    if (risk <= 8) return '#e67e22';
    return '#e74c3c';
  };

  const filteredSignals = signals.filter(signal => {
    if (filterCriteria.confidence && signal.confidence < filterCriteria.confidence) return false;
    if (filterCriteria.asset !== 'all' && signal.symbol !== filterCriteria.asset) return false;
    if (filterCriteria.signalType !== 'all' && signal.type !== filterCriteria.signalType) return false;
    if (filterCriteria.timeframe !== 'all') {
      const timeLimit = {
        '1h': 60 * 60 * 1000,
        '4h': 4 * 60 * 60 * 1000,
        '1d': 24 * 60 * 60 * 1000,
        '1w': 7 * 24 * 60 * 60 * 1000
      }[filterCriteria.timeframe];
      
      if (Date.now() - signal.timestamp > timeLimit) return false;
    }
    return true;
  });

  return (
    <div className="trading-signals">
      {/* Header */}
      <div className="signals-header">
        <div className="header-title">
          <h2>🤖 AI Trading Signals</h2>
          <div className="signal-status">
            <span className="status-dot active"></span>
            <span>Live Analysis</span>
          </div>
        </div>

        <div className="header-controls">
          <div className="auto-trading-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={isAutoTrading}
                onChange={(e) => setIsAutoTrading(e.target.checked)}
              />
              <span className="toggle-slider"></span>
              Auto Trading
            </label>
          </div>
          
          <button className="settings-btn">
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="performance-metrics">
        <div className="metric-card">
          <div className="metric-value">{performanceMetrics.winRate || 0}%</div>
          <div className="metric-label">Win Rate</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{performanceMetrics.totalPnL || 0}%</div>
          <div className="metric-label">Total P&L</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{performanceMetrics.sharpeRatio || 0}</div>
          <div className="metric-label">Sharpe Ratio</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{signals.length}</div>
          <div className="metric-label">Active Signals</div>
        </div>
      </div>

      {/* Filters */}
      <div className="signal-filters">
        <div className="filter-group">
          <label>Min Confidence</label>
          <input
            type="range"
            min="50"
            max="95"
            value={filterCriteria.confidence}
            onChange={(e) => setFilterCriteria(prev => ({
              ...prev,
              confidence: parseInt(e.target.value)
            }))}
          />
          <span>{filterCriteria.confidence}%</span>
        </div>

        <div className="filter-group">
          <label>Asset</label>
          <select
            value={filterCriteria.asset}
            onChange={(e) => setFilterCriteria(prev => ({
              ...prev,
              asset: e.target.value
            }))}
          >
            <option value="all">All Assets</option>
            <option value="BTC">Bitcoin</option>
            <option value="ETH">Ethereum</option>
            <option value="ADA">Cardano</option>
            <option value="DOT">Polkadot</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Signal Type</label>
          <select
            value={filterCriteria.signalType}
            onChange={(e) => setFilterCriteria(prev => ({
              ...prev,
              signalType: e.target.value
            }))}
          >
            <option value="all">All Types</option>
            <option value="buy">Buy Signals</option>
            <option value="sell">Sell Signals</option>
            <option value="breakout">Breakouts</option>
            <option value="reversal">Reversals</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Timeframe</label>
          <select
            value={filterCriteria.timeframe}
            onChange={(e) => setFilterCriteria(prev => ({
              ...prev,
              timeframe: e.target.value
            }))}
          >
            <option value="all">All Time</option>
            <option value="1h">Last Hour</option>
            <option value="4h">Last 4 Hours</option>
            <option value="1d">Last Day</option>
            <option value="1w">Last Week</option>
          </select>
        </div>
      </div>

      {/* Signals Grid */}
      <div className="signals-grid">
        <AnimatePresence>
          {filteredSignals.map((signal, index) => (
            <motion.div
              key={signal.id}
              className={`signal-card ${signal.action} ${signal.priority}`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => setActiveSignal(signal)}
            >
              {/* Signal Header */}
              <div className="signal-header">
                <div className="signal-icon">
                  {getSignalIcon(signal.type)}
                </div>
                <div className="signal-title">
                  <span className="symbol">{signal.symbol}</span>
                  <span className="action">{signal.action.toUpperCase()}</span>
                </div>
                <div className="signal-time">
                  {new Date(signal.timestamp).toLocaleTimeString()}
                </div>
              </div>

              {/* Signal Content */}
              <div className="signal-content">
                <div className="price-info">
                  <div className="current-price">
                    ${signal.currentPrice.toLocaleString()}
                  </div>
                  <div className="target-price">
                    Target: ${signal.targetPrice.toLocaleString()}
                  </div>
                </div>

                <div className="signal-metrics">
                  <div className="metric">
                    <span className="metric-label">Confidence</span>
                    <span 
                      className="metric-value confidence"
                      style={{ color: getConfidenceColor(signal.confidence) }}
                    >
                      {signal.confidence}%
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Risk</span>
                    <span 
                      className="metric-value risk"
                      style={{ color: getRiskColor(signal.risk) }}
                    >
                      {signal.risk}/10
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">R/R</span>
                    <span className="metric-value ratio">
                      1:{signal.rewardRisk.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="signal-reasoning">
                  <p>{signal.reasoning}</p>
                </div>

                {/* Technical Indicators */}
                <div className="technical-indicators">
                  {signal.indicators.map((indicator, idx) => (
                    <div key={idx} className={`indicator ${indicator.status}`}>
                      <span className="indicator-name">{indicator.name}</span>
                      <span className="indicator-value">{indicator.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signal Actions */}
              <div className="signal-actions">
                <button
                  className="action-btn execute"
                  onClick={(e) => {
                    e.stopPropagation();
                    executeSignal(signal);
                  }}
                >
                  🚀 Execute
                </button>
                <button
                  className="action-btn analyze"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSignal(signal);
                  }}
                >
                  📊 Analyze
                </button>
                <button
                  className="action-btn dismiss"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissSignal(signal.id);
                  }}
                >
                  ✕ Dismiss
                </button>
              </div>

              {/* Priority Indicator */}
              {signal.priority === 'high' && (
                <div className="priority-badge high">HIGH</div>
              )}
              {signal.priority === 'critical' && (
                <div className="priority-badge critical">CRITICAL</div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredSignals.length === 0 && (
          <div className="no-signals">
            <span className="no-signals-icon">🤖</span>
            <p>No signals match your current filters</p>
            <button onClick={() => setFilterCriteria({
              confidence: 50,
              timeframe: 'all',
              asset: 'all',
              signalType: 'all'
            })}>
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Signal Detail Modal */}
      <AnimatePresence>
        {activeSignal && (
          <SignalDetailModal 
            signal={activeSignal} 
            onClose={() => setActiveSignal(null)}
            onExecute={executeSignal}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Signal Detail Modal Component
const SignalDetailModal = ({ signal, onClose, onExecute }) => {
  return (
    <motion.div
      className="signal-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="signal-modal"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{signal.symbol} {signal.action.toUpperCase()} Signal</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="signal-overview">
            <div className="overview-stat">
              <span className="stat-label">Confidence</span>
              <span className="stat-value">{signal.confidence}%</span>
            </div>
            <div className="overview-stat">
              <span className="stat-label">Risk Level</span>
              <span className="stat-value">{signal.risk}/10</span>
            </div>
            <div className="overview-stat">
              <span className="stat-label">R/R Ratio</span>
              <span className="stat-value">1:{signal.rewardRisk.toFixed(1)}</span>
            </div>
            <div className="overview-stat">
              <span className="stat-label">Timeframe</span>
              <span className="stat-value">{signal.timeframe}</span>
            </div>
          </div>

          <div className="signal-analysis">
            <h4>Technical Analysis</h4>
            <div className="analysis-content">
              <p>{signal.detailedAnalysis}</p>
              
              <div className="price-levels">
                <div className="level">
                  <span>Entry Price:</span>
                  <span>${signal.currentPrice.toLocaleString()}</span>
                </div>
                <div className="level">
                  <span>Target Price:</span>
                  <span>${signal.targetPrice.toLocaleString()}</span>
                </div>
                <div className="level">
                  <span>Stop Loss:</span>
                  <span>${signal.stopLoss.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="signal-chart">
            <h4>Price Chart</h4>
            {/* Chart component would go here */}
            <div className="chart-placeholder">
              📈 Chart visualization coming soon
            </div>
          </div>

          <div className="modal-actions">
            <button
              className="action-btn execute"
              onClick={() => onExecute(signal)}
            >
              🚀 Execute Signal
            </button>
            <button
              className="action-btn secondary"
              onClick={onClose}
            >
              📱 Set Alert
            </button>
            <button
              className="action-btn tertiary"
              onClick={onClose}
            >
              📤 Share
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TradingSignals;