class SignalService {
  constructor() {
    this.signals = {};
    this.lastUpdated = null;
    this.backend_url = 'http://localhost:5000'; // Update with your backend URL
  }

  async fetchLatestSignals() {
    try {
      const response = await fetch(`${this.backend_url}/api/signals`);
      
      if (!response.ok) {
        throw new Error(`Signal fetch failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      this.signals = data.signals;
      this.lastUpdated = new Date(data.last_update * 1000); // Convert timestamp
      
      return this.signals;
    } catch (error) {
      console.error("Error fetching signals:", error);
      
      // Use mock data as fallback
      if (Object.keys(this.signals).length === 0) {
        this.signals = {
          'ETH': { 
            total_score: 2,
            mean_reversion: 1,
            momentum: 1,
            volatility: 0,
            breakout: 0,
            ml_confidence: 0.68
          },
          'BTC': {
            total_score: -1,
            mean_reversion: 0,
            momentum: -1,
            volatility: -1,
            breakout: 1,
            ml_confidence: 0.42
          },
          'USDC': {
            total_score: 0,
            mean_reversion: 0,
            momentum: 0,
            volatility: 0,
            breakout: 0,
            ml_confidence: 0.51
          }
        };
      }
      
      return this.signals;
    }
  }
  
  async fetchTargetWeights() {
    try {
      const response = await fetch(`${this.backend_url}/api/signals`);
      const data = await response.json();
      return data.weights;
    } catch (error) {
      console.error("Error fetching target weights:", error);
      
      // Calculate mock weights based on signal scores
      const scores = Object.entries(this.signals).map(([token, data]) => ({
        token,
        score: data.total_score + 4 // Adjust to positive (0-8)
      }));
      
      const totalScore = scores.reduce((sum, item) => sum + item.score, 0);
      
      const weights = scores.reduce((obj, item) => {
        obj[item.token] = Math.round((item.score / totalScore) * 100);
        return obj;
      }, {});
      
      return weights;
    }
  }
}

export default new SignalService();