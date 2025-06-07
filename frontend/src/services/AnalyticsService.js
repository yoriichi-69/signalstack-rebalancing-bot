import BlockchainService from './BlockchainService';
import { formatCurrency, formatPercentage } from '../utils/formatters';

class AnalyticsService {
  constructor() {
    this.performanceData = new Map();
    this.riskMetrics = new Map();
    this.portfolioSnapshots = [];
    this.benchmarkData = new Map();
    this.alertThresholds = {
      drawdown: 0.15,
      volatility: 0.25,
      sharpeRatio: 0.5,
      impermanentLoss: 0.05
    };
  }

  // Portfolio Performance Analytics
  async calculatePortfolioMetrics(portfolioData, timeframe = '30d') {
    try {
      const metrics = {
        totalReturn: this.calculateTotalReturn(portfolioData, timeframe),
        annualizedReturn: this.calculateAnnualizedReturn(portfolioData, timeframe),
        volatility: this.calculateVolatility(portfolioData, timeframe),
        sharpeRatio: this.calculateSharpeRatio(portfolioData, timeframe),
        maxDrawdown: this.calculateMaxDrawdown(portfolioData, timeframe),
        winRate: this.calculateWinRate(portfolioData, timeframe),
        profitFactor: this.calculateProfitFactor(portfolioData, timeframe),
        sortino: this.calculateSortinoRatio(portfolioData, timeframe),
        calmar: this.calculateCalmarRatio(portfolioData, timeframe),
        beta: await this.calculateBeta(portfolioData, timeframe),
        alpha: await this.calculateAlpha(portfolioData, timeframe),
        informationRatio: await this.calculateInformationRatio(portfolioData, timeframe)
      };

      this.performanceData.set(timeframe, metrics);
      return metrics;
    } catch (error) {
      console.error('Failed to calculate portfolio metrics:', error);
      throw error;
    }
  }

  calculateTotalReturn(portfolioData, timeframe) {
    if (!portfolioData.historicalValues || portfolioData.historicalValues.length < 2) {
      return 0;
    }

    const values = this.getTimeframedData(portfolioData.historicalValues, timeframe);
    const startValue = values[0].value;
    const endValue = values[values.length - 1].value;
    
    return ((endValue - startValue) / startValue) * 100;
  }

  calculateAnnualizedReturn(portfolioData, timeframe) {
    const totalReturn = this.calculateTotalReturn(portfolioData, timeframe);
    const days = this.getTimeframeDays(timeframe);
    const annualizationFactor = 365 / days;
    
    return Math.pow(1 + (totalReturn / 100), annualizationFactor) - 1;
  }

  calculateVolatility(portfolioData, timeframe) {
    const values = this.getTimeframedData(portfolioData.historicalValues, timeframe);
    if (values.length < 2) return 0;

    const returns = this.calculateDailyReturns(values);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(365); // Annualized volatility
  }

  calculateSharpeRatio(portfolioData, timeframe) {
    const annualizedReturn = this.calculateAnnualizedReturn(portfolioData, timeframe);
    const volatility = this.calculateVolatility(portfolioData, timeframe);
    const riskFreeRate = 0.02; // 2% risk-free rate assumption
    
    return volatility !== 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;
  }

