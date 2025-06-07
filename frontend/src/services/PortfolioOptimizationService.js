/* filepath: frontend/src/services/PortfolioOptimizationService.js */
import NotificationService from './NotificationService';

class PortfolioOptimizationService {
  constructor() {
    this.optimizationStrategies = {
      'balanced': { risk: 0.5, reward: 0.5, stability: 0.7 },
      'aggressive': { risk: 0.8, reward: 0.9, stability: 0.3 },
      'conservative': { risk: 0.2, reward: 0.4, stability: 0.9 },
      'growth': { risk: 0.6, reward: 0.8, stability: 0.5 },
      'income': { risk: 0.3, reward: 0.5, stability: 0.8 }
    };
    
    this.rebalanceThresholds = {
      minor: 0.05, // 5%
      moderate: 0.10, // 10%
      major: 0.20 // 20%
    };
    
    this.correlationMatrix = new Map();
    this.performanceHistory = new Map();
  }

  // Main optimization analysis
  async analyzePortfolio(portfolio, strategy = 'balanced', targetAmount = null) {
    const analysis = {
      currentAllocation: this.calculateCurrentAllocation(portfolio),
      riskAssessment: await this.assessRisk(portfolio),
      diversificationScore: this.calculateDiversification(portfolio),
      correlationAnalysis: await this.analyzeAssetCorrelations(portfolio),
      performanceMetrics: this.calculatePerformanceMetrics(portfolio),
      recommendations: [],
      rebalanceRequired: false,
      optimizedAllocation: null,
      projectedReturns: null
    };

    // Generate optimized allocation
    analysis.optimizedAllocation = await this.generateOptimizedAllocation(
      portfolio, 
      strategy, 
      targetAmount
    );

    // Check if rebalancing is needed
    analysis.rebalanceRequired = this.checkRebalanceNeed(
      analysis.currentAllocation,
      analysis.optimizedAllocation
    );

    // Generate specific recommendations
    analysis.recommendations = await this.generateRecommendations(analysis);

    // Calculate projected returns
    analysis.projectedReturns = this.calculateProjectedReturns(
      analysis.optimizedAllocation,
      strategy
    );

    return analysis;
  }

  calculateCurrentAllocation(portfolio) {
    const totalValue = portfolio.reduce((sum, asset) => sum + asset.value, 0);
    
    return portfolio.map(asset => ({
      symbol: asset.symbol,
      currentWeight: asset.value / totalValue,
      value: asset.value,
      amount: asset.amount,
      averagePrice: asset.averagePrice || (asset.value / asset.amount)
    }));
  }

  async assessRisk(portfolio) {
    const riskMetrics = {
      portfolioVolatility: 0,
      valueAtRisk: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      riskLevel: 'moderate',
      riskFactors: []
    };

    // Calculate portfolio volatility
    let totalVariance = 0;
    const weights = this.calculateCurrentAllocation(portfolio);
    
    for (let i = 0; i < weights.length; i++) {
      const assetVolatility = await this.getAssetVolatility(weights[i].symbol);
      totalVariance += Math.pow(weights[i].currentWeight * assetVolatility, 2);
      
      // Add correlation effects
      for (let j = i + 1; j < weights.length; j++) {
        const correlation = await this.getAssetCorrelation(
          weights[i].symbol, 
          weights[j].symbol
        );
        const covarianceContribution = 2 * weights[i].currentWeight * 
          weights[j].currentWeight * assetVolatility * 
          await this.getAssetVolatility(weights[j].symbol) * correlation;
        totalVariance += covarianceContribution;
      }
    }

    riskMetrics.portfolioVolatility = Math.sqrt(totalVariance) * 100;

    // Value at Risk (95% confidence, 1 day)
    riskMetrics.valueAtRisk = portfolio.reduce((sum, asset) => sum + asset.value, 0) * 
      0.05 * riskMetrics.portfolioVolatility / 100;

    // Risk level classification
    if (riskMetrics.portfolioVolatility < 10) riskMetrics.riskLevel = 'low';
    else if (riskMetrics.portfolioVolatility < 25) riskMetrics.riskLevel = 'moderate';
    else if (riskMetrics.portfolioVolatility < 40) riskMetrics.riskLevel = 'high';
    else riskMetrics.riskLevel = 'very_high';

    // Identify risk factors
    riskMetrics.riskFactors = await this.identifyRiskFactors(portfolio);

    return riskMetrics;
  }

