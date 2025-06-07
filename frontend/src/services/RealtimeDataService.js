class RealtimeDataService {
  constructor() {
    this.subscribers = new Map();
    this.dataCache = new Map();
    this.updateInterval = 1000; // 1 second
    this.isActive = false;
  }

  // Simulated real-time price updates
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

  updatePrice(symbol, data) {
    this.dataCache.set(`price_${symbol}`, data);
    this.notify('price_update', { symbol, data });
  }

  notify(channel, data) {
    const channelSubscribers = this.subscribers.get(channel);
    if (channelSubscribers) {
      channelSubscribers.forEach(callback => callback(data));
    }
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

    this.notify('portfolio_update', performance);
    return performance;
  }
}

export default new RealtimeDataService();