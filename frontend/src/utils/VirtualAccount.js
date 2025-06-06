class VirtualAccount {
  constructor(initialBalances = {}) {
    // Default initial balances if none provided
    const defaultBalances = {
      'ETH': 1.0,
      'BTC': 0.05,
      'USDC': 10000,
    };

    this.balances = initialBalances || defaultBalances;
    this.transactions = [];
    this.portfolioHistory = [];
    this.lastUpdated = new Date();
    
    // Load from localStorage if available
    this.loadAccount();
  }
  
  loadAccount() {
    const savedAccount = localStorage.getItem('virtualAccount');
    if (savedAccount) {
      const parsed = JSON.parse(savedAccount);
      this.balances = parsed.balances;
      this.transactions = parsed.transactions;
      this.portfolioHistory = parsed.portfolioHistory;
      this.lastUpdated = new Date(parsed.lastUpdated);
    }
  }
  
  saveAccount() {
    localStorage.setItem('virtualAccount', JSON.stringify({
      balances: this.balances,
      transactions: this.transactions,
      portfolioHistory: this.portfolioHistory,
      lastUpdated: this.lastUpdated
    }));
  }
  
  getBalances() {
    return {...this.balances};
  }
  
  getTransactionHistory() {
    return [...this.transactions];
  }
  
  executeSwap(fromToken, toToken, amountFrom, exchangeRate) {
    // Check balance
    if (!this.balances[fromToken] || this.balances[fromToken] < amountFrom) {
      throw new Error('Insufficient balance');
    }
    
    // Calculate amount to receive
    const amountTo = amountFrom * exchangeRate;
    
    // Update balances
    this.balances[fromToken] -= amountFrom;
    if (!this.balances[toToken]) this.balances[toToken] = 0;
    this.balances[toToken] += amountTo;
    
    // Record transaction
    const transaction = {
      type: 'SWAP',
      fromToken,
      toToken,
      amountFrom,
      amountTo,
      exchangeRate,
      timestamp: new Date()
    };
    
    this.transactions.push(transaction);
    this.lastUpdated = new Date();
    this.saveAccount();
    
    return transaction;
  }
  
  executeRebalance(targetWeights, prices) {
    // Calculate current portfolio value in USD
    let totalValueUSD = 0;
    Object.entries(this.balances).forEach(([token, amount]) => {
      totalValueUSD += amount * (prices[token] || 0);
    });
    
    // Calculate target values for each token
    const targetValues = {};
    Object.entries(targetWeights).forEach(([token, weight]) => {
      targetValues[token] = (weight / 100) * totalValueUSD;
    });
    
    // Calculate current values
    const currentValues = {};
    Object.entries(this.balances).forEach(([token, amount]) => {
      currentValues[token] = amount * (prices[token] || 0);
    });
    
    // Determine tokens to sell (overweight) and buy (underweight)
    const tokensToSell = [];
    const tokensToBuy = [];
    
    Object.entries(targetValues).forEach(([token, targetValue]) => {
      const currentValue = currentValues[token] || 0;
      if (currentValue > targetValue + (totalValueUSD * 0.02)) { // 2% threshold
        tokensToSell.push({
          token,
          amountUSD: currentValue - targetValue
        });
      } else if (targetValue > currentValue + (totalValueUSD * 0.02)) {
        tokensToBuy.push({
          token,
          amountUSD: targetValue - currentValue
        });
      }
    });
    
    // Execute virtual swaps
    const swaps = [];
    
    // Sort by amount descending
    tokensToSell.sort((a, b) => b.amountUSD - a.amountUSD);
    tokensToBuy.sort((a, b) => b.amountUSD - a.amountUSD);
    
    // Sell overweight tokens first
    let totalUSDFromSells = 0;
    for (const sell of tokensToSell) {
      const token = sell.token;
      const amountToSellUSD = sell.amountUSD;
      const tokenPrice = prices[token];
      const amountToSell = amountToSellUSD / tokenPrice;
      
      // Record the swap to USDC
      if (amountToSell > 0 && tokenPrice) {
        this.executeSwap(token, 'USDC', amountToSell, tokenPrice);
        totalUSDFromSells += amountToSellUSD;
        swaps.push({
          from: token,
          to: 'USDC',
          amountFrom: amountToSell,
          amountTo: amountToSellUSD
        });
      }
    }
    
    // Then buy underweight tokens
    for (const buy of tokensToBuy) {
      const token = buy.token;
      const usdAvailableForThisToken = (buy.amountUSD / tokensToBuy.reduce((sum, t) => sum + t.amountUSD, 0)) * totalUSDFromSells;
      const tokenPrice = prices[token];
      const amountToBuy = usdAvailableForThisToken / tokenPrice;
      
      // Record the swap from USDC
      if (amountToBuy > 0 && tokenPrice) {
        this.executeSwap('USDC', token, usdAvailableForThisToken, 1/tokenPrice);
        swaps.push({
          from: 'USDC',
          to: token,
          amountFrom: usdAvailableForThisToken,
          amountTo: amountToBuy
        });
      }
    }
    
    // Calculate new portfolio value and record in history
    let newTotalValue = 0;
    Object.entries(this.balances).forEach(([token, amount]) => {
      newTotalValue += amount * (prices[token] || 0);
    });
    
    this.portfolioHistory.push({
      timestamp: new Date(),
      value: newTotalValue,
      balances: {...this.balances}
    });
    
    this.saveAccount();
    
    return {
      swaps,
      oldValue: totalValueUSD,
      newValue: newTotalValue,
      change: newTotalValue - totalValueUSD
    };
  }
  
  reset() {
    // Reset to initial state
    this.balances = {
      'ETH': 1.0,
      'BTC': 0.05,
      'USDC': 10000,
    };
    this.transactions = [];
    this.portfolioHistory = [];
    this.lastUpdated = new Date();
    this.saveAccount();
  }
  
  getPortfolioValue(prices) {
    let totalValue = 0;
    Object.entries(this.balances).forEach(([token, amount]) => {
      if (prices[token]) {
        totalValue += amount * prices[token];
      }
    });
    return totalValue;
  }
}

export default VirtualAccount;