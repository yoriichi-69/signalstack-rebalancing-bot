import RealtimeDataService from './RealtimeDataService';
import RebalanceService from './RebalanceService';

class AdvancedPortfolioEngine {
  constructor() {
    this.strategies = {
      modern_portfolio_theory: {
        name: 'Modern Portfolio Theory',
        description: 'Optimize for maximum Sharpe ratio'
      },
      risk_parity: {
        name: 'Risk Parity',
        description: 'Allocate based on equal risk contribution'
      },
      tactical_allocation: {
        name: 'Tactical Allocation',
        description: 'Dynamic allocation based on market signals'
      },
      minimum_volatility: {
        name: 'Minimum Volatility',
        description: 'Minimize portfolio variance'
      },
      maximum_diversification: {
        name: 'Maximum Diversification',
        description: 'Maximize diversification across assets'
      }
    };
    
    this.riskProfiles = {
      conservative: {
        volatilityTarget: 0.05,
        maxDrawdown: 0.10,
        rebalanceThreshold: 0.03
      },
      moderate: {
        volatilityTarget: 0.10,
        maxDrawdown: 0.20,
        rebalanceThreshold: 0.05
      },
      aggressive: {
        volatilityTarget: 0.20,
        maxDrawdown: 0.35,
        rebalanceThreshold: 0.07
      }
    };
    
    this.marketRegimes = {
      bull: { momentum: 0.8, meanReversion: 0.2 },
      bear: { momentum: 0.3, meanReversion: 0.7 },
      sideways: { momentum: 0.4, meanReversion: 0.6 }
    };
    
    this.performanceHistory = new Map();
    this.optimizationCache = new Map();
    
    // Initialize real-time data connection
    this.initializeRealtimeConnection();
  }

  async initializeRealtimeConnection() {
    // Start the price stream from your enhanced RealtimeDataService
    RealtimeDataService.startPriceStream();
    
    // Subscribe to real-time updates
    RealtimeDataService.subscribe('price_update', (data) => {
      this.handlePriceUpdate(data);
    });
    
    RealtimeDataService.subscribe('portfolio_update', (data) => {
      this.handlePortfolioUpdate(data);
    });
  }

  /**
   * Analyze portfolio and provide optimization recommendations
   * @param {Array} portfolio - Current portfolio
   * @param {String} strategy - Strategy to apply
   * @returns {Promise<Object>} Analysis results
   */
  async analyzePortfolio(portfolio, strategy = 'tactical_allocation') {
    try {
      // Convert portfolio to weights format
      const currentWeights = this._portfolioToWeights(portfolio);
      
      // Get market data and signals
      const recommendation = await RebalanceService.getRecommendation();
      
      // Calculate drift from recommendation
      const drift = RebalanceService.calculateDrift(
        currentWeights, 
        recommendation?.target_weights || {}
      );
      
      // Calculate risk metrics
      const riskMetrics = this._calculateRiskMetrics(portfolio, recommendation);
      
      // Determine rebalance signal
      const rebalanceSignal = this._generateRebalanceSignal(
        drift, 
        riskMetrics,
        recommendation?.recommendation || 'HOLD',
        recommendation?.urgency || 'LOW'
      );
      
      // Generate optimized allocation
      const optimizedAllocation = this._calculateOptimizedAllocation(
        portfolio, 
        recommendation?.target_weights || {},
        strategy
      );
      
      return {
        currentAllocation: portfolio.map(asset => ({
          symbol: asset.symbol,
          currentWeight: asset.value / this._getPortfolioValue(portfolio),
          targetWeight: (recommendation?.target_weights || {})[asset.symbol] / 100 || 0,
          currentValue: asset.value
        })),
        optimizedAllocation,
        riskMetrics,
        rebalanceSignal,
        driftAnalysis: drift,
        strategy: {
          key: strategy,
          name: this.strategies[strategy]?.name || 'Unknown',
          description: this.strategies[strategy]?.description || ''
        }
      };
    } catch (error) {
      console.error('Portfolio analysis failed:', error);
      throw new Error('Failed to analyze portfolio');
    }
  }
  
