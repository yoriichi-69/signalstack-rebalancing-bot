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

  // Real-time signal streaming
  startRealTimeUpdates(interval = 30000) { // 30 seconds default
    if (this.isRealTimeActive) return;
    
    this.isRealTimeActive = true;
    console.log('Starting real-time signal updates...');
    
    this.updateInterval = setInterval(async () => {
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
    return this.performanceMetrics;
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
    return this.signalHistory.slice(0, limit);
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
    return Array.from(this.aiSignals.values())
      .filter(signal => signal.alertLevel !== 'low')
      .sort((a, b) => b.confidence - a.confidence);
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