  calculateMaxDrawdown(portfolioData, timeframe) {
    const values = this.getTimeframedData(portfolioData.historicalValues, timeframe);
    if (values.length < 2) return 0;

    let maxDrawdown = 0;
    let peak = values[0].value;

    for (const point of values) {
      if (point.value > peak) {
        peak = point.value;
      }
      
      const drawdown = (peak - point.value) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown * 100;
  }

  calculateWinRate(portfolioData, timeframe) {
    const values = this.getTimeframedData(portfolioData.historicalValues, timeframe);
    const returns = this.calculateDailyReturns(values);
    
    const winningDays = returns.filter(r => r > 0).length;
    return (winningDays / returns.length) * 100;
  }

  calculateProfitFactor(portfolioData, timeframe) {
    const values = this.getTimeframedData(portfolioData.historicalValues, timeframe);
    const returns = this.calculateDailyReturns(values);
    
    const grossProfits = returns.filter(r => r > 0).reduce((sum, r) => sum + r, 0);
    const grossLosses = Math.abs(returns.filter(r => r < 0).reduce((sum, r) => sum + r, 0));
    
    return grossLosses !== 0 ? grossProfits / grossLosses : grossProfits > 0 ? Infinity : 0;
  }

  calculateSortinoRatio(portfolioData, timeframe) {
    const values = this.getTimeframedData(portfolioData.historicalValues, timeframe);
    const returns = this.calculateDailyReturns(values);
    const riskFreeRate = 0.02 / 365; // Daily risk-free rate
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const downsideReturns = returns.filter(r => r < riskFreeRate);
    
    if (downsideReturns.length === 0) return Infinity;
    
    const downsideDeviation = Math.sqrt(
      downsideReturns.reduce((sum, r) => sum + Math.pow(r - riskFreeRate, 2), 0) / downsideReturns.length
    ) * Math.sqrt(365);
    
    return downsideDeviation !== 0 ? (avgReturn * 365 - 0.02) / downsideDeviation : 0;
  }

  calculateCalmarRatio(portfolioData, timeframe) {
    const annualizedReturn = this.calculateAnnualizedReturn(portfolioData, timeframe);
    const maxDrawdown = this.calculateMaxDrawdown(portfolioData, timeframe) / 100;
    
    return maxDrawdown !== 0 ? annualizedReturn / maxDrawdown : annualizedReturn > 0 ? Infinity : 0;
  }

  async calculateBeta(portfolioData, timeframe) {
    try {
      const benchmarkData = await this.getBenchmarkData('ETH', timeframe);
      const portfolioValues = this.getTimeframedData(portfolioData.historicalValues, timeframe);
      
      if (portfolioValues.length !== benchmarkData.length) return 1;
      
      const portfolioReturns = this.calculateDailyReturns(portfolioValues);
      const benchmarkReturns = this.calculateDailyReturns(benchmarkData);
      
      const covariance = this.calculateCovariance(portfolioReturns, benchmarkReturns);
      const benchmarkVariance = this.calculateVariance(benchmarkReturns);
      
      return benchmarkVariance !== 0 ? covariance / benchmarkVariance : 1;
    } catch (error) {
      console.error('Failed to calculate beta:', error);
      return 1;
    }
  }

  async calculateAlpha(portfolioData, timeframe) {
    try {
      const portfolioReturn = this.calculateAnnualizedReturn(portfolioData, timeframe);
      const beta = await this.calculateBeta(portfolioData, timeframe);
      const benchmarkReturn = await this.getBenchmarkReturn('ETH', timeframe);
      const riskFreeRate = 0.02;
      
      return portfolioReturn - (riskFreeRate + beta * (benchmarkReturn - riskFreeRate));
    } catch (error) {
      console.error('Failed to calculate alpha:', error);
      return 0;
    }
  }

  async calculateInformationRatio(portfolioData, timeframe) {
    try {
      const portfolioReturn = this.calculateAnnualizedReturn(portfolioData, timeframe);
      const benchmarkReturn = await this.getBenchmarkReturn('ETH', timeframe);
      const trackingError = await this.calculateTrackingError(portfolioData, timeframe);
      
      return trackingError !== 0 ? (portfolioReturn - benchmarkReturn) / trackingError : 0;
    } catch (error) {
      console.error('Failed to calculate information ratio:', error);
      return 0;
    }
  }

  // Risk Analytics
  async calculateRiskMetrics(portfolioData) {
    try {
      const riskMetrics = {
        portfolioVaR: this.calculateVaR(portfolioData, 0.05), // 5% VaR
        conditionalVaR: this.calculateConditionalVaR(portfolioData, 0.05),
        concentrationRisk: this.calculateConcentrationRisk(portfolioData),
        liquidityRisk: this.calculateLiquidityRisk(portfolioData),
        correlationRisk: await this.calculateCorrelationRisk(portfolioData),
        leverageRisk: this.calculateLeverageRisk(portfolioData),
        impermanentLossRisk: this.calculateILRisk(portfolioData),
        smartContractRisk: this.calculateSmartContractRisk(portfolioData)
      };

      this.riskMetrics.set('current', riskMetrics);
      return riskMetrics;
    } catch (error) {
      console.error('Failed to calculate risk metrics:', error);
      throw error;
    }
  }

  calculateVaR(portfolioData, confidence = 0.05) {
    const values = portfolioData.historicalValues || [];
    if (values.length < 30) return 0;

    const returns = this.calculateDailyReturns(values);
    returns.sort((a, b) => a - b);
    
    const index = Math.floor(returns.length * confidence);
    return Math.abs(returns[index]) * portfolioData.totalValue;
  }

  calculateConditionalVaR(portfolioData, confidence = 0.05) {
    const values = portfolioData.historicalValues || [];
    if (values.length < 30) return 0;

    const returns = this.calculateDailyReturns(values);
    returns.sort((a, b) => a - b);
    
    const cutoffIndex = Math.floor(returns.length * confidence);
    const tailReturns = returns.slice(0, cutoffIndex);
    const avgTailReturn = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
    
    return Math.abs(avgTailReturn) * portfolioData.totalValue;
  }

  calculateConcentrationRisk(portfolioData) {
    if (!portfolioData.assets || portfolioData.assets.length === 0) return 0;

    const weights = portfolioData.assets.map(asset => asset.value / portfolioData.totalValue);
    const herfindahlIndex = weights.reduce((sum, w) => sum + Math.pow(w, 2), 0);
    
    return herfindahlIndex; // 0 = perfectly diversified, 1 = completely concentrated
  }

  calculateLiquidityRisk(portfolioData) {
    if (!portfolioData.assets) return 0;

    const liquidityScores = {
      'ETH': 1.0, 'BTC': 1.0, 'USDC': 1.0, 'USDT': 1.0, 'DAI': 0.9,
      'WBTC': 0.8, 'LINK': 0.7, 'UNI': 0.6, 'AAVE': 0.5
    };

    let weightedLiquidityScore = 0;
    let totalWeight = 0;

    portfolioData.assets.forEach(asset => {
      const weight = asset.value / portfolioData.totalValue;
      const liquidityScore = liquidityScores[asset.symbol] || 0.3;
      weightedLiquidityScore += weight * liquidityScore;
      totalWeight += weight;
    });

    return 1 - (weightedLiquidityScore / totalWeight); // Higher = more illiquid
  }

  async calculateCorrelationRisk(portfolioData) {
    // Simplified correlation risk calculation
    // In production, this would analyze correlations between all assets
    return 0.3; // Placeholder
  }

  calculateLeverageRisk(portfolioData) {
    const totalDebt = portfolioData.totalDebt || 0;
    const totalValue = portfolioData.totalValue || 1;
    
    return totalDebt / totalValue; // Debt-to-equity ratio
  }

  calculateILRisk(portfolioData) {
    const liquidityPositions = portfolioData.liquidityPositions || [];
    if (liquidityPositions.length === 0) return 0;

    const totalIL = liquidityPositions.reduce((sum, pos) => {
      return sum + (pos.impermanentLoss?.impermanentLoss || 0);
    }, 0);

    return totalIL / liquidityPositions.length; // Average IL across positions
  }

  calculateSmartContractRisk(portfolioData) {
    const protocolRiskScores = {
      'uniswap': 0.1, 'aave': 0.2, 'compound': 0.2, 'curve': 0.15,
      'sushiswap': 0.3, 'pancakeswap': 0.4, 'unknown': 0.8
    };

    let weightedRisk = 0;
    let totalExposure = 0;

    // Calculate based on DeFi protocol exposure
    if (portfolioData.defiExposure) {
      Object.entries(portfolioData.defiExposure).forEach(([protocol, exposure]) => {
        const riskScore = protocolRiskScores[protocol] || protocolRiskScores.unknown;
        weightedRisk += exposure * riskScore;
        totalExposure += exposure;
      });
    }

    return totalExposure > 0 ? weightedRisk / totalExposure : 0;
  }

  // Performance Benchmarking
  async getBenchmarkData(benchmark = 'ETH', timeframe = '30d') {
    // Mock benchmark data - replace with actual price feeds
    const days = this.getTimeframeDays(timeframe);
    const data = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Mock ETH price with some volatility
      const basePrice = 2000;
      const volatility = 0.05;
      const randomFactor = 1 + (Math.random() - 0.5) * volatility;
      
      data.unshift({
        timestamp: date.getTime(),
        value: basePrice * randomFactor
      });
    }
    
    this.benchmarkData.set(benchmark, data);
    return data;
  }