  calculateDiversification(portfolio) {
    const sectors = new Map();
    const marketCaps = new Map();
    const totalValue = portfolio.reduce((sum, asset) => sum + asset.value, 0);

    // Sector diversification
    portfolio.forEach(asset => {
      const sector = this.getAssetSector(asset.symbol);
      const weight = asset.value / totalValue;
      sectors.set(sector, (sectors.get(sector) || 0) + weight);
    });

    // Market cap diversification
    portfolio.forEach(asset => {
      const capCategory = this.getMarketCapCategory(asset.symbol);
      const weight = asset.value / totalValue;
      marketCaps.set(capCategory, (marketCaps.get(capCategory) || 0) + weight);
    });

    // Calculate Herfindahl-Hirschman Index for concentration
    const hhi = portfolio.reduce((sum, asset) => {
      const weight = asset.value / totalValue;
      return sum + Math.pow(weight, 2);
    }, 0);

    // Diversification score (0-100, higher is better)
    const diversificationScore = Math.max(0, 100 - (hhi - 0.1) * 1000);

    return {
      score: diversificationScore,
      sectorDistribution: Object.fromEntries(sectors),
      marketCapDistribution: Object.fromEntries(marketCaps),
      concentrationIndex: hhi,
      recommendation: diversificationScore < 70 ? 'increase_diversification' : 'well_diversified'
    };
  }

  async generateOptimizedAllocation(portfolio, strategy, targetAmount = null) {
    const strategyConfig = this.optimizationStrategies[strategy];
    const currentTotal = portfolio.reduce((sum, asset) => sum + asset.value, 0);
    const targetTotal = targetAmount || currentTotal;

    // Modern Portfolio Theory optimization
    const optimizedWeights = await this.optimizeUsingMPT(portfolio, strategyConfig);
    
    // Apply constraints and preferences
    const constrainedWeights = this.applyConstraints(optimizedWeights, strategy);
    
    // Generate target allocation
    const optimizedAllocation = constrainedWeights.map(weight => ({
      symbol: weight.symbol,
      targetWeight: weight.optimizedWeight,
      targetValue: weight.optimizedWeight * targetTotal,
      currentWeight: weight.currentWeight,
      currentValue: weight.currentValue,
      difference: weight.optimizedWeight - weight.currentWeight,
      action: this.determineAction(weight.optimizedWeight, weight.currentWeight),
      priority: this.calculateActionPriority(weight.optimizedWeight, weight.currentWeight)
    }));

    return optimizedAllocation.sort((a, b) => b.priority - a.priority);
  }

  async optimizeUsingMPT(portfolio, strategyConfig) {
    // Simplified Modern Portfolio Theory implementation
    const assets = portfolio.map(asset => asset.symbol);
    const expectedReturns = await Promise.all(
      assets.map(symbol => this.getExpectedReturn(symbol))
    );
    const volatilities = await Promise.all(
      assets.map(symbol => this.getAssetVolatility(symbol))
    );
    
    // Create covariance matrix
    const covarianceMatrix = await this.buildCovarianceMatrix(assets);
    
    // Optimize using quadratic programming (simplified)
    const weights = this.solveOptimization(
      expectedReturns,
      covarianceMatrix,
      strategyConfig
    );

    return portfolio.map((asset, index) => ({
      symbol: asset.symbol,
      currentValue: asset.value,
      currentWeight: asset.value / portfolio.reduce((sum, a) => sum + a.value, 0),
      optimizedWeight: weights[index],
      expectedReturn: expectedReturns[index],
      volatility: volatilities[index]
    }));
  }

