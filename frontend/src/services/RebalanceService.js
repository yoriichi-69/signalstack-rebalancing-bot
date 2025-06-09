import axios from 'axios';

const DEFAULT_USER_ID = 'default_user';

class RebalanceService {
  constructor() {
    this.baseUrl = '/api';
  }

  /**
   * Fetch rebalance recommendation with optional risk profile
   * @param {number} riskProfile - Risk profile (0-100)
   * @param {string} userId - Optional user ID
   * @returns {Promise<Object>} Rebalance recommendation
   */
  async getRecommendation(riskProfile = 50, userId = DEFAULT_USER_ID) {
    try {
      const response = await axios.get(`${this.baseUrl}/portfolio/recommendation`, {
        params: { 
          risk_profile: riskProfile,
          user_id: userId
        }
      });
      return response.data.recommendation;
    } catch (error) {
      console.error('Error fetching rebalance recommendation:', error);
      throw this._formatError(error);
    }
  }

  /**
   * Execute portfolio rebalancing
   * @param {Object} weights - Target weights as percentages
   * @param {string} strategy - Strategy key
   * @param {number} riskProfile - Risk profile (0-100)
   * @param {string} userId - Optional user ID
   * @returns {Promise<Object>} Rebalance result
   */
  async executeRebalance(weights, strategy = 'tactical', riskProfile = 50, userId = DEFAULT_USER_ID) {
    try {
      const response = await axios.post(`${this.baseUrl}/portfolio/rebalance`, {
        weights,
        strategy,
        risk_profile: riskProfile,
        user_id: userId
      });
      return response.data;
    } catch (error) {
      console.error('Error executing rebalance:', error);
      throw this._formatError(error);
    }
  }

  /**
   * Get available rebalancing strategies
   * @returns {Promise<Object>} Available strategies
   */
  async getStrategies() {
    try {
      const response = await axios.get(`${this.baseUrl}/strategies`);
      return response.data.strategies;
    } catch (error) {
      console.error('Error fetching strategies:', error);
      throw this._formatError(error);
    }
  }

  /**
   * Get current portfolio data
   * @param {string} userId - Optional user ID
   * @returns {Promise<Object>} Portfolio data
   */
  async getPortfolioData(userId = DEFAULT_USER_ID) {
    try {
      const response = await axios.get(`${this.baseUrl}/portfolio/data`, {
        params: { user_id: userId }
      });
      return response.data.portfolio;
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      throw this._formatError(error);
    }
  }

  /**
   * Get portfolio historical performance
   * @param {string} userId - Optional user ID
   * @returns {Promise<Object>} Portfolio performance history
   */
  async getPerformanceHistory(userId = DEFAULT_USER_ID) {
    try {
      const response = await axios.get(`${this.baseUrl}/portfolio/performance`, {
        params: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching performance history:', error);
      throw this._formatError(error);
    }
  }

  /**
   * Calculate drift from target allocation
   * @param {Object} currentWeights - Current weights as decimal (0.32 = 32%)
   * @param {Object} targetWeights - Target weights as percentage (32 = 32%)
   * @returns {Object} Drift analysis
   */
  calculateDrift(currentWeights, targetWeights) {
    const drifts = {};
    let maxDrift = 0;
    let totalDrift = 0;
    
    // Convert target weights from percentage to decimal if needed
    const normalizedTargets = {};
    for (const [asset, weight] of Object.entries(targetWeights)) {
      normalizedTargets[asset] = weight > 1 ? weight / 100 : weight;
    }
    
    for (const asset in currentWeights) {
      const current = currentWeights[asset] || 0;
      const target = normalizedTargets[asset] || 0;
      const drift = Math.abs(current - target);
      
      drifts[asset] = {
        current: current * 100, // Convert to percentage
        target: target * 100,
        drift: drift * 100,
        status: drift > 0.05 ? 'HIGH' : drift > 0.02 ? 'MEDIUM' : 'LOW'
      };
      
      maxDrift = Math.max(maxDrift, drift);
      totalDrift += drift;
    }
    
    // Check for missing assets in current allocation
    for (const asset in normalizedTargets) {
      if (!currentWeights[asset]) {
        const target = normalizedTargets[asset];
        drifts[asset] = {
          current: 0,
          target: target * 100,
          drift: target * 100,
          status: target > 0.05 ? 'HIGH' : 'MEDIUM'
        };
        
        maxDrift = Math.max(maxDrift, target);
        totalDrift += target;
      }
    }
    
    return {
      drifts,
      maxDrift: maxDrift * 100,
      totalDrift: totalDrift * 100,
      needsRebalance: maxDrift > 0.05,
      driftStatus: maxDrift > 0.1 ? 'HIGH' : maxDrift > 0.05 ? 'MEDIUM' : 'LOW'
    };
  }

  /**
   * Simulate rebalance impact
   * @param {Object} currentWeights - Current weights
   * @param {Object} targetWeights - Target weights
   * @returns {Object} Impact analysis
   */
  simulateRebalanceImpact(currentWeights, targetWeights) {
    // Simple simulation - more sophisticated calculation would be done on backend
    const drift = this.calculateDrift(currentWeights, targetWeights);
    
    // Estimate transaction cost (simplified)
    const transactionCost = drift.totalDrift * 0.0005; // 5 basis points
    
    // Rough estimate of potential improvement in risk-adjusted return
    const riskReduction = drift.maxDrift > 0.1 ? 0.15 : drift.maxDrift > 0.05 ? 0.08 : 0.02;
    const returnImprovement = drift.maxDrift > 0.1 ? 0.10 : drift.maxDrift > 0.05 ? 0.05 : 0.01;
    const netImprovement = returnImprovement - transactionCost;
    
    return {
      cost: {
        percentValue: transactionCost,
        rating: transactionCost > 0.2 ? 'HIGH' : transactionCost > 0.1 ? 'MEDIUM' : 'LOW'
      },
      impact: {
        riskReduction,
        returnImprovement,
        netImprovement,
        rating: netImprovement > 0.05 ? 'HIGH' : netImprovement > 0 ? 'MEDIUM' : 'LOW'
      },
      recommendation: netImprovement > 0 ? 'REBALANCE' : 'HOLD',
      confidence: drift.maxDrift > 0.1 ? 0.9 : drift.maxDrift > 0.05 ? 0.7 : 0.5
    };
  }
  
  /**
   * Formats error responses consistently.
   * @private
   * @param {Error} error - The caught error.
   * @returns {Error} Formatted error.
   */
  _formatError(error) {
    if (error.response && error.response.data && error.response.data.error) {
      return new Error(error.response.data.error);
    }
    return error;
  }
}

export default new RebalanceService(); 