  async getBenchmarkReturn(benchmark, timeframe) {
    const data = await this.getBenchmarkData(benchmark, timeframe);
    if (data.length < 2) return 0;
    
    const startValue = data[0].value;
    const endValue = data[data.length - 1].value;
    const days = this.getTimeframeDays(timeframe);
    
    const totalReturn = (endValue - startValue) / startValue;
    return Math.pow(1 + totalReturn, 365 / days) - 1; // Annualized
  }

  async calculateTrackingError(portfolioData, timeframe) {
    try {
      const portfolioValues = this.getTimeframedData(portfolioData.historicalValues, timeframe);
      const benchmarkData = await this.getBenchmarkData('ETH', timeframe);
      
      if (portfolioValues.length !== benchmarkData.length) return 0;
      
      const portfolioReturns = this.calculateDailyReturns(portfolioValues);
      const benchmarkReturns = this.calculateDailyReturns(benchmarkData);
      
      const excessReturns = portfolioReturns.map((r, i) => r - benchmarkReturns[i]);
      const avgExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;
      const variance = excessReturns.reduce((sum, r) => sum + Math.pow(r - avgExcessReturn, 2), 0) / excessReturns.length;
      
      return Math.sqrt(variance) * Math.sqrt(365); // Annualized tracking error
    } catch (error) {
      console.error('Failed to calculate tracking error:', error);
      return 0;
    }
  }

