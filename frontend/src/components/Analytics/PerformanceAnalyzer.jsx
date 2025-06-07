import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  ShowChart,
  PieChart,
  BarChart,
  Timeline,
  Warning,
  CheckCircle,
  Info,
  Download,
  Refresh,
  ExpandMore,
  Speed,
  Security,
  MonetizationOn,
  CompareArrows,
  AccountBalance,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import AnalyticsService from '../../services/AnalyticsService';
import { formatCurrency, formatPercentage, formatTime } from '../../utils/formatters';

const PerformanceAnalyzer = ({ portfolioData, onExportData }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [timeframe, setTimeframe] = useState('30d');
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [benchmarkComparison, setBenchmarkComparison] = useState(null);
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [performanceAlerts, setPerformanceAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedBenchmark, setSelectedBenchmark] = useState('ETH');

  // Chart colors
  const chartColors = {
    primary: '#1976d2',
    secondary: '#dc004e',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    info: '#0288d1'
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    if (portfolioData) {
      loadAnalyticsData();
    }
  }, [portfolioData, timeframe]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load performance metrics
      const perfMetrics = await AnalyticsService.calculatePortfolioMetrics(portfolioData, timeframe);
      setPerformanceMetrics(perfMetrics);
      
      // Load risk metrics
      const riskData = await AnalyticsService.calculateRiskMetrics(portfolioData);
      setRiskMetrics(riskData);
      
      // Check for alerts
      const alerts = AnalyticsService.checkPerformanceAlerts(portfolioData, perfMetrics);
      setPerformanceAlerts(alerts);
      
      // Load benchmark comparison
      const benchmarkData = await loadBenchmarkComparison();
      setBenchmarkComparison(benchmarkData);
      
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBenchmarkComparison = async () => {
    try {
      const portfolioReturn = performanceMetrics?.annualizedReturn || 0;
      const benchmarkReturn = await AnalyticsService.getBenchmarkReturn(selectedBenchmark, timeframe);
      const beta = await AnalyticsService.calculateBeta(portfolioData, timeframe);
      const alpha = await AnalyticsService.calculateAlpha(portfolioData, timeframe);
      
      return {
        portfolioReturn,
        benchmarkReturn,
        outperformance: portfolioReturn - benchmarkReturn,
        beta,
        alpha,
        correlation: beta * 0.8 // Simplified correlation estimate
      };
    } catch (error) {
      console.error('Failed to load benchmark comparison:', error);
      return null;
    }
  };

  const handleOptimizePortfolio = async () => {
    try {
      setLoading(true);
      const targetReturn = performanceMetrics?.annualizedReturn * 1.1 || 0.15; // Target 10% improvement
      const optimization = await AnalyticsService.optimizePortfolio(portfolioData, targetReturn);
      setOptimizationResults(optimization);
    } catch (error) {
      console.error('Failed to optimize portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    setExportDialogOpen(true);
  };

  const exportAnalytics = (format) => {
    const data = AnalyticsService.exportAnalyticsData(format);
    const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio_analytics_${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDialogOpen(false);
  };

  const renderPerformanceOverview = () => (
    <Grid container spacing={3}>
      {/* Key Performance Metrics */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance Overview ({timeframe})
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h4" color={performanceMetrics?.totalReturn >= 0 ? 'success.main' : 'error.main'}>
                    {formatPercentage(performanceMetrics?.totalReturn || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Return
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h4" color="primary">
                    {formatPercentage((performanceMetrics?.annualizedReturn || 0) * 100)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Annualized Return
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h4" color="warning.main">
                    {performanceMetrics?.sharpeRatio?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sharpe Ratio
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h4" color="error.main">
                    {formatPercentage(performanceMetrics?.maxDrawdown || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Max Drawdown
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Performance Chart */}
      <Grid item xs={12} lg={8}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Portfolio Performance vs Benchmark
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Benchmark</InputLabel>
                <Select
                  value={selectedBenchmark}
                  onChange={(e) => setSelectedBenchmark(e.target.value)}
                >
                  <MenuItem value="ETH">Ethereum</MenuItem>
                  <MenuItem value="BTC">Bitcoin</MenuItem>
                  <MenuItem value="SPY">S&P 500</MenuItem>
                  <MenuItem value="DeFi">DeFi Index</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {portfolioData?.historicalValues && (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={portfolioData.historicalValues}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <RechartsTooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value, name) => [formatCurrency(value), name]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    fill={chartColors.primary}
                    fillOpacity={0.3}
                    stroke={chartColors.primary}
                    name="Portfolio Value"
                  />
                  <ReferenceLine 
                    y={portfolioData.historicalValues[0]?.value || 0} 
                    stroke={chartColors.secondary}
                    strokeDasharray="2 2"
                    label="Initial Value"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Performance Metrics Table */}
      <Grid item xs={12} lg={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Detailed Metrics
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>Volatility</TableCell>
                  <TableCell align="right">
                    {formatPercentage((performanceMetrics?.volatility || 0) * 100)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Win Rate</TableCell>
                  <TableCell align="right">
                    {formatPercentage(performanceMetrics?.winRate || 0)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Profit Factor</TableCell>
                  <TableCell align="right">
                    {performanceMetrics?.profitFactor?.toFixed(2) || '0.00'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Sortino Ratio</TableCell>
                  <TableCell align="right">
                    {performanceMetrics?.sortino?.toFixed(2) || '0.00'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Calmar Ratio</TableCell>
                  <TableCell align="right">
                    {performanceMetrics?.calmar?.toFixed(2) || '0.00'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Beta</TableCell>
                  <TableCell align="right">
                    {performanceMetrics?.beta?.toFixed(2) || '1.00'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Alpha</TableCell>
                  <TableCell align="right">
                    <span style={{ color: (performanceMetrics?.alpha || 0) >= 0 ? chartColors.success : chartColors.error }}>
                      {formatPercentage((performanceMetrics?.alpha || 0) * 100)}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderRiskAnalysis = () => (
    <Grid container spacing={3}>
      {/* Risk Overview */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Risk Analysis
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h4" color="error.main">
                    {formatCurrency(riskMetrics?.portfolioVaR || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Value at Risk (5%)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h4" color="error.main">
                    {formatCurrency(riskMetrics?.conditionalVaR || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Conditional VaR
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h4" color="warning.main">
                    {(riskMetrics?.concentrationRisk * 100)?.toFixed(1) || '0.0'}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Concentration Risk
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h4" color="info.main">
                    {(riskMetrics?.liquidityRisk * 100)?.toFixed(1) || '0.0'}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Liquidity Risk
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Risk Breakdown Chart */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Risk Factor Breakdown
            </Typography>
            {riskMetrics && (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={[
                  { factor: 'Concentration', value: riskMetrics.concentrationRisk * 100 },
                  { factor: 'Liquidity', value: riskMetrics.liquidityRisk * 100 },
                  { factor: 'Leverage', value: riskMetrics.leverageRisk * 100 },
                  { factor: 'Smart Contract', value: riskMetrics.smartContractRisk * 100 },
                  { factor: 'IL Risk', value: riskMetrics.impermanentLossRisk * 100 },
                  { factor: 'Correlation', value: riskMetrics.correlationRisk * 100 }
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="factor" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Risk Level"
                    dataKey="value"
                    stroke={chartColors.error}
                    fill={chartColors.error}
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Risk Metrics Details */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Risk Assessment Details
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Security color={riskMetrics?.concentrationRisk > 0.5 ? 'error' : 'success'} />
                </ListItemIcon>
                <ListItemText
                  primary="Concentration Risk"
                  secondary={`${(riskMetrics?.concentrationRisk * 100)?.toFixed(1)}% - ${
                    riskMetrics?.concentrationRisk > 0.5 ? 'High concentration detected' : 'Well diversified'
                  }`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Speed color={riskMetrics?.liquidityRisk > 0.3 ? 'warning' : 'success'} />
                </ListItemIcon>
                <ListItemText
                  primary="Liquidity Risk"
                  secondary={`${(riskMetrics?.liquidityRisk * 100)?.toFixed(1)}% - ${
                    riskMetrics?.liquidityRisk > 0.3 ? 'Some illiquid positions' : 'Good liquidity'
                  }`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <AccountBalance color={riskMetrics?.leverageRisk > 0.5 ? 'error' : 'success'} />
                </ListItemIcon>
                <ListItemText
                  primary="Leverage Risk"
                  secondary={`${(riskMetrics?.leverageRisk * 100)?.toFixed(1)}% - ${
                    riskMetrics?.leverageRisk > 0.5 ? 'High leverage detected' : 'Conservative leverage'
                  }`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Security color={riskMetrics?.smartContractRisk > 0.4 ? 'warning' : 'success'} />
                </ListItemIcon>
                <ListItemText
                  primary="Smart Contract Risk"
                  secondary={`${(riskMetrics?.smartContractRisk * 100)?.toFixed(1)}% - ${
                    riskMetrics?.smartContractRisk > 0.4 ? 'Experimental protocols detected' : 'Established protocols'
                  }`}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderBenchmarkComparison = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Benchmark Comparison ({selectedBenchmark})
            </Typography>
            {benchmarkComparison && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell>Portfolio Return</TableCell>
                        <TableCell align="right">
                          <span style={{ color: benchmarkComparison.portfolioReturn >= 0 ? chartColors.success : chartColors.error }}>
                            {formatPercentage(benchmarkComparison.portfolioReturn * 100)}
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Benchmark Return</TableCell>
                        <TableCell align="right">
                          <span style={{ color: benchmarkComparison.benchmarkReturn >= 0 ? chartColors.success : chartColors.error }}>
                            {formatPercentage(benchmarkComparison.benchmarkReturn * 100)}
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Outperformance</strong></TableCell>
                        <TableCell align="right">
                          <strong style={{ color: benchmarkComparison.outperformance >= 0 ? chartColors.success : chartColors.error }}>
                            {formatPercentage(benchmarkComparison.outperformance * 100)}
                          </strong>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Beta</TableCell>
                        <TableCell align="right">
                          {benchmarkComparison.beta?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Alpha</TableCell>
                        <TableCell align="right">
                          <span style={{ color: benchmarkComparison.alpha >= 0 ? chartColors.success : chartColors.error }}>
                            {formatPercentage(benchmarkComparison.alpha * 100)}
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Correlation</TableCell>
                        <TableCell align="right">
                          {benchmarkComparison.correlation?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Performance Analysis
                    </Typography>
                    <Box mb={2}>
                      <Alert 
                        severity={benchmarkComparison.outperformance >= 0 ? 'success' : 'warning'}
                        icon={benchmarkComparison.outperformance >= 0 ? <TrendingUp /> : <TrendingDown />}
                      >
                        {benchmarkComparison.outperformance >= 0 ? 
                          `Portfolio is outperforming ${selectedBenchmark} by ${formatPercentage(benchmarkComparison.outperformance * 100)}` :
                          `Portfolio is underperforming ${selectedBenchmark} by ${formatPercentage(Math.abs(benchmarkComparison.outperformance) * 100)}`
                        }
                      </Alert>
                    </Box>
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Risk-Adjusted Performance:
                      </Typography>
                      <Typography variant="body2">
                        {benchmarkComparison.alpha >= 0 ? 
                          `Positive alpha of ${formatPercentage(benchmarkComparison.alpha * 100)} indicates good risk-adjusted returns` :
                          `Negative alpha suggests underperformance after adjusting for risk`
                        }
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderOptimization = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Portfolio Optimization
              </Typography>
              <Button
                variant="contained"
                onClick={handleOptimizePortfolio}
                disabled={loading}
                startIcon={<AnalyticsIcon />}
              >
                Optimize Portfolio
              </Button>
            </Box>
            
            {optimizationResults ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Optimization Results
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Expected Return</TableCell>
                        <TableCell align="right">
                          {formatPercentage(optimizationResults.expectedReturn * 100)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Expected Volatility</TableCell>
                        <TableCell align="right">
                          {formatPercentage(optimizationResults.expectedVolatility * 100)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Expected Sharpe Ratio</TableCell>
                        <TableCell align="right">
                          {optimizationResults.sharpeRatio?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Recommended Actions
                  </Typography>
                  {optimizationResults.rebalanceActions.length > 0 ? (
                    <List dense>
                      {optimizationResults.rebalanceActions.slice(0, 5).map((action, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            {action.action === 'buy' ? 
                              <TrendingUp color="success" /> : 
                              <TrendingDown color="error" />
                            }
                          </ListItemIcon>
                          <ListItemText
                            primary={`${action.action.toUpperCase()} ${action.asset}`}
                            secondary={`Target: ${formatPercentage(action.targetWeight * 100)} (Current: ${formatPercentage(action.currentWeight * 100)})`}
                          />
                          <Chip
                            label={action.priority}
                            size="small"
                            color={action.priority === 'high' ? 'error' : 'warning'}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Portfolio is already well-optimized
                    </Typography>
                  )}
                </Grid>
              </Grid>
            ) : (
              <Alert severity="info">
                Click "Optimize Portfolio" to analyze and receive optimization recommendations
              </Alert>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" display="flex" alignItems="center">
          <Assessment sx={{ mr: 2 }} />
          Performance Analytics
        </Typography>
        <Box>
          <FormControl size="small" sx={{ mr: 2, minWidth: 120 }}>
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <MenuItem value="7d">7 Days</MenuItem>
              <MenuItem value="30d">30 Days</MenuItem>
              <MenuItem value="90d">90 Days</MenuItem>
              <MenuItem value="1y">1 Year</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={handleExportData}
            startIcon={<Download />}
            sx={{ mr: 1 }}
          >
            Export
          </Button>
          <IconButton onClick={loadAnalyticsData} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Performance Alerts */}
      {performanceAlerts.length > 0 && (
        <Box mb={3}>
          {performanceAlerts.map((alert, index) => (
            <Alert
              key={index}
              severity={alert.type}
              sx={{ mb: 1 }}
              icon={
                alert.severity === 'high' ? <Warning /> :
                alert.severity === 'medium' ? <Info /> : <CheckCircle />
              }
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* Loading State */}
      {loading && (
        <Box mb={3}>
          <LinearProgress />
        </Box>
      )}

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, value) => setActiveTab(value)}>
          <Tab label="Performance Overview" icon={<ShowChart />} />
          <Tab label="Risk Analysis" icon={<Security />} />
          <Tab label="Benchmark Comparison" icon={<CompareArrows />} />
          <Tab label="Portfolio Optimization" icon={<AnalyticsIcon />} />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && renderPerformanceOverview()}
      {activeTab === 1 && renderRiskAnalysis()}
      {activeTab === 2 && renderBenchmarkComparison()}
      {activeTab === 3 && renderOptimization()}

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Export Analytics Data</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Choose the format for exporting your analytics data:
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              onClick={() => exportAnalytics('json')}
              startIcon={<Download />}
            >
              Export JSON
            </Button>
            <Button
              variant="outlined"
              onClick={() => exportAnalytics('csv')}
              startIcon={<Download />}
            >
              Export CSV
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PerformanceAnalyzer;