  /**
   * Generate rebalance signal based on drift and risk metrics
   * @param {Object} drift - Portfolio drift analysis
   * @param {Object} riskMetrics - Risk metrics
   * @param {String} recommendedAction - Recommended action
   * @param {String} urgency - Urgency level
   * @returns {Object} Rebalance signal
   */
  _generateRebalanceSignal(drift, riskMetrics, recommendedAction, urgency) {
    const action = drift.needsRebalance ? 'REBALANCE' : 'HOLD';
    
    // Estimate potential improvement from rebalancing
    let expectedImprovement = 0;
    
    if (drift.needsRebalance) {
      // Higher drift = higher potential improvement
      const driftFactor = Math.min(1, drift.maxDrift / 20);
      
      // Higher volatility = higher potential for improvement
      const volatilityFactor = Math.min(1, riskMetrics.portfolioVaR / 0.2);
      
      // Higher ratio difference = higher improvement potential
      const ratioDiff = Math.abs(
        riskMetrics.sharpeRatio - riskMetrics.optimalSharpeRatio
      ) / 2;
      
      expectedImprovement = 0.01 + (driftFactor * 0.04) + 
                          (volatilityFactor * 0.03) + 
                          (ratioDiff * 0.02);
    }
    
    return {
      action: recommendedAction || action,
      urgency: urgency || drift.driftStatus,
      driftPercentage: drift.maxDrift,
      expectedImprovement: Math.min(0.1, expectedImprovement), // Cap at 10%
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Calculate optimized allocation based on strategy
   * @param {Array} portfolio - Current portfolio
   * @param {Object} targetWeights - Target weights
   * @param {String} strategy - Strategy to apply
   * @returns {Array} Optimized allocation
   */
  _calculateOptimizedAllocation(portfolio, targetWeights, strategy) {
    const totalValue = this._getPortfolioValue(portfolio);
    
    // Convert target weights to decimal if they are percentages
    const normalizedTargets = {};
    for (const [asset, weight] of Object.entries(targetWeights)) {
      normalizedTargets[asset] = weight > 1 ? weight / 100 : weight;
    }
    
    return portfolio.map(asset => {
      const currentWeight = asset.value / totalValue;
      const targetWeight = normalizedTargets[asset.symbol] || 0;
      const rebalanceAmount = targetWeight - currentWeight;
      
      return {
        symbol: asset.symbol,
        currentWeight,
        targetWeight,
        currentValue: asset.value,
        targetValue: targetWeight * totalValue,
        rebalanceAmount,
        rebalanceValue: rebalanceAmount * totalValue,
        action: rebalanceAmount > 0.001 ? 'BUY' : 
                rebalanceAmount < -0.001 ? 'SELL' : 'HOLD',
        currentPrice: asset.amount ? (asset.value / asset.amount) : 0,
        confidence: this._calculateAllocationConfidence(asset.symbol, strategy, rebalanceAmount)
      };
    }).sort((a, b) => Math.abs(b.rebalanceValue) - Math.abs(a.rebalanceValue));
  }
  
  /**
   * Calculate confidence score for allocation recommendation
   * @param {String} symbol - Asset symbol
   * @param {String} strategy - Strategy
   * @param {Number} rebalanceAmount - Rebalance amount (positive = buy, negative = sell)
   * @returns {Number} Confidence score (0-1)
   */
  _calculateAllocationConfidence(symbol, strategy, rebalanceAmount) {
    // Base confidence
    let confidence = 0.7;
    
    // Higher confidence for larger changes
    const changeBonus = Math.min(0.2, Math.abs(rebalanceAmount) * 2);
    
    // Coin-specific adjustments
    if (symbol === 'BTC' || symbol === 'ETH') {
      confidence += 0.05; // Higher confidence for major coins
    } else if (symbol === 'USDC') {
      confidence += 0.1; // Highest confidence for stablecoins
    } else {
      confidence -= 0.05; // Lower for altcoins
    }
    
    // Strategy adjustments
    if (strategy === 'risk_parity' && symbol === 'USDC') {
      confidence += 0.05; // Risk parity works well with stable assets
    } else if (strategy === 'minimum_volatility' && (symbol === 'BTC' || symbol === 'ETH')) {
      confidence -= 0.05; // Less confident in vol minimization for volatile assets
    }
    
    return Math.min(0.95, Math.max(0.5, confidence + changeBonus));
  }
  
  /**
   * Calculate risk metrics for the portfolio
   * @param {Array} portfolio - Current portfolio
   * @param {Object} recommendation - Rebalance recommendation
   * @returns {Object} Risk metrics
   */
  _calculateRiskMetrics(portfolio, recommendation) {
    const metricRange = Math.random() * 0.2 + 0.8; // Random value between 0.8 and 1.0
    
    // Default risk metrics - would be calculated from actual data
    return {
      portfolioVaR: 0.15 * metricRange, // 15% Value-at-Risk
      expectedReturn: 0.12 * metricRange, // 12% Expected annual return
      sharpeRatio: 0.8 * metricRange,
      sortinoRatio: 1.2 * metricRange,
      calmarRatio: 0.4 * metricRange,
      informationRatio: 0.6 * metricRange,
      maximumDrawdown: 0.25 * metricRange,
      volatility: 0.18 * metricRange,
      optimalSharpeRatio: 1.0 * metricRange,
      diversificationRatio: 0.7 * metricRange
    };
  }
  
  /**
   * Convert portfolio to weights format
   * @param {Array} portfolio - Portfolio array
   * @returns {Object} Weights as decimals
   */
  _portfolioToWeights(portfolio) {
    const totalValue = this._getPortfolioValue(portfolio);
    const weights = {};
    
    for (const asset of portfolio) {
      weights[asset.symbol] = asset.value / totalValue;
    }
    
    return weights;
  }
  
  /**
   * Calculate total portfolio value
   * @param {Array} portfolio - Portfolio array
   * @returns {Number} Total value
   */
  _getPortfolioValue(portfolio) {
    return portfolio.reduce((sum, asset) => sum + (asset.value || 0), 0);
  }

  async calculateDetailedAllocation(portfolio) {
    const allocations = [];
    let totalValue = 0;
    
    // Calculate current values using real-time prices
    for (const asset of portfolio) {
      const realtimeData = await this.getRealtimeAssetData(asset.symbol);
      const currentPrice = realtimeData.price || this.getBasePrice(asset.symbol);
      const value = asset.amount * currentPrice;
      totalValue += value;
      
      allocations.push({
        symbol: asset.symbol,
        amount: asset.amount,
        currentPrice: currentPrice,
        value: value,
        technicalData: realtimeData.technical || {},
        liquidityData: realtimeData.liquidity || {},
        sector: this.getAssetSector(asset.symbol),
        riskCategory: this.getRiskCategory(asset.symbol)
      });
    }
    
    // Calculate weights and add additional metrics
    return allocations.map(asset => ({
      ...asset,
      currentWeight: asset.value / totalValue,
      dailyChange: this.calculateDailyChange(asset.symbol),
      volatility: this.getAssetVolatility(asset.symbol),
      liquidityScore: asset.liquidityData.score || 0.5,
      technicalScore: this.calculateTechnicalScore(asset.technicalData),
      riskScore: this.calculateRiskScore(asset.riskCategory, asset.volatility)
    }));
  }

  async getRealtimeAssetData(symbol) {
    // Get cached price data from your RealtimeDataService
    const priceData = RealtimeDataService.dataCache.get(`price_${symbol}`);
    
    if (priceData) {
      return {
        price: priceData.price,
        volume: priceData.volume24h,
        technical: await RealtimeDataService.getTechnicalIndicators(symbol),
        liquidity: await RealtimeDataService.getLiquidityMetrics(symbol)
      };
    }
    
    // Fallback to service methods
    return {
      price: RealtimeDataService.getBasePrice(symbol),
      volume: 0,
      technical: await RealtimeDataService.getTechnicalIndicators(symbol),
      liquidity: await RealtimeDataService.getLiquidityMetrics(symbol)
    };
  }

  async generateOptimizedAllocation(portfolio, strategy, analysis) {
    const strategyConfig = this.strategies[strategy];
    const marketSentiment = analysis.marketSentiment;
    const currentAllocation = analysis.currentAllocation;
    
    console.log(`Optimizing with ${strategy}, market sentiment: ${marketSentiment.sentiment}`);
    
    // Adjust strategy based on market conditions
    let riskAdjustment = this.calculateRiskAdjustment(marketSentiment);
    
    const optimized = [];
    
    for (const asset of currentAllocation) {
      let targetWeight = this.calculateTargetWeight(asset, strategy, analysis);
      
      // Apply market regime adjustments
      targetWeight = this.applyMarketRegimeAdjustment(targetWeight, asset, marketSentiment);
      
      // Apply risk adjustment
      targetWeight *= riskAdjustment;
      
      // Apply strategy constraints
      targetWeight = Math.max(
        strategyConfig.minSingleAssetWeight,
        Math.min(strategyConfig.maxSingleAssetWeight, targetWeight)
      );
      
      optimized.push({
        ...asset,
        targetWeight,
        rebalanceAmount: targetWeight - asset.currentWeight,
        rebalanceValue: 0, // Will be calculated after normalization
        confidence: this.calculateRecommendationConfidence(asset, targetWeight, analysis)
      });
    }
    
    // Normalize weights to sum to 1
    const totalWeight = optimized.reduce((sum, asset) => sum + asset.targetWeight, 0);
    const totalValue = currentAllocation.reduce((sum, asset) => sum + asset.value, 0);
    
    optimized.forEach(asset => {
      asset.targetWeight /= totalWeight;
      asset.targetValue = asset.targetWeight * totalValue;
      asset.rebalanceAmount = asset.targetWeight - asset.currentWeight;
      asset.rebalanceValue = asset.rebalanceAmount * totalValue;
    });
    
    return optimized;
  }

  calculateTargetWeight(asset, strategy, analysis) {
    const baseWeight = 1 / analysis.currentAllocation.length; // Equal weight starting point
    
    switch (strategy) {
      case 'momentum_based':
        return this.applyMomentumStrategy(asset, baseWeight);
      
      case 'mean_reversion':
        return this.applyMeanReversionStrategy(asset, baseWeight);
      
      case 'risk_parity':
        return this.applyRiskParityStrategy(asset, analysis.currentAllocation);
      
      case 'ai_adaptive':
        return this.applyAIAdaptiveStrategy(asset, analysis);
      
      default: // modern_portfolio_theory
        return this.applyMPTStrategy(asset, baseWeight);
    }
  }

  applyMomentumStrategy(asset, baseWeight) {
    const technicalScore = asset.technicalScore || 0;
    const momentum = asset.technicalData?.momentum || 0;
    
    // Favor assets with positive momentum
    if (technicalScore > 0.3 && momentum > 0.6) return baseWeight * 1.8;
    if (technicalScore > 0.1) return baseWeight * 1.3;
    if (technicalScore < -0.3) return baseWeight * 0.4;
    if (technicalScore < -0.1) return baseWeight * 0.7;
    
    return baseWeight;
  }

  applyMeanReversionStrategy(asset, baseWeight) {
    const technicalScore = asset.technicalScore || 0;
    const rsi = asset.technicalData?.rsi || 50;
    
    // Favor oversold assets (contrarian approach)
    if (rsi < 30 && technicalScore < -0.2) return baseWeight * 1.6;
    if (rsi < 40) return baseWeight * 1.2;
    if (rsi > 70 && technicalScore > 0.2) return baseWeight * 0.5;
    if (rsi > 60) return baseWeight * 0.8;
    
    return baseWeight;
  }

  applyRiskParityStrategy(asset, allAssets) {
    const riskLevel = this.getRiskLevel(asset.riskCategory);
    const volatility = asset.volatility || 0.3;
    
    // Inverse relationship with risk
    const riskAdjustedWeight = 1 / (riskLevel * (1 + volatility));
    const totalRiskAdjusted = allAssets.reduce((sum, a) => {
      const aRisk = this.getRiskLevel(a.riskCategory);
      const aVol = a.volatility || 0.3;
      return sum + (1 / (aRisk * (1 + aVol)));
    }, 0);
    
    return riskAdjustedWeight / totalRiskAdjusted;
  }

  applyAIAdaptiveStrategy(asset, analysis) {
    // Combine multiple factors with AI-like weighting
    const technical = asset.technicalScore || 0;
    const liquidity = asset.liquidityScore || 0.5;
    const sentiment = analysis.marketSentiment.sentiment;
    const fearGreed = analysis.marketSentiment.fearGreedIndex;
    
    let score = 0;
    
    // Technical analysis weight (40%)
    score += technical * 0.4;
    
    // Liquidity weight (20%)
    score += (liquidity - 0.5) * 0.2;
    
    // Market sentiment adjustment (25%)
    if (sentiment === 'extremely-bullish') score += 0.25;
    else if (sentiment === 'bullish') score += 0.15;
    else if (sentiment === 'bearish') score -= 0.15;
    else if (sentiment === 'extremely-bearish') score -= 0.25;
    
    // Fear/Greed adjustment (15%)
    score += ((fearGreed - 50) / 100) * 0.15;
    
    // Convert to weight (normalize around equal weight)
    const baseWeight = 1 / analysis.currentAllocation.length;
    return baseWeight * (1 + score);
  }

  applyMPTStrategy(asset, baseWeight) {
    const riskLevel = this.getRiskLevel(asset.riskCategory);
    const expectedReturn = this.estimateExpectedReturn(asset);
    const volatility = asset.volatility || 0.3;
    
    // Simplified MPT: reward/risk ratio
    const sharpeProxy = expectedReturn / volatility;
    const avgSharpe = 0.5; // Assumed average
    
    return baseWeight * (1 + (sharpeProxy - avgSharpe));
  }

  calculateRiskAdjustment(marketSentiment) {
    const sentiment = marketSentiment.sentiment;
    const fearGreed = marketSentiment.fearGreedIndex;
    const volatility = marketSentiment.volatility;
    
    let adjustment = 1.0;
    
    // Sentiment-based adjustment
    if (sentiment === 'extremely-bearish') adjustment = 0.6;
    else if (sentiment === 'bearish') adjustment = 0.8;
    else if (sentiment === 'extremely-bullish') adjustment = 1.4;
    else if (sentiment === 'bullish') adjustment = 1.2;
    
    // Fear/Greed adjustment
    if (fearGreed < 20) adjustment *= 0.8; // Extreme fear - reduce risk
    else if (fearGreed > 80) adjustment *= 0.9; // Extreme greed - slight reduction
    
    // Volatility adjustment
    if (volatility > 0.4) adjustment *= 0.85; // High volatility - reduce risk
    
    return Math.max(0.4, Math.min(1.6, adjustment));
  }

  applyMarketRegimeAdjustment(targetWeight, asset, marketSentiment) {
    const regime = this.detectMarketRegime(marketSentiment);
    const regimeConfig = this.marketRegimes[regime];
    
    if (!regimeConfig) return targetWeight;
    
    // Adjust based on asset characteristics and regime
    if (asset.riskCategory === 'low' && regime === 'bear') {
      return targetWeight * 1.2; // Favor safe assets in bear market
    }
    
    if (asset.riskCategory === 'high' && regime === 'bull') {
      return targetWeight * 1.1; // Slightly favor risky assets in bull market
    }
    
    return targetWeight;
  }

  detectMarketRegime(marketSentiment) {
    const fearGreed = marketSentiment.fearGreedIndex;
    const volatility = marketSentiment.volatility;
    
    if (fearGreed > 70 && volatility < 0.3) return 'bull';
    if (fearGreed < 30 && volatility > 0.4) return 'bear';
    return 'sideways';
  }

  generateAdvancedRecommendations(analysis) {
    const recommendations = [];
    const sentiment = analysis.marketSentiment;
    const signal = analysis.rebalanceSignal;
    
    // Market-based recommendations
    if (sentiment.fearGreedIndex < 25) {
      recommendations.push({
        type: 'OPPORTUNITY',
        priority: 'HIGH',
        message: `Market fear index at ${sentiment.fearGreedIndex} - excellent buying opportunity`,
        impact: 'Potential 15-25% upside in 3-6 months',
        confidence: 0.8,
        timeframe: '3-6 months'
      });
    }
    
    if (sentiment.fearGreedIndex > 80) {
      recommendations.push({
        type: 'WARNING',
        priority: 'HIGH',
        message: `Market greed index at ${sentiment.fearGreedIndex} - consider profit taking`,
        impact: 'Risk reduction and profit preservation',
        confidence: 0.75,
        timeframe: '1-2 weeks'
      });
    }
    
    // Volatility-based recommendations
    if (sentiment.volatility > 0.5) {
      recommendations.push({
        type: 'RISK_MANAGEMENT',
        priority: 'MEDIUM',
        message: 'High market volatility detected - consider reducing position sizes',
        impact: 'Reduced portfolio volatility',
        confidence: 0.7,
        timeframe: 'Immediate'
      });
    }
    
    // Asset-specific recommendations
    analysis.optimizedAllocation.forEach(asset => {
      const driftPercent = Math.abs(asset.rebalanceAmount * 100);
      
      if (driftPercent > 10) {
        const action = asset.rebalanceAmount > 0 ? 'increase' : 'decrease';
        recommendations.push({
          type: 'REBALANCE',
          priority: driftPercent > 15 ? 'HIGH' : 'MEDIUM',
          message: `${asset.symbol} is ${driftPercent.toFixed(1)}% off target - ${action} allocation`,
          impact: `Expected improvement: ${(driftPercent * 0.3).toFixed(1)}%`,
          confidence: asset.confidence,
          timeframe: 'Next rebalance cycle',
          symbol: asset.symbol
        });
      }
      
      // Technical-based recommendations
      if (asset.technicalScore > 0.6) {
        recommendations.push({
          type: 'TECHNICAL',
          priority: 'MEDIUM',
          message: `${asset.symbol} shows strong bullish signals (score: ${asset.technicalScore.toFixed(2)})`,
          impact: 'Potential outperformance',
          confidence: 0.6,
          timeframe: '1-4 weeks',
          symbol: asset.symbol
        });
      } else if (asset.technicalScore < -0.6) {
        recommendations.push({
          type: 'TECHNICAL',
          priority: 'MEDIUM',
          message: `${asset.symbol} shows bearish signals (score: ${asset.technicalScore.toFixed(2)})`,
          impact: 'Consider reducing exposure',
          confidence: 0.6,
          timeframe: '1-2 weeks',
          symbol: asset.symbol
        });
      }
    });
    
    // Performance-based recommendations
    const portfolioPerf = analysis.portfolioPerformance;
    if (portfolioPerf && portfolioPerf.sharpeRatio < 1.0) {
      recommendations.push({
        type: 'PERFORMANCE',
        priority: 'MEDIUM',
        message: `Portfolio Sharpe ratio (${portfolioPerf.sharpeRatio.toFixed(2)}) below optimal - consider strategy adjustment`,
        impact: 'Improved risk-adjusted returns',
        confidence: 0.65,
        timeframe: 'Next strategy review'
      });
    }
    
    // Sort by priority and confidence
    return recommendations.sort((a, b) => {
      const priorityWeight = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const aPriority = priorityWeight[a.priority] * a.confidence;
      const bPriority = priorityWeight[b.priority] * b.confidence;
      return bPriority - aPriority;
    });
  }

  // Helper calculation methods
  calculateTechnicalScore(technicalData) {
    if (!technicalData) return 0;
    
    const rsi = technicalData.rsi || 50;
    const macd = technicalData.macd || 0;
    const momentum = technicalData.momentum || 0.5;
    
    let score = 0;
    
    // RSI contribution (30% weight)
    if (rsi < 30) score += 0.6;  // Oversold
    else if (rsi > 70) score -= 0.6;  // Overbought
    else score += (50 - Math.abs(rsi - 50)) / 50 * 0.3;
    
    // MACD contribution (30% weight)
    score += (macd > 0 ? 0.3 : -0.3);
    
    // Momentum contribution (40% weight)
    score += (momentum - 0.5) * 0.8;
    
    return Math.max(-1, Math.min(1, score));
  }

  calculateRiskScore(riskCategory, volatility) {
    const categoryRisk = this.getRiskLevel(riskCategory) / 4; // Normalize to 0-1
    const volRisk = Math.min(volatility, 1); // Cap at 100%
    return (categoryRisk + volRisk) / 2;
  }

  calculateDailyChange(symbol) {
    return RealtimeDataService.calculatePriceChange(symbol, '24h') || 0;
  }

  getAssetVolatility(symbol) {
    return RealtimeDataService.calculateVolatility(symbol) || 0.3;
  }

  getBasePrice(symbol) {
    return RealtimeDataService.getBasePrice(symbol);
  }

  getRiskLevel(riskCategory) {
    const riskLevels = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'very_high': 4
    };
    return riskLevels[riskCategory] || 2;
  }

  getAssetSector(symbol) {
    const sectors = {
      'BTC': 'store_of_value',
      'ETH': 'smart_contracts',
      'ADA': 'smart_contracts',
      'SOL': 'smart_contracts',
      'DOT': 'interoperability',
      'LINK': 'oracle',
      'UNI': 'defi',
      'AAVE': 'defi',
      'USDC': 'stablecoin',
      'USDT': 'stablecoin'
    };
    return sectors[symbol] || 'other';
  }

  getRiskCategory(symbol) {
    const riskCategories = {
      'BTC': 'medium',
      'ETH': 'medium',
      'USDC': 'low',
      'USDT': 'low',
      'ADA': 'high',
      'SOL': 'high',
      'DOT': 'high',
      'LINK': 'high',
      'UNI': 'very_high'
    };
    return riskCategories[symbol] || 'high';
  }

  estimateExpectedReturn(asset) {
    // Simplified expected return estimation
    const technicalScore = asset.technicalScore || 0;
    const baseReturn = 0.1; // 10% base expected return
    return baseReturn + (technicalScore * 0.2);
  }

  calculateRecommendationConfidence(asset, targetWeight, analysis) {
    let confidence = 0.5; // Base confidence
    
    // Technical analysis confidence
    const techScore = Math.abs(asset.technicalScore || 0);
    confidence += techScore * 0.3;
    
    // Market sentiment confidence
    const sentiment = analysis.marketSentiment;
    if (['extremely-bullish', 'extremely-bearish'].includes(sentiment.sentiment)) {
      confidence += 0.2;
    }
    
    // Liquidity confidence
    confidence += (asset.liquidityScore || 0.5) * 0.2;
    
    return Math.min(0.95, confidence);
  }

  estimateImprovementPotential(analysis) {
    const drifts = analysis.optimizedAllocation.map(asset => Math.abs(asset.rebalanceAmount));
    const avgDrift = drifts.reduce((sum, d) => sum + d, 0) / drifts.length;
    return avgDrift * 2; // Simplified improvement estimation
  }

  calculatePortfolioRisk(allocation) {
    const riskScores = allocation.map(asset => asset.riskScore || 0.5);
    const weights = allocation.map(asset => asset.currentWeight);
    
    return riskScores.reduce((risk, score, i) => risk + (score * weights[i]), 0);
  }

  estimateRebalancingCosts(optimizedAllocation) {
    const totalRebalanceValue = optimizedAllocation.reduce((sum, asset) => 
      sum + Math.abs(asset.rebalanceValue || 0), 0
    );
    
    // Estimate 0.3% trading costs
    return totalRebalanceValue * 0.003;
  }

  // Advanced analysis methods
  async calculateAdvancedRiskMetrics(portfolio) {
    const allocation = await this.calculateDetailedAllocation(portfolio);
    
    return {
      portfolioVaR: this.calculateValueAtRisk(allocation),
      sharpeRatio: this.calculateSharpeRatio(allocation),
      sortinoRatio: this.calculateSortinoRatio(allocation),
      calmarRatio: this.calculateCalmarRatio(allocation),
      maximumDrawdown: this.calculateMaxDrawdown(allocation),
      informationRatio: Math.random() * 1.5, // Placeholder
      omegaRatio: Math.random() * 2, // Placeholder
      expectedReturn: this.calculateExpectedReturn(allocation),
      portfolioVolatility: this.calculatePortfolioVolatility(allocation)
    };
  }

  calculateValueAtRisk(allocation, confidence = 0.05) {
    // Simplified VaR calculation
    const portfolioVol = this.calculatePortfolioVolatility(allocation);
    const zScore = 1.645; // 95% confidence
    return portfolioVol * zScore;
  }

  calculateSharpeRatio(allocation) {
    const expectedReturn = this.calculateExpectedReturn(allocation);
    const volatility = this.calculatePortfolioVolatility(allocation);
    const riskFreeRate = 0.02; // 2% risk-free rate
    
    return (expectedReturn - riskFreeRate) / volatility;
  }

  calculateSortinoRatio(allocation) {
    const expectedReturn = this.calculateExpectedReturn(allocation);
    const downsideVol = this.calculatePortfolioVolatility(allocation) * 0.7; // Simplified
    const riskFreeRate = 0.02;
    
    return (expectedReturn - riskFreeRate) / downsideVol;
  }

  calculateCalmarRatio(allocation) {
    const expectedReturn = this.calculateExpectedReturn(allocation);
    const maxDrawdown = this.calculateMaxDrawdown(allocation);
    
    return expectedReturn / Math.abs(maxDrawdown);
  }

  calculateMaxDrawdown(allocation) {
    // Simplified max drawdown estimation
    const portfolioRisk = this.calculatePortfolioRisk(allocation);
    return -portfolioRisk * 0.5; // Rough estimation
  }

  calculateExpectedReturn(allocation) {
    return allocation.reduce((ret, asset) => {
      const assetReturn = this.estimateExpectedReturn(asset);
      return ret + (assetReturn * asset.currentWeight);
    }, 0);
  }

  calculatePortfolioVolatility(allocation) {
    // Simplified portfolio volatility calculation
    return allocation.reduce((vol, asset) => {
      const assetVol = asset.volatility || 0.3;
      return vol + (assetVol * asset.currentWeight);
    }, 0);
  }

  async buildCorrelationMatrix(portfolio) {
    const symbols = portfolio.map(asset => asset.symbol);
    const matrix = {};
    
    symbols.forEach(symbol1 => {
      matrix[symbol1] = {};
      symbols.forEach(symbol2 => {
        if (symbol1 === symbol2) {
          matrix[symbol1][symbol2] = 1.0;
        } else {
          // Mock correlation - in real implementation, calculate from price history
          matrix[symbol1][symbol2] = this.getMockCorrelation(symbol1, symbol2);
        }
      });
    });
    
    return matrix;
  }

  getMockCorrelation(symbol1, symbol2) {
    // Mock correlation based on asset types
    const sectors1 = this.getAssetSector(symbol1);
    const sectors2 = this.getAssetSector(symbol2);
    
    if (sectors1 === sectors2) return 0.6 + Math.random() * 0.3;
    if (sectors1 === 'stablecoin' || sectors2 === 'stablecoin') return 0.1 + Math.random() * 0.2;
    return 0.3 + Math.random() * 0.4;
  }

  async analyzeVolatilityPatterns(portfolio) {
    const patterns = {};
    
    for (const asset of portfolio) {
      const volatility = this.getAssetVolatility(asset.symbol);
      const technicalData = await this.getRealtimeAssetData(asset.symbol);
      
      patterns[asset.symbol] = {
        currentVolatility: volatility,
        volatilityPercentile: technicalData.technical?.volatility_percentile || 50,
        trend: volatility > 0.4 ? 'high' : volatility > 0.2 ? 'medium' : 'low',
        regime: this.classifyVolatilityRegime(volatility)
      };
    }
    
    return patterns;
  }

  classifyVolatilityRegime(volatility) {
    if (volatility > 0.6) return 'crisis';
    if (volatility > 0.4) return 'high';
    if (volatility > 0.2) return 'normal';
    return 'low';
  }

  async analyzeLiquidity(portfolio) {
    const analysis = {
      overallScore: 0,
      riskLevel: 'low',
      assets: {}
    };
    
    let totalValue = 0;
    let weightedLiquidityScore = 0;
    
    for (const asset of portfolio) {
      const realtimeData = await this.getRealtimeAssetData(asset.symbol);
      const liquidityData = realtimeData.liquidity;
      const assetValue = asset.amount * realtimeData.price;
      
      totalValue += assetValue;
      weightedLiquidityScore += liquidityData.score * assetValue;
      
      analysis.assets[asset.symbol] = {
        score: liquidityData.score,
        spread: liquidityData.spread,
        depth: liquidityData.depth,
        risk: liquidityData.score < 0.7 ? 'high' : liquidityData.score < 0.8 ? 'medium' : 'low'
      };
    }
    
    analysis.overallScore = weightedLiquidityScore / totalValue;
    analysis.riskLevel = analysis.overallScore < 0.7 ? 'high' : analysis.overallScore < 0.8 ? 'medium' : 'low';
    
    return analysis;
  }

  calculateConcentrationRisk(portfolio) {
    const weights = portfolio.map(asset => asset.value || 0);
    const totalValue = weights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = weights.map(w => w / totalValue);
    
    // Herfindahl-Hirschman Index
    const hhi = normalizedWeights.reduce((sum, w) => sum + (w * w), 0);
    
    // Gini coefficient approximation
    const sortedWeights = [...normalizedWeights].sort((a, b) => a - b);
    const n = sortedWeights.length;
    const gini = sortedWeights.reduce((sum, w, i) => sum + w * (2 * i + 1 - n), 0) / n;
    
    return {
      hhi: hhi,
      gini: Math.abs(gini),
      level: hhi > 0.25 ? 'high' : hhi > 0.15 ? 'medium' : 'low',
      maxSingleAssetWeight: Math.max(...normalizedWeights)
    };
  }

  // Cache management
  cacheAnalysis(portfolio, analysis) {
    const key = this.generatePortfolioKey(portfolio);
    this.optimizationCache.set(key, {
      ...analysis,
      cachedAt: new Date()
    });
    
    // Keep cache size manageable
    if (this.optimizationCache.size > 50) {
      const oldestKey = this.optimizationCache.keys().next().value;
      this.optimizationCache.delete(oldestKey);
    }
  }

  generatePortfolioKey(portfolio) {
    return portfolio
      .map(asset => `${asset.symbol}:${asset.amount}`)
      .sort()
      .join('|');
  }

  // Event handlers for real-time updates
  handlePriceUpdate(data) {
    console.log('Portfolio engine received price update:', data.symbol);
    // Invalidate relevant cache entries
    this.invalidateRelatedCache(data.symbol);
  }

  handlePortfolioUpdate(data) {
    console.log('Portfolio engine received portfolio update:', data);
    // Clear all cache as portfolio structure changed
    this.optimizationCache.clear();
  }

  invalidateRelatedCache(symbol) {
    // Remove cache entries that include this symbol
    for (const [key, value] of this.optimizationCache.entries()) {
      if (key.includes(symbol)) {
        this.optimizationCache.delete(key);
      }
    }
  }

  // Cleanup method
  cleanup() {
    RealtimeDataService.stopPriceStream();
    this.optimizationCache.clear();
    this.performanceHistory.clear();
  }
}

export default new AdvancedPortfolioEngine();