  // Utility Functions
  getTimeframedData(data, timeframe) {
    if (!data || data.length === 0) return [];
    
    const days = this.getTimeframeDays(timeframe);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return data.filter(point => new Date(point.timestamp) >= cutoffDate);
  }

  getTimeframeDays(timeframe) {
    const timeframes = {
      '7d': 7, '30d': 30, '90d': 90, '1y': 365, 'all': 1000
    };
    return timeframes[timeframe] || 30;
  }

  calculateDailyReturns(values) {
    if (values.length < 2) return [];
    
    const returns = [];
    for (let i = 1; i < values.length; i++) {
      const previousValue = values[i - 1].value;
      const currentValue = values[i].value;
      const dailyReturn = (currentValue - previousValue) / previousValue;
      returns.push(dailyReturn);
    }
    
    return returns;
  }

  calculateCovariance(series1, series2) {
    if (series1.length !== series2.length || series1.length === 0) return 0;
    
    const mean1 = series1.reduce((sum, val) => sum + val, 0) / series1.length;
    const mean2 = series2.reduce((sum, val) => sum + val, 0) / series2.length;
    
    const covariance = series1.reduce((sum, val, i) => {
      return sum + (val - mean1) * (series2[i] - mean2);
    }, 0) / series1.length;
    
    return covariance;
  }

  calculateVariance(series) {
    if (series.length === 0) return 0;
    
    const mean = series.reduce((sum, val) => sum + val, 0) / series.length;
    return series.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / series.length;
  }

  // Portfolio Optimization
  async optimizePortfolio(portfolioData, targetReturn, constraints = {}) {
    // Simplified portfolio optimization using mean-variance approach
    // In production, this would use more sophisticated algorithms
    
    const assets = portfolioData.assets || [];
    if (assets.length < 2) return null;

    const optimization = {
      recommendedWeights: this.calculateOptimalWeights(assets, targetReturn),
      expectedReturn: targetReturn,
      expectedVolatility: this.estimatePortfolioVolatility(assets),
      sharpeRatio: 0,
      rebalanceActions: []
    };

    optimization.sharpeRatio = (optimization.expectedReturn - 0.02) / optimization.expectedVolatility;
    optimization.rebalanceActions = this.generateRebalanceActions(portfolioData, optimization.recommendedWeights);

    return optimization;
  }

