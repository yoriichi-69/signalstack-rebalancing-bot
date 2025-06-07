import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Settings,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  Eye,
  Shield,
  Lightbulb,
  DollarSign,
  Activity,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Maximize2,
  TrendingUp as Trending
} from 'lucide-react';
import AdvancedPortfolioEngine from '../services/AdvancedPortfolioEngine';
import RealtimeDataService from '../services/RealtimeDataService';
import { Line, Doughnut, Bar, Radar, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  RadialLinearScale
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  RadialLinearScale
);

const AdvancedPortfolioManager = ({ portfolio, onPortfolioUpdate, totalValue = 125420.5 }) => {
  const [analysis, setAnalysis] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState('modern_portfolio_theory');
  const [autoRebalanceEnabled, setAutoRebalanceEnabled] = useState(false);
  const [rebalanceThreshold, setRebalanceThreshold] = useState([10]);
  const [riskTolerance, setRiskTolerance] = useState([50]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [realTimeData, setRealTimeData] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [simulationResults, setSimulationResults] = useState(null);
  const [executionPlan, setExecutionPlan] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Default portfolio for demonstration
  const defaultPortfolio = [
    { symbol: 'BTC', amount: 1.2, value: 56439.23 },
    { symbol: 'ETH', amount: 10, value: 31355.13 },
    { symbol: 'ADA', amount: 39200, value: 18813.08 },
    { symbol: 'DOT', amount: 1640, value: 12542.05 },
    { symbol: 'Others', amount: 1, value: 6271.01 }
  ];

  const currentPortfolio = portfolio || defaultPortfolio;

  // Real-time updates subscription
  useEffect(() => {
    // Subscribe to real-time data updates
    const unsubscribePrice = RealtimeDataService.subscribe('price_update', (data) => {
      setRealTimeData(prev => ({
        ...prev,
        [data.symbol]: data.data
      }));
    });

    const unsubscribePortfolio = RealtimeDataService.subscribe('portfolio_update', (data) => {
      if (autoRebalanceEnabled && analysis) {
        checkAutoRebalanceTriggers();
      }
    });

    // Start real-time data stream
    RealtimeDataService.startPriceStream();

    return () => {
      unsubscribePrice();
      unsubscribePortfolio();
    };
  }, [autoRebalanceEnabled, analysis]);

  // Auto-analyze on strategy change
  useEffect(() => {
    if (currentPortfolio?.length > 0) {
      analyzePortfolio();
    }
  }, [selectedStrategy]);

  // Analyze portfolio with selected strategy
  const analyzePortfolio = useCallback(async () => {
    if (!currentPortfolio?.length) return;
    
    setIsAnalyzing(true);
    try {
      console.log('Starting portfolio analysis...');
      const result = await AdvancedPortfolioEngine.analyzePortfolio(currentPortfolio, selectedStrategy);
      setAnalysis(result);
      
      // Generate execution plan
      if (result.rebalanceSignal.action !== 'HOLD') {
        const plan = generateExecutionPlan(result.optimizedAllocation);
        setExecutionPlan(plan);
      }
      
      // Run strategy comparison simulation
      const simulation = await runStrategySimulation();
      setSimulationResults(simulation);
      
      addNotification('success', 'Portfolio analysis completed successfully');
    } catch (error) {
      console.error('Analysis failed:', error);
      addNotification('error', 'Portfolio analysis failed: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentPortfolio, selectedStrategy]);

  const runStrategySimulation = async () => {
    const strategies = Object.keys(AdvancedPortfolioEngine.strategies);
    const results = {};
    
    for (const strategy of strategies) {
      try {
        const strategyAnalysis = await AdvancedPortfolioEngine.analyzePortfolio(currentPortfolio, strategy);
        results[strategy] = {
          name: AdvancedPortfolioEngine.strategies[strategy].name,
          expectedReturn: strategyAnalysis.riskMetrics.expectedReturn * 100,
          risk: strategyAnalysis.riskMetrics.portfolioVaR * 100,
          sharpe: strategyAnalysis.riskMetrics.sharpeRatio,
          maxDrawdown: strategyAnalysis.riskMetrics.maximumDrawdown * 100,
          confidence: Math.random() * 0.3 + 0.7 // 70-100% confidence range
        };
      } catch (error) {
        console.error(`Error analyzing ${strategy}:`, error);
      }
    }
    
    return results;
  };

  const checkAutoRebalanceTriggers = async () => {
    if (!analysis) return;
    
    const signal = analysis.rebalanceSignal;
    const thresholdValue = rebalanceThreshold[0] / 100;
    
    const maxDrift = Math.max(
      ...analysis.optimizedAllocation.map(asset => Math.abs(asset.rebalanceAmount))
    );
    
    if ((signal.urgency === 'HIGH' && maxDrift > thresholdValue) || 
        (signal.urgency === 'MEDIUM' && maxDrift > thresholdValue * 1.5)) {
      addNotification('info', 'Auto-rebalance triggered by market conditions');
      await executeRebalancing();
    }
  };

  const executeRebalancing = async () => {
    if (!analysis?.optimizedAllocation || !executionPlan) return;
    
    setIsExecuting(true);
    try {
      addNotification('info', 'Executing portfolio rebalancing...');
      
      // Simulate execution delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Apply optimized allocation to portfolio
      const newPortfolio = applyOptimizedAllocation(currentPortfolio, analysis.optimizedAllocation);
      
      if (onPortfolioUpdate) {
        onPortfolioUpdate(newPortfolio);
      }
      
      addNotification('success', 'Portfolio rebalancing completed successfully');
      
      // Re-analyze with new allocation
      setTimeout(analyzePortfolio, 1000);
      
    } catch (error) {
      console.error('Rebalancing failed:', error);
      addNotification('error', 'Rebalancing failed: ' + error.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const generateExecutionPlan = (optimizedAllocation) => {
    const currentTotal = currentPortfolio.reduce((sum, asset) => sum + (asset.value || 0), 0);
    
    const trades = optimizedAllocation
      .map(optAsset => {
        const currentAsset = currentPortfolio.find(a => a.symbol === optAsset.symbol);
        const targetValue = optAsset.targetWeight * currentTotal;
        const currentValue = currentAsset?.value || 0;
        const difference = targetValue - currentValue;
        
        if (Math.abs(difference) < 50) return null; // Skip small trades
        
        return {
          symbol: optAsset.symbol,
          action: difference > 0 ? 'BUY' : 'SELL',
          amount: Math.abs(difference),
          percentage: Math.abs(difference / currentTotal) * 100,
          priority: Math.abs(difference / currentTotal) > 0.05 ? 'HIGH' : 'MEDIUM',
          estimatedCost: Math.abs(difference) * 0.003,
          currentWeight: (currentValue / currentTotal) * 100,
          targetWeight: optAsset.targetWeight * 100,
          confidence: optAsset.confidence || 0.7
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.amount - a.amount);
    
    const totalCost = trades.reduce((sum, trade) => sum + trade.estimatedCost, 0);
    const totalValue = trades.reduce((sum, trade) => sum + trade.amount, 0);
    
    return {
      trades,
      summary: {
        totalTrades: trades.length,
        totalValue,
        totalCost,
        costPercentage: (totalCost / currentTotal) * 100,
        expectedImprovement: analysis?.rebalanceSignal.expectedImprovement * 100 || 0
      }
    };
  };

  const applyOptimizedAllocation = (portfolio, optimizedAllocation) => {
    const totalValue = portfolio.reduce((sum, asset) => sum + (asset.value || 0), 0);
    
    return optimizedAllocation.map(optAsset => {
      const currentAsset = portfolio.find(a => a.symbol === optAsset.symbol);
      const newValue = optAsset.targetWeight * totalValue;
      const price = optAsset.currentPrice || 1;
      
      return {
        ...currentAsset,
        value: newValue,
        amount: newValue / price,
        weight: optAsset.targetWeight
      };
    });
  };

  const addNotification = (type, message) => {
    const notification = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Chart configurations
  const allocationComparisonData = useMemo(() => {
    if (!analysis?.optimizedAllocation) return null;
    
    const labels = analysis.optimizedAllocation.map(asset => asset.symbol);
    const currentData = analysis.optimizedAllocation.map(asset => asset.currentWeight * 100);
    const targetData = analysis.optimizedAllocation.map(asset => asset.targetWeight * 100);
    
    return {
      labels,
      datasets: [
        {
          label: 'Current Allocation',
          data: currentData,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          borderRadius: 4
        },
        {
          label: 'Target Allocation',
          data: targetData,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          borderRadius: 4
        }
      ]
    };
  }, [analysis]);

  const riskMetricsRadarData = useMemo(() => {
    if (!analysis?.riskMetrics) return null;
    
    const normalizeMetric = (value, max) => Math.min(Math.abs(value || 0), max) / max * 100;
    
    return {
      labels: ['Sharpe Ratio', 'Sortino Ratio', 'Calmar Ratio', 'Info Ratio', 'Expected Return'],
      datasets: [{
        label: 'Current Portfolio',
        data: [
          normalizeMetric(analysis.riskMetrics.sharpeRatio, 3),
          normalizeMetric(analysis.riskMetrics.sortinoRatio, 3),
          normalizeMetric(analysis.riskMetrics.calmarRatio, 3),
          normalizeMetric(analysis.riskMetrics.informationRatio, 2),
          normalizeMetric(analysis.riskMetrics.expectedReturn, 0.5)
        ],
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(168, 85, 247, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(168, 85, 247, 1)'
      }]
    };
  }, [analysis]);

  const strategyComparisonData = useMemo(() => {
    if (!simulationResults) return null;
    
    const strategies = Object.values(simulationResults);
    
    return {
      datasets: [{
        label: 'Strategy Performance',
        data: strategies.map(s => ({
          x: s.risk,
          y: s.expectedReturn,
          r: s.sharpe * 3 + 5 // Size based on Sharpe ratio
        })),
        backgroundColor: strategies.map((_, i) => 
          `hsla(${i * 60}, 70%, 60%, 0.7)`
        ),
        borderColor: strategies.map((_, i) => 
          `hsla(${i * 60}, 70%, 50%, 1)`
        ),
        borderWidth: 2
      }]
    };
  }, [simulationResults]);

  const performanceTimelineData = useMemo(() => {
    // Mock performance data - replace with actual historical data
    const days = Array.from({ length: 30 }, (_, i) => i + 1);
    const baseValue = totalValue;
    
    return {
      labels: days.map(d => `Day ${d}`),
      datasets: [
        {
          label: 'Portfolio Value',
          data: days.map(d => {
            const volatility = 0.02; // 2% daily volatility
            const trend = 0.001; // Slight upward trend
            const random = (Math.random() - 0.5) * volatility;
            return baseValue * (1 + trend * d + random);
          }),
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }
      ]
    };
  }, [totalValue]);

  if (!currentPortfolio?.length) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No portfolio data available</p>
            <Button onClick={() => analyzePortfolio()} className="mt-4">
              Load Demo Portfolio
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <Alert key={notification.id} className={`w-80 ${
              notification.type === 'success' ? 'border-green-500 bg-green-50' :
              notification.type === 'error' ? 'border-red-500 bg-red-50' :
              'border-blue-500 bg-blue-50'
            }`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{notification.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Header Controls */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">Advanced Portfolio Manager</CardTitle>
                <p className="text-blue-100 text-sm">AI-Powered Portfolio Optimization & Rebalancing</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-white/20 text-white">
                {analysis?.marketSentiment?.sentiment || 'Loading...'}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white">
                F&G: {analysis?.marketSentiment?.fearGreedIndex || '--'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Strategy Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Optimization Strategy</label>
              <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AdvancedPortfolioEngine.strategies).map(([key, strategy]) => (
                    <SelectItem key={key} value={key}>
                      {strategy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {AdvancedPortfolioEngine.strategies[selectedStrategy]?.description}
              </p>
            </div>

            {/* Risk Tolerance */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Risk Tolerance</label>
              <Slider
                value={riskTolerance}
                onValueChange={setRiskTolerance}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Conservative</span>
                <span>{riskTolerance[0]}%</span>
                <span>Aggressive</span>
              </div>
            </div>

            {/* Auto Rebalance Settings */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Auto Rebalance</label>
                <Switch
                  checked={autoRebalanceEnabled}
                  onCheckedChange={setAutoRebalanceEnabled}
                />
              </div>
              {autoRebalanceEnabled && (
                <>
                  <Slider
                    value={rebalanceThreshold}
                    onValueChange={setRebalanceThreshold}
                    min={1}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Trigger at {rebalanceThreshold[0]}% drift
                  </p>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={analyzePortfolio}
                disabled={isAnalyzing}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
              
              {analysis?.rebalanceSignal.action !== 'HOLD' && (
                <Button
                  onClick={executeRebalancing}
                  disabled={isExecuting}
                  variant="outline"
                  className="flex-1"
                >
                  {isExecuting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Execute
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Status Dashboard */}
      {analysis && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Portfolio Value</p>
                  <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
                  <p className="text-sm opacity-75">+$3,020.15 (+2.45%)</p>
                </div>
                <DollarSign className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className={`text-white ${
            analysis.rebalanceSignal.urgency === 'HIGH' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
            analysis.rebalanceSignal.urgency === 'MEDIUM' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
            'bg-gradient-to-r from-blue-500 to-indigo-500'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Rebalance Signal</p>
                  <p className="text-xl font-bold">{analysis.rebalanceSignal.action}</p>
                  <Badge className="bg-white/20 text-white text-xs">
                    {analysis.rebalanceSignal.urgency}
                  </Badge>
                </div>
                <Target className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-violet-500 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Risk Score</p>
                  <p className="text-2xl font-bold">
                    {(analysis.riskMetrics.portfolioVaR * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm opacity-75">VaR (95%)</p>
                </div>
                <Shield className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Sharpe Ratio</p>
                  <p className="text-2xl font-bold">
                    {(analysis.riskMetrics.sharpeRatio || 0).toFixed(2)}
                  </p>
                  <p className="text-sm opacity-75">Risk-Adjusted Return</p>
                </div>
                <Activity className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-teal-500 to-green-500 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Expected Return</p>
                  <p className="text-2xl font-bold">
                    {(analysis.riskMetrics.expectedReturn * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm opacity-75">Annualized</p>
                </div>
                <TrendingUp className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Analysis Tabs */}
      {analysis && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="allocation" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Allocation
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Risk
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Optimization
            </TabsTrigger>
            <TabsTrigger value="execution" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Execution
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Portfolio Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trending className="h-5 w-5" />
                    Portfolio Performance (30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Line
                      data={performanceTimelineData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false }
                        },
                        scales: {
                          y: {
                            beginAtZero: false,
                            ticks: {
                              callback: function(value) {
                                return '$' + value.toLocaleString();
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Current vs Target Allocation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Allocation Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {allocationComparisonData && (
                      <Bar
                        data={allocationComparisonData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: 'top' }
                          },
                          scales: {
                            y: { 
                              beginAtZero: true, 
                              max: 50,
                              ticks: {
                                callback: function(value) {
                                  return value + '%';
                                }
                              }
                            }
                          }
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  AI-Powered Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {analysis.recommendations.slice(0, 4).map((rec, index) => (
                    <Alert key={index} className={`${
                      rec.priority === 'HIGH' ? 'border-red-200 bg-red-50' :
                      rec.priority === 'MEDIUM' ? 'border-yellow-200 bg-yellow-50' :
                      'border-blue-200 bg-blue-50'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-1 rounded-full ${
                          rec.type === 'OPPORTUNITY' ? 'bg-green-100' :
                          rec.type === 'WARNING' ? 'bg-red-100' :
                          rec.type === 'REBALANCE' ? 'bg-blue-100' :
                          'bg-gray-100'
                        }`}>
                          {rec.type === 'OPPORTUNITY' ? <ArrowUpRight className="h-4 w-4 text-green-600" /> :
                           rec.type === 'WARNING' ? <AlertTriangle className="h-4 w-4 text-red-600" /> :
                           rec.type === 'REBALANCE' ? <Target className="h-4 w-4 text-blue-600" /> :
                           <Info className="h-4 w-4 text-gray-600" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm">{rec.type.replace('_', ' ')}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {rec.priority}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {(rec.confidence * 100).toFixed(0)}% confidence
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{rec.message}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Impact: {rec.impact}</span>
                            <span>Timeframe: {rec.timeframe}</span>
                          </div>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Allocation Tab */}
          <TabsContent value="allocation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Allocation Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {allocationComparisonData && (
                      <Doughnut
                        data={{
                          labels: allocationComparisonData.labels,
                          datasets: [{
                            data: allocationComparisonData.datasets[0].data,
                            backgroundColor: [
                              '#F97316', // Orange for BTC
                              '#3B82F6', // Blue for ETH  
                              '#8B5CF6', // Purple for ADA
                              '#EF4444', // Red for DOT
                              '#10B981'  // Green for Others
                            ],
                            borderWidth: 2,
                            borderColor: '#fff'
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: 'bottom' }
                          }
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Target Allocation Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Target Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {allocationComparisonData && (
                      <Doughnut
                        data={{
                          labels: allocationComparisonData.labels,
                          datasets: [{
                            data: allocationComparisonData.datasets[1].data,
                            backgroundColor: [
                              '#F97316', // Orange for BTC
                              '#3B82F6', // Blue for ETH  
                              '#8B5CF6', // Purple for ADA
                              '#EF4444', // Red for DOT
                              '#10B981'  // Green for Others
                            ],
                            borderWidth: 2,
                            borderColor: '#fff'
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: 'bottom' }
                          }
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Allocation Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Allocation Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Asset</th>
                        <th className="text-right p-2">Current %</th>
                        <th className="text-right p-2">Target %</th>
                        <th className="text-right p-2">Drift</th>
                        <th className="text-right p-2">Value</th>
                        <th className="text-right p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.optimizedAllocation.map((asset, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{asset.symbol}</td>
                          <td className="text-right p-2">{(asset.currentWeight * 100).toFixed(1)}%</td>
                          <td className="text-right p-2">{(asset.targetWeight * 100).toFixed(1)}%</td>
                          <td className={`text-right p-2 ${
                            Math.abs(asset.rebalanceAmount) > 0.05 ? 'text-red-600 font-medium' :
                            Math.abs(asset.rebalanceAmount) > 0.02 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {asset.rebalanceAmount > 0 ? '+' : ''}{(asset.rebalanceAmount * 100).toFixed(1)}%
                          </td>
                          <td className="text-right p-2">${(asset.value || 0).toLocaleString()}</td>
                          <td className="text-right p-2">
                            {Math.abs(asset.rebalanceAmount) > 0.02 ? (
                              <Badge variant={asset.rebalanceAmount > 0 ? "default" : "secondary"}>
                                {asset.rebalanceAmount > 0 ? 'BUY' : 'SELL'}
                              </Badge>
                            ) : (
                              <Badge variant="outline">HOLD</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risk Analysis Tab */}
          <TabsContent value="risk" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk Metrics Radar */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {riskMetricsRadarData && (
                      <Radar
                        data={riskMetricsRadarData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            r: { 
                              beginAtZero: true, 
                              max: 100,
                              ticks: { display: false }
                            }
                          }
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Metrics Cards */}
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Value at Risk (95%)</p>
                        <p className="text-2xl font-bold text-red-600">
                          {(analysis.riskMetrics.portfolioVaR * 100).toFixed(2)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Max 1-day loss</p>
                        <p className="text-lg font-medium">
                          ${(totalValue * analysis.riskMetrics.portfolioVaR).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Maximum Drawdown</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {(analysis.riskMetrics.maximumDrawdown * 100).toFixed(2)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Historical worst</p>
                        <p className="text-lg font-medium">
                          ${(totalValue * Math.abs(analysis.riskMetrics.maximumDrawdown)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Portfolio Volatility</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {(analysis.riskMetrics.portfolioVolatility * 100).toFixed(2)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Annualized</p>
                        <Badge variant={
                          analysis.riskMetrics.portfolioVolatility > 0.4 ? "destructive" :
                          analysis.riskMetrics.portfolioVolatility > 0.25 ? "secondary" : "default"
                        }>
                          {analysis.riskMetrics.portfolioVolatility > 0.4 ? 'High' :
                           analysis.riskMetrics.portfolioVolatility > 0.25 ? 'Medium' : 'Low'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Concentration Risk */}
            <Card>
              <CardHeader>
                <CardTitle>Concentration Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Herfindahl Index</p>
                    <p className="text-2xl font-bold">{analysis.concentrationRisk.hhi.toFixed(3)}</p>
                    <Badge variant={
                      analysis.concentrationRisk.level === 'high' ? "destructive" :
                      analysis.concentrationRisk.level === 'medium' ? "secondary" : "default"
                    }>
                      {analysis.concentrationRisk.level} concentration
                    </Badge>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Largest Position</p>
                    <p className="text-2xl font-bold">
                      {(analysis.concentrationRisk.maxSingleAssetWeight * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500">Single asset exposure</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Diversification Score</p>
                    <p className="text-2xl font-bold">
                      {((1 - analysis.concentrationRisk.gini) * 100).toFixed(0)}
                    </p>
                    <p className="text-sm text-gray-500">Out of 100</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Strategy Optimization Tab */}
          <TabsContent value="optimization" className="space-y-6">
            {simulationResults && (
              <>
                {/* Strategy Comparison Scatter Plot */}
                <Card>
                  <CardHeader>
                    <CardTitle>Strategy Performance Comparison</CardTitle>
                    <p className="text-sm text-gray-600">Risk vs Return analysis (bubble size = Sharpe ratio)</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <Scatter
                        data={strategyComparisonData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const strategies = Object.keys(simulationResults);
                                  const strategy = strategies[context.dataIndex];
                                  const data = simulationResults[strategy];
                                  return [
                                    `Strategy: ${data.name}`,
                                    `Expected Return: ${data.expectedReturn.toFixed(2)}%`,
                                    `Risk (VaR): ${data.risk.toFixed(2)}%`,
                                    `Sharpe Ratio: ${data.sharpe.toFixed(2)}`
                                  ];
                                }
                              }
                            }
                          },
                          scales: {
                            x: {
                              title: { display: true, text: 'Risk (VaR %)' },
                              beginAtZero: true
                            },
                            y: {
                              title: { display: true, text: 'Expected Return (%)' },
                              beginAtZero: true
                            }
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Strategy Details Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Strategy Performance Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Strategy</th>
                            <th className="text-right p-3">Expected Return</th>
                            <th className="text-right p-3">Risk (VaR)</th>
                            <th className="text-right p-3">Sharpe Ratio</th>
                            <th className="text-right p-3">Max Drawdown</th>
                            <th className="text-right p-3">Confidence</th>
                            <th className="text-center p-3">Recommendation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(simulationResults).map(([key, strategy]) => (
                            <tr key={key} className={`border-b hover:bg-gray-50 ${
                              key === selectedStrategy ? 'bg-blue-50 border-blue-200' : ''
                            }`}>
                              <td className="p-3">
                                <div>
                                  <p className="font-medium">{strategy.name}</p>
                                  {key === selectedStrategy && (
                                    <Badge variant="default" className="text-xs mt-1">CURRENT</Badge>
                                  )}
                                </div>
                              </td>
                              <td className="text-right p-3 font-medium text-green-600">
                                +{strategy.expectedReturn.toFixed(2)}%
                              </td>
                              <td className="text-right p-3 font-medium text-red-600">
                                {strategy.risk.toFixed(2)}%
                              </td>
                              <td className="text-right p-3 font-medium">
                                {strategy.sharpe.toFixed(2)}
                              </td>
                              <td className="text-right p-3 text-orange-600">
                                {strategy.maxDrawdown.toFixed(2)}%
                              </td>
                              <td className="text-right p-3">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-500 h-2 rounded-full"
                                      style={{ width: `${strategy.confidence * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm">{(strategy.confidence * 100).toFixed(0)}%</span>
                                </div>
                              </td>
                              <td className="text-center p-3">
                                {strategy.sharpe > 1.5 ? (
                                  <Badge variant="default">Excellent</Badge>
                                ) : strategy.sharpe > 1.0 ? (
                                  <Badge variant="secondary">Good</Badge>
                                ) : strategy.sharpe > 0.5 ? (
                                  <Badge variant="outline">Fair</Badge>
                                ) : (
                                  <Badge variant="destructive">Poor</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Execution Tab */}
          <TabsContent value="execution" className="space-y-6">
            {executionPlan && (
              <>
                {/* Execution Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Execution Plan Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{executionPlan.summary.totalTrades}</p>
                        <p className="text-sm text-gray-600">Total Trades</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          ${executionPlan.summary.totalValue.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">Trade Value</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">
                          ${executionPlan.summary.totalCost.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">Est. Costs</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          +{executionPlan.summary.expectedImprovement.toFixed(2)}%
                        </p>
                        <p className="text-sm text-gray-600">Expected Gain</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Execution Plan */}
                <Card>
                  <CardHeader>
                    <CardTitle>Trade Execution Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {executionPlan.trades.map((trade, index) => (
                        <div key={index} className={`p-4 rounded-lg border-2 ${
                          trade.priority === 'HIGH' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Badge variant={trade.action === 'BUY' ? "default" : "secondary"}>
                                {trade.action}
                              </Badge>
                              <h3 className="font-bold text-lg">{trade.symbol}</h3>
                              <Badge variant="outline" className="text-xs">
                                {trade.priority}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">${trade.amount.toLocaleString()}</p>
                              <p className="text-sm text-gray-600">{trade.percentage.toFixed(1)}% of portfolio</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Current Weight</p>
                              <p className="font-medium">{trade.currentWeight.toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Target Weight</p>
                              <p className="font-medium">{trade.targetWeight.toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Est. Cost</p>
                              <p className="font-medium">${trade.estimatedCost.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Confidence</p>
                              <div className="flex items-center gap-2">
                                <div className="w-12 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${trade.confidence * 100}%` }}
                                  ></div>
                                </div>
                                <span>{(trade.confidence * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Execute Button */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg mb-2">Ready to Execute Rebalancing</h3>
                        <p className="text-gray-600">
                          This will execute {executionPlan.summary.totalTrades} trades with an estimated cost of ${executionPlan.summary.totalCost.toLocaleString()}
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          Expected portfolio improvement: +{executionPlan.summary.expectedImprovement.toFixed(2)}%
                        </p>
                      </div>
                      <Button
                        onClick={executeRebalancing}
                        disabled={isExecuting}
                        size="lg"
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        {isExecuting ? (
                          <>
                            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-5 w-5 mr-2" />
                            Execute Rebalancing
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {!executionPlan && analysis?.rebalanceSignal.action === 'HOLD' && (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <h3 className="font-bold text-lg mb-2">Portfolio is Well Balanced</h3>
                    <p className="text-gray-600">No rebalancing needed at this time.</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Current allocation is within acceptable drift thresholds.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AdvancedPortfolioManager;