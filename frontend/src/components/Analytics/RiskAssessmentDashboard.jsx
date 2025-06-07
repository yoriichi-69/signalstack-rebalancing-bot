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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Gauge
} from '@mui/material';
import {
  Security,
  Warning,
  Error,
  CheckCircle,
  Timeline,
  ShowChart,
  Assessment,
  Speed,
  TrendingDown,
  TrendingUp,
  Shield,
  Notifications,
  Settings,
  PlayArrow,
  Stop,
  Refresh,
  ExpandMore,
  Science,
  Psychology,
  MonetizationOn,
  AccountBalance,
  SwapHoriz,
  FlashOn
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
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ReferenceLine,
  ComposedChart
} from 'recharts';
import RiskAssessmentService from '../../services/RiskAssessmentService';
import { formatCurrency, formatPercentage, formatTime } from '../../utils/formatters';

const RiskAssessmentDashboard = ({ portfolioData, onRiskLimitUpdate }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [stressTestResults, setStressTestResults] = useState(null);
  const [monteCarloResults, setMonteCarloResults] = useState(null);
  const [riskLimits, setRiskLimits] = useState({
    maxDrawdown: 15,
    varLimit: 100000,
    concentrationLimit: 25,
    leverageLimit: 2.0
  });
  const [scenarioTestOpen, setScenarioTestOpen] = useState(false);
  const [customScenario, setCustomScenario] = useState({
    name: '',
    ethPriceChange: -30,
    btcPriceChange: -25,
    defiTvlChange: -40,
    gasMultiplier: 3,
    duration: 7
  });
  const [riskAlerts, setRiskAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [realTimeMonitoring, setRealTimeMonitoring] = useState(true);

  // Predefined stress test scenarios
  const stressScenarios = {
    crypto_crash: {
      name: 'Crypto Market Crash',
      description: '2018-style bear market scenario',
      parameters: {
        ethPriceChange: -85,
        btcPriceChange: -80,
        defiTvlChange: -70,
        correlationIncrease: 0.3,
        volatilityMultiplier: 2.5
      }
    },
    defi_exploit: {
      name: 'Major DeFi Exploit',
      description: 'Smart contract vulnerability impact',
      parameters: {
        protocolFailure: 'random',
        liquidityDrain: -60,
        contagionEffect: 0.4,
        gasSpike: 10
      }
    },
    flash_crash: {
      name: 'Flash Crash Event',
      description: 'Rapid price decline with recovery',
      parameters: {
        initialDrop: -40,
        recoveryTime: 2,
        liquidityDrop: -80,
        slippageIncrease: 5
      }
    },
    regulatory_crackdown: {
      name: 'Regulatory Crackdown',
      description: 'Government intervention scenario',
      parameters: {
        exchangeRestrictions: 0.7,
        stablecoinDepeg: -5,
        defiRestrictions: 0.5,
        tradingVolumeDrop: -60
      }
    },
    black_swan: {
      name: 'Black Swan Event',
      description: 'Extreme tail risk scenario',
      parameters: {
        allAssetCorrelation: 0.95,
        extremeVolatility: 5,
        liquidityEvaporation: -90,
        systemicRisk: 0.8
      }
    }
  };

  useEffect(() => {
    if (portfolioData) {
      loadRiskAssessment();
      if (realTimeMonitoring) {
        const interval = setInterval(loadRiskAssessment, 30000); // Update every 30 seconds
        return () => clearInterval(interval);
      }
    }
  }, [portfolioData, realTimeMonitoring]);

  const loadRiskAssessment = async () => {
    try {
      setLoading(true);
      
      // Load comprehensive risk metrics
      const risk = await RiskAssessmentService.calculateAdvancedRisk(portfolioData);
      setRiskMetrics(risk);
      
      // Check risk limit violations
      const alerts = checkRiskLimits(risk);
      setRiskAlerts(alerts);
      
    } catch (error) {
      console.error('Failed to load risk assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const runStressTest = async (scenarioKey) => {
    try {
      setLoading(true);
      const scenario = stressScenarios[scenarioKey];
      const results = await RiskAssessmentService.runStressTest(portfolioData, scenario);
      setStressTestResults(results);
    } catch (error) {
      console.error('Failed to run stress test:', error);
    } finally {
      setLoading(false);
    }
  };

  const runMonteCarloSimulation = async () => {
    try {
      setLoading(true);
      const results = await RiskAssessmentService.runMonteCarloSimulation(portfolioData, {
        iterations: 10000,
        timeHorizon: 252, // 1 year in trading days
        confidenceLevels: [0.05, 0.01, 0.001]
      });
      setMonteCarloResults(results);
    } catch (error) {
      console.error('Failed to run Monte Carlo simulation:', error);
    } finally {
      setLoading(false);
    }
  };

  const runCustomScenario = async () => {
    try {
      setLoading(true);
      const results = await RiskAssessmentService.runCustomScenario(portfolioData, customScenario);
      setStressTestResults(results);
      setScenarioTestOpen(false);
    } catch (error) {
      console.error('Failed to run custom scenario:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRiskLimits = (risk) => {
    const alerts = [];
    
    if (risk.maxDrawdown > riskLimits.maxDrawdown) {
      alerts.push({
        type: 'error',
        category: 'drawdown',
        message: `Max drawdown (${formatPercentage(risk.maxDrawdown)}) exceeds limit (${formatPercentage(riskLimits.maxDrawdown)})`,
        severity: 'high'
      });
    }
    
    if (risk.portfolioVaR > riskLimits.varLimit) {
      alerts.push({
        type: 'warning',
        category: 'var',
        message: `Portfolio VaR (${formatCurrency(risk.portfolioVaR)}) exceeds limit (${formatCurrency(riskLimits.varLimit)})`,
        severity: 'medium'
      });
    }
    
    if (risk.concentrationRisk * 100 > riskLimits.concentrationLimit) {
      alerts.push({
        type: 'warning',
        category: 'concentration',
        message: `Concentration risk (${formatPercentage(risk.concentrationRisk * 100)}) exceeds limit (${formatPercentage(riskLimits.concentrationLimit)})`,
        severity: 'medium'
      });
    }
    
    if (risk.leverageRisk > riskLimits.leverageLimit) {
      alerts.push({
        type: 'error',
        category: 'leverage',
        message: `Leverage ratio (${risk.leverageRisk.toFixed(2)}x) exceeds limit (${riskLimits.leverageLimit}x)`,
        severity: 'high'
      });
    }
    
    return alerts;
  };

  const getRiskColor = (value, thresholds) => {
    if (value >= thresholds.high) return 'error';
    if (value >= thresholds.medium) return 'warning';
    return 'success';
  };

  const renderRiskOverview = () => (
    <Grid container spacing={3}>
      {/* Risk Score */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>
                Overall Risk Score
              </Typography>
              <Box position="relative" display="inline-flex">
                <CircularProgress
                  variant="determinate"
                  value={riskMetrics?.overallRiskScore || 0}
                  size={120}
                  thickness={8}
                  color={getRiskColor(riskMetrics?.overallRiskScore || 0, { high: 70, medium: 40 })}
                />
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  bottom={0}
                  right={0}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Typography variant="h4" component="div" color="text.secondary">
                    {Math.round(riskMetrics?.overallRiskScore || 0)}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {riskMetrics?.overallRiskScore < 40 ? 'Low Risk' :
                 riskMetrics?.overallRiskScore < 70 ? 'Medium Risk' : 'High Risk'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Risk Metrics Grid */}
      <Grid item xs={12} md={8}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="error.main">
                  {formatCurrency(riskMetrics?.portfolioVaR || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Daily VaR (95%)
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((riskMetrics?.portfolioVaR || 0) / riskLimits.varLimit * 100, 100)}
                  color={getRiskColor((riskMetrics?.portfolioVaR || 0) / riskLimits.varLimit, { high: 0.8, medium: 0.6 })}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {formatPercentage(riskMetrics?.maxDrawdown || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Max Drawdown
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((riskMetrics?.maxDrawdown || 0) / riskLimits.maxDrawdown * 100, 100)}
                  color={getRiskColor((riskMetrics?.maxDrawdown || 0) / riskLimits.maxDrawdown, { high: 0.8, medium: 0.6 })}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {formatPercentage((riskMetrics?.concentrationRisk || 0) * 100)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Concentration
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((riskMetrics?.concentrationRisk || 0) * 100 / riskLimits.concentrationLimit * 100, 100)}
                  color={getRiskColor((riskMetrics?.concentrationRisk || 0) * 100 / riskLimits.concentrationLimit, { high: 0.8, medium: 0.6 })}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="secondary.main">
                  {riskMetrics?.leverageRisk?.toFixed(2) || '0.00'}x
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Leverage Ratio
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((riskMetrics?.leverageRisk || 0) / riskLimits.leverageLimit * 100, 100)}
                  color={getRiskColor((riskMetrics?.leverageRisk || 0) / riskLimits.leverageLimit, { high: 0.8, medium: 0.6 })}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Risk Breakdown Chart */}
      <Grid item xs={12} lg={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Risk Factor Analysis
            </Typography>
            {riskMetrics && (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={[
                  { factor: 'Market Risk', value: riskMetrics.marketRisk * 100, fullMark: 100 },
                  { factor: 'Liquidity Risk', value: riskMetrics.liquidityRisk * 100, fullMark: 100 },
                  { factor: 'Credit Risk', value: riskMetrics.creditRisk * 100, fullMark: 100 },
                  { factor: 'Operational Risk', value: riskMetrics.operationalRisk * 100, fullMark: 100 },
                  { factor: 'Concentration Risk', value: riskMetrics.concentrationRisk * 100, fullMark: 100 },
                  { factor: 'Leverage Risk', value: Math.min(riskMetrics.leverageRisk * 50, 100), fullMark: 100 }
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="factor" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Risk Level"
                    dataKey="value"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Risk Alerts */}
      <Grid item xs={12} lg={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
              <Warning sx={{ mr: 1 }} />
              Risk Alerts ({riskAlerts.length})
            </Typography>
            {riskAlerts.length === 0 ? (
              <Box textAlign="center" py={3}>
                <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="body2" color="success.main">
                  All risk limits within acceptable ranges
                </Typography>
              </Box>
            ) : (
              <List dense>
                {riskAlerts.map((alert, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {alert.type === 'error' ? 
                        <Error color="error" /> : 
                        <Warning color="warning" />
                      }
                    </ListItemIcon>
                    <ListItemText
                      primary={alert.message}
                      secondary={`Category: ${alert.category} • Severity: ${alert.severity}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderStressTesting = () => (
    <Grid container spacing={3}>
      {/* Stress Test Scenarios */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Stress Test Scenarios
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  onClick={() => setScenarioTestOpen(true)}
                  startIcon={<Science />}
                  sx={{ mr: 1 }}
                >
                  Custom Scenario
                </Button>
                <Button
                  variant="contained"
                  onClick={runMonteCarloSimulation}
                  startIcon={<Psychology />}
                  disabled={loading}
                >
                  Monte Carlo
                </Button>
              </Box>
            </Box>
            
            <Grid container spacing={2}>
              {Object.entries(stressScenarios).map(([key, scenario]) => (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <Card 
                    variant="outlined"
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 2 },
                      border: stressTestResults?.scenarioName === scenario.name ? '2px solid #1976d2' : undefined
                    }}
                    onClick={() => runStressTest(key)}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {scenario.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {scenario.description}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Chip
                          label={key === 'black_swan' ? 'Extreme' : key === 'crypto_crash' ? 'Severe' : 'Moderate'}
                          size="small"
                          color={key === 'black_swan' ? 'error' : key === 'crypto_crash' ? 'warning' : 'info'}
                        />
                        <IconButton size="small" disabled={loading}>
                          <PlayArrow />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Stress Test Results */}
      {stressTestResults && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stress Test Results: {stressTestResults.scenarioName}
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" color="error.main" gutterBottom>
                    Impact Summary
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Portfolio Value Impact</TableCell>
                        <TableCell align="right">
                          <span style={{ color: stressTestResults.portfolioImpact >= 0 ? '#2e7d32' : '#d32f2f' }}>
                            {formatPercentage(stressTestResults.portfolioImpact)}
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Estimated Loss (USD)</TableCell>
                        <TableCell align="right" style={{ color: '#d32f2f' }}>
                          {formatCurrency(Math.abs(stressTestResults.estimatedLoss || 0))}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Recovery Time (days)</TableCell>
                        <TableCell align="right">
                          {stressTestResults.recoveryTime || 'Unknown'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Liquidity Impact</TableCell>
                        <TableCell align="right">
                          {formatPercentage(stressTestResults.liquidityImpact || 0)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Asset-Level Impact
                  </Typography>
                  {stressTestResults.assetImpacts && (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={Object.entries(stressTestResults.assetImpacts).map(([asset, impact]) => ({
                        asset,
                        impact: impact * 100
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="asset" />
                        <YAxis />
                        <RechartsTooltip formatter={(value) => `${value.toFixed(2)}%`} />
                        <Bar dataKey="impact" fill="#ff7300" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Grid>
              </Grid>
              
              {stressTestResults.recommendations && (
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>
                    Risk Mitigation Recommendations
                  </Typography>
                  <List>
                    {stressTestResults.recommendations.map((rec, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Shield color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Monte Carlo Results */}
      {monteCarloResults && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monte Carlo Simulation Results (10,000 iterations)
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monteCarloResults.distributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="return" tickFormatter={(value) => `${value}%`} />
                      <YAxis />
                      <RechartsTooltip 
                        labelFormatter={(value) => `Return: ${value}%`}
                        formatter={(value) => [`${value}`, 'Probability']}
                      />
                      <Area
                        type="monotone"
                        dataKey="probability"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                      />
                      <ReferenceLine 
                        x={monteCarloResults.var95} 
                        stroke="red" 
                        strokeDasharray="2 2"
                        label="95% VaR"
                      />
                      <ReferenceLine 
                        x={monteCarloResults.var99} 
                        stroke="darkred" 
                        strokeDasharray="2 2"
                        label="99% VaR"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>
                    Risk Metrics (1 Year)
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Expected Return</TableCell>
                        <TableCell align="right">
                          {formatPercentage(monteCarloResults.expectedReturn)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Volatility</TableCell>
                        <TableCell align="right">
                          {formatPercentage(monteCarloResults.volatility)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>VaR (95%)</TableCell>
                        <TableCell align="right" style={{ color: '#d32f2f' }}>
                          {formatPercentage(monteCarloResults.var95)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>VaR (99%)</TableCell>
                        <TableCell align="right" style={{ color: '#d32f2f' }}>
                          {formatPercentage(monteCarloResults.var99)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Expected Shortfall</TableCell>
                        <TableCell align="right" style={{ color: '#d32f2f' }}>
                          {formatPercentage(monteCarloResults.expectedShortfall)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Probability of Loss</TableCell>
                        <TableCell align="right">
                          {formatPercentage(monteCarloResults.probOfLoss)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  const renderRiskLimits = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Risk Limit Configuration
            </Typography>
            
            <Box mb={3}>
              <Typography gutterBottom>
                Maximum Drawdown: {formatPercentage(riskLimits.maxDrawdown)}
              </Typography>
              <Slider
                value={riskLimits.maxDrawdown}
                onChange={(e, value) => setRiskLimits(prev => ({ ...prev, maxDrawdown: value }))}
                min={5}
                max={50}
                step={1}
                marks={[
                  { value: 10, label: '10%' },
                  { value: 25, label: '25%' },
                  { value: 40, label: '40%' }
                ]}
              />
            </Box>
            
            <Box mb={3}>
              <Typography gutterBottom>
                VaR Limit: {formatCurrency(riskLimits.varLimit)}
              </Typography>
              <Slider
                value={riskLimits.varLimit}
                onChange={(e, value) => setRiskLimits(prev => ({ ...prev, varLimit: value }))}
                min={10000}
                max={500000}
                step={10000}
                marks={[
                  { value: 50000, label: '$50K' },
                  { value: 150000, label: '$150K' },
                  { value: 300000, label: '$300K' }
                ]}
              />
            </Box>
            
            <Box mb={3}>
              <Typography gutterBottom>
                Concentration Limit: {formatPercentage(riskLimits.concentrationLimit)}
              </Typography>
              <Slider
                value={riskLimits.concentrationLimit}
                onChange={(e, value) => setRiskLimits(prev => ({ ...prev, concentrationLimit: value }))}
                min={10}
                max={80}
                step={5}
                marks={[
                  { value: 20, label: '20%' },
                  { value: 40, label: '40%' },
                  { value: 60, label: '60%' }
                ]}
              />
            </Box>
            
            <Box mb={3}>
              <Typography gutterBottom>
                Maximum Leverage: {riskLimits.leverageLimit}x
              </Typography>
              <Slider
                value={riskLimits.leverageLimit}
                onChange={(e, value) => setRiskLimits(prev => ({ ...prev, leverageLimit: value }))}
                min={1}
                max={10}
                step={0.5}
                marks={[
                  { value: 2, label: '2x' },
                  { value: 5, label: '5x' },
                  { value: 8, label: '8x' }
                ]}
              />
            </Box>
            
            <Button
              variant="contained"
              onClick={() => onRiskLimitUpdate(riskLimits)}
              fullWidth
            >
              Update Risk Limits
            </Button>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Real-time Monitoring
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={realTimeMonitoring}
                  onChange={(e) => setRealTimeMonitoring(e.target.checked)}
                />
              }
              label="Enable Real-time Risk Monitoring"
            />
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
              Monitor portfolio risk metrics every 30 seconds and receive instant alerts when limits are breached.
            </Typography>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Alert Preferences
            </Typography>
            
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Email Notifications"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Push Notifications"
            />
            <FormControlLabel
              control={<Switch />}
              label="SMS Alerts (High Risk Only)"
            />
            
            <Box mt={3}>
              <Alert severity="info">
                <strong>Risk Monitoring Status:</strong> {realTimeMonitoring ? 'Active' : 'Inactive'}
                <br />
                Last updated: {formatTime(Date.now())}
              </Alert>
            </Box>
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
          <Security sx={{ mr: 2 }} />
          Risk Assessment Dashboard
        </Typography>
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={realTimeMonitoring}
                onChange={(e) => setRealTimeMonitoring(e.target.checked)}
              />
            }
            label="Real-time Monitoring"
          />
          <IconButton onClick={loadRiskAssessment} disabled={loading} sx={{ ml: 1 }}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box mb={3}>
          <LinearProgress />
        </Box>
      )}

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, value) => setActiveTab(value)}>
          <Tab label="Risk Overview" icon={<Assessment />} />
          <Tab label="Stress Testing" icon={<Science />} />
          <Tab label="Risk Limits" icon={<Settings />} />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && renderRiskOverview()}
      {activeTab === 1 && renderStressTesting()}
      {activeTab === 2 && renderRiskLimits()}

      {/* Custom Scenario Dialog */}
      <Dialog open={scenarioTestOpen} onClose={() => setScenarioTestOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Custom Stress Test Scenario</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Scenario Name"
                value={customScenario.name}
                onChange={(e) => setCustomScenario(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={6}>
              <Typography gutterBottom>
                ETH Price Change: {formatPercentage(customScenario.ethPriceChange)}
              </Typography>
              <Slider
                value={customScenario.ethPriceChange}
                onChange={(e, value) => setCustomScenario(prev => ({ ...prev, ethPriceChange: value }))}
                min={-90}
                max={50}
                step={5}
                marks={[
                  { value: -50, label: '-50%' },
                  { value: 0, label: '0%' },
                  { value: 25, label: '+25%' }
                ]}
              />
            </Grid>
            
            <Grid item xs={6}>
              <Typography gutterBottom>
                BTC Price Change: {formatPercentage(customScenario.btcPriceChange)}
              </Typography>
              <Slider
                value={customScenario.btcPriceChange}
                onChange={(e, value) => setCustomScenario(prev => ({ ...prev, btcPriceChange: value }))}
                min={-90}
                max={50}
                step={5}
                marks={[
                  { value: -50, label: '-50%' },
                  { value: 0, label: '0%' },
                  { value: 25, label: '+25%' }
                ]}
              />
            </Grid>
            
            <Grid item xs={6}>
              <Typography gutterBottom>
                DeFi TVL Change: {formatPercentage(customScenario.defiTvlChange)}
              </Typography>
              <Slider
                value={customScenario.defiTvlChange}
                onChange={(e, value) => setCustomScenario(prev => ({ ...prev, defiTvlChange: value }))}
                min={-80}
                max={100}
                step={5}
                marks={[
                  { value: -40, label: '-40%' },
                  { value: 0, label: '0%' },
                  { value: 50, label: '+50%' }
                ]}
              />
            </Grid>
            
            <Grid item xs={6}>
              <Typography gutterBottom>
                Gas Price Multiplier: {customScenario.gasMultiplier}x
              </Typography>
              <Slider
                value={customScenario.gasMultiplier}
                onChange={(e, value) => setCustomScenario(prev => ({ ...prev, gasMultiplier: value }))}
                min={0.5}
                max={10}
                step={0.5}
                marks={[
                  { value: 1, label: '1x' },
                  { value: 3, label: '3x' },
                  { value: 7, label: '7x' }
                ]}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Scenario Duration (days)"
                type="number"
                value={customScenario.duration}
                onChange={(e) => setCustomScenario(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                inputProps={{ min: 1, max: 365 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScenarioTestOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={runCustomScenario}
            disabled={loading || !customScenario.name}
          >
            Run Scenario
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RiskAssessmentDashboard;