  calculateOptimalWeights(assets, targetReturn) {
    // Simplified equal-weight approach with some adjustments
    // In production, this would use quadratic programming
    
    const baseWeight = 1 / assets.length;
    const weights = {};
    
    assets.forEach(asset => {
      weights[asset.symbol] = baseWeight;
    });
    
    return weights;
  }

  estimatePortfolioVolatility(assets) {
    // Simplified volatility estimation
    const avgVolatility = assets.reduce((sum, asset) => {
      const assetVolatility = this.getAssetVolatility(asset.symbol);
      return sum + assetVolatility;
    }, 0) / assets.length;
    
    return avgVolatility * 0.8; // Assume some diversification benefit
  }

  getAssetVolatility(symbol) {
    const volatilities = {
      'ETH': 0.8, 'BTC': 0.7, 'USDC': 0.01, 'USDT': 0.01, 'DAI': 0.02,
      'WBTC': 0.7, 'LINK': 1.2, 'UNI': 1.5, 'AAVE': 1.3
    };
    
    return volatilities[symbol] || 1.0;
  }

  generateRebalanceActions(portfolioData, targetWeights) {
    const actions = [];
    const currentValue = portfolioData.totalValue;
    
    portfolioData.assets.forEach(asset => {
      const currentWeight = asset.value / currentValue;
      const targetWeight = targetWeights[asset.symbol] || 0;
      const weightDiff = targetWeight - currentWeight;
      
      if (Math.abs(weightDiff) > 0.05) { // 5% threshold
        actions.push({
          asset: asset.symbol,
          action: weightDiff > 0 ? 'buy' : 'sell',
          currentWeight: currentWeight,
          targetWeight: targetWeight,
          amountChange: Math.abs(weightDiff * currentValue),
          priority: Math.abs(weightDiff) > 0.1 ? 'high' : 'medium'
        });
      }
    });
    
    return actions.sort((a, b) => Math.abs(b.targetWeight - b.currentWeight) - Math.abs(a.targetWeight - a.currentWeight));
  }

  // Alert System
  checkPerformanceAlerts(portfolioData, metrics) {
    const alerts = [];
    
    if (metrics.maxDrawdown > this.alertThresholds.drawdown * 100) {
      alerts.push({
        type: 'warning',
        category: 'performance',
        message: `High drawdown detected: ${metrics.maxDrawdown.toFixed(2)}%`,
        severity: 'high',
        timestamp: Date.now()
      });
    }
    
    if (metrics.volatility > this.alertThresholds.volatility) {
      alerts.push({
        type: 'info',
        category: 'risk',
        message: `Portfolio volatility is high: ${(metrics.volatility * 100).toFixed(2)}%`,
        severity: 'medium',
        timestamp: Date.now()
      });
    }
    
    if (metrics.sharpeRatio < this.alertThresholds.sharpeRatio) {
      alerts.push({
        type: 'warning',
        category: 'performance',
        message: `Low Sharpe ratio: ${metrics.sharpeRatio.toFixed(2)}`,
        severity: 'medium',
        timestamp: Date.now()
      });
    }
    
    return alerts;
  }

  // Data Export
  exportAnalyticsData(format = 'json') {
    const data = {
      performanceMetrics: Object.fromEntries(this.performanceData),
      riskMetrics: Object.fromEntries(this.riskMetrics),
      portfolioSnapshots: this.portfolioSnapshots,
      timestamp: Date.now()
    };
    
    if (format === 'csv') {
      return this.convertToCSV(data);
    }
    
    return JSON.stringify(data, null, 2);
  }

  convertToCSV(data) {
    // Simple CSV conversion for performance metrics
    let csv = 'Metric,Value,Timeframe\n';
    
    Object.entries(data.performanceMetrics).forEach(([timeframe, metrics]) => {
      Object.entries(metrics).forEach(([metric, value]) => {
        csv += `${metric},${value},${timeframe}\n`;
      });
    });
    
    return csv;
  }
}

export default new AnalyticsService();