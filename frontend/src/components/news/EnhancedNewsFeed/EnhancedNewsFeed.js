import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NewsService from '../../../services/NewsService';
import NotificationService from '../../../services/NotificationService';
import './EnhancedNewsFeed.css';

const EnhancedNewsFeed = () => {
  const [newsData, setNewsData] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNews, setSelectedNews] = useState(null);
  const [marketImpactMode, setMarketImpactMode] = useState(false);

  const categories = [
    { id: 'all', name: 'All News', icon: '📰', color: '#40e0d0' },
    { id: 'bitcoin', name: 'Bitcoin', icon: '₿', color: '#f7931a' },
    { id: 'ethereum', name: 'Ethereum', icon: 'Ξ', color: '#627eea' },
    { id: 'defi', name: 'DeFi', icon: '🏦', color: '#9945ff' },
    { id: 'regulation', name: 'Regulation', icon: '⚖️', color: '#e74c3c' },
    { id: 'market', name: 'Market', icon: '📈', color: '#2ecc71' },
    { id: 'technology', name: 'Tech', icon: '⚡', color: '#3498db' }
  ];

  const sentimentFilters = [
    { id: 'all', name: 'All', color: '#40e0d0' },
    { id: 'bullish', name: 'Bullish', color: '#2ecc71' },
    { id: 'bearish', name: 'Bearish', color: '#e74c3c' },
    { id: 'neutral', name: 'Neutral', color: '#95a5a6' }
  ];

  useEffect(() => {
    initializeNewsFeed();
    
    // Subscribe to real-time news updates
    const unsubscribe = NewsService.subscribe('news_update', handleNewsUpdate);
    
    return () => {
      unsubscribe();
      NewsService.stopNewsStream();
    };
  }, []);

  useEffect(() => {
    filterNews();
  }, [newsData, activeCategory, sentimentFilter, searchQuery]);

  const initializeNewsFeed = async () => {
    try {
      setIsLoading(true);
      
      // Start news stream
      await NewsService.startNewsStream();
      
      // Get initial news
      const initialNews = NewsService.getLatestNews(50);
      setNewsData(initialNews);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize news feed:', error);
      setIsLoading(false);
    }
  };

  const handleNewsUpdate = useCallback((newsArray) => {
    setNewsData(prev => {
      const combined = [...newsArray, ...prev];
      const unique = combined.filter((news, index, self) => 
        index === self.findIndex(n => n.id === news.id)
      );
      return unique.slice(0, 100); // Keep only latest 100
    });

    // Show notification for breaking news
    const breakingNews = newsArray.filter(news => 
      news.tags.includes('breaking') && news.relevance > 90
    );
    
    breakingNews.forEach(news => {
      NotificationService.newsAlert(
        news.headline,
        news.source,
        news.sentiment.label
      );
    });
  }, []);

  const filterNews = () => {
    let filtered = [...newsData];

    // Category filter
    if (activeCategory !== 'all') {
      filtered = filtered.filter(news => news.category === activeCategory);
    }

    // Sentiment filter
    if (sentimentFilter !== 'all') {
      filtered = filtered.filter(news => {
        const sentiment = news.sentiment.label.toLowerCase();
        return (
          (sentimentFilter === 'bullish' && (sentiment === 'positive' || sentiment === 'bullish')) ||
          (sentimentFilter === 'bearish' && (sentiment === 'negative' || sentiment === 'bearish')) ||
          (sentimentFilter === 'neutral' && sentiment === 'neutral')
        );
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(news =>
        news.headline.toLowerCase().includes(query) ||
        news.description.toLowerCase().includes(query) ||
        news.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort by relevance and time
    filtered.sort((a, b) => {
      if (a.relevance !== b.relevance) {
        return b.relevance - a.relevance;
      }
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });

    setFilteredNews(filtered);
  };

  const getSentimentColor = (sentiment) => {
    const label = sentiment.label.toLowerCase();
    if (label === 'positive' || label === 'bullish') return '#2ecc71';
    if (label === 'negative' || label === 'bearish') return '#e74c3c';
    return '#95a5a6';
  };

  const getMarketImpactIcon = (impact) => {
    switch (impact.level) {
      case 'high': return '🔥';
      case 'medium': return '⚡';
      case 'low': return '💡';
      default: return '📊';
    }
  };

  const getMarketImpactColor = (impact) => {
    switch (impact.level) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const handleNewsClick = (news) => {
    setSelectedNews(news);
    
    // Track analytics
    if (window.gtag) {
      window.gtag('event', 'news_click', {
        news_id: news.id,
        category: news.category,
        sentiment: news.sentiment.label
      });
    }
  };

  if (isLoading) {
    return (
      <div className="news-feed-loading">
        <motion.div 
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          📰
        </motion.div>
        <p>Loading latest crypto news...</p>
      </div>
    );
  }

  return (
    <div className="enhanced-news-feed">
      {/* Header */}
      <div className="news-feed-header">
        <div className="header-title">
          <h2>📰 Crypto News Intelligence</h2>
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span>Live Updates</span>
          </div>
        </div>

        <div className="news-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="news-search"
            />
            <span className="search-icon">🔍</span>
          </div>

          <button
            className={`impact-mode-btn ${marketImpactMode ? 'active' : ''}`}
            onClick={() => setMarketImpactMode(!marketImpactMode)}
          >
            {marketImpactMode ? '📊' : '🎯'} Impact Mode
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="category-filters">
        {categories.map(category => (
          <motion.button
            key={category.id}
            className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
            style={{ '--category-color': category.color }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="category-icon">{category.icon}</span>
            <span>{category.name}</span>
          </motion.button>
        ))}
      </div>

      {/* Sentiment Filters */}
      <div className="sentiment-filters">
        <span className="filter-label">Sentiment:</span>
        {sentimentFilters.map(filter => (
          <button
            key={filter.id}
            className={`sentiment-btn ${sentimentFilter === filter.id ? 'active' : ''}`}
            onClick={() => setSentimentFilter(filter.id)}
            style={{ '--sentiment-color': filter.color }}
          >
            {filter.name}
          </button>
        ))}
      </div>

      {/* News Grid */}
      <div className={`news-grid ${marketImpactMode ? 'impact-mode' : ''}`}>
        <AnimatePresence>
          {filteredNews.map((news, index) => (
            <motion.article
              key={news.id}
              className={`news-card ${news.tags.includes('breaking') ? 'breaking' : ''}`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => handleNewsClick(news)}
            >
              {/* Breaking Badge */}
              {news.tags.includes('breaking') && (
                <div className="breaking-badge">
                  🚨 BREAKING
                </div>
              )}

              {/* Market Impact Indicator */}
              {marketImpactMode && (
                <div 
                  className="market-impact-indicator"
                  style={{ background: getMarketImpactColor(news.marketImpact) }}
                >
                  <span>{getMarketImpactIcon(news.marketImpact)}</span>
                  <span>{news.marketImpact.level.toUpperCase()}</span>
                </div>
              )}

              {/* News Header */}
              <div className="news-header">
                <div className="news-meta">
                  <span className="news-source">{news.source}</span>
                  <span className="news-time">{formatTimeAgo(news.publishedAt)}</span>
                </div>
                <div 
                  className="sentiment-badge"
                  style={{ background: getSentimentColor(news.sentiment) }}
                >
                  {news.sentiment.score > 0 ? '📈' : news.sentiment.score < 0 ? '📉' : '➖'}
                  <span>{(news.sentiment.score * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* News Content */}
              <div className="news-content">
                <h3 className="news-headline">{news.headline}</h3>
                <p className="news-description">{news.description}</p>
              </div>

              {/* Affected Assets */}
              {news.marketImpact.affectedAssets.length > 0 && (
                <div className="affected-assets">
                  <span className="assets-label">Affected:</span>
                  {news.marketImpact.affectedAssets.map(asset => (
                    <span key={asset} className="asset-tag">{asset}</span>
                  ))}
                </div>
              )}

              {/* News Tags */}
              <div className="news-tags">
                {news.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="news-tag">#{tag}</span>
                ))}
              </div>

              {/* Relevance Score */}
              <div className="relevance-bar">
                <div 
                  className="relevance-fill"
                  style={{ width: `${news.relevance}%` }}
                ></div>
                <span className="relevance-text">{news.relevance}% relevant</span>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>

      {/* Load More */}
      {filteredNews.length === 0 && !isLoading && (
        <div className="no-news">
          <span className="no-news-icon">📭</span>
          <p>No news found matching your filters</p>
          <button onClick={() => {
            setActiveCategory('all');
            setSentimentFilter('all');
            setSearchQuery('');
          }}>
            Clear Filters
          </button>
        </div>
      )}

      {/* News Detail Modal */}
      <AnimatePresence>
        {selectedNews && (
          <NewsDetailModal 
            news={selectedNews} 
            onClose={() => setSelectedNews(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// News Detail Modal Component
const NewsDetailModal = ({ news, onClose }) => {
  return (
    <motion.div
      className="news-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="news-modal"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{news.headline}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="news-meta-detailed">
            <span><strong>Source:</strong> {news.source}</span>
            <span><strong>Published:</strong> {new Date(news.publishedAt).toLocaleString()}</span>
            <span><strong>Category:</strong> {news.category}</span>
            <span><strong>Sentiment:</strong> {news.sentiment.label} ({(news.sentiment.score * 100).toFixed(1)}%)</span>
          </div>

          <div className="news-description-full">
            <p>{news.description}</p>
          </div>

          <div className="market-impact-analysis">
            <h3>Market Impact Analysis</h3>
            <div className="impact-details">
              <div className="impact-level">
                <strong>Impact Level:</strong> {news.marketImpact.level.toUpperCase()}
              </div>
              <div className="impact-direction">
                <strong>Direction:</strong> {news.marketImpact.direction}
              </div>
              <div className="impact-confidence">
                <strong>Confidence:</strong> {news.marketImpact.confidence}%
              </div>
            </div>

            {news.marketImpact.affectedAssets.length > 0 && (
              <div className="affected-assets-detailed">
                <strong>Affected Assets:</strong>
                <div className="assets-grid">
                  {news.marketImpact.affectedAssets.map(asset => (
                    <span key={asset} className="asset-chip">{asset}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="news-actions">
            <button className="action-btn primary">
              📊 Analyze Impact
            </button>
            <button className="action-btn secondary">
              🔔 Set Alert
            </button>
            <button className="action-btn tertiary">
              📤 Share
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EnhancedNewsFeed;