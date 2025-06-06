class BaseStrategy {
  constructor(name, description) {
    this.name = name;
    this.description = description;
  }
  
  calculateTargetWeights(signals, prices) {
    throw new Error("calculateTargetWeights must be implemented by subclass");
  }
  
  getDescription() {
    return this.description;
  }
  
  getName() {
    return this.name;
  }
}

class SignalBasedStrategy extends BaseStrategy {
  constructor() {
    super(
      "Signal Based", 
      "Allocates weights based on technical and ML signals. Favors assets with stronger buy signals."
    );
  }
  
  calculateTargetWeights(signals, prices) {
    // Extract scores and normalize to positive
    const scores = Object.entries(signals).map(([token, data]) => ({
      token,
      score: data.total_score + 4 // Adjust to make positive (range 0-8)
    }));
    
    const totalScore = scores.reduce((sum, item) => sum + item.score, 0);
    
    if (totalScore === 0) {
      // Equal weights if no signal
      const equalWeight = 100 / scores.length;
      return scores.reduce((obj, item) => {
        obj[item.token] = equalWeight;
        return obj;
      }, {});
    }
    
    // Calculate percentage weights
    return scores.reduce((obj, item) => {
      obj[item.token] = Math.round((item.score / totalScore) * 100);
      return obj;
    }, {});
  }
}

class MomentumStrategy extends BaseStrategy {
  constructor() {
    super(
      "Pure Momentum",
      "Allocates more weight to assets with positive price momentum and less to those with negative momentum."
    );
  }
  
  calculateTargetWeights(signals, prices) {
    // Extract only momentum values
    const scores = Object.entries(signals).map(([token, data]) => ({
      token,
      score: data.momentum + 2 // Normalize to positive (range 0-4)
    }));
    
    const totalScore = scores.reduce((sum, item) => sum + item.score, 0);
    
    // Calculate weights based only on momentum
    return scores.reduce((obj, item) => {
      obj[item.token] = Math.round((item.score / totalScore) * 100);
      return obj;
    }, {});
  }
}

class EqualWeightStrategy extends BaseStrategy {
  constructor() {
    super(
      "Equal Weight",
      "Allocates equal weight to all assets regardless of signals. Simple but can be effective."
    );
  }
  
  calculateTargetWeights(signals, prices) {
    const tokens = Object.keys(signals);
    const equalWeight = Math.round(100 / tokens.length);
    
    // Distribute weights equally
    const weights = tokens.reduce((obj, token) => {
      obj[token] = equalWeight;
      return obj;
    }, {});
    
    // Handle rounding error by adding remainder to first token
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (totalWeight < 100 && tokens.length > 0) {
      weights[tokens[0]] += 100 - totalWeight;
    }
    
    return weights;
  }
}

class RiskParityStrategy extends BaseStrategy {
  constructor() {
    super(
      "Risk Parity",
      "Allocates based on volatility. Lower volatility assets get higher weights."
    );
  }
  
  calculateTargetWeights(signals, prices) {
    // Extract inverse volatility scores (lower volatility = higher score)
    const scores = Object.entries(signals).map(([token, data]) => {
      // Convert volatility signal (-1 to 1) to inverse volatility score
      // -1 = high volatility, 1 = low volatility
      const volatilityScore = 3 - data.volatility;
      return {
        token,
        score: volatilityScore
      };
    });
    
    const totalScore = scores.reduce((sum, item) => sum + item.score, 0);
    
    // Calculate weights based on inverse volatility
    return scores.reduce((obj, item) => {
      obj[item.token] = Math.round((item.score / totalScore) * 100);
      return obj;
    }, {});
  }
}

export const strategies = {
  signalBased: new SignalBasedStrategy(),
  momentum: new MomentumStrategy(),
  equalWeight: new EqualWeightStrategy(),
  riskParity: new RiskParityStrategy()
};

export default strategies;