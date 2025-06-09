import React, { useState, useEffect } from 'react';
import RebalanceService from '../services/RebalanceService';
import RebalanceStrategies from './RebalanceStrategies';

const RecommendationCard = ({ recommendation }) => {
  if (!recommendation) return null;
  
  const { recommendation: action, urgency, strategy, target_weights, justification, metrics } = recommendation;
  
  // Format urgency for display
  const urgencyDisplay = {
    HIGH: { label: 'Urgent', color: '#ef4444' },
    MEDIUM: { label: 'Recommended', color: '#f59e0b' },
    LOW: { label: 'Optional', color: '#10b981' }
  }[urgency] || { label: urgency, color: '#6b7280' };
  
  return (
    <div className="recommendation-card">
      <div className="card-header" style={{ borderColor: urgencyDisplay.color }}>
        <h3>Recommendation: <span className="action">{action}</span></h3>
        <div className="urgency-badge" style={{ backgroundColor: urgencyDisplay.color }}>
          {urgencyDisplay.label}
        </div>
      </div>
      
      <div className="recommendation-content">
        <div className="strategy-info">
          <h4>Recommended Strategy</h4>
          <div className="strategy-name">{strategy.name}</div>
          <div className="strategy-description">{strategy.description}</div>
        </div>
        
        <div className="justification-section">
          <h4>Justification</h4>
          <ul className="justification-list">
            {justification.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
        
        {metrics && (
          <div className="metrics-section">
            <div className="metric">
              <div className="metric-label">Expected Improvement</div>
              <div className="metric-value">{metrics.optimization_score || 0}/10</div>
            </div>
            <div className="metric">
              <div className="metric-label">Risk Impact</div>
              <div className="metric-value">{metrics.risk_impact >= 0 ? '+' : ''}{(metrics.risk_impact * 100).toFixed(1)}%</div>
            </div>
            <div className="metric">
              <div className="metric-label">Return Impact</div>
              <div className="metric-value">{metrics.expected_return_impact >= 0 ? '+' : ''}{(metrics.expected_return_impact * 100).toFixed(1)}%</div>
            </div>
          </div>
        )}
        
        {target_weights && Object.keys(target_weights).length > 0 && (
          <div className="target-weights">
            <h4>Target Allocation</h4>
            <div className="weights-grid">
              {Object.entries(target_weights).map(([asset, weight]) => (
                <div key={asset} className="weight-item">
                  <div className="asset-name">{asset}</div>
                  <div className="asset-weight">{weight.toFixed(1)}%</div>
                  <div className="weight-bar" style={{ width: `${weight}%` }}></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AdvancedRebalancePanel = ({ 
  onExecuteRebalance, 
  portfolioData, 
  refreshInterval = 60000 
}) => {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState('tactical');
  const [riskProfile, setRiskProfile] = useState(50);
  const [driftAnalysis, setDriftAnalysis] = useState(null);
  const [executionStatus, setExecutionStatus] = useState('idle');
  
  // Fetch rebalance recommendation
  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        setLoading(true);
        const data = await RebalanceService.getRecommendation(riskProfile);
        setRecommendation(data);
        
        // Calculate drift analysis if portfolio data available
        if (portfolioData?.current_weights) {
          const drift = RebalanceService.calculateDrift(
            portfolioData.current_weights,
            data.target_weights || {}
          );
          setDriftAnalysis(drift);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch recommendation:', error);
        setLoading(false);
      }
    };
    
    fetchRecommendation();
    
    // Set up refresh interval
    const interval = setInterval(fetchRecommendation, refreshInterval);
    return () => clearInterval(interval);
  }, [riskProfile, refreshInterval, portfolioData]);
  
  // Handle strategy change
  const handleStrategyChange = (strategy) => {
    setSelectedStrategy(strategy);
    // Could fetch updated recommendation based on strategy
  };
  
  // Handle risk profile change
  const handleRiskProfileChange = (e) => {
    setRiskProfile(Number(e.target.value));
  };
  
  // Execute rebalance
  const handleExecuteRebalance = async () => {
    try {
      setExecutionStatus('executing');
      
      const result = await RebalanceService.executeRebalance(
        recommendation?.target_weights,
        selectedStrategy,
        riskProfile
      );
      
      setExecutionStatus('success');
      
      if (onExecuteRebalance) {
        onExecuteRebalance(result);
      }
      
      // Re-fetch recommendation after rebalancing
      setTimeout(async () => {
        try {
          const newData = await RebalanceService.getRecommendation(riskProfile);
          setRecommendation(newData);
        } catch (error) {
          console.error('Failed to update recommendation after rebalance:', error);
        }
        setExecutionStatus('idle');
      }, 3000);
      
    } catch (error) {
      console.error('Rebalance execution failed:', error);
      setExecutionStatus('error');
      
      // Reset status after delay
      setTimeout(() => {
        setExecutionStatus('idle');
      }, 3000);
    }
  };
  
  return (
    <div className="advanced-rebalance-panel">
      <div className="panel-header">
        <h2>Portfolio Rebalancing</h2>
        <div className="risk-profile-control">
          <label htmlFor="risk-slider">Risk Profile</label>
          <input
            id="risk-slider"
            type="range"
            min="0"
            max="100"
            value={riskProfile}
            onChange={handleRiskProfileChange}
            className="risk-slider"
          />
          <span className="risk-label">
            {riskProfile < 30 ? 'Conservative' : riskProfile > 70 ? 'Aggressive' : 'Moderate'}
          </span>
        </div>
      </div>
      
      <div className="panel-content">
        <div className="recommendation-section">
          {loading ? (
            <div className="loading-indicator">Loading recommendation...</div>
          ) : (
            <RecommendationCard recommendation={recommendation} />
          )}
          
          {driftAnalysis && (
            <div className="drift-analysis">
              <h4>Portfolio Drift Analysis</h4>
              <div className="drift-metrics">
                <div className="drift-metric">
                  <span className="metric-label">Max Drift</span>
                  <span className={`metric-value drift-${driftAnalysis.driftStatus.toLowerCase()}`}>
                    {driftAnalysis.maxDrift.toFixed(1)}%
                  </span>
                </div>
                <div className="drift-metric">
                  <span className="metric-label">Total Drift</span>
                  <span className="metric-value">
                    {driftAnalysis.totalDrift.toFixed(1)}%
                  </span>
                </div>
                <div className="drift-metric">
                  <span className="metric-label">Status</span>
                  <span className={`drift-status drift-${driftAnalysis.driftStatus.toLowerCase()}`}>
                    {driftAnalysis.driftStatus}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div className="action-controls">
            <button
              className={`execute-button ${executionStatus}`}
              onClick={handleExecuteRebalance}
              disabled={executionStatus !== 'idle' || recommendation?.recommendation !== 'REBALANCE'}
            >
              {executionStatus === 'executing' ? 'Executing...' :
               executionStatus === 'success' ? 'Success!' :
               executionStatus === 'error' ? 'Failed' :
               'Execute Rebalance'}
            </button>
            
            {recommendation?.recommendation !== 'REBALANCE' && (
              <div className="hold-message">
                Rebalancing is not recommended at this time
              </div>
            )}
          </div>
        </div>
        
        <RebalanceStrategies 
          onStrategyChange={handleStrategyChange}
          initialStrategy={recommendation?.strategy?.key || 'tactical'}
          className="strategies-section"
        />
      </div>
    </div>
  );
};

export default AdvancedRebalancePanel; 