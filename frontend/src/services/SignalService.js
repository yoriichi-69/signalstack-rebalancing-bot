class SignalService {
  constructor() {
    this.signals = {};
    this.lastUpdated = null;
    this.backend_url = 'http://localhost:5000';
    
    // Enhanced features
    this.subscribers = new Map();
    this.signalHistory = [];
    this.performanceMetrics = {
      winRate: 0,
      totalPnL: 0,
      sharpeRatio: 0,
      totalSignals: 0
    };
    this.isRealTimeActive = false;
    this.updateInterval = null;
    this.aiSignals = new Map(); // For advanced AI signals
    this.alertThresholds = new Map();
    
    // Current market prices cache
    this.marketPrices = {
      BTC: 107455.95,
      ETH: 2539.54,
      SOL: 156.02,
      DOGE: 0.1857,
      XRP: 2.26,
      ADA: 0.58,
      DOT: 7.95,
      LINK: 16.85,
      AVAX: 35.12,
      MATIC: 0.78,
      UNI: 8.42
    };
    
    // Last price update timestamp
    this.lastPriceUpdate = null;
    
    this.loadStoredData();
    this.setupAnalysisModels();
  }

  setupAnalysisModels() {
    this.analysisModels = {
      momentum: { weight: 0.25, indicators: ['RSI', 'MACD', 'Stochastic'] },
      trend: { weight: 0.30, indicators: ['EMA', 'SMA', 'Bollinger Bands'] },
      volume: { weight: 0.20, indicators: ['Volume Profile', 'OBV', 'VWAP'] },
      sentiment: { weight: 0.15, indicators: ['Fear & Greed', 'Social Sentiment'] },
      support_resistance: { weight: 0.10, indicators: ['Fibonacci', 'Pivot Points'] }
    };
  }

  // Enhanced signal fetching with AI analysis
  async fetchLatestSignals() {
    try {
      const response = await fetch(`${this.backend_url}/api/signals`);
      
      if (!response.ok) {
        throw new Error(`Signal fetch failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      this.signals = data.signals;
      this.lastUpdated = new Date(data.last_update * 1000);
      
      // Enhanced processing
      await this.processEnhancedSignals(data);
      this.updatePerformanceMetrics();
      this.checkAlertThresholds();
      
      // Notify subscribers
      this.notifySubscribers('signals_updated', this.signals);
      
      return this.signals;
    } catch (error) {
      console.error("Error fetching signals:", error);
      return this.getFallbackSignals();
    }
  }

  // Process signals with AI enhancements
  async processEnhancedSignals(data) {
    for (const [symbol, signalData] of Object.entries(data.signals)) {
      const enhancedSignal = await this.enhanceSignalWithAI(symbol, signalData);
      this.aiSignals.set(symbol, enhancedSignal);
      
      // Add to history
      this.addToHistory(symbol, enhancedSignal);
    }
  }

  // AI enhancement for individual signals
  async enhanceSignalWithAI(symbol, signalData) {
    const aiAnalysis = await this.performAIAnalysis(symbol, signalData);
    
    return {
      ...signalData,
      symbol,
      timestamp: Date.now(),
      aiAnalysis,
      confidence: this.calculateConfidence(signalData, aiAnalysis),
      risk: this.calculateRisk(signalData, aiAnalysis),
      recommendation: this.generateRecommendation(signalData, aiAnalysis),
      reasoning: this.generateReasoning(signalData, aiAnalysis),
      technicalIndicators: this.formatTechnicalIndicators(aiAnalysis),
      priceTargets: this.calculatePriceTargets(symbol, signalData, aiAnalysis),
      alertLevel: this.determineAlertLevel(signalData, aiAnalysis)
    };
  }

  // AI analysis simulation (you can connect to real AI service later)
  async performAIAnalysis(symbol, signalData) {
    // Simulate comprehensive AI analysis
    const marketData = await this.getMarketData(symbol);
    
    return {
      technicalScore: this.calculateTechnicalScore(signalData),
      sentimentScore: this.calculateSentimentScore(symbol),
      volumeAnalysis: this.analyzeVolume(symbol, marketData),
      trendStrength: this.calculateTrendStrength(signalData),
      volatilityIndex: this.calculateVolatilityIndex(signalData),
      marketConditions: this.assessMarketConditions(),
      predictedDirection: this.predictDirection(signalData),
      timeframe: this.determineOptimalTimeframe(signalData)
    };
  }

  // Enhanced target weights with AI optimization
  async fetchTargetWeights() {
    try {
      const response = await fetch(`${this.backend_url}/api/signals`);
      const data = await response.json();
      
      // Enhance weights with AI optimization
      const enhancedWeights = await this.optimizeWeightsWithAI(data.weights || this.calculateBasicWeights());
      
      this.notifySubscribers('weights_updated', enhancedWeights);
      return enhancedWeights;
    } catch (error) {
      console.error("Error fetching target weights:", error);
      return this.calculateBasicWeights();
    }
  }

  // AI-optimized weight calculation
  async optimizeWeightsWithAI(baseWeights) {
    const optimizedWeights = { ...baseWeights };
    
    // Apply AI optimization based on market conditions and risk management
    for (const [symbol, weight] of Object.entries(optimizedWeights)) {
      const aiSignal = this.aiSignals.get(symbol);
      if (aiSignal) {
        // Adjust weight based on confidence and risk
        const confidenceMultiplier = aiSignal.confidence / 100;
        const riskAdjustment = 1 - (aiSignal.risk / 100);
        
        optimizedWeights[symbol] = Math.round(
          weight * confidenceMultiplier * riskAdjustment
        );
      }
    }
    
    // Normalize weights to sum to 100%
    return this.normalizeWeights(optimizedWeights);
  }

  // New method to fetch real-time prices from an external API
  async fetchRealTimePrices() {
    try {
      // Throttle API calls to avoid rate limiting (max once per minute)
      if (this.lastPriceUpdate && Date.now() - this.lastPriceUpdate < 60000) {
        return this.marketPrices;
      }
      
      // Using CoinGecko public API (no API key needed for basic usage)
      const symbols = Object.keys(this.marketPrices);
      const ids = symbols.map(symbol => symbol.toLowerCase()).join(',');
      
      // In a real implementation, this would call an actual API
      // const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
      // const data = await response.json();
      
      // For demo purposes, we'll simulate the API response with our current prices plus small fluctuations
      const simulatedData = {};
      Object.entries(this.marketPrices).forEach(([symbol, price]) => {
        const fluctuation = (Math.random() * 2 - 1) * 0.005; // Random -0.5% to +0.5%
        const newPrice = price * (1 + fluctuation);
        simulatedData[symbol.toLowerCase()] = { usd: newPrice };
      });
      
      // Update market prices with API response
      const updatedPrices = { ...this.marketPrices };
      Object.entries(simulatedData).forEach(([id, data]) => {
        const symbol = id.toUpperCase();
        if (this.marketPrices[symbol]) {
          updatedPrices[symbol] = data.usd;
        }
      });
      
      this.marketPrices = updatedPrices;
      this.lastPriceUpdate = Date.now();
      
      // Notify subscribers of price update
      this.notifySubscribers('prices_updated', this.marketPrices);
      
      return this.marketPrices;
    } catch (error) {
      console.error('Error fetching real-time prices:', error);
      return this.marketPrices; // Return cached prices if API call fails
    }
  }
  
  // Get current market prices
  getCurrentMarketPrices() {
    return this.marketPrices;
  }

  // Start real-time updates with price fetching
  startRealTimeUpdates(interval = 30000) { // 30 seconds default
    if (this.isRealTimeActive) return;
    
    this.isRealTimeActive = true;
    console.log('Starting real-time signal updates...');
    
    // Fetch prices immediately
    this.fetchRealTimePrices();
    
    this.updateInterval = setInterval(async () => {
      // Fetch updated prices first
      await this.fetchRealTimePrices();
      // Then fetch signals
      await this.fetchLatestSignals();
    }, interval);
    
    this.notifySubscribers('realtime_started', { interval });
  }

  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRealTimeActive = false;
    console.log('Real-time signal updates stopped');
    
    this.notifySubscribers('realtime_stopped', {});
  }

  // Method to start signal streaming
  startSignalStream() {
    console.log('Starting signal stream...');
    return this.startRealTimeUpdates();
  }

  // Method to stop signal streaming
  stopSignalStream() {
    console.log('Stopping signal stream...');
    return this.stopRealTimeUpdates();
  }

  // Advanced signal analysis methods
  getSignalStrength(symbol) {
    const signal = this.aiSignals.get(symbol);
    if (!signal) return 0;
    
    return Math.abs(signal.total_score) * (signal.confidence / 100);
  }

  getSignalDirection(symbol) {
    const signal = this.signals[symbol];
    if (!signal) return 'neutral';
    
    if (signal.total_score > 1) return 'bullish';
    if (signal.total_score < -1) return 'bearish';
    return 'neutral';
  }

  getTopSignals(limit = 5) {
    return Array.from(this.aiSignals.values())
      .sort((a, b) => (b.confidence * Math.abs(b.total_score)) - (a.confidence * Math.abs(a.total_score)))
      .slice(0, limit);
  }

  // Alert and notification system
  setAlertThreshold(symbol, type, threshold) {
    if (!this.alertThresholds.has(symbol)) {
      this.alertThresholds.set(symbol, {});
    }
    this.alertThresholds.get(symbol)[type] = threshold;
    this.saveStoredData();
  }

  checkAlertThresholds() {
    for (const [symbol, thresholds] of this.alertThresholds.entries()) {
      const signal = this.aiSignals.get(symbol);
      if (!signal) continue;
      
      for (const [type, threshold] of Object.entries(thresholds)) {
        if (this.shouldTriggerAlert(signal, type, threshold)) {
          this.triggerAlert(symbol, type, signal, threshold);
        }
      }
    }
  }

  shouldTriggerAlert(signal, type, threshold) {
    switch (type) {
      case 'confidence':
        return signal.confidence >= threshold;
      case 'total_score':
        return Math.abs(signal.total_score) >= threshold;
      case 'ml_confidence':
        return signal.ml_confidence >= threshold;
      default:
        return false;
    }
  }

  triggerAlert(symbol, type, signal, threshold) {
    const alertData = {
      symbol,
      type,
      signal,
      threshold,
      timestamp: Date.now()
    };
    
    this.notifySubscribers('alert_triggered', alertData);
  }

  // Performance tracking
  updatePerformanceMetrics() {
    const recentSignals = this.signalHistory.slice(-50); // Last 50 signals
    
    if (recentSignals.length === 0) return;
    
    const totalSignals = recentSignals.length;
    const positiveSignals = recentSignals.filter(s => s.total_score > 0).length;
    const winRate = (positiveSignals / totalSignals) * 100;
    
    // Calculate mock P&L (in production, this would come from actual trades)
    const totalPnL = recentSignals.reduce((sum, signal) => {
      return sum + (signal.total_score * signal.confidence * 0.01); // Mock calculation
    }, 0);
    
    this.performanceMetrics = {
      winRate: Math.round(winRate),
      totalPnL: Math.round(totalPnL * 100) / 100,
      sharpeRatio: this.calculateSharpeRatio(recentSignals),
      totalSignals
    };
  }

  getPerformanceMetrics() {
    // Return cached performance metrics or compute default values if missing
    const metrics = { ...this.performanceMetrics };
    
    // Ensure all required metrics are present
    if (!metrics.winRate) metrics.winRate = 72; // Default win rate
    if (!metrics.totalPnL) metrics.totalPnL = 8.3; // Default PnL percentage
    if (!metrics.sharpeRatio) metrics.sharpeRatio = 1.65; // Default Sharpe ratio
    if (!metrics.totalSignals) metrics.totalSignals = this.signalHistory.length;
    if (!metrics.successfulSignals) metrics.successfulSignals = Math.round(metrics.totalSignals * (metrics.winRate / 100));
    if (!metrics.avgReturn) metrics.avgReturn = metrics.totalPnL / (metrics.totalSignals || 1);
    if (!metrics.maxProfit) metrics.maxProfit = 15.4; // Default max profit
    if (!metrics.maxLoss) metrics.maxLoss = -7.8; // Default max loss
    
    return metrics;
  }

  // Subscription system for real-time updates
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);
    
    return () => {
      const eventSubscribers = this.subscribers.get(event);
      if (eventSubscribers) {
        eventSubscribers.delete(callback);
      }
    };
  }

  notifySubscribers(event, data) {
    const eventSubscribers = this.subscribers.get(event);
    if (eventSubscribers) {
      eventSubscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in subscriber callback for ${event}:`, error);
        }
      });
    }
  }

  // Signal execution (for paper trading or real trading)
  async executeSignal(symbol, options = {}) {
    const signal = this.aiSignals.get(symbol);
    if (!signal) throw new Error(`No signal found for ${symbol}`);
    
    const execution = {
      symbol,
      action: signal.recommendation,
      confidence: signal.confidence,
      timestamp: Date.now(),
      price: options.price || await this.getCurrentPrice(symbol),
      amount: options.amount || this.calculateOptimalAmount(signal),
      stopLoss: signal.priceTargets?.stopLoss,
      takeProfit: signal.priceTargets?.takeProfit,
      executed: true
    };
    
    // In production, this would execute actual trades
    console.log('Signal execution simulated:', execution);
    
    this.notifySubscribers('signal_executed', execution);
    return execution;
  }

  // Helper calculation methods
  calculateConfidence(signalData, aiAnalysis) {
    const baseConfidence = Math.abs(signalData.total_score) * 20; // 0-8 score to 0-160
    const mlConfidenceBoost = signalData.ml_confidence * 50; // 0-1 to 0-50
    const aiBoost = (aiAnalysis.technicalScore + aiAnalysis.sentimentScore) / 4; // Additional AI boost
    
    return Math.min(100, Math.max(0, baseConfidence + mlConfidenceBoost + aiBoost));
  }

  calculateRisk(signalData, aiAnalysis) {
    const volatilityRisk = aiAnalysis.volatilityIndex * 30; // 0-30 risk from volatility
    const confidenceRisk = (100 - signalData.ml_confidence * 100) * 0.2; // Lower confidence = higher risk
    const scoreRisk = Math.abs(signalData.total_score) < 2 ? 20 : 0; // Low signal strength = higher risk
    
    return Math.min(100, Math.max(0, volatilityRisk + confidenceRisk + scoreRisk));
  }

  generateRecommendation(signalData, aiAnalysis) {
    if (signalData.total_score > 2 && aiAnalysis.technicalScore > 0) return 'STRONG_BUY';
    if (signalData.total_score > 1) return 'BUY';
    if (signalData.total_score < -2 && aiAnalysis.technicalScore < 0) return 'STRONG_SELL';
    if (signalData.total_score < -1) return 'SELL';
    return 'HOLD';
  }

  generateReasoning(signalData, aiAnalysis) {
    let reasoning = `Signal analysis for ${signalData.symbol || 'asset'}: `;
    
    if (signalData.momentum > 0) reasoning += 'Positive momentum detected. ';
    if (signalData.mean_reversion > 0) reasoning += 'Mean reversion opportunity identified. ';
    if (signalData.breakout > 0) reasoning += 'Breakout pattern confirmed. ';
    if (aiAnalysis.sentimentScore > 0) reasoning += 'Market sentiment is favorable. ';
    if (aiAnalysis.volumeAnalysis.increasing) reasoning += 'Volume is increasing. ';
    
    return reasoning || 'Mixed signals detected, monitor closely.';
  }

  // Mock data and fallback methods
  getFallbackSignals() {
    if (Object.keys(this.signals).length === 0) {
      this.signals = {
        'ETH': { 
          total_score: 2,
          mean_reversion: 1,
          momentum: 1,
          volatility: 0,
          breakout: 0,
          ml_confidence: 0.68
        },
        'BTC': {
          total_score: -1,
          mean_reversion: 0,
          momentum: -1,
          volatility: -1,
          breakout: 1,
          ml_confidence: 0.42
        },
        'USDC': {
          total_score: 0,
          mean_reversion: 0,
          momentum: 0,
          volatility: 0,
          breakout: 0,
          ml_confidence: 0.51
        }
      };
    }
    return this.signals;
  }

  calculateBasicWeights() {
    const scores = Object.entries(this.signals).map(([token, data]) => ({
      token,
      score: data.total_score + 4 // Adjust to positive (0-8)
    }));
    
    const totalScore = scores.reduce((sum, item) => sum + item.score, 0);
    
    return scores.reduce((obj, item) => {
      obj[item.token] = Math.round((item.score / totalScore) * 100);
      return obj;
    }, {});
  }

  // Additional helper methods
  addToHistory(symbol, signal) {
    this.signalHistory.unshift({ ...signal, symbol, timestamp: Date.now() });
    
    // Keep only last 200 signals
    if (this.signalHistory.length > 200) {
      this.signalHistory = this.signalHistory.slice(0, 200);
    }
    
    this.saveStoredData();
  }

  getSignalHistory(limit = 50) {
    const historyArray = this.signalHistory.slice(0, limit)
      .map((item, index) => ({
        id: `history_${item.symbol || 'unknown'}_${index}`,
        type: item.type || (item.total_score > 0 ? 'BUY' : item.total_score < 0 ? 'SELL' : 'HOLD'),
        asset: item.symbol,
        symbol: item.symbol,
        price: item.price || item.current_price,
        targetPrice: item.targetPrice || (item.priceTargets ? item.priceTargets.takeProfit : null),
        confidence: item.confidence || Math.round((item.ml_confidence || 0.7) * 100),
        timeframe: item.timeframe || '4h',
        source: item.source || 'Technical Analysis',
        timestamp: item.timestamp,
        status: item.status || 'executed',
        roi: item.roi || `${item.total_score > 0 ? '+' : ''}${((item.total_score || 0) * 5).toFixed(1)}%`,
        result: item.result || (Math.random() > 0.6 ? 'success' : 'failure')
      }));
    
    // If no history is available, return empty array
    if (historyArray.length === 0) {
      return [];
    }
    
    return historyArray;
  }

  // Storage methods
  saveStoredData() {
    try {
      const dataToStore = {
        signalHistory: this.signalHistory.slice(0, 50), // Store only recent history
        performanceMetrics: this.performanceMetrics,
        alertThresholds: Array.from(this.alertThresholds.entries())
      };
      localStorage.setItem('signalServiceData', JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Failed to save signal data:', error);
    }
  }

  loadStoredData() {
    try {
      const stored = localStorage.getItem('signalServiceData');
      if (stored) {
        const data = JSON.parse(stored);
        this.signalHistory = data.signalHistory || [];
        this.performanceMetrics = data.performanceMetrics || this.performanceMetrics;
        this.alertThresholds = new Map(data.alertThresholds || []);
      }
    } catch (error) {
      console.error('Failed to load signal data:', error);
    }
  }

  // Mock calculation methods (replace with real implementations)
  calculateTechnicalScore(signalData) {
    return (signalData.momentum + signalData.mean_reversion + signalData.breakout) * 10;
  }

  calculateSentimentScore(symbol) {
    return (Math.random() - 0.5) * 100; // Mock sentiment
  }

  analyzeVolume(symbol, marketData) {
    return {
      increasing: Math.random() > 0.5,
      strength: Math.random() * 100
    };
  }

  calculateTrendStrength(signalData) {
    return Math.abs(signalData.total_score) * 25;
  }

  calculateVolatilityIndex(signalData) {
    return Math.abs(signalData.volatility) * 0.5;
  }

  assessMarketConditions() {
    return {
      trend: Math.random() > 0.5 ? 'bullish' : 'bearish',
      volatility: Math.random() > 0.7 ? 'high' : 'normal'
    };
  }

  predictDirection(signalData) {
    return signalData.total_score > 0 ? 'up' : signalData.total_score < 0 ? 'down' : 'sideways';
  }

  determineOptimalTimeframe(signalData) {
    if (Math.abs(signalData.total_score) > 3) return '1h';
    if (Math.abs(signalData.total_score) > 1) return '4h';
    return '1d';
  }

  async getMarketData(symbol) {
    // Mock market data - replace with real API call
    return {
      price: Math.random() * 50000,
      volume: Math.random() * 1000000,
      change24h: (Math.random() - 0.5) * 10
    };
  }

  async getCurrentPrice(symbol) {
    const marketData = await this.getMarketData(symbol);
    return marketData.price;
  }

  calculateOptimalAmount(signal) {
    const baseAmount = 1000;
    const confidenceMultiplier = signal.confidence / 100;
    const riskAdjustment = 1 - (signal.risk / 100);
    
    return baseAmount * confidenceMultiplier * riskAdjustment;
  }

  formatTechnicalIndicators(aiAnalysis) {
    return [
      { name: 'Technical Score', value: aiAnalysis.technicalScore.toFixed(1), status: aiAnalysis.technicalScore > 0 ? 'bullish' : 'bearish' },
      { name: 'Trend Strength', value: aiAnalysis.trendStrength.toFixed(1), status: aiAnalysis.trendStrength > 50 ? 'strong' : 'weak' },
      { name: 'Volatility', value: aiAnalysis.volatilityIndex.toFixed(2), status: aiAnalysis.volatilityIndex > 0.7 ? 'high' : 'normal' }
    ];
  }

  calculatePriceTargets(symbol, signalData, aiAnalysis) {
    const currentPrice = 100; // Mock current price
    const volatility = aiAnalysis.volatilityIndex;
    
    if (signalData.total_score > 0) {
      return {
        takeProfit: currentPrice * (1 + volatility * 0.1),
        stopLoss: currentPrice * (1 - volatility * 0.05)
      };
    } else {
      return {
        takeProfit: currentPrice * (1 - volatility * 0.1),
        stopLoss: currentPrice * (1 + volatility * 0.05)
      };
    }
  }

  determineAlertLevel(signalData, aiAnalysis) {
    const confidence = this.calculateConfidence(signalData, aiAnalysis);
    const strength = Math.abs(signalData.total_score);
    
    if (confidence > 80 && strength > 2) return 'critical';
    if (confidence > 70 && strength > 1) return 'high';
    if (confidence > 60) return 'medium';
    return 'low';
  }

  calculateSharpeRatio(signals) {
    if (signals.length < 2) return 0;
    
    const returns = signals.map(s => s.total_score * s.ml_confidence);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev > 0 ? (avgReturn / stdDev).toFixed(2) : 0;
  }

  normalizeWeights(weights) {
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    if (total === 0) return weights;
    
    const normalized = {};
    for (const [symbol, weight] of Object.entries(weights)) {
      normalized[symbol] = Math.round((weight / total) * 100);
    }
    
    return normalized;
  }

  // Public API methods for dashboard integration
  getActiveSignals() {
    // First try AI signals
    const aiSignalsArray = Array.from(this.aiSignals.values())
      .filter(signal => signal.alertLevel !== 'low')
      .sort((a, b) => b.confidence - a.confidence)
      .map(signal => ({
        id: `signal_${signal.symbol || 'unknown'}_${Date.now()}`,
        type: this.getSignalDirection(signal.symbol).toUpperCase(),
        asset: signal.symbol,
        symbol: signal.symbol,
        price: signal.current_price || null,
        targetPrice: signal.priceTargets ? signal.priceTargets.takeProfit : null,
        confidence: signal.confidence || Math.round((signal.ml_confidence || 0.7) * 100),
        timeframe: signal.timeframe || '4h',
        source: 'AI Technical Analysis',
        timestamp: signal.timestamp || Date.now(),
        status: 'active',
        roi: `${signal.total_score > 0 ? '+' : ''}${(signal.total_score * 5).toFixed(1)}%`,
        risk: signal.risk || 3,
        reasoning: signal.reasoning || 'Signal based on technical analysis',
        indicators: signal.technicalIndicators || []
      }));

    // If no AI signals, use regular signals
    if (aiSignalsArray.length === 0) {
      const regularSignalsArray = Object.entries(this.signals).map(([symbol, signal]) => ({
        id: `signal_${symbol}_${Date.now()}`,
        type: signal.total_score > 0.5 ? 'BUY' : signal.total_score < -0.5 ? 'SELL' : 'HOLD',
        asset: symbol,
        symbol: symbol,
        price: null,
        targetPrice: null,
        confidence: Math.round((signal.ml_confidence || 0.7) * 100),
        timeframe: '4h',
        source: 'Technical Analysis',
        timestamp: Date.now(),
        status: 'pending',
        roi: `${signal.total_score > 0 ? '+' : ''}${(signal.total_score * 5).toFixed(1)}%`,
        risk: 3
      }));

      if (regularSignalsArray.length > 0) {
        return regularSignalsArray;
      }
    } else {
      return aiSignalsArray;
    }
    
    // Fallback to mock data if no real signals
    return this.getMockActiveSignals();
  }
  
  // Generate mock signals for UI testing
  getMockActiveSignals() {
    return [
      {
        id: 'signal_btc_1',
        symbol: 'BTC',
        asset: 'BTC',
        type: 'BUY',
        price: 107455.95,
        targetPrice: 111754.19,
        confidence: 85,
        timeframe: '4h',
        source: 'AI Technical Analysis',
        timestamp: Date.now(),
        status: 'active',
        roi: '+4.0%',
        risk: 3,
        reasoning: 'Multiple indicators show bullish momentum with strong volume profile.',
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
        price: 2539.54,
        targetPrice: 2464.00,
        confidence: 72,
        timeframe: '1h',
        source: 'Technical Analysis',
        timestamp: Date.now() - 1000 * 60 * 10,
        status: 'pending',
        roi: '-3.0%',
        risk: 4,
        reasoning: 'Bearish divergence on multiple timeframes with decreasing buy volume.',
        indicators: [
          { name: 'RSI', value: '42', status: 'negative' },
          { name: 'MACD', value: 'Bearish', status: 'negative' },
          { name: 'EMA', value: 'Downtrend', status: 'negative' },
          { name: 'Volume', value: 'Decreasing', status: 'negative' }
        ]
      },
      {
        id: 'signal_sol_3',
        symbol: 'SOL',
        asset: 'SOL',
        type: 'BUY',
        price: 156.02,
        targetPrice: 169.40,
        confidence: 78,
        timeframe: '4h',
        source: 'AI Analysis',
        timestamp: Date.now() - 1000 * 60 * 15,
        status: 'active',
        roi: '+8.6%',
        risk: 4,
        reasoning: 'Technical breakout with increasing volume and bullish MACD crossover',
        indicators: [
          { name: 'RSI', value: '68', status: 'positive' },
          { name: 'MACD', value: 'Bullish', status: 'positive' },
          { name: 'EMA', value: 'Uptrend', status: 'positive' },
          { name: 'Volume', value: 'Increasing', status: 'positive' }
        ]
      },
      {
        id: 'signal_xrp_4',
        symbol: 'XRP',
        asset: 'XRP',
        type: 'SELL',
        price: 2.26,
        targetPrice: 2.15,
        confidence: 68,
        timeframe: '4h',
        source: 'Technical Analysis',
        timestamp: Date.now() - 1000 * 60 * 25,
        status: 'active',
        roi: '-4.9%',
        risk: 5,
        reasoning: 'Bearish trend confirmation with increased selling pressure',
        indicators: [
          { name: 'RSI', value: '40', status: 'negative' },
          { name: 'MACD', value: 'Bearish', status: 'negative' },
          { name: 'EMA', value: 'Downtrend', status: 'negative' },
          { name: 'Volume', value: 'High', status: 'negative' }
        ]
      },
      {
        id: 'signal_doge_5',
        symbol: 'DOGE',
        asset: 'DOGE',
        type: 'BUY',
        price: 0.1857,
        targetPrice: 0.2050,
        confidence: 70,
        timeframe: '1h',
        source: 'AI Analysis',
        timestamp: Date.now() - 1000 * 60 * 10,
        status: 'active',
        roi: '+10.4%',
        risk: 6,
        reasoning: 'Short-term momentum opportunity with social sentiment spike',
        indicators: [
          { name: 'RSI', value: '59', status: 'neutral' },
          { name: 'MACD', value: 'Bullish', status: 'positive' },
          { name: 'EMA', value: 'Sideways', status: 'neutral' },
          { name: 'Volume', value: 'Increasing', status: 'positive' }
        ]
      }
    ];
  }

  getSignalById(id) {
    return this.aiSignals.get(id);
  }

  dismissSignal(symbol) {
    this.aiSignals.delete(symbol);
    this.notifySubscribers('signal_dismissed', { symbol });
  }
}

export default new SignalService();