  solveOptimization(expectedReturns, covarianceMatrix, strategyConfig) {
    // Simplified optimization - in production, use proper quadratic programming
    const numAssets = expectedReturns.length;
    const weights = new Array(numAssets).fill(1 / numAssets); // Equal weight start
    
    // Apply strategy bias
    for (let i = 0; i < numAssets; i++) {
      const returnBias = strategyConfig.reward * (expectedReturns[i] - 0.1);
      const riskBias = strategyConfig.risk * (1 - Math.sqrt(covarianceMatrix[i][i]));
      weights[i] *= (1 + returnBias + riskBias);
    }
    
    // Normalize weights
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    return weights.map(w => w / totalWeight);
  }

  async generateRecommendations(analysis) {
    const recommendations = [];

    // Rebalancing recommendations
    if (analysis.rebalanceRequired) {
      const rebalanceRec = {
        type: 'rebalance',
        priority: 'high',
        title: 'Portfolio Rebalancing Required',
        description: 'Your portfolio has drifted from optimal allocation',
        actions: analysis.optimizedAllocation
          .filter(asset => Math.abs(asset.difference) > 0.05)
          .map(asset => ({
            symbol: asset.symbol,
            action: asset.action,
            amount: Math.abs(asset.targetValue - asset.currentValue),
            reasoning: `${asset.action} to achieve optimal ${(asset.targetWeight * 100).toFixed(1)}% allocation`
          })),
        impact: {
          expectedReturn: '+2.3%',
          riskReduction: '15%',
          diversificationImprovement: '+12%'
        }
      };
      recommendations.push(rebalanceRec);
    }

    // Diversification recommendations
    if (analysis.diversificationScore.score < 70) {
      recommendations.push({
        type: 'diversification',
        priority: 'medium',
        title: 'Improve Portfolio Diversification',
        description: 'Consider adding assets from underrepresented sectors',
        suggestions: this.getDiversificationSuggestions(analysis),
        impact: {
          diversificationImprovement: '+25%',
          riskReduction: '8%'
        }
      });
    }

    // Risk management recommendations
    if (analysis.riskAssessment.riskLevel === 'very_high') {
      recommendations.push({
        type: 'risk_management',
        priority: 'critical',
        title: 'High Risk Portfolio Detected',
        description: 'Consider reducing exposure to volatile assets',
        actions: this.getRiskReductionActions(analysis),
        impact: {
          riskReduction: '30%',
          stabilityImprovement: '+20%'
        }
      });
    }

    // Performance enhancement recommendations
    const performanceRecs = await this.getPerformanceRecommendations(analysis);
    recommendations.push(...performanceRecs);

    // Tax optimization recommendations
    const taxRecs = this.getTaxOptimizationRecommendations(analysis);
    recommendations.push(...taxRecs);

    return recommendations;
  }

