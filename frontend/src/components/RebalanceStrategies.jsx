import React, { useState, useEffect, useMemo } from 'react';
import RebalanceService from '../services/RebalanceService';

const StrategyCard = ({ strategy, selected, onSelect }) => {
  const { key, name, description } = strategy;
  
  return (
    <div 
      className={`strategy-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(key)}
    >
      <div className="strategy-header">
        <h3>{name}</h3>
        {selected && <span className="selected-badge">Selected</span>}
      </div>
      <p className="strategy-description">{description}</p>
      
      <div className="strategy-stats">
        <div className="stat">
          <span className="stat-label">Risk Level</span>
          <div className={`stat-value risk-${key === 'risk_parity' ? 'low' : key === 'momentum' ? 'high' : 'medium'}`}>
            {key === 'risk_parity' ? 'Low' : key === 'momentum' ? 'High' : 'Medium'}
          </div>
        </div>
        <div className="stat">
          <span className="stat-label">Rebalance Frequency</span>
          <div className="stat-value">
            {key === 'threshold' ? 'As needed' : key === 'tactical' ? 'Dynamic' : 'Periodic'}
          </div>
        </div>
      </div>
    </div>
  );
};

const RebalanceStrategies = ({ onStrategyChange, initialStrategy = 'tactical', className = '' }) => {
  const [strategies, setStrategies] = useState({});
  const [selectedStrategy, setSelectedStrategy] = useState(initialStrategy);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch available strategies
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        setLoading(true);
        const data = await RebalanceService.getStrategies();
        setStrategies(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load strategies');
        setLoading(false);
        console.error('Failed to load strategies:', err);
        
        // Fallback strategies
        setStrategies({
          'shannon': {
            name: "Shannon's Demon",
            description: 'Equal-weight rebalancing strategy that benefits from volatility harvesting'
          },
          'threshold': {
            name: 'Threshold Rebalancing',
            description: 'Rebalance only when asset weights drift beyond threshold'
          },
          'mpt': {
            name: 'Modern Portfolio Theory',
            description: 'Optimize for maximum Sharpe ratio'
          },
          'risk_parity': {
            name: 'Risk Parity',
            description: 'Allocate based on equal risk contribution'
          },
          'momentum': {
            name: 'Momentum-Based',
            description: 'Allocate more to assets with positive momentum'
          },
          'tactical': {
            name: 'Tactical Allocation',
            description: 'Dynamic allocation based on market signals'
          }
        });
      }
    };
    
    fetchStrategies();
  }, []);
  
  // Notify parent of strategy changes
  useEffect(() => {
    if (onStrategyChange && !loading && strategies[selectedStrategy]) {
      onStrategyChange(selectedStrategy, strategies[selectedStrategy]);
    }
  }, [selectedStrategy, strategies, loading, onStrategyChange]);
  
  // Handle strategy selection
  const handleStrategySelect = (strategyKey) => {
    setSelectedStrategy(strategyKey);
  };
  
  // Format strategies for display
  const strategyList = useMemo(() => {
    return Object.entries(strategies).map(([key, data]) => ({
      key,
      name: data.name,
      description: data.description
    }));
  }, [strategies]);
  
  if (loading) {
    return <div className="strategies-loading">Loading strategies...</div>;
  }
  
  if (error) {
    return <div className="strategies-error">{error}</div>;
  }
  
  return (
    <div className={`rebalance-strategies-container ${className}`}>
      <div className="strategies-header">
        <h2>Rebalancing Strategies</h2>
        <p className="strategies-subtitle">
          Select the optimal strategy for your portfolio rebalancing
        </p>
      </div>
      
      <div className="strategies-grid">
        {strategyList.map((strategy) => (
          <StrategyCard 
            key={strategy.key}
            strategy={strategy}
            selected={selectedStrategy === strategy.key}
            onSelect={handleStrategySelect}
          />
        ))}
      </div>
      
      <div className="strategy-info-panel">
        <h3>About {strategies[selectedStrategy]?.name}</h3>
        <p>{strategies[selectedStrategy]?.description}</p>
        
        <div className="strategy-use-cases">
          <h4>Best For</h4>
          {selectedStrategy === 'shannon' && (
            <ul>
              <li>Long-term investors seeking consistent returns</li>
              <li>Portfolios with uncorrelated volatile assets</li>
              <li>Simple maintenance with potential volatility harvesting benefits</li>
            </ul>
          )}
          {selectedStrategy === 'threshold' && (
            <ul>
              <li>Tax-sensitive investors minimizing transaction costs</li>
              <li>Portfolios requiring minimal maintenance</li>
              <li>Markets with high transaction costs</li>
            </ul>
          )}
          {selectedStrategy === 'mpt' && (
            <ul>
              <li>Performance-oriented investors</li>
              <li>Portfolios seeking optimal risk/return balance</li>
              <li>Markets with relatively stable correlations</li>
            </ul>
          )}
          {selectedStrategy === 'risk_parity' && (
            <ul>
              <li>Risk-averse investors</li>
              <li>Highly volatile market conditions</li>
              <li>Diversified multi-asset portfolios</li>
            </ul>
          )}
          {selectedStrategy === 'momentum' && (
            <ul>
              <li>Trend-following investors</li>
              <li>Strong directional market conditions</li>
              <li>Higher risk tolerance profiles</li>
            </ul>
          )}
          {selectedStrategy === 'tactical' && (
            <ul>
              <li>Active portfolio management</li>
              <li>Adapting to changing market conditions</li>
              <li>Balancing multiple signal indicators</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default RebalanceStrategies; 