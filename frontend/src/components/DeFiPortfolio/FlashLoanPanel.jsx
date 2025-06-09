import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Switch,
  FormControlLabel,
  Slider
} from '@mui/material';
import {
  Flash,
  TrendingUp,
  Security,
  Speed,
  Warning,
  PlayArrow,
  Stop,
  Refresh,
  ExpandMore,
  Info,
  Assessment,
  Timeline,
  MonetizationOn,
  SwapHoriz,
  AccountBalance,
  Build,
  Science
} from '@mui/icons-material';
import FlashLoanService from '../../services/FlashLoanService';
import { formatCurrency, formatPercentage, formatTime } from '../../utils/formatters';

const FlashLoanPanel = ({ opportunities, onStrategyExecute }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [strategyBuilderOpen, setStrategyBuilderOpen] = useState(false);
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false);
  const [flashLoanStats, setFlashLoanStats] = useState(null);
  const [customStrategy, setCustomStrategy] = useState({
    type: 'arbitrage',
    steps: [],
    parameters: {},
    riskLevel: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(null);
  const [simulationResults, setSimulationResults] = useState(null);

  // Strategy templates
  const strategyTemplates = {
    arbitrage: {
      name: 'DEX Arbitrage',
      description: 'Profit from price differences between DEXs',
      steps: ['borrow', 'buy_low', 'sell_high', 'repay'],
      minProfit: 50,
      riskLevel: 'medium'
    },
    liquidation: {
      name: 'Liquidation Bot',
      description: 'Liquidate undercollateralized positions',
      steps: ['borrow', 'liquidate', 'sell_collateral', 'repay'],
      minProfit: 100,
      riskLevel: 'high'
    },
    yield_arbitrage: {
      name: 'Yield Arbitrage',
      description: 'Exploit yield rate differences across protocols',
      steps: ['borrow', 'deposit_high_yield', 'withdraw_low_yield', 'repay'],
      minProfit: 25,
      riskLevel: 'low'
    },
    collateral_swap: {
      name: 'Collateral Swap',
      description: 'Swap collateral types without liquidation risk',
      steps: ['borrow', 'repay_position', 'swap_collateral', 'reopen_position'],
      minProfit: 10,
      riskLevel: 'low'
    }
  };

  useEffect(() => {
    loadFlashLoanData();
  }, []);

  const loadFlashLoanData = async () => {
    try {
      const stats = await FlashLoanService.getFlashLoanStats();
      setFlashLoanStats(stats);
    } catch (error) {
      console.error('Failed to load flash loan data:', error);
    }
  };

  const handleOpportunitySelect = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setExecuteDialogOpen(true);
  };

  const handleExecuteStrategy = async () => {
    if (!selectedOpportunity) return;

    try {
      setLoading(true);
      setExecutionProgress({ step: 'preparing', progress: 0 });

      const result = await FlashLoanService.executeFlashLoanStrategy(
        selectedOpportunity,
        {
          progressCallback: setExecutionProgress,
          gasLimit: 2000000,
          maxGasPrice: 100e9, // 100 Gwei
          slippageTolerance: 0.5
        }
      );

      setExecuteDialogOpen(false);
      await onStrategyExecute();
      await loadFlashLoanData();

    } catch (error) {
      console.error('Failed to execute flash loan strategy:', error);
      setExecutionProgress({ step: 'failed', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateStrategy = async (strategy) => {
    try {
      setLoading(true);
      const results = await FlashLoanService.simulateFlashLoanStrategy(strategy);
      setSimulationResults(results);
    } catch (error) {
      console.error('Failed to simulate strategy:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildCustomStrategy = () => {
    setStrategyBuilderOpen(true);
    setCustomStrategy({
      type: 'arbitrage',
      steps: [],
      parameters: {},
      riskLevel: 'medium'
    });
  };

  const getProfitColor = (profit) => {
    if (profit >= 500) return 'success';
    if (profit >= 100) return 'warning';
    return 'default';
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return <Security color="success" />;
      case 'medium': return <Warning color="warning" />;
      case 'high': return <Warning color="error" />;
      default: return <Info />;
    }
  };

  const renderOpportunities = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Flash Loan Opportunities ({opportunities.length})
          </Typography>
          <Box>
            <Button
              variant="outlined"
              onClick={buildCustomStrategy}
              startIcon={<Build />}
              sx={{ mr: 1 }}
            >
              Strategy Builder
            </Button>
            <IconButton onClick={loadFlashLoanData}>
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        {opportunities.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Flash sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No profitable opportunities found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Flash loan opportunities will appear here when market conditions are favorable
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Strategy</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Estimated Profit</TableCell>
                  <TableCell align="right">Gas Cost</TableCell>
                  <TableCell align="right">Net Profit</TableCell>
                  <TableCell align="center">Risk</TableCell>
                  <TableCell align="center">Confidence</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {opportunities.map((opportunity, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {opportunity.type === 'arbitrage' ? 
                            `${opportunity.pair?.token0}-${opportunity.pair?.token1} Arbitrage` :
                            `${opportunity.protocol} Liquidation`
                          }
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {opportunity.type === 'arbitrage' ?
                            `${opportunity.buyDEX} → ${opportunity.sellDEX}` :
                            `Position: ${opportunity.positionId?.slice(0, 8)}...`
                          }
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={opportunity.type}
                        size="small"
                        color={opportunity.type === 'arbitrage' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        {formatCurrency(opportunity.profit || opportunity.estimatedProfit)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(opportunity.gasCost)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={formatCurrency((opportunity.profit || opportunity.estimatedProfit) - opportunity.gasCost)}
                        color={getProfitColor((opportunity.profit || opportunity.estimatedProfit) - opportunity.gasCost)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center">
                        {getRiskIcon(opportunity.riskLevel)}
                        <Typography variant="caption" sx={{ ml: 0.5 }}>
                          {opportunity.riskLevel?.toUpperCase()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center">
                        <LinearProgress
                          variant="determinate"
                          value={opportunity.confidence * 100}
                          sx={{ width: 40, mr: 1 }}
                        />
                        <Typography variant="caption">
                          {Math.round(opportunity.confidence * 100)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Execute Strategy">
                        <IconButton
                          size="small"
                          onClick={() => handleOpportunitySelect(opportunity)}
                          color="primary"
                        >
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Simulate">
                        <IconButton
                          size="small"
                          onClick={() => handleSimulateStrategy(opportunity)}
                        >
                          <Science />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );

  const renderFlashLoanStats = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {flashLoanStats && (
        <>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="primary">
                  {flashLoanStats.totalStrategies}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Strategies
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {formatCurrency(flashLoanStats.totalProfit)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Profit (24h)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {flashLoanStats.successRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Success Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {formatCurrency(flashLoanStats.avgGasCost)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Gas Cost
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </>
      )}
    </Grid>
  );

  const renderStrategyHistory = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Strategy Execution History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Recent flash loan strategy executions and their results
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info">
            Strategy history tracking coming soon...
          </Alert>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" display="flex" alignItems="center">
          <Flash sx={{ mr: 2 }} />
          Flash Loan Strategies
        </Typography>
        <Button
          variant="contained"
          onClick={buildCustomStrategy}
          startIcon={<Build />}
        >
          Build Strategy
        </Button>
      </Box>

      {/* Stats */}
      {renderFlashLoanStats()}

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, value) => setActiveTab(value)}>
          <Tab label="Opportunities" />
          <Tab label="Strategy History" />
        </Tabs>
      </Box>

      {/* Content */}
      {activeTab === 0 && renderOpportunities()}
      {activeTab === 1 && renderStrategyHistory()}

      {/* Execute Strategy Dialog */}
      <Dialog open={executeDialogOpen} onClose={() => setExecuteDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Execute Flash Loan Strategy</DialogTitle>
        <DialogContent>
          {executionProgress ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                {executionProgress.step === 'failed' ? 'Strategy Failed' : 'Executing Strategy...'}
              </Typography>
              {executionProgress.step === 'failed' ? (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {executionProgress.error}
                </Alert>
              ) : (
                <>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {executionProgress.step === 'preparing' && 'Preparing flash loan transaction...'}
                    {executionProgress.step === 'borrowing' && 'Borrowing funds via flash loan...'}
                    {executionProgress.step === 'executing' && 'Executing arbitrage strategy...'}
                    {executionProgress.step === 'repaying' && 'Repaying flash loan...'}
                    {executionProgress.step === 'completed' && 'Strategy executed successfully!'}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={executionProgress.progress || 0} 
                    sx={{ mb: 2 }}
                  />
                </>
              )}
            </Box>
          ) : selectedOpportunity && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You are about to execute a flash loan strategy with the following parameters:
              </Typography>
              
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Strategy Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Strategy Type:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {selectedOpportunity.type?.charAt(0).toUpperCase() + selectedOpportunity.type?.slice(1)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Estimated Profit:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {formatCurrency(selectedOpportunity.profit || selectedOpportunity.estimatedProfit)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Gas Cost:
                      </Typography>
                      <Typography variant="body2">
                        {formatCurrency(selectedOpportunity.gasCost)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Net Profit:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency((selectedOpportunity.profit || selectedOpportunity.estimatedProfit) - selectedOpportunity.gasCost)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {selectedOpportunity.type === 'arbitrage' && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography>Arbitrage Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Trading Pair:</strong> {selectedOpportunity.pair?.token0}-{selectedOpportunity.pair?.token1}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Buy From:</strong> {selectedOpportunity.buyDEX} at {formatCurrency(selectedOpportunity.buyPrice)}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Sell To:</strong> {selectedOpportunity.sellDEX} at {formatCurrency(selectedOpportunity.sellPrice)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Price Difference:</strong> {formatPercentage(selectedOpportunity.priceDifference)}
                      </Typography>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}

              {selectedOpportunity.type === 'liquidation' && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography>Liquidation Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Protocol:</strong> {selectedOpportunity.protocol}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Position ID:</strong> {selectedOpportunity.positionId}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Health Factor:</strong> {selectedOpportunity.healthFactor?.toFixed(3)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Collateral Value:</strong> {formatCurrency(selectedOpportunity.collateralValue)}
                      </Typography>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}

              <Alert 
                severity={selectedOpportunity.riskLevel === 'high' ? 'warning' : 'info'} 
                sx={{ mt: 2 }}
              >
                {selectedOpportunity.riskLevel === 'high' ?
                  'High-risk strategy: Monitor market conditions closely during execution.' :
                  'This strategy has been simulated and shows positive expected returns.'
                }
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!executionProgress && (
            <>
              <Button onClick={() => setExecuteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleExecuteStrategy}
                disabled={loading}
              >
                Execute Strategy
              </Button>
            </>
          )}
          {executionProgress?.step === 'failed' && (
            <Button onClick={() => setExecuteDialogOpen(false)}>
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Strategy Builder Dialog */}
      <Dialog open={strategyBuilderOpen} onClose={() => setStrategyBuilderOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Flash Loan Strategy Builder</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Choose Strategy Template
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(strategyTemplates).map(([key, template]) => (
                <Grid item xs={12} md={6} key={key}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 2 }
                    }}
                    onClick={() => setCustomStrategy({ ...customStrategy, type: key, ...template })}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {template.description}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Chip 
                          label={`Min Profit: ${formatCurrency(template.minProfit)}`}
                          size="small"
                          color="primary"
                        />
                        <Chip
                          label={template.riskLevel}
                          size="small"
                          color={template.riskLevel === 'low' ? 'success' : template.riskLevel === 'medium' ? 'warning' : 'error'}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStrategyBuilderOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" disabled>
            Build Strategy (Coming Soon)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Simulation Results Dialog */}
      <Dialog open={!!simulationResults} onClose={() => setSimulationResults(null)} maxWidth="md" fullWidth>
        <DialogTitle>Strategy Simulation Results</DialogTitle>
        <DialogContent>
          {simulationResults && (
            <Box>
              <Alert 
                severity={simulationResults.success ? 'success' : 'error'}
                sx={{ mb: 2 }}
              >
                Simulation {simulationResults.success ? 'Successful' : 'Failed'}
              </Alert>
              
              <Typography variant="h6" gutterBottom>
                Expected Results:
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Estimated Profit"
                    secondary={formatCurrency(simulationResults.estimatedProfit || 0)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Gas Cost"
                    secondary={formatCurrency(simulationResults.gasCost || 0)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Success Probability"
                    secondary={formatPercentage(simulationResults.successProbability || 0)}
                  />
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSimulationResults(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FlashLoanPanel;