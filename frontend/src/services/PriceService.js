class PriceService {
  constructor() {
    this.prices = {};
    this.lastUpdated = null;
    this.listeners = [];
    this.updateInterval = null;
  }
  
  startRealTimeUpdates() {
    // Update prices every 30 seconds
    this.updateInterval = setInterval(() => {
      this.fetchLatestPrices();
    }, 30000); 
    
    // Initial fetch
    this.fetchLatestPrices();
  }
  
  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  async fetchLatestPrices() {
    try {
      // Using CoinGecko API for price data
      const tokens = ['bitcoin', 'ethereum', 'usd-coin'];
      const symbols = ['BTC', 'ETH', 'USDC'];
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokens.join(',')}&vs_currencies=usd`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }
      
      const data = await response.json();
      
      // Update the prices object
      this.prices = {
        'BTC': data['bitcoin']?.usd || 0,
        'ETH': data['ethereum']?.usd || 0,
        'USDC': data['usd-coin']?.usd || 1 // Stablecoin, usually 1 USD
      };
      
      this.lastUpdated = new Date();
      
      // Notify all listeners
      this.notifyListeners();
      
      return this.prices;
    } catch (error) {
      console.error("Error fetching prices:", error);
      
      // Return last known prices or mock data
      if (!this.prices.BTC) {
        this.prices = {
          'BTC': 58000,
          'ETH': 2800,
          'USDC': 1
        };
      }
      
      return this.prices;
    }
  }
  
  getLastUpdated() {
    return this.lastUpdated;
  }
  
  getCurrentPrices() {
    return {...this.prices};
  }
  
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
  
  notifyListeners() {
    this.listeners.forEach(callback => {
      callback(this.prices);
    });
  }
}

export default new PriceService(); // Singleton instance