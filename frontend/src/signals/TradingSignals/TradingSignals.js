import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SignalService from '../../services/SignalService';
import NotificationService from '../../services/NotificationService';
import './TradingSignals.css';

// Get initial market prices from SignalService
const INITIAL_MARKET_PRICES = SignalService.getCurrentMarketPrices();

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [marketPrices, setMarketPrices] = useState(INITIAL_MARKET_PRICES);
  const [lastPriceUpdate, setLastPriceUpdate] = useState(Date.now());
  
  // Refs for price update intervals
  const priceUpdateInterval = useRef(null);
  const signalUpdateInterval = useRef(null);

  useEffect(() => {
    initializeSignalService();
    
    // Subscribe to real-time signals
    const signalUnsubscribe = SignalService.subscribe('new_signal', handleNewSignal);
    
    // Subscribe to price updates
    const priceUnsubscribe = SignalService.subscribe('prices_updated', handlePriceUpdate);
    
    // Set up price update interval - for UI animations between API updates
    priceUpdateInterval.current = setInterval(() => {
      microUpdatePrices();
    }, 5000); // Small UI updates every 5 seconds
    
    // Set up signal update interval for UI refresh
    signalUpdateInterval.current = setInterval(() => {
      updateSignalStatuses();
    }, 30000); // Update signal statuses every 30 seconds
    
    return () => {
      signalUnsubscribe();
      priceUnsubscribe();
      SignalService.stopSignalStream();
      
      // Clear intervals on component unmount
      if (priceUpdateInterval.current) clearInterval(priceUpdateInterval.current);
      if (signalUpdateInterval.current) clearInterval(signalUpdateInterval.current);
    };
  }, []);

  // Handle price updates from SignalService
  const handlePriceUpdate = useCallback((prices) => {
    setMarketPrices(prices);
    setLastPriceUpdate(Date.now());
    
    // Update signal prices
    updateSignalPrices(prices);
  }, []);

  // Small UI price updates between API calls
  const microUpdatePrices = () => {
    // Only do micro-updates if it's been more than 10 seconds since the last real update
    if (Date.now() - lastPriceUpdate < 10000) return;
    
    setMarketPrices(prevPrices => {
      const updatedPrices = { ...prevPrices };
      
      // Update each price with tiny random fluctuations for visual effect
      Object.keys(updatedPrices).forEach(symbol => {
        const changePercent = (Math.random() * 0.1) - 0.05; // -0.05% to +0.05%
        const changeAmount = updatedPrices[symbol] * (changePercent / 100);
        updatedPrices[symbol] = parseFloat((updatedPrices[symbol] + changeAmount).toFixed(symbol === 'BTC' ? 2 : 
                                          (symbol === 'ETH' || symbol === 'SOL' || symbol === 'AVAX') ? 2 : 4));
      });
      
      // Also update prices in signals
      updateSignalPrices(updatedPrices);
      
      return updatedPrices;
    });
  };
  
  // Update prices in all signals
  const updateSignalPrices = (updatedPrices) => {
    setSignals(prevSignals => 
      prevSignals.map(signal => {
        if (updatedPrices[signal.symbol]) {
          const newPrice = updatedPrices[signal.symbol];
          // Maintain the same target price percentage difference
          const targetPercentDiff = signal.targetPrice / signal.currentPrice - 1;
          const newTargetPrice = parseFloat((newPrice * (1 + targetPercentDiff)).toFixed(signal.symbol === 'BTC' ? 2 : 
                                           (signal.symbol === 'ETH' || signal.symbol === 'SOL' || signal.symbol === 'AVAX') ? 2 : 4));
          
          // Calculate new price movement indicator
          const priceChange = newPrice - (signal.lastPrice || signal.price);
          const priceChangePercent = priceChange / (signal.lastPrice || signal.price) * 100;
          
          return {
            ...signal,
            currentPrice: newPrice,
            lastPrice: signal.currentPrice || signal.price,
            price: newPrice,
            targetPrice: newTargetPrice,
            priceChange,
            priceChangePercent,
            lastUpdated: Date.now()
          };
        }
        return signal;
      })
    );
  };
  
  // Update signal statuses (active, pending, expired)
  const updateSignalStatuses = () => {
    setSignals(prevSignals => 
      prevSignals.map(signal => {
        // Check if signal is expired (over 24 hours old)
        const isExpired = Date.now() - signal.timestamp > 24 * 60 * 60 * 1000;
        
        // Check if target price was hit
        const targetHit = signal.type === 'BUY' || signal.action === 'buy'
          ? signal.currentPrice >= signal.targetPrice
          : signal.currentPrice <= signal.targetPrice;
          
        // Update signal status
        let updatedStatus = signal.status;
        if (isExpired) {
          updatedStatus = 'expired';
        } else if (targetHit) {
          updatedStatus = 'completed';
        }
        
        return {
          ...signal,
          status: updatedStatus
        };
      })
    );
  };
  
  // Get complete price and market data for a signal
  const getEnhancedSignalData = (signal) => {
    const price = marketPrices[signal.symbol] || signal.price;
    
    // Calculate reasonable target price based on signal type and volatility
    const volatilityFactor = getVolatilityFactor(signal.symbol);
    const targetPercentage = signal.type === 'BUY' || signal.type === 'BULLISH' || signal.action === 'buy'
      ? volatilityFactor 
      : -volatilityFactor;
      
    const targetPrice = parseFloat((price * (1 + targetPercentage)).toFixed(signal.symbol === 'BTC' ? 2 : 
                        (signal.symbol === 'ETH' || signal.symbol === 'SOL' || signal.symbol === 'AVAX') ? 2 : 4));
    
    return {
      ...signal,
      currentPrice: price,
      price,
      targetPrice: signal.targetPrice || targetPrice,
      lastUpdated: Date.now()
    };
  };
  
  // Get estimated volatility factor for different cryptocurrencies
  const getVolatilityFactor = (symbol) => {
    const volatilityMap = {
      'BTC': 0.03, // 3%
      'ETH': 0.04, // 4%
      'SOL': 0.06, // 6% 
      'DOGE': 0.08, // 8%
      'XRP': 0.05, // 5%
      'ADA': 0.06, // 6%
      'DOT': 0.07, // 7%
      'LINK': 0.06, // 6%
      'AVAX': 0.07, // 7%
      'MATIC': 0.06, // 6%
      'UNI': 0.05  // 5%
    };
    
    return volatilityMap[symbol] || 0.05; // Default 5%
  };

  const initializeSignalService = async () => {
    setIsLoading(true);
    try {
      await SignalService.startSignalStream();
      
      // Load initial signals and history
      const initialSignals = SignalService.getActiveSignals();
      const history = SignalService.getSignalHistory(50);
      const metrics = SignalService.getPerformanceMetrics();
      const currentPrices = SignalService.getCurrentMarketPrices();
      
      setMarketPrices(currentPrices);
      
      // Enhance signals with current market prices
      const enhancedSignals = initialSignals.map(signal => getEnhancedSignalData(signal));
      setSignals(enhancedSignals);
      
      setSignalHistory(history);
      setPerformanceMetrics(metrics);
      
      // Add more mock signals for demonstration, also with enhanced price data
      const additionalSignals = getMockAdditionalSignals().map(signal => getEnhancedSignalData(signal));
      setSignals(prevSignals => [...prevSignals, ...additionalSignals]);
      
      // Request a price update
      await SignalService.fetchRealTimePrices();
    } catch (error) {
      console.error('Failed to initialize signal service:', error);
      NotificationService.error('Failed to load signals data');
    } finally {
      setIsLoading(false);
    }
  };

  const getMockAdditionalSignals = () => {
    return [
      {
        id: 'signal_sol_3',
        symbol: 'SOL',
        asset: 'SOL',
        type: 'BUY',
        action: 'buy',
        price: 156.02,
        currentPrice: 156.02,
        targetPrice: 169.40,
        confidence: 78,
        risk: 4,
        timeframe: '4h',
        source: 'AI Analysis',
        timestamp: Date.now() - 1000 * 60 * 15,
        status: 'active',
        signal_score: '+1.2',
        reasoning: 'Technical breakout with increasing volume and bullish MACD crossover',
        indicators: [
          { name: 'RSI', value: '68', status: 'positive' },
          { name: 'MACD', value: 'Bullish', status: 'positive' },
          { name: 'EMA', value: 'Uptrend', status: 'positive' },
          { name: 'Volume', value: 'Increasing', status: 'positive' }
        ]
      },
      {
        id: 'signal_link_4',
        symbol: 'LINK',
        asset: 'LINK',
        type: 'SELL',
        action: 'sell',
        price: 16.85,
        currentPrice: 16.85,
        targetPrice: 15.70,
        confidence: 69,
        risk: 5,
        timeframe: '1d',
        source: 'Technical Analysis',
        timestamp: Date.now() - 1000 * 60 * 45,
        status: 'active',
        signal_score: '-0.9',
        reasoning: 'Bearish divergence on RSI with declining volume profile',
        indicators: [
          { name: 'RSI', value: '38', status: 'negative' },
          { name: 'MACD', value: 'Bearish', status: 'negative' },
          { name: 'EMA', value: 'Downtrend', status: 'negative' },
          { name: 'Volume', value: 'Decreasing', status: 'negative' }
        ]
      },
      {
        id: 'signal_ada_5',
        symbol: 'ADA',
        asset: 'ADA',
        type: 'BUY',
        action: 'buy',
        price: 0.58,
        currentPrice: 0.58,
        targetPrice: 0.67,
        confidence: 75,
        risk: 3,
        timeframe: '4h',
        source: 'AI Analysis',
        timestamp: Date.now() - 1000 * 60 * 30,
        status: 'active',
        signal_score: '+1.1',
        reasoning: 'Accumulation pattern with strong support level confirmed',
        indicators: [
          { name: 'RSI', value: '52', status: 'positive' },
          { name: 'MACD', value: 'Bullish', status: 'positive' },
          { name: 'EMA', value: 'Uptrend', status: 'positive' },
          { name: 'Volume', value: 'Stable', status: 'neutral' }
        ]
      },
      {
        id: 'signal_dot_6',
        symbol: 'DOT',
        asset: 'DOT',
        type: 'BUY',
        action: 'buy',
        price: 7.95,
        currentPrice: 7.95,
        targetPrice: 8.65,
        confidence: 82,
        risk: 2,
        timeframe: '1d',
        source: 'AI Analysis',
        timestamp: Date.now() - 1000 * 60 * 60,
        status: 'active',
        signal_score: '+1.4',
        reasoning: 'Strong buy signal with multiple indicators showing bullish momentum',
        indicators: [
          { name: 'RSI', value: '61', status: 'positive' },
          { name: 'MACD', value: 'Bullish', status: 'positive' },
          { name: 'EMA', value: 'Uptrend', status: 'positive' },
          { name: 'Volume', value: 'High', status: 'positive' }
        ]
      },
      {
        id: 'signal_avax_7',
        symbol: 'AVAX',
        asset: 'AVAX',
        type: 'SELL',
        action: 'sell',
        price: 35.12,
        currentPrice: 35.12,
        targetPrice: 32.50,
        confidence: 68,
        risk: 4,
        timeframe: '4h',
        source: 'Technical Analysis',
        timestamp: Date.now() - 1000 * 60 * 20,
        status: 'active',
        signal_score: '-0.8',
        reasoning: 'Potential breakdown with increasing selling pressure',
        indicators: [
          { name: 'RSI', value: '35', status: 'negative' },
          { name: 'MACD', value: 'Bearish', status: 'negative' },
          { name: 'EMA', value: 'Downtrend', status: 'negative' },
          { name: 'Volume', value: 'High', status: 'negative' }
        ]
      },
      {
        id: 'signal_doge_8',
        symbol: 'DOGE',
        asset: 'DOGE',
        type: 'BUY',
        action: 'buy',
        price: 0.1857,
        currentPrice: 0.1857,
        targetPrice: 0.2050,
        confidence: 70,
        risk: 6,
        timeframe: '1h',
        source: 'AI Analysis',
        timestamp: Date.now() - 1000 * 60 * 10,
        status: 'active',
        signal_score: '+0.9',
        reasoning: 'Short-term momentum opportunity with social sentiment spike',
        indicators: [
          { name: 'RSI', value: '59', status: 'neutral' },
          { name: 'MACD', value: 'Bullish', status: 'positive' },
          { name: 'EMA', value: 'Sideways', status: 'neutral' },
          { name: 'Volume', value: 'Increasing', status: 'positive' }
        ]
      },
      {
        id: 'signal_btc_1',
        symbol: 'BTC',
        asset: 'BTC',
        type: 'BUY',
        action: 'buy',
        price: 107455.95,
        currentPrice: 107455.95,
        targetPrice: 111754.19,
        confidence: 85,
        risk: 3,
        timeframe: '4h',
        source: 'AI Technical Analysis',
        timestamp: Date.now(),
        status: 'active',
        signal_score: '+1.2',
        reasoning: 'Multiple indicators show bullish momentum with strong volume profile',
        indicators: [
          { name: 'RSI', value: '63', status: 'positive' },
          { name: 'MACD', value: 'Bullish', status: 'positive' },
          { name: 'EMA', value: 'Uptrend', status: 'positive' },
          { name: 'Volume', value: 'High', status: 'positive' }
        ]
      },
      {
        id: 'signal_eth_2',
        symbol: 'ETH',
        asset: 'ETH',
        type: 'SELL',
        action: 'sell',
        price: 2539.54,
        currentPrice: 2539.54,
        targetPrice: 2464.00,
        confidence: 72,
        risk: 4,
        timeframe: '1h',
        source: 'Technical Analysis',
        timestamp: Date.now() - 1000 * 60 * 5,
        status: 'pending',
        signal_score: '-0.8',
        reasoning: 'Bearish divergence on multiple timeframes with decreasing buy volume',
        indicators: [
          { name: 'RSI', value: '42', status: 'negative' },
          { name: 'MACD', value: 'Bearish', status: 'negative' },
          { name: 'EMA', value: 'Downtrend', status: 'negative' },
          { name: 'Volume', value: 'Decreasing', status: 'negative' }
        ]
      },
      {
        id: 'signal_xrp_9',
        symbol: 'XRP',
        asset: 'XRP',
        type: 'SELL',
        action: 'sell',
        price: 2.26,
        currentPrice: 2.26,
        targetPrice: 2.15,
        confidence: 68,
        risk: 5,
        timeframe: '4h',
        source: 'AI Analysis',
        timestamp: Date.now() - 1000 * 60 * 25,
        status: 'active',
        signal_score: '-0.9',
        reasoning: 'Bearish trend confirmation with increased selling pressure',
        indicators: [
          { name: 'RSI', value: '40', status: 'negative' },
          { name: 'MACD', value: 'Bearish', status: 'negative' },
          { name: 'EMA', value: 'Downtrend', status: 'negative' },
          { name: 'Volume', value: 'High', status: 'negative' }
        ]
      }
    ];
  };

  const handleNewSignal = useCallback((signal) => {
    // Update the signal with current market price if available
    const updatedSignal = marketPrices[signal.symbol]
      ? { 
          ...signal, 
          currentPrice: marketPrices[signal.symbol],
          price: marketPrices[signal.symbol],
          targetPrice: signal.action === 'buy' || signal.type === 'BUY' 
            ? marketPrices[signal.symbol] * 1.05 
            : marketPrices[signal.symbol] * 0.95
        }
      : signal;
    
    setSignals(prev => [updatedSignal, ...prev.slice(0, 19)]); // Keep latest 20
    
    // Show notification for high-confidence signals
    if (signal.confidence >= signalSettings.minConfidence) {
      NotificationService.aiSignal(signal);
    }
    
    // Auto-execute if enabled and conditions met
    if (signalSettings.autoExecute && 
        signal.confidence >= signalSettings.minConfidence &&
        signal.risk <= signalSettings.maxRisk) {
      executeSignal(updatedSignal);
    }
  }, [signalSettings, marketPrices]);

  const executeSignal = async (signal) => {
    try {
      const result = await SignalService.executeSignal(signal.symbol, {
        amount: calculateTradeAmount(signal),
        stopLoss: signal.stopLoss || (signal.price * 0.95),
        takeProfit: signal.takeProfit || (signal.price * 1.05)
      });
      
      NotificationService.success(
        `Signal executed: ${signal.action?.toUpperCase() || signal.type} ${signal.symbol}`,
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
    const riskMultiplier = 1 - (signal.risk / 10); // Risk is on scale of 1-10
    
    return baseAmount * confidenceMultiplier * riskMultiplier;
  };

  const dismissSignal = (signalId) => {
    SignalService.dismissSignal(signalId);
    setSignals(prev => prev.filter(s => s.id !== signalId));
    NotificationService.info('Signal dismissed');
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
    return icons[type?.toLowerCase()] || '📊';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return '#2ecc71';
    if (confidence >= 80) return '#27ae60';
    if (confidence >= 70) return '#3498db';
    if (confidence >= 60) return '#f39c12';
    return '#95a5a6';
  };

  const getRiskColor = (risk) => {
    if (risk <= 2) return '#2ecc71';
    if (risk <= 5) return '#3498db';
    if (risk <= 8) return '#f39c12';
    return '#e74c3c';
  };

  const filteredSignals = signals.filter(signal => {
    if (filterCriteria.confidence && signal.confidence < filterCriteria.confidence) return false;
    if (filterCriteria.asset !== 'all' && signal.symbol !== filterCriteria.asset) return false;
    if (filterCriteria.signalType !== 'all') {
      if (signal.type && signal.type.toLowerCase() !== filterCriteria.signalType.toLowerCase()) return false;
      if (signal.action && signal.action.toLowerCase() !== filterCriteria.signalType.toLowerCase()) return false;
    }
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

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Format price based on cryptocurrency
  const formatPrice = (price, symbol) => {
    if (!price) return '$0';
    
    if (symbol === 'BTC') {
      return `$${parseFloat(price).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}`;
    } else if (['ETH', 'SOL', 'AVAX'].includes(symbol)) {
      return `$${parseFloat(price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    } else if (['DOGE', 'XRP', 'ADA', 'MATIC', 'LINK'].includes(symbol)) {
      if (parseFloat(price) < 1) {
        return `$${parseFloat(price).toLocaleString(undefined, {minimumFractionDigits: 4, maximumFractionDigits: 4})}`;
      }
      return `$${parseFloat(price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    
    // Default formatting
    return `$${parseFloat(price).toLocaleString()}`;
  };

  // Price change indicators for UI
  const getPriceChangeIndicator = (signal) => {
    if (!signal.priceChange) return null;
    
    return (
      <span className={`price-change ${signal.priceChange > 0 ? 'positive' : signal.priceChange < 0 ? 'negative' : ''}`}>
        {signal.priceChange > 0 ? '↑' : signal.priceChange < 0 ? '↓' : ''}
        {Math.abs(signal.priceChangePercent || 0).toFixed(2)}%
      </span>
    );
  };

  return (
    <div className="trading-signals">
      {/* Header */}
      <div className="signals-header">
        <div className="header-title">
          <h2>AI Trading Signals</h2>
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
          
          <button className="settings-btn" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <motion.div 
        className="performance-metrics"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <motion.div 
          className="metric-card"
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="metric-value">{performanceMetrics.winRate || 0}%</div>
          <div className="metric-label">Win Rate</div>
        </motion.div>
        <motion.div 
          className="metric-card"
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="metric-value">{performanceMetrics.totalPnL || 0}%</div>
          <div className="metric-label">Total P&L</div>
        </motion.div>
        <motion.div 
          className="metric-card"
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="metric-value">{performanceMetrics.sharpeRatio || 0}</div>
          <div className="metric-label">Sharpe Ratio</div>
        </motion.div>
        <motion.div 
          className="metric-card"
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="metric-value">{signals.length}</div>
          <div className="metric-label">Active Signals</div>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div 
        className="signal-filters"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="filter-group">
          <label>Min Confidence</label>
          <div className="range-container">
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
            <span className="range-value">{filterCriteria.confidence}%</span>
          </div>
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
            <option value="SOL">Solana</option>
            <option value="ADA">Cardano</option>
            <option value="DOT">Polkadot</option>
            <option value="LINK">Chainlink</option>
            <option value="AVAX">Avalanche</option>
            <option value="DOGE">Dogecoin</option>
            <option value="XRP">Ripple</option>
            <option value="MATIC">Polygon</option>
            <option value="UNI">Uniswap</option>
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
            <option value="bullish">Bullish</option>
            <option value="bearish">Bearish</option>
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
      </motion.div>

      {/* Loading State */}
      {isLoading ? (
        <div className="signals-loading">
          <div className="loading-spinner"></div>
          <p>Loading signals data...</p>
        </div>
      ) : (
        <>
          {/* Signals Grid */}
          <div className="signals-grid">
            <AnimatePresence>
              {filteredSignals.map((signal, index) => (
                <motion.div
                  key={signal.id}
                  className={`signal-card ${signal.action?.toLowerCase() || signal.type?.toLowerCase() || ''} ${signal.priority || ''}`}
                  data-symbol={signal.symbol}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  onClick={() => setActiveSignal(signal)}
                >
                  {/* Status Indicator */}
                  <div className={`status-indicator ${signal.status || 'active'}`}></div>
                  
                  {/* Signal Header */}
                  <div className="signal-header">
                    <div className={`signal-icon ${(signal.action === 'buy' || signal.type === 'BUY') ? 'buy' : 
                             (signal.action === 'sell' || signal.type === 'SELL') ? 'sell' : 'neutral'}`}>
                      {getSignalIcon(signal.type || signal.action || '')}
                    </div>
                    <div className="signal-title">
                      <span className="symbol">{signal.symbol}</span>
                      <span className="time-ago">{getTimeAgo(signal.timestamp)}</span>
                    </div>
                    <div className={`signal-badge ${(signal.action === 'buy' || signal.type === 'BUY') ? 'buy' : 
                                  (signal.action === 'sell' || signal.type === 'SELL') ? 'sell' : 'neutral'}`}>
                      {signal.action?.toUpperCase() || signal.type}
                    </div>
                  </div>

                  {/* Signal Content */}
                  <div className="signal-content">
                    <div className="price-info">
                      <div className={`current-price ${signal.lastUpdated && Date.now() - signal.lastUpdated < 5000 ? 'updated' : ''}`}>
                        {formatPrice(signal.currentPrice || signal.price, signal.symbol)}
                        {getPriceChangeIndicator(signal)}
                      </div>
                      <div className="target-price">
                        <span>Target:</span> {formatPrice(signal.targetPrice || (signal.price * (signal.action === 'buy' || signal.type === 'BUY' ? 1.05 : 0.95)), signal.symbol)}
                      </div>
                      
                      {/* Price Details Tooltip */}
                      <div className="price-detail-tooltip">
                        <div className="price-detail-row">
                          <span className="price-detail-label">24h High:</span>
                          <span className="price-detail-value">
                            {formatPrice(signal.currentPrice * 1.03, signal.symbol)}
                          </span>
                        </div>
                        <div className="price-detail-row">
                          <span className="price-detail-label">24h Low:</span>
                          <span className="price-detail-value">
                            {formatPrice(signal.currentPrice * 0.97, signal.symbol)}
                          </span>
                        </div>
                        <div className="price-detail-row">
                          <span className="price-detail-label">Volume:</span>
                          <span className="price-detail-value">
                            ${(signal.currentPrice * (Math.random() * 500000 + 100000)).toLocaleString(undefined, {maximumFractionDigits: 0})}
                          </span>
                        </div>
                        <div className="price-detail-row">
                          <span className="price-detail-label">Updated:</span>
                          <span className="price-detail-value">
                            {signal.lastUpdated ? new Date(signal.lastUpdated).toLocaleTimeString() : 'Just now'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="signal-metrics">
                      <div className="metric">
                        <span className="metric-label">Confidence</span>
                        <div className="confidence-bar-container">
                          <div 
                            className="confidence-bar" 
                            style={{ 
                              width: `${signal.confidence}%`, 
                              backgroundColor: getConfidenceColor(signal.confidence) 
                            }}
                          ></div>
                          <span className="confidence-value">{signal.confidence}%</span>
                        </div>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Risk</span>
                        <div className="risk-indicator">
                          <span 
                            className="risk-value"
                            style={{ color: getRiskColor(signal.risk || 5) }}
                          >
                            {signal.risk || 5}/10
                          </span>
                        </div>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Signal</span>
                        <span className={`signal-score ${parseFloat(signal.signal_score || 0) >= 0 ? 'positive' : 'negative'}`}>
                          {signal.signal_score || signal.total_score || (signal.action === 'buy' ? "+1.2" : "-0.8")}
                        </span>
                      </div>
                    </div>

                    <div className="signal-reasoning">
                      <p>{signal.reasoning || signal.description || `${signal.action || signal.type} signal based on ${signal.source || 'algorithmic'} analysis.`}</p>
                    </div>

                    {/* Technical Indicators */}
                    <div className="technical-indicators">
                      {signal.indicators ? (
                        signal.indicators.slice(0, 4).map((indicator, idx) => (
                          <div key={idx} className={`indicator ${indicator.status}`}>
                            <span className="indicator-name">{indicator.name}</span>
                            <span className="indicator-value">{indicator.value}</span>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className={`indicator ${signal.mean_reversion > 0 ? 'positive' : 'negative'}`}>
                            <span className="indicator-name">Mean Rev</span>
                            <span className="indicator-value">{signal.mean_reversion || 0}</span>
                          </div>
                          <div className={`indicator ${signal.momentum > 0 ? 'positive' : 'negative'}`}>
                            <span className="indicator-name">Momentum</span>
                            <span className="indicator-value">{signal.momentum || 0}</span>
                          </div>
                          <div className={`indicator neutral`}>
                            <span className="indicator-name">Volatility</span>
                            <span className="indicator-value">{signal.volatility || 0}</span>
                          </div>
                          <div className={`indicator ${signal.breakout > 0 ? 'positive' : 'negative'}`}>
                            <span className="indicator-name">Breakout</span>
                            <span className="indicator-value">{signal.breakout || 0}</span>
                          </div>
                        </>
                      )}
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
        </>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <motion.div 
          className="settings-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsSettingsOpen(false)}
        >
          <motion.div
            className="settings-modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Signal Settings</h3>
              <button className="modal-close" onClick={() => setIsSettingsOpen(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="settings-group">
                <label>Minimum Confidence for Auto-Trading</label>
                <div className="range-container">
                  <input
                    type="range"
                    min="60"
                    max="95"
                    value={signalSettings.minConfidence}
                    onChange={(e) => setSignalSettings(prev => ({
                      ...prev,
                      minConfidence: parseInt(e.target.value)
                    }))}
                  />
                  <span>{signalSettings.minConfidence}%</span>
                </div>
              </div>
              <div className="settings-group">
                <label>Maximum Risk Level</label>
                <div className="range-container">
                  <input
                    type="range"
                    min="1"
                    max="9"
                    value={signalSettings.maxRisk}
                    onChange={(e) => setSignalSettings(prev => ({
                      ...prev,
                      maxRisk: parseInt(e.target.value)
                    }))}
                  />
                  <span>{signalSettings.maxRisk}/10</span>
                </div>
              </div>
              <div className="settings-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={signalSettings.autoExecute}
                    onChange={(e) => setSignalSettings(prev => ({
                      ...prev,
                      autoExecute: e.target.checked
                    }))}
                  />
                  <span className="toggle-slider"></span>
                  Auto-Execute High Confidence Signals
                </label>
                <p className="setting-description">
                  When enabled, signals that meet minimum confidence and maximum risk settings will be executed automatically
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-save" onClick={() => setIsSettingsOpen(false)}>Save Settings</button>
            </div>
          </motion.div>
        </motion.div>
      )}

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
  // Import formatPrice function from parent component
  const formatPrice = (price, symbol) => {
    if (!price) return '$0';
    
    if (symbol === 'BTC') {
      return `$${parseFloat(price).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}`;
    } else if (['ETH', 'SOL', 'AVAX'].includes(symbol)) {
      return `$${parseFloat(price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    } else if (['DOGE', 'XRP', 'ADA', 'MATIC', 'LINK'].includes(symbol)) {
      if (parseFloat(price) < 1) {
        return `$${parseFloat(price).toLocaleString(undefined, {minimumFractionDigits: 4, maximumFractionDigits: 4})}`;
      }
      return `$${parseFloat(price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    
    // Default formatting
    return `$${parseFloat(price).toLocaleString()}`;
  };

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
          <h3>
            <span className={`signal-icon ${(signal.action === 'buy' || signal.type === 'BUY') ? 'buy' : 
                      (signal.action === 'sell' || signal.type === 'SELL') ? 'sell' : 'neutral'}`}>
              {(signal.action === 'buy' || signal.type === 'BUY') ? '🟢' : 
              (signal.action === 'sell' || signal.type === 'SELL') ? '🔴' : '🔵'}
            </span>
            {signal.symbol} {signal.action ? signal.action.toUpperCase() : signal.type} Signal
          </h3>
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
              <span className="stat-value">{signal.risk || 5}/10</span>
            </div>
            <div className="overview-stat">
              <span className="stat-label">Signal Score</span>
              <span className="stat-value">{signal.signal_score || signal.total_score || (signal.action === 'buy' ? "+1.2" : "-0.8")}</span>
            </div>
            <div className="overview-stat">
              <span className="stat-label">Timeframe</span>
              <span className="stat-value">{signal.timeframe || '4h'}</span>
            </div>
          </div>

          <div className="signal-analysis">
            <h4>Technical Analysis</h4>
            <div className="analysis-content">
              <p>{signal.detailedAnalysis || signal.reasoning || signal.description || `${signal.symbol} is showing ${signal.action === 'buy' ? 'bullish' : 'bearish'} momentum with strong ${signal.type || 'technical'} indicators. The ${signal.timeframe || '4h'} chart confirms this trend direction.`}</p>
              
              <div className="price-levels">
                <div className="level">
                  <span>Entry Price:</span>
                  <span>{formatPrice(signal.currentPrice || signal.price, signal.symbol)}</span>
                </div>
                <div className="level">
                  <span>Target Price:</span>
                  <span>{formatPrice(signal.targetPrice || (signal.price * (signal.action === 'buy' || signal.type === 'BUY' ? 1.05 : 0.95)), signal.symbol)}</span>
                </div>
                <div className="level">
                  <span>Stop Loss:</span>
                  <span>{formatPrice(signal.stopLoss || (signal.price * 0.95), signal.symbol)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="signal-chart">
            <h4>Indicator Analysis</h4>
            <div className="technical-indicators expanded">
              {signal.indicators ? (
                signal.indicators.map((indicator, idx) => (
                  <div key={idx} className={`indicator ${indicator.status}`}>
                    <span className="indicator-name">{indicator.name}</span>
                    <span className="indicator-value">{indicator.value}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className={`indicator ${signal.mean_reversion > 0 ? 'positive' : 'negative'}`}>
                    <span className="indicator-name">Mean Reversion</span>
                    <span className="indicator-value">{signal.mean_reversion || 0}</span>
                  </div>
                  <div className={`indicator ${signal.momentum > 0 ? 'positive' : 'negative'}`}>
                    <span className="indicator-name">Momentum</span>
                    <span className="indicator-value">{signal.momentum || 0}</span>
                  </div>
                  <div className={`indicator neutral`}>
                    <span className="indicator-name">Volatility</span>
                    <span className="indicator-value">{signal.volatility || 0}</span>
                  </div>
                  <div className={`indicator ${signal.breakout > 0 ? 'positive' : 'negative'}`}>
                    <span className="indicator-name">Breakout</span>
                    <span className="indicator-value">{signal.breakout || 0}</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="chart-container">
              <div className="chart-placeholder">
                <div className="chart-icon">📈</div>
                <p>Interactive chart visualization will be available soon</p>
              </div>
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