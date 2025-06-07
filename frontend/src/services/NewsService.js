/* filepath: frontend/src/services/NewsService.js */
import NotificationService from './NotificationService';

class NewsService {
  constructor() {
    this.newsCache = new Map();
    this.subscribers = new Map();
    this.apiKey = process.env.REACT_APP_NEWS_API_KEY;
    this.updateInterval = 300000; // 5 minutes
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.isActive = false;
    
    this.setupNewsCategories();
  }

  setupNewsCategories() {
    this.categories = {
      'bitcoin': { keywords: ['bitcoin', 'btc'], weight: 0.9 },
      'ethereum': { keywords: ['ethereum', 'eth', 'smart contract'], weight: 0.8 },
      'defi': { keywords: ['defi', 'decentralized finance', 'yield farming'], weight: 0.7 },
      'nft': { keywords: ['nft', 'non-fungible token', 'opensea'], weight: 0.6 },
      'regulation': { keywords: ['regulation', 'sec', 'government', 'ban'], weight: 0.9 },
      'market': { keywords: ['market', 'trading', 'exchange', 'volume'], weight: 0.8 },
      'technology': { keywords: ['blockchain', 'protocol', 'upgrade'], weight: 0.7 }
    };
  }

  async startNewsStream() {
    if (this.isActive) return;
    
    this.isActive = true;
    
    // Initial fetch
    await this.fetchLatestNews();
    
    // Set up periodic updates
    this.newsInterval = setInterval(() => {
      this.fetchLatestNews();
    }, this.updateInterval);
    
    console.log('News stream started');
  }

  stopNewsStream() {
    this.isActive = false;
    if (this.newsInterval) {
      clearInterval(this.newsInterval);
    }
    console.log('News stream stopped');
  }

