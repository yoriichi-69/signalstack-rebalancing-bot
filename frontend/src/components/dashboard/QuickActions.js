import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './QuickActions.css';

const QuickActions = ({ onCreateStrategy, onRebalance, onAnalyze }) => {
  const [selectedAction, setSelectedAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const actions = [
    {
      id: 'rebalance',
      title: 'Auto Rebalance',
      description: 'Rebalance your portfolio based on target allocations',
      icon: '⚖️',
      color: '#00ff88',
      bgColor: 'rgba(0, 255, 136, 0.1)',
      shortcut: 'R',
      estimatedTime: '2-3 min',
      onClick: onRebalance
    },
    {
      id: 'strategy',
      title: 'Create Strategy',
      description: 'Build a new trading strategy with AI assistance',
      icon: '🧠',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      shortcut: 'S',
      estimatedTime: '5-10 min',
      onClick: onCreateStrategy
    },
    {
      id: 'analyze',
      title: 'Portfolio Analysis',
      description: 'Get detailed insights and performance metrics',
      icon: '📊',
      color: '#00d4ff',
      bgColor: 'rgba(0, 212, 255, 0.1)',
      shortcut: 'A',
      estimatedTime: '1-2 min',
      onClick: onAnalyze
    },
    {
      id: 'optimize',
      title: 'Risk Optimization',
      description: 'Optimize your portfolio for better risk management',
      icon: '🛡️',
      color: '#ffd700',
      bgColor: 'rgba(255, 215, 0, 0.1)',
      shortcut: 'O',
      estimatedTime: '3-5 min',
      onClick: () => console.log('Optimize portfolio')
    },
    {
      id: 'backtest',
      title: 'Backtest Strategy',
      description: 'Test your strategies against historical data',
      icon: '📈',
      color: '#ff6b6b',
      bgColor: 'rgba(255, 107, 107, 0.1)',
      shortcut: 'B',
      estimatedTime: '2-4 min',
      onClick: () => console.log('Backtest strategy')
    },
    {
      id: 'alerts',
      title: 'Set Price Alerts',
      description: 'Create custom alerts for price movements',
      icon: '🔔',
      color: '#ff9500',
      bgColor: 'rgba(255, 149, 0, 0.1)',
      shortcut: 'L',
      estimatedTime: '1 min',
      onClick: () => console.log('Set alerts')
    }
  ];

  const handleActionClick = async (action) => {
    setSelectedAction(action.id);
    setIsProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
      if (action.onClick) {
        action.onClick();
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsProcessing(false);
      setSelectedAction(null);
    }
  };

  const quickStats = [
    { label: 'Active Strategies', value: '3', color: '#00ff88' },
    { label: 'Pending Orders', value: '7', color: '#ffd700' },
    { label: 'Alerts Set', value: '12', color: '#00d4ff' },
    { label: 'Last Rebalanced', value: '2h ago', color: '#8b5cf6' }
  ];

  return (
    <motion.div 
      className="quick-actions-container"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="actions-header">
        <h3 className="actions-title">Quick Actions</h3>
        <div className="keyboard-hint">
          <span>Use keyboard shortcuts</span>
          <div className="hint-keys">
            <kbd>Ctrl</kbd> + <kbd>Key</kbd>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="stat-item"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <span className="stat-value" style={{ color: stat.color }}>
              {stat.value}
            </span>
            <span className="stat-label">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Action Buttons Grid */}
      <div className="actions-grid">
        {actions.map((action, index) => (
          <motion.div
            key={action.id}
            className={`action-card ${selectedAction === action.id ? 'processing' : ''}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ 
              scale: 1.02, 
              y: -4,
              boxShadow: `0 20px 40px ${action.color}20`
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleActionClick(action)}
            style={{ 
              background: action.bgColor,
              borderColor: `${action.color}30`
            }}
          >
            <div className="action-header">
              <div className="action-icon" style={{ color: action.color }}>
                {action.icon}
              </div>
              <div className="action-shortcut" style={{ color: action.color }}>
                <kbd>{action.shortcut}</kbd>
              </div>
            </div>

            <div className="action-content">
              <h4 className="action-title">{action.title}</h4>
              <p className="action-description">{action.description}</p>
            </div>

            <div className="action-footer">
              <span className="estimated-time">
                ⏱️ {action.estimatedTime}
              </span>
              
              {selectedAction === action.id && isProcessing ? (
                <div className="processing-indicator">
                  <div className="spinner"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <motion.div 
                  className="action-arrow"
                  style={{ color: action.color }}
                  whileHover={{ x: 4 }}
                >
                  →
                </motion.div>
              )}
            </div>

            {/* Hover Effect Overlay */}
            <div className="action-overlay"></div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h4 className="activity-title">Recent Activity</h4>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">🔄</div>
            <div className="activity-details">
              <span className="activity-action">Portfolio rebalanced</span>
              <span className="activity-time">2 hours ago</span>
            </div>
            <div className="activity-status success">✓</div>
          </div>
          
          <div className="activity-item">
            <div className="activity-icon">📈</div>
            <div className="activity-details">
              <span className="activity-action">Strategy optimization completed</span>
              <span className="activity-time">4 hours ago</span>
            </div>
            <div className="activity-status success">✓</div>
          </div>
          
          <div className="activity-item">
            <div className="activity-icon">🔔</div>
            <div className="activity-details">
              <span className="activity-action">Price alert triggered for BTC</span>
              <span className="activity-time">6 hours ago</span>
            </div>
            <div className="activity-status warning">!</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default QuickActions;