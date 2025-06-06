import React, { useState, useEffect } from 'react';
import strategies from '../utils/StrategyService';

const StrategyComparison = ({ signals, prices, onApplyStrategy }) => {
  const [activeStrategy, setActiveStrategy] = useState('signalBased');
  const [strategyWeights, setStrategyWeights] = useState({});
  
  useEffect(() => {
    if (Object.keys(signals).length > 0) {
      // Calculate weights for all strategies
      const allWeights = {};
      
      Object.entries(strategies).forEach(([key, strategy]) => {
        allWeights[key] = strategy.calculateTargetWeights(signals, prices);
      });
      
      setStrategyWeights(allWeights);
    }
  }, [signals, prices]);
  
  return (
    <div className="strategy-comparison">
      <h2>Strategy Selection</h2>
      
      <div className="strategy-tabs">
        {Object.entries(strategies).map(([key, strategy]) => (
          <div 
            key={key}
            className={`strategy-tab ${activeStrategy === key ? 'active' : ''}`}
            onClick={() => setActiveStrategy(key)}
          >
            {strategy.getName()}
          </div>
        ))}
      </div>
      
      <div className="strategy-content">
        <div className="strategy-description">
          <p>{strategies[activeStrategy].getDescription()}</p>
        </div>
        
        <div className="strategy-weights">
          <h3>Recommended Portfolio Weights</h3>
          {strategyWeights[activeStrategy] && Object.entries(strategyWeights[activeStrategy]).map(([token, weight]) => (
            <div key={token} className="weight-item">
              <span className="token-name">{token}</span>
              <div className="weight-bar-container">
                <div 
                  className="weight-bar" 
                  style={{ width: `${weight}%` }}
                >
                  {weight}%
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button 
          className="strategy-apply-button"
          onClick={() => onApplyStrategy(activeStrategy, strategyWeights[activeStrategy])}
        >
          Apply This Strategy
        </button>
      </div>
    </div>
  );
};

export default StrategyComparison;