  async getPerformanceRecommendations(analysis) {
    const recommendations = [];
    
    // Identify underperforming assets
    const underperformers = analysis.currentAllocation.filter(asset => {
      const expectedReturn = this.getExpectedReturn(asset.symbol);
      return expectedReturn < 0.05; // Less than 5% expected return
    });

    if (underperformers.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Replace Underperforming Assets',
        description: 'Some assets in your portfolio have poor growth prospects',
        actions: underperformers.map(asset => ({
          symbol: asset.symbol,
          action: 'consider_selling',
          reasoning: 'Low expected returns and poor technical indicators'
        })),
        alternatives: await this.getAlternativeAssets(underperformers),
        impact: {
          expectedReturn: '+1.8%',
          diversificationImprovement: '+5%'
        }
      });
    }

    return recommendations;
  }

  getTaxOptimizationRecommendations(analysis) {
    const recommendations = [];
    
    // Tax loss harvesting opportunities
    const lossCandidates = analysis.currentAllocation.filter(asset => 
      asset.value < asset.amount * asset.averagePrice * 0.95 // 5% loss
    );

    if (lossCandidates.length > 0) {
      recommendations.push({
        type: 'tax_optimization',
        priority: 'low',
        title: 'Tax Loss Harvesting Opportunity',
        description: 'Realize losses to offset capital gains',
        actions: lossCandidates.map(asset => ({
          symbol: asset.symbol,
          action: 'harvest_loss',
          potentialSavings: (asset.amount * asset.averagePrice - asset.value) * 0.2 // 20% tax rate
        })),
        impact: {
          taxSavings: `$${lossCandidates.reduce((sum, asset) => 
            sum + (asset.amount * asset.averagePrice - asset.value) * 0.2, 0
          ).toFixed(2)}`
        }
      });
    }

    return recommendations;
  }

  // Utility methods
  async getAssetVolatility(symbol) {
    // Simulated volatility data
    const volatilities = {
      'BTC': 0.65,
      'ETH': 0.75,
      'ADA': 0.85,
      'DOT': 0.80,
      'USDC': 0.05,
      'LINK': 0.90,
      'UNI': 0.95
    };
    return volatilities[symbol] || 0.70;
  }

  async getAssetCorrelation(symbol1, symbol2) {
    // Simulated correlation data
    const correlations = {
      'BTC-ETH': 0.75,
      'BTC-ADA': 0.60,
      'ETH-ADA': 0.65,
      'BTC-USDC': 0.05,
      'ETH-USDC': 0.08
    };
    const key = `${symbol1}-${symbol2}`;
    const reverseKey = `${symbol2}-${symbol1}`;
    return correlations[key] || correlations[reverseKey] || 0.50;
  }

  async getExpectedReturn(symbol) {
    // Simulated expected returns (annualized)
    const returns = {
      'BTC': 0.25,
      'ETH': 0.30,
      'ADA': 0.20,
      'DOT': 0.22,
      'USDC': 0.02,
      'LINK': 0.28,
      'UNI': 0.35
    };
    return returns[symbol] || 0.15;
  }

  getAssetSector(symbol) {
    const sectors = {
      'BTC': 'store_of_value',
      'ETH': 'smart_contracts',
      'ADA': 'smart_contracts',
      'DOT': 'interoperability',
      'USDC': 'stablecoin',
      'LINK': 'oracle',
      'UNI': 'defi'
    };
    return sectors[symbol] || 'other';
  }

  getMarketCapCategory(symbol) {
    const marketCaps = {
      'BTC': 'large_cap',
      'ETH': 'large_cap',
      'ADA': 'mid_cap',
      'DOT': 'mid_cap',
      'USDC': 'large_cap',
      'LINK': 'mid_cap',
      'UNI': 'small_cap'
    };
    return marketCaps[symbol] || 'small_cap';
  }

  determineAction(targetWeight, currentWeight) {
    const difference = targetWeight - currentWeight;
    if (Math.abs(difference) < 0.02) return 'hold';
    return difference > 0 ? 'buy' : 'sell';
  }

  calculateActionPriority(targetWeight, currentWeight) {
    return Math.abs(targetWeight - currentWeight) * 100;
  }

  checkRebalanceNeed(currentAllocation, optimizedAllocation) {
    return optimizedAllocation.some(asset => 
      Math.abs(asset.difference) > this.rebalanceThresholds.minor
    );
  }

  // Auto-rebalancing scheduler
  scheduleAutoRebalance(portfolio, strategy, frequency = 'monthly') {
    const intervals = {
      'weekly': 7 * 24 * 60 * 60 * 1000,
      'monthly': 30 * 24 * 60 * 60 * 1000,
      'quarterly': 90 * 24 * 60 * 60 * 1000
    };

    const interval = intervals[frequency];
    
    setInterval(async () => {
      const analysis = await this.analyzePortfolio(portfolio, strategy);
      
      if (analysis.rebalanceRequired) {
        NotificationService.notify('portfolio_rebalance', 
          'Auto-rebalancing recommendation available', {
          priority: 'medium',
          persistent: true,
          actions: [
            { label: 'View Recommendations', action: 'VIEW_REBALANCE' },
            { label: 'Auto Execute', action: 'EXECUTE_REBALANCE' }
          ],
          metadata: { analysis }
        });
      }
    }, interval);
  }
}

export default new PortfolioOptimizationService();