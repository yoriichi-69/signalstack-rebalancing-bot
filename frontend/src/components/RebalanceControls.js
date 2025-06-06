// d:\intel\cryptorizz\main\signalstack-rebalancing-bot\frontend\src\components\RebalanceControls.js
import React, { useState } from 'react';
import { Slider } from '@material-ui/core';

const RebalanceControls = ({ tokens, currentWeights, targetWeights, onCustomWeightsChange, onRebalance }) => {
  const [customMode, setCustomMode] = useState(false);
  const [customWeights, setCustomWeights] = useState({...targetWeights});
  
  const handleSliderChange = (token, value) => {
    // Update custom weight for the token
    const newWeights = {...customWeights, [token]: value};
    
    // Ensure weights sum to 100%
    const total = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
    const factor = 100 / total;
    
    const adjustedWeights = {};
    Object.entries(newWeights).forEach(([t, w]) => {
      adjustedWeights[t] = Math.round(w * factor);
    });
    
    setCustomWeights(adjustedWeights);
    onCustomWeightsChange(adjustedWeights);
  };
  
  return (
    <div className="rebalance-controls">
      <div className="control-header">
        <h3>Portfolio Weights</h3>
        <div className="mode-switch">
          <button 
            className={!customMode ? 'active' : ''} 
            onClick={() => setCustomMode(false)}
          >
            Signal-based
          </button>
          <button 
            className={customMode ? 'active' : ''} 
            onClick={() => setCustomMode(true)}
          >
            Custom
          </button>
        </div>
      </div>
      
      <div className="weight-controls">
        {Object.entries(customMode ? customWeights : targetWeights).map(([token, weight]) => (
          <div key={token} className="token-weight-control">
            <div className="token-label">
              <span className="token-name">{token}</span>
              <span className="token-weight">{weight}%</span>
            </div>
            
            {customMode && (
              <Slider
                value={weight}
                onChange={(e, val) => handleSliderChange(token, val)}
                min={0}
                max={100}
                step={1}
                valueLabelDisplay="auto"
              />
            )}
            
            <div className="weight-bar-container">
              <div 
                className="weight-bar current" 
                style={{ width: `${currentWeights[token] || 0}%` }}
              />
              <div 
                className="weight-bar target" 
                style={{ 
                  width: `${weight}%`,
                  opacity: 0.7
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <button 
        className="rebalance-button"
        onClick={() => onRebalance(customMode ? customWeights : targetWeights)}
      >
        Execute Rebalance
      </button>
    </div>
  );
};