  async fetchLatestNews() {
    try {
      // Simulate multiple news sources
      const sources = [
        'coindesk',
        'cointelegraph',
        'decrypt',
        'the-block',
        'crypto-news'
      ];

      const newsPromises = sources.map(source => this.fetchFromSource(source));
      const newsArrays = await Promise.all(newsPromises);
      
      const allNews = newsArrays.flat();
      const processedNews = await this.processNews(allNews);
      
      // Update cache and notify subscribers
      this.updateNewsCache(processedNews);
      this.notifySubscribers('news_update', processedNews);
      
      // Check for breaking news
      this.checkBreakingNews(processedNews);
      
      return processedNews;
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  }

  async fetchFromSource(source) {
    // Simulate API call - replace with actual news API
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockNews = this.generateMockNews(source);
        resolve(mockNews);
      }, Math.random() * 1000);
    });
  }

  generateMockNews(source) {
    const headlines = [
      'Bitcoin Reaches New All-Time High Above $50,000',
      'Ethereum 2.0 Staking Rewards Surpass $1 Billion',
      'Major Bank Announces Cryptocurrency Trading Services',
      'DeFi Protocol Launches Revolutionary Yield Farming Mechanism',
      'NFT Marketplace Sees Record Trading Volume',
      'Regulatory Clarity Boosts Institutional Crypto Adoption',
      'Lightning Network Adoption Accelerates Among Merchants',
      'Altcoin Season: Top 10 Cryptos Show Double-Digit Gains',
      'Central Bank Digital Currency Pilot Program Launched',
      'Crypto Exchange Adds Support for 50 New Tokens'
    ];

    const descriptions = [
      'Market analysts predict continued bullish momentum as institutional investors increase their positions.',
      'The latest development marks a significant milestone in the cryptocurrency ecosystem evolution.',
      'Industry experts believe this could trigger a new wave of mainstream adoption.',
      'Technical analysis suggests strong support levels with potential for further growth.',
      'Regulatory developments continue to shape the future of digital asset markets.'
    ];

    const news = [];
    const count = Math.floor(Math.random() * 5) + 3; // 3-7 news items

    for (let i = 0; i < count; i++) {
      const headline = headlines[Math.floor(Math.random() * headlines.length)];
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      
      news.push({
        id: `${source}_${Date.now()}_${i}`,
        headline,
        description,
        source,
        publishedAt: new Date(Date.now() - Math.random() * 3600000), // Random time within last hour
        url: `https://${source}.com/article-${i}`,
        imageUrl: `https://picsum.photos/400/200?random=${Date.now()}${i}`,
        category: this.categorizeNews(headline + ' ' + description),
        author: `${source} Reporter`,
        readTime: Math.floor(Math.random() * 5) + 2 // 2-6 minutes
      });
    }

    return news;
  }

  async processNews(newsArray) {
    const processedNews = [];

    for (const news of newsArray) {
      // Skip if already processed
      if (this.newsCache.has(news.id)) continue;

      // Perform sentiment analysis
      const sentiment = await this.sentimentAnalyzer.analyze(
        news.headline + ' ' + news.description
      );

      // Calculate relevance score
      const relevance = this.calculateRelevance(news);

      // Detect potential market impact
      const marketImpact = this.assessMarketImpact(news, sentiment);

      const processedNews = {
        ...news,
        sentiment: {
          score: sentiment.score,
          label: sentiment.label,
          confidence: sentiment.confidence
        },
        relevance,
        marketImpact,
        tags: this.extractTags(news.headline + ' ' + news.description),
        processed: true,
        processedAt: Date.now()
      };

      processedNews.push(processedNews);
    }

    return processedNews;
  }

  categorizeNews(text) {
    const lowerText = text.toLowerCase();
    let bestCategory = 'general';
    let highestScore = 0;

    Object.entries(this.categories).forEach(([category, config]) => {
      const score = config.keywords.reduce((sum, keyword) => {
        const occurrences = (lowerText.match(new RegExp(keyword, 'gi')) || []).length;
        return sum + occurrences;
      }, 0) * config.weight;

      if (score > highestScore) {
        highestScore = score;
        bestCategory = category;
      }
    });

    return bestCategory;
  }

  calculateRelevance(news) {
    const factors = {
      recency: this.calculateRecency(news.publishedAt),
      sourceCredibility: this.getSourceCredibility(news.source),
      categoryImportance: this.getCategoryImportance(news.category),
      keywordDensity: this.calculateKeywordDensity(news.headline + ' ' + news.description)
    };

    // Weighted relevance score
    const relevance = (
      factors.recency * 0.3 +
      factors.sourceCredibility * 0.25 +
      factors.categoryImportance * 0.25 +
      factors.keywordDensity * 0.2
    );

    return Math.min(100, Math.max(0, relevance));
  }

  calculateRecency(publishedAt) {
    const hoursAgo = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);
    return Math.max(0, 100 - hoursAgo * 2); // Decrease by 2 points per hour
  }

  getSourceCredibility(source) {
    const credibilityScores = {
      'coindesk': 95,
      'cointelegraph': 90,
      'decrypt': 85,
      'the-block': 90,
      'crypto-news': 80
    };
    return credibilityScores[source] || 70;
  }

  getCategoryImportance(category) {
    const importanceScores = {
      'regulation': 95,
      'bitcoin': 90,
      'ethereum': 85,
      'market': 80,
      'defi': 75,
      'technology': 70,
      'nft': 65
    };
    return importanceScores[category] || 60;
  }

  assessMarketImpact(news, sentiment) {
    const impact = {
      level: 'low', // low, medium, high, critical
      direction: 'neutral', // positive, negative, neutral
      confidence: 0,
      affectedAssets: []
    };

    // Determine impact level based on category and sentiment
    const category = news.category;
    const sentimentScore = sentiment.score;

    if (category === 'regulation' && Math.abs(sentimentScore) > 0.6) {
      impact.level = 'high';
      impact.confidence = 0.8;
    } else if (['bitcoin', 'ethereum'].includes(category) && Math.abs(sentimentScore) > 0.5) {
      impact.level = 'medium';
      impact.confidence = 0.7;
    } else if (Math.abs(sentimentScore) > 0.7) {
      impact.level = 'medium';
      impact.confidence = 0.6;
    }

    // Determine direction
    if (sentimentScore > 0.3) impact.direction = 'positive';
    else if (sentimentScore < -0.3) impact.direction = 'negative';

    // Identify affected assets
    impact.affectedAssets = this.identifyAffectedAssets(news);

    return impact;
  }

  identifyAffectedAssets(news) {
    const text = (news.headline + ' ' + news.description).toLowerCase();
    const assets = [];

    const assetKeywords = {
      'BTC': ['bitcoin', 'btc'],
      'ETH': ['ethereum', 'eth', 'ether'],
      'ADA': ['cardano', 'ada'],
      'DOT': ['polkadot', 'dot'],
      'LINK': ['chainlink', 'link'],
      'UNI': ['uniswap', 'uni'],
      'AAVE': ['aave'],
      'COMP': ['compound', 'comp']
    };

    Object.entries(assetKeywords).forEach(([symbol, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        assets.push(symbol);
      }
    });

    return assets;
  }

  extractTags(text) {
    const commonTags = [
      'breaking', 'analysis', 'price', 'market', 'trading', 'investment',
      'technology', 'partnership', 'launch', 'update', 'adoption'
    ];

    const lowerText = text.toLowerCase();
    return commonTags.filter(tag => lowerText.includes(tag));
  }

  checkBreakingNews(newsArray) {
    const breakingNews = newsArray.filter(news => 
      news.relevance > 85 && 
      news.marketImpact.level === 'high' &&
      news.tags.includes('breaking')
    );

    breakingNews.forEach(news => {
      NotificationService.newsAlert(
        news.headline,
        news.source,
        news.sentiment.label
      );
    });
  }

  updateNewsCache(newsArray) {
    newsArray.forEach(news => {
      this.newsCache.set(news.id, news);
    });

    // Clean old cache entries (keep last 1000)
    if (this.newsCache.size > 1000) {
      const entries = Array.from(this.newsCache.entries());
      entries.sort((a, b) => b[1].processedAt - a[1].processedAt);
      
      this.newsCache.clear();
      entries.slice(0, 1000).forEach(([id, news]) => {
        this.newsCache.set(id, news);
      });
    }
  }

  // Subscription system
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
      eventSubscribers.forEach(callback => callback(data));
    }
  }

  // Public methods
  getLatestNews(limit = 20) {
    const news = Array.from(this.newsCache.values());
    return news
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);
  }

  getNewsByCategory(category, limit = 10) {
    const news = Array.from(this.newsCache.values());
    return news
      .filter(n => n.category === category)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);
  }

  searchNews(query, limit = 20) {
    const lowerQuery = query.toLowerCase();
    const news = Array.from(this.newsCache.values());
    
    return news
      .filter(n => 
        n.headline.toLowerCase().includes(lowerQuery) ||
        n.description.toLowerCase().includes(lowerQuery) ||
        n.tags.some(tag => tag.includes(lowerQuery))
      )
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);
  }

  getBreakingNews() {
    const news = Array.from(this.newsCache.values());
    return news
      .filter(n => n.relevance > 85 && n.tags.includes('breaking'))
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }
}

// Simple sentiment analyzer
class SentimentAnalyzer {
  constructor() {
    this.positiveWords = [
      'bullish', 'surge', 'rise', 'gain', 'profit', 'success', 'breakthrough',
      'adoption', 'partnership', 'launch', 'upgrade', 'positive', 'growth'
    ];
    
    this.negativeWords = [
      'bearish', 'crash', 'fall', 'loss', 'decline', 'ban', 'regulation',
      'hack', 'scam', 'fraud', 'volatile', 'risk', 'concern', 'warning'
    ];
  }

  async analyze(text) {
    const words = text.toLowerCase().split(/\W+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (this.positiveWords.includes(word)) positiveCount++;
      if (this.negativeWords.includes(word)) negativeCount++;
    });

    const totalSentimentWords = positiveCount + negativeCount;
    const score = totalSentimentWords > 0 ? 
      (positiveCount - negativeCount) / totalSentimentWords : 0;

    let label = 'neutral';
    if (score > 0.3) label = 'positive';
    else if (score < -0.3) label = 'negative';

    return {
      score,
      label,
      confidence: Math.min(0.9, totalSentimentWords / 10),
      details: {
        positiveCount,
        negativeCount,
        totalWords: words.length
      }
    };
  }
}

export default new NewsService();