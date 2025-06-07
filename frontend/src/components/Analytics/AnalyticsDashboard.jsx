import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DatePicker,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  ShowChart,
  PieChart,
  Download,
  Refresh,
  Timeline,
  AccountBalance,
  Security,
  Speed,
  Warning,
  Info,
  FilterList,
  DateRange
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
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  BarChart,
  Bar,
  ComposedChart,
  ScatterChart,
  Scatter
} from 'recharts';
import AnalyticsService from '../../services/AnalyticsService';
import PerformanceAnalyzer from './PerformanceAnalyzer';
import RiskAssessment from './RiskAssessment';
import PortfolioOptimizer from './PortfolioOptimizer';
import ReportGenerator from './ReportGenerator';
import { formatCurrency, formatPercentage, formatTime } from '../../utils/formatters';

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('7d');
  const [analytics, setAnalytics] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [portfolioOptimization, setPortfolioOptimization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filters, setFilters] = useState({
    strategies: 'all',
    chains: 'all',
    protocols: 'all',
    riskLevel: 'all'
  });

  // Chart colors
  const COLORS = {
    primary: '#667eea',
    secondary: '#764ba2',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3'
  };

  const CHART_COLORS = ['#667eea', '#764ba2', '#4caf50', '#ff9800', '#f44336', '#2196f3', '#9c27b0', '#00bcd4'];

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, filters]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadAnalyticsData();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [autoRefresh, timeRange, filters]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Load comprehensive analytics
      const analyticsData = await AnalyticsService.getPortfolioAnalytics(timeRange, filters);
      setAnalytics(analyticsData);

      // Load performance data for charts
      const performance = await AnalyticsService.getPerformanceHistory(timeRange);
      setPerformanceData(performance);

      // Load risk metrics
      const risk = await AnalyticsService.getRiskAssessment();
      setRiskMetrics(risk);

      // Load portfolio optimization suggestions
      const optimization = await AnalyticsService.getPortfolioOptimization();
      setPortfolioOptimization(optimization);

    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (format = 'pdf') => {
    try {
      const report = await AnalyticsService.generateReport(timeRange, filters, format);
      // Trigger download
      const blob = new Blob([report], { type: format === 'pdf' ? 'application/pdf' : 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `defi-portfolio-report-${timeRange}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const renderOverviewMetrics = () => {
    if (!analytics) return null;

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="metric-card">
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {formatCurrency(analytics.totalValue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Portfolio Value
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    {analytics.valueChange24h >= 0 ? (
                      <TrendingUp color="success" sx={{ mr: 0.5 }} />
                    ) : (
                      <TrendingDown color="error" sx={{ mr: 0.5 }} />
                    )}
                    <Typography 
                      variant="body2" 
                      color={analytics.valueChange24h >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="bold"
                    >
                      {formatPercentage(Math.abs(analytics.valueChange24h))} (24h)
                    </Typography>
                  </Box>
                </Box>
                <AccountBalance sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="metric-card">
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {formatPercentage(analytics.totalAPY)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Portfolio APY
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Expected: {formatCurrency(analytics.expectedAnnualYield)}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="metric-card">
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    {analytics.riskScore}/100
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Risk Score
                  </Typography>
                  <Chip
                    label={analytics.riskLevel}
                    size="small"
                    color={
                      analytics.riskLevel === 'Low' ? 'success' :
                      analytics.riskLevel === 'Medium' ? 'warning' : 'error'
                    }
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Security sx={{ fontSize: 40, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="metric-card">
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {analytics.activeStrategies}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Strategies
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Success Rate: {formatPercentage(analytics.successRate)}
                  </Typography>
                </Box>
                <Assessment sx={{ fontSize: 40, color: 'info.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderPerformanceChart = () => {
    if (!performanceData.length) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Portfolio Performance
          </Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value, name) => [
                    name === 'value' ? formatCurrency(value) : formatPercentage(value),
                    name === 'value' ? 'Portfolio Value' : 'APY'
                  ]}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="value"
                  fill={COLORS.primary}
                  fillOpacity={0.3}
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  name="Portfolio Value"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="apy"
                  stroke={COLORS.success}
                  strokeWidth={2}
                  dot={false}
                  name="APY %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderAllocationCharts = () => {
    if (!analytics) return null;

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Strategy Allocation
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={analytics.strategyAllocation}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.strategyAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chain Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.chainDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="value" fill={COLORS.secondary} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderRiskBreakdown = () => {
    if (!riskMetrics) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Risk Assessment
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Smart Contract Risk
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={riskMetrics.smartContractRisk}
                  color={riskMetrics.smartContractRisk > 70 ? 'error' : riskMetrics.smartContractRisk > 40 ? 'warning' : 'success'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {riskMetrics.smartContractRisk}% - {riskMetrics.smartContractRisk > 70 ? 'High' : riskMetrics.smartContractRisk > 40 ? 'Medium' : 'Low'} Risk
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Impermanent Loss Risk
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={riskMetrics.impermanentLossRisk}
                  color={riskMetrics.impermanentLossRisk > 70 ? 'error' : riskMetrics.impermanentLossRisk > 40 ? 'warning' : 'success'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {riskMetrics.impermanentLossRisk}% - Current IL: {formatPercentage(riskMetrics.currentIL)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Liquidity Risk
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={riskMetrics.liquidityRisk}
                  color={riskMetrics.liquidityRisk > 70 ? 'error' : riskMetrics.liquidityRisk > 40 ? 'warning' : 'success'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {riskMetrics.liquidityRisk}% - Market depth analysis
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Market Risk (Volatility)
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={riskMetrics.marketRisk}
                  color={riskMetrics.marketRisk > 70 ? 'error' : riskMetrics.marketRisk > 40 ? 'warning' : 'success'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {riskMetrics.marketRisk}% - 30d volatility: {formatPercentage(riskMetrics.volatility30d)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Concentration Risk
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={riskMetrics.concentrationRisk}
                  color={riskMetrics.concentrationRisk > 70 ? 'error' : riskMetrics.concentrationRisk > 40 ? 'warning' : 'success'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {riskMetrics.concentrationRisk}% - Portfolio diversification
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Counterparty Risk
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={riskMetrics.counterpartyRisk}
                  color={riskMetrics.counterpartyRisk > 70 ? 'error' : riskMetrics.counterpartyRisk > 40 ? 'warning' : 'success'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {riskMetrics.counterpartyRisk}% - Protocol security assessment
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {riskMetrics.recommendations.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Risk Mitigation Recommendations
              </Typography>
              {riskMetrics.recommendations.map((rec, index) => (
                <Alert 
                  key={index} 
                  severity={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'info'}
                  sx={{ mb: 1 }}
                >
                  <Typography variant="body2">
                    <strong>{rec.title}:</strong> {rec.description}
                  </Typography>
                </Alert>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderTopPerformers = () => {
    if (!analytics?.topPerformers) return null;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Top Performing Strategies
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Strategy</TableCell>
                  <TableCell align="right">Return</TableCell>
                  <TableCell align="right">APY</TableCell>
                  <TableCell align="center">Risk</TableCell>
                  <TableCell align="right">Sharpe Ratio</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analytics.topPerformers.map((strategy, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {strategy.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {strategy.protocol} • {strategy.pair}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        color={strategy.return >= 0 ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {strategy.return >= 0 ? '+' : ''}{formatPercentage(strategy.return)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {formatPercentage(strategy.apy)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={strategy.riskLevel}
                        size="small"
                        color={
                          strategy.riskLevel === 'Low' ? 'success' :
                          strategy.riskLevel === 'Medium' ? 'warning' : 'error'
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {strategy.sharpeRatio.toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading portfolio analytics...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" display="flex" alignItems="center">
          <Assessment sx={{ mr: 2 }} />
          Portfolio Analytics
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="24h">24 Hours</MenuItem>
              <MenuItem value="7d">7 Days</MenuItem>
              <MenuItem value="30d">30 Days</MenuItem>
              <MenuItem value="90d">90 Days</MenuItem>
              <MenuItem value="1y">1 Year</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto Refresh"
          />

          <Button
            variant="outlined"
            onClick={() => handleExportReport('pdf')}
            startIcon={<Download />}
          >
            Export PDF
          </Button>

          <IconButton onClick={loadAnalyticsData}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center">
            <FilterList sx={{ mr: 1 }} />
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Strategies</InputLabel>
                <Select
                  value={filters.strategies}
                  onChange={(e) => setFilters(prev => ({ ...prev, strategies: e.target.value }))}
                >
                  <MenuItem value="all">All Strategies</MenuItem>
                  <MenuItem value="yield_farming">Yield Farming</MenuItem>
                  <MenuItem value="liquidity">Liquidity Providing</MenuItem>
                  <MenuItem value="flash_loans">Flash Loans</MenuItem>
                  <MenuItem value="arbitrage">Arbitrage</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Chains</InputLabel>
                <Select
                  value={filters.chains}
                  onChange={(e) => setFilters(prev => ({ ...prev, chains: e.target.value }))}
                >
                  <MenuItem value="all">All Chains</MenuItem>
                  <MenuItem value="ethereum">Ethereum</MenuItem>
                  <MenuItem value="polygon">Polygon</MenuItem>
                  <MenuItem value="bsc">BSC</MenuItem>
                  <MenuItem value="arbitrum">Arbitrum</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Protocols</InputLabel>
                <Select
                  value={filters.protocols}
                  onChange={(e) => setFilters(prev => ({ ...prev, protocols: e.target.value }))}
                >
                  <MenuItem value="all">All Protocols</MenuItem>
                  <MenuItem value="uniswap">Uniswap</MenuItem>
                  <MenuItem value="aave">Aave</MenuItem>
                  <MenuItem value="compound">Compound</MenuItem>
                  <MenuItem value="curve">Curve</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Risk Level</InputLabel>
                <Select
                  value={filters.riskLevel}
                  onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
                >
                  <MenuItem value="all">All Risk Levels</MenuItem>
                  <MenuItem value="low">Low Risk</MenuItem>
                  <MenuItem value="medium">Medium Risk</MenuItem>
                  <MenuItem value="high">High Risk</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, value) => setActiveTab(value)}>
          <Tab label="Overview" />
          <Tab label="Performance" />
          <Tab label="Risk Analysis" />
          <Tab label="Optimization" />
          <Tab label="Reports" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {renderOverviewMetrics()}
          {renderPerformanceChart()}
          {renderAllocationCharts()}
          {renderTopPerformers()}
        </Box>
      )}

      {activeTab === 1 && (
        <PerformanceAnalyzer 
          performanceData={performanceData}
          analytics={analytics}
          timeRange={timeRange}
        />
      )}

      {activeTab === 2 && (
        <Box>
          {renderRiskBreakdown()}
          <RiskAssessment 
            riskMetrics={riskMetrics}
            analytics={analytics}
          />
        </Box>
      )}

      {activeTab === 3 && (
        <PortfolioOptimizer 
          optimization={portfolioOptimization}
          analytics={analytics}
          onOptimizationApply={loadAnalyticsData}
        />
      )}

      {activeTab === 4 && (
        <ReportGenerator 
          analytics={analytics}
          performanceData={performanceData}
          riskMetrics={riskMetrics}
          timeRange={timeRange}
          onExport={handleExportReport}
        />
      )}
    </Box>
  );
};

export default AnalyticsDashboard;