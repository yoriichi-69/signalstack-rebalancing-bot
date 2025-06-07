class RealtimeDataService {
  constructor() {
    this.websocket = null;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnected = false;
    this.lastPrices = new Map();
    this.priceHistory = new Map();
    this.marketData = new Map();
    this.dataCache = new Map();
    this.updateInterval = 1000; // 1 second
    this.isActive = false;
  }

  // Initialize WebSocket connection
  async initialize() {
    try {
      // Mock WebSocket connection - replace with actual WebSocket URL
      this.websocket = new WebSocket('wss://api.example.com/portfolio-stream');
      
      this.websocket.onopen = this.handleOpen.bind(this);
      this.websocket.onmessage = this.handleMessage.bind(this);
      this.websocket.onclose = this.handleClose.bind(this);
      this.websocket.onerror = this.handleError.bind(this);
      
    } catch (error) {
      console.error('WebSocket initialization failed:', error);
      this.startPollingFallback();
    }
  }

  handleOpen() {
    console.log('Portfolio WebSocket connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    // Subscribe to portfolio updates
    this.sendMessage({
      type: 'subscribe',
      channels: ['portfolio_updates', 'market_data', 'rebalance_signals']
    });
  }

  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      this.processRealtimeUpdate(data);
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }

  handleClose() {
    this.isConnected = false;
    console.log('Portfolio WebSocket disconnected');
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.initialize();
      }, Math.pow(2, this.reconnectAttempts) * 1000);
    } else {
      this.startPollingFallback();
    }
  }

  handleError(error) {
    console.error('WebSocket error:', error);
  }

  processRealtimeUpdate(data) {
    switch (data.type) {
      case 'price_update':
        this.handlePriceUpdate(data);
        break;
      case 'portfolio_change':
        this.handlePortfolioChange(data);
        break;
      case 'market_regime_change':
        this.handleMarketRegimeChange(data);
        break;
      case 'rebalance_opportunity':
        this.handleRebalanceOpportunity(data);
        break;
      case 'risk_alert':
        this.handleRiskAlert(data);
        break;
    }
    
    // Notify subscribers
    this.notifySubscribers(data.type, data);
  }

  handlePriceUpdate(data) {
    const { symbol, price } = data;
    this.lastPrices.set(symbol, price);
    this.priceHistory.set(symbol, [...(this.priceHistory.get(symbol) || []), { price, timestamp: Date.now() }]);
    this.updatePrice(symbol, data);
  }

  handlePortfolioChange(data) {
    // Handle portfolio change updates
    console.log('Portfolio change:', data);
  }

  handleMarketRegimeChange(data) {
    // Handle market regime change updates
    console.log('Market regime change:', data);
  }

  handleRebalanceOpportunity(data) {
    // Handle rebalance opportunity updates
    console.log('Rebalance opportunity:', data);
  }

  handleRiskAlert(data) {
    // Handle risk alert updates
    console.log('Risk alert:', data);
  }

  // Simulated real-time price updates (fallback)
  startPriceStream() {
    if (this.isActive) return;
    
    this.isActive = true;
    const tokens = ['BTC', 'ETH', 'ADA', 'DOT', 'USDC'];
    
    this.priceInterval = setInterval(() => {
      tokens.forEach(token => {
        const basePrice = this.getBasePrice(token);
        const volatility = this.getVolatility(token);
        const change = (Math.random() - 0.5) * volatility;
        const newPrice = basePrice * (1 + change / 100);
        const volume = Math.random() * 1000000000;
        
        const priceData = {
          symbol: token,
          price: newPrice,
          change24h: (Math.random() - 0.5) * 10,
          volume24h: volume,
          timestamp: Date.now(),
          marketCap: newPrice * this.getCirculatingSupply(token),
          high24h: newPrice * (1 + Math.random() * 0.05),
          low24h: newPrice * (1 - Math.random() * 0.05)
        };
        
        this.updatePrice(token, priceData);
      });
    }, this.updateInterval);
  }

  stopPriceStream() {
    this.isActive = false;
    if (this.priceInterval) {
      clearInterval(this.priceInterval);
    }
  }

  updatePrice(symbol, data) {
    this.dataCache.set(`price_${symbol}`, data);
    this.notifySubscribers('price_update', { symbol, data });
  }

  async getPortfolioUpdates(portfolio) {
    const updates = {};
    
    for (const asset of portfolio) {
      try {
        // Get latest price data
        const priceData = await this.getAssetPriceData(asset.symbol);
        const technicalData = await this.getTechnicalIndicators(asset.symbol);
        const liquidityData = await this.getLiquidityMetrics(asset.symbol);
        
        updates[asset.symbol] = {
          ...priceData,
          ...technicalData,
          ...liquidityData,
          timestamp: new Date(),
          changePercent24h: this.calculatePriceChange(asset.symbol, '24h'),
          volatility: this.calculateVolatility(asset.symbol),
          volume24h: priceData.volume24h,
          marketCap: priceData.marketCap,
          liquidityScore: liquidityData.score,
          technicalScore: technicalData.composite_score
        };
        
      } catch (error) {
        console.error(`Error updating ${asset.symbol}:`, error);
      }
    }
    
    return updates;
  }

  async getAssetPriceData(symbol) {
    // Mock API call - replace with actual price feed
    const mockData = {
      'BTC': { price: 45250.3, volume24h: 28500000000, marketCap: 850000000000 },
      'ETH': { price: 3128.45, volume24h: 15200000000, marketCap: 375000000000 },
      'ADA': { price: 0.48, volume24h: 850000000, marketCap: 16000000000 },
      'DOT': { price: 7.65, volume24h: 420000000, marketCap: 8500000000 },
      'SOL': { price: 98.23, volume24h: 1200000000, marketCap: 42000000000 }
    };
    
    const baseData = mockData[symbol] || { price: Math.random() * 100, volume24h: Math.random() * 1000000000 };
    
    // Add some realistic price fluctuation
    const fluctuation = (Math.random() - 0.5) * 0.02; // ±1% fluctuation
    baseData.price *= (1 + fluctuation);
    
    return baseData;
  }

  async getTechnicalIndicators(symbol) {
    // Mock technical analysis - replace with actual TA library
    const rsi = Math.random() * 100;
    const macd = (Math.random() - 0.5) * 2;
    const bollingerBand = Math.random();
    const stochastic = Math.random() * 100;
    
    // Composite technical score
    let composite_score = 0;
    
    // RSI scoring (30-70 is neutral, <30 oversold, >70 overbought)
    if (rsi < 30) composite_score += 0.8; // Oversold = bullish
    else if (rsi > 70) composite_score -= 0.8; // Overbought = bearish
    else composite_score += (50 - Math.abs(rsi - 50)) / 50 * 0.3;
    
    // MACD scoring
    composite_score += macd > 0 ? 0.5 : -0.5;
    
    // Normalize to -1 to 1 scale
    composite_score = Math.max(-1, Math.min(1, composite_score));
    
    return {
      rsi,
      macd,
      bollinger_band_position: bollingerBand,
      stochastic,
      composite_score,
      trend: composite_score > 0.2 ? 'bullish' : composite_score < -0.2 ? 'bearish' : 'neutral',
      momentum: Math.abs(composite_score),
      volatility_percentile: Math.random() * 100
    };
  }

  async getLiquidityMetrics(symbol) {
    // Mock liquidity data
    const liquidityTiers = {
      'BTC': { score: 0.95, spread: 0.001, depth: 10000000 },
      'ETH': { score: 0.90, spread: 0.002, depth: 5000000 },
      'ADA': { score: 0.75, spread: 0.005, depth: 1000000 },
      'DOT': { score: 0.70, spread: 0.008, depth: 500000 },
      'SOL': { score: 0.80, spread: 0.004, depth: 2000000 }
    };
    
    return liquidityTiers[symbol] || { score: 0.6, spread: 0.01, depth: 100000 };
  }

  calculatePriceChange(symbol, period) {
    const current = this.lastPrices.get(symbol);
    const history = this.priceHistory.get(symbol) || [];
    
    if (!current || history.length === 0) return 0;
    
    const hoursMap = { '1h': 1, '24h': 24, '7d': 168 };
    const hours = hoursMap[period] || 24;
    
    const pastPrice = history.find(h => {
      const hoursDiff = (Date.now() - h.timestamp) / (1000 * 60 * 60);
      return hoursDiff >= hours;
    });
    
    if (!pastPrice) return 0;
    
    return (current - pastPrice.price) / pastPrice.price;
  }

  calculateVolatility(symbol, period = 24) {
    const history = this.priceHistory.get(symbol) || [];
    if (history.length < 2) return 0;
    
    const recent = history.slice(-period);
    const returns = recent.slice(1).map((price, i) => 
      Math.log(price.price / recent[i].price)
    );
    
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance * 365); // Annualized volatility
  }

  getBasePrice(token) {
    const basePrices = {
      'BTC': 45000,
      'ETH': 3000,
      'ADA': 0.35,
      'DOT': 6.5,
      'USDC': 1.0
    };
    return basePrices[token] || 100;
  }

  getVolatility(token) {
    const volatilities = {
      'BTC': 3,
      'ETH': 4,
      'ADA': 6,
      'DOT': 5,
      'USDC': 0.1
    };
    return volatilities[token] || 2;
  }

  getCirculatingSupply(token) {
    const supplies = {
      'BTC': 19500000,
      'ETH': 120000000,
      'ADA': 34000000000,
      'DOT': 1100000000,
      'USDC': 55000000000
    };
    return supplies[token] || 1000000;
  }

  // Advanced market sentiment analysis
  generateMarketSentiment() {
    const indicators = {
      fearGreedIndex: Math.floor(Math.random() * 100),
      rsi: Math.floor(Math.random() * 100),
      macd: (Math.random() - 0.5) * 2,
      bollinger: Math.random(),
      volume: Math.random() * 2,
      social: Math.random() * 100
    };

    let sentiment = 'neutral';
    const score = (indicators.fearGreedIndex + indicators.rsi + indicators.social) / 3;
    
    if (score > 70) sentiment = 'extremely-bullish';
    else if (score > 60) sentiment = 'bullish';
    else if (score > 40) sentiment = 'neutral';
    else if (score > 30) sentiment = 'bearish';
    else sentiment = 'extremely-bearish';

    return { ...indicators, sentiment, score };
  }

  // Portfolio performance simulation
  simulatePortfolioPerformance(holdings) {
    const performance = {
      totalValue: 0,
      dayChange: 0,
      weekChange: 0,
      monthChange: 0,
      yearChange: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0
    };

    holdings.forEach(holding => {
      const priceData = this.dataCache.get(`price_${holding.symbol}`);
      if (priceData) {
        const value = holding.amount * priceData.price;
        performance.totalValue += value;
        performance.dayChange += value * (priceData.change24h / 100);
      }
    });

    // Simulate additional metrics
    performance.weekChange = performance.dayChange * (1 + Math.random() * 0.5);
    performance.monthChange = performance.weekChange * (1 + Math.random() * 0.3);
    performance.yearChange = performance.monthChange * (1 + Math.random() * 2);
    performance.volatility = Math.random() * 30;
    performance.sharpeRatio = Math.random() * 3;
    performance.maxDrawdown = Math.random() * 40;

    this.notifySubscribers('portfolio_update', performance);
    return performance;
  }

  // Subscription management
  subscribe(channel, callback) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel).add(callback);
    
    return () => {
      const channelSubscribers = this.subscribers.get(channel);
      if (channelSubscribers) {
        channelSubscribers.delete(callback);
      }
    };
  }

  notifySubscribers(channel, data) {
    const channelSubscribers = this.subscribers.get(channel);
    if (channelSubscribers) {
      channelSubscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Subscriber callback error:', error);
        }
      });
    }
  }

  sendMessage(message) {
    if (this.websocket && this.isConnected) {
      this.websocket.send(JSON.stringify(message));
    }
  }

  // Fallback polling mechanism
  startPollingFallback() {
    console.log('Starting polling fallback for real-time data');
    setInterval(async () => {
      // Poll for updates every 30 seconds
      try {
        const marketUpdate = await this.pollMarketData();
        this.processRealtimeUpdate({
          type: 'market_update',
          data: marketUpdate
        });
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 30000);
  }

  async pollMarketData() {
    // Implementation for polling fallback
    return {
      timestamp: new Date(),
      prices: await this.getAllPrices(),
      volumes: await this.getAllVolumes()
    };
  }

  async getAllPrices() {
    // Mock implementation - replace with actual API call
    const tokens = ['BTC', 'ETH', 'ADA', 'DOT', 'USDC'];
    const prices = {};
    
    for (const token of tokens) {
      prices[token] = await this.getAssetPriceData(token);
    }
    
    return prices;
  }

  async getAllVolumes() {
    // Mock implementation - replace with actual API call
    const tokens = ['BTC', 'ETH', 'ADA', 'DOT', 'USDC'];
    const volumes = {};
    
    for (const token of tokens) {
      const priceData = await this.getAssetPriceData(token);
      volumes[token] = priceData.volume24h;
    }
    
    return volumes;
  }

  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.isConnected = false;
    }
  }
}

export default new RealtimeDataService();