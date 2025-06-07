import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  Alert,
  LinearProgress,
  Tooltip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Agriculture,
  TrendingUp,
  Info,
  Settings,
  PlayArrow,
  Stop,
  Refresh,
  ExpandMore,
  Warning,
  CheckCircle,
  Timer,
  AccountBalance,
  Speed,
  Security
} from '@mui/icons-material';
import YieldFarmingService from '../../services/YieldFarmingService';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const YieldFarmingPanel = ({ opportunities, onStrategyExecute }) => {
  const [selectedOpportunities, setSelectedOpportunities] = useState([]);
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [farmingStats, setFarmingStats] = useState(null);
  const [activeFarms, setActiveFarms] = useState([]);
  const [harvestOpportunities, setHarvestOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [executeProgress, setExecuteProgress] = useState(null);
  
  // Strategy settings
  const [strategySettings, setStrategySettings] = useState({
    riskTolerance: 'medium',
    maxAllocation: 30,
    autoCompound: true,
    harvestThreshold: 10,
    maxSlippage: 2,
    gasPrice: 'medium'
  });

  useEffect(() => {
    loadFarmingData();
  }, []);

  const loadFarmingData = async () => {
    try {
      const stats = await YieldFarmingService.getFarmingStats();
      setFarmingStats(stats);
      
      const harvestOpps = await YieldFarmingService.monitorActiveFarms();
      setHarvestOpportunities(harvestOpps);
    } catch (error) {
      console.error('Failed to load farming data:', error);
    }
  };

  const handleOpportunitySelect = (opportunity) => {
    setSelectedOpportunities(prev => {
      const isSelected = prev.some(opp => opp.asset === opportunity.asset);
      if (isSelected) {
        return prev.filter(opp => opp.asset !== opportunity.asset);
      } else {
        return [...prev, opportunity];
      }
    });
  };

  const handleExecuteStrategy = async () => {
    if (selectedOpportunities.length === 0) return;

    try {
      setLoading(true);
      setExecuteProgress({ step: 'preparing', current: 0, total: selectedOpportunities.length });

      const result = await YieldFarmingService.executeYieldStrategy(
        selectedOpportunities,
        {
          maxSlippage: strategySettings.maxSlippage,
          autoCompound: strategySettings.autoCompound,
          progressCallback: setExecuteProgress
        }
      );

      if (result.errors.length > 0) {
        console.warn('Some strategies failed:', result.errors);
      }

      setExecuteDialogOpen(false);
      setSelectedOpportunities([]);
      await loadFarmingData();
      onStrategyExecute();

    } catch (error) {
      console.error('Failed to execute yield strategy:', error);
    } finally {
      setLoading(false);
      setExecuteProgress(null);
    }
  };

  const handleAutoHarvest = async () => {
    try {
      setLoading(true);
      const results = await YieldFarmingService.autoHarvest();
      await loadFarmingData();
      onStrategyExecute();
    } catch (error) {
      console.error('Failed to auto-harvest:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async () => {
    try {
      YieldFarmingService.setRiskTolerance(strategySettings.riskTolerance);
      YieldFarmingService.setHarvestThreshold(strategySettings.harvestThreshold);
      YieldFarmingService.setAutoCompounding(strategySettings.autoCompound);
      
      setSettingsDialogOpen(false);
      await loadFarmingData();
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const getAPYColor = (apy) => {
    if (apy >= 50) return 'success';
    if (apy >= 20) return 'warning';
    return 'default';
  };

  return (
    <Box>
      {/* Header with Stats */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" display="flex" alignItems="center">
            <Agriculture sx={{ mr: 2 }} />
            Yield Farming
          </Typography>
          <Box>
            <Button
              variant="outlined"
              onClick={() => setSettingsDialogOpen(true)}
              startIcon={<Settings />}
              sx={{ mr: 1 }}
            >
              Settings
            </Button>
            <Button
              variant="contained"
              onClick={handleAutoHarvest}
              startIcon={<Agriculture />}
              disabled={loading || harvestOpportunities.length === 0}
            >
              Auto Harvest ({harvestOpportunities.length})
            </Button>
          </Box>
        </Box>

        {farmingStats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="primary">
                    {farmingStats.activeFarms}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Farms
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    {formatPercentage(farmingStats.averageAPY)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average APY
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    {formatCurrency(farmingStats.pendingRewards)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Rewards
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6">
                    {strategySettings.riskTolerance.toUpperCase()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Risk Tolerance
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Yield Opportunities */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Available Opportunities ({opportunities.length})
                </Typography>
                <Box>
                  {selectedOpportunities.length > 0 && (
                    <Button
                      variant="contained"
                      onClick={() => setExecuteDialogOpen(true)}
                      startIcon={<PlayArrow />}
                      sx={{ mr: 1 }}
                    >
                      Execute Strategy ({selectedOpportunities.length})
                    </Button>
                  )}
                  <IconButton onClick={loadFarmingData}>
                    <Refresh />
                  </IconButton>
                </Box>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox"></TableCell>
                      <TableCell>Pool</TableCell>
                      <TableCell align="right">APY</TableCell>
                      <TableCell align="right">TVL</TableCell>
                      <TableCell align="center">Risk</TableCell>
                      <TableCell align="right">Expected Yield</TableCell>
                      <TableCell align="center">Features</TableCell>
                      <TableCell align="center">Confidence</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {opportunities.map((opportunity, index) => (
                      <TableRow 
                        key={index}
                        hover
                        onClick={() => handleOpportunitySelect(opportunity)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <input
                            type="checkbox"
                            checked={selectedOpportunities.some(opp => opp.asset === opportunity.asset)}
                            onChange={() => handleOpportunitySelect(opportunity)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {opportunity.pool?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {opportunity.pool?.protocolName} • {opportunity.asset}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={formatPercentage(opportunity.pool?.apy)}
                            color={getAPYColor(opportunity.pool?.apy)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(opportunity.pool?.tvl)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={opportunity.pool?.riskLevel}
                            color={getRiskColor(opportunity.pool?.riskLevel)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="success.main" fontWeight="bold">
                            {formatCurrency(opportunity.expectedAnnualYield)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" justifyContent="center" gap={0.5}>
                            {opportunity.pool?.autoCompound && (
                              <Tooltip title="Auto-Compound">
                                <Chip icon={<TrendingUp />} label="AC" size="small" />
                              </Tooltip>
                            )}
                            {opportunity.pool?.poolType === 'stable' && (
                              <Tooltip title="Stable Pool">
                                <Chip icon={<Security />} label="ST" size="small" />
                              </Tooltip>
                            )}
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Harvest Opportunities */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Harvest Opportunities
              </Typography>
              {harvestOpportunities.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No harvest opportunities available
                </Typography>
              ) : (
                <List dense>
                  {harvestOpportunities.map((harvest, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={harvest.farm?.name}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Rewards: {formatCurrency(harvest.rewardValue)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Profit: {formatCurrency(harvest.profitability)}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label="Ready"
                          color="success"
                          size="small"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Strategy Summary */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Strategy Summary
              </Typography>
              {selectedOpportunities.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Select opportunities to see strategy summary
                </Typography>
              ) : (
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Selected Farms:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {selectedOpportunities.length}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Total Investment:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(selectedOpportunities.reduce((sum, opp) => sum + opp.recommendedAmount, 0))}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Expected Annual Yield:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      {formatCurrency(selectedOpportunities.reduce((sum, opp) => sum + opp.expectedAnnualYield, 0))}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2">Average APY:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatPercentage(selectedOpportunities.reduce((sum, opp) => sum + opp.pool.apy, 0) / selectedOpportunities.length)}
                    </Typography>
                  </Box>
                  <Alert severity="info" size="small">
                    Risk Level: {selectedOpportunities.some(opp => opp.pool.riskLevel === 'high') ? 'High' : 
                                selectedOpportunities.some(opp => opp.pool.riskLevel === 'medium') ? 'Medium' : 'Low'}
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Execute Strategy Dialog */}
      <Dialog open={executeDialogOpen} onClose={() => setExecuteDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Execute Yield Farming Strategy</DialogTitle>
        <DialogContent>
          {executeProgress ? (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom>
                Executing Strategy...
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {executeProgress.step === 'preparing' && 'Preparing transactions...'}
                {executeProgress.step === 'executing' && `Executing farm ${executeProgress.current} of ${executeProgress.total}: ${executeProgress.opportunity}`}
                {executeProgress.step === 'tracking' && 'Tracking transactions...'}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(executeProgress.current / executeProgress.total) * 100} 
                sx={{ mb: 1 }}
              />
              <Typography variant="caption">
                {executeProgress.current} / {executeProgress.total} completed
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You are about to execute yield farming strategies for {selectedOpportunities.length} opportunities.
              </Typography>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>Strategy Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Pool</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell align="right">APY</TableCell>
                          <TableCell align="right">Expected Yield</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOpportunities.map((opp, index) => (
                          <TableRow key={index}>
                            <TableCell>{opp.pool?.name}</TableCell>
                            <TableCell align="right">{formatCurrency(opp.recommendedAmount)}</TableCell>
                            <TableCell align="right">{formatPercentage(opp.pool?.apy)}</TableCell>
                            <TableCell align="right">{formatCurrency(opp.expectedAnnualYield)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>

              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Gas Price</InputLabel>
                  <Select
                    value={strategySettings.gasPrice}
                    onChange={(e) => setStrategySettings(prev => ({ ...prev, gasPrice: e.target.value }))}
                  >
                    <MenuItem value="slow">Slow (Lower cost)</MenuItem>
                    <MenuItem value="medium">Medium (Recommended)</MenuItem>
                    <MenuItem value="fast">Fast (Higher cost)</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ mb: 2 }}>
                  <Typography gutterBottom>Max Slippage: {strategySettings.maxSlippage}%</Typography>
                  <Slider
                    value={strategySettings.maxSlippage}
                    onChange={(e, value) => setStrategySettings(prev => ({ ...prev, maxSlippage: value }))}
                    min={0.1}
                    max={5}
                    step={0.1}
                    marks={[
                      { value: 0.5, label: '0.5%' },
                      { value: 1, label: '1%' },
                      { value: 2, label: '2%' },
                      { value: 5, label: '5%' }
                    ]}
                  />
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={strategySettings.autoCompound}
                      onChange={(e) => setStrategySettings(prev => ({ ...prev, autoCompound: e.target.checked }))}
                    />
                  }
                  label="Enable Auto-Compounding"
                />
              </Box>

              <Alert severity="warning" sx={{ mt: 2 }}>
                This will execute multiple transactions. Make sure you have enough gas tokens for all operations.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!executeProgress && (
            <>
              <Button onClick={() => setExecuteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleExecuteStrategy}
                disabled={loading || selectedOpportunities.length === 0}
              >
                Execute Strategy
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yield Farming Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Risk Tolerance</InputLabel>
              <Select
                value={strategySettings.riskTolerance}
                onChange={(e) => setStrategySettings(prev => ({ ...prev, riskTolerance: e.target.value }))}
              >
                <MenuItem value="low">Low - Stable coins and established protocols</MenuItem>
                <MenuItem value="medium">Medium - Balanced risk/reward</MenuItem>
                <MenuItem value="high">High - Maximum yield potential</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>Max Portfolio Allocation: {strategySettings.maxAllocation}%</Typography>
              <Slider
                value={strategySettings.maxAllocation}
                onChange={(e, value) => setStrategySettings(prev => ({ ...prev, maxAllocation: value }))}
                min={5}
                max={50}
                step={5}
                marks={[
                  { value: 10, label: '10%' },
                  { value: 25, label: '25%' },
                  { value: 50, label: '50%' }
                ]}
              />
            </Box>

            <TextField
              fullWidth
              label="Harvest Threshold ($)"
              type="number"
              value={strategySettings.harvestThreshold}
              onChange={(e) => setStrategySettings(prev => ({ ...prev, harvestThreshold: parseFloat(e.target.value) }))}
              sx={{ mb: 3 }}
              helperText="Minimum reward value to trigger auto-harvest"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={strategySettings.autoCompound}
                  onChange={(e) => setStrategySettings(prev => ({ ...prev, autoCompound: e.target.checked }))}
                />
              }
              label="Enable Auto-Compounding"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSettingsUpdate}>
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default YieldFarmingPanel;