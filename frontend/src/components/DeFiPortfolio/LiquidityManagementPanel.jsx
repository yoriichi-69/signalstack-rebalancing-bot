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
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Slider,
  Badge
} from '@mui/material';
import {
  SwapHoriz,
  TrendingUp,
  TrendingDown,
  Warning,
  Security,
  Add,
  Remove,
  Refresh,
  ExpandMore,
  Info,
  Assessment,
  Timeline,
  MonetizationOn,
  Balance,
  ShowChart,
  Shield
} from '@mui/icons-material';
import LiquidityManagementService from '../../services/LiquidityManagementService';
import { formatCurrency, formatPercentage, formatImpermanentLoss } from '../../utils/formatters';

const LiquidityManagementPanel = ({ positions, onPositionUpdate }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [addLiquidityOpen, setAddLiquidityOpen] = useState(false);
  const [removeLiquidityOpen, setRemoveLiquidityOpen] = useState(false);
  const [impermanentLossAlerts, setImpermanentLossAlerts] = useState([]);
  const [liquidityStats, setLiquidityStats] = useState(null);
  const [rebalanceRecommendations, setRebalanceRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mevProtection, setMevProtection] = useState(true);

  // Add liquidity form
  const [addLiquidityForm, setAddLiquidityForm] = useState({
    protocol: 'uniswap_v3',
    token0: 'ETH',
    token1: 'USDC',
    amount0: '',
    amount1: '',
    feetier: 0.3,
    priceRange: { min: '', max: '' },
    autoRebalance: true
  });

  // Remove liquidity form
  const [removeLiquidityForm, setRemoveLiquidityForm] = useState({
    percentage: 100,
    emergencyExit: false
  });

  const supportedProtocols = [
    { id: 'uniswap_v3', name: 'Uniswap V3', type: 'concentrated' },
    { id: 'uniswap_v2', name: 'Uniswap V2', type: 'full_range' },
    { id: 'sushiswap', name: 'SushiSwap', type: 'full_range' },
    { id: 'curve', name: 'Curve', type: 'stable' },
    { id: 'balancer', name: 'Balancer', type: 'weighted' }
  ];

  const feeTiers = [0.01, 0.05, 0.3, 1.0];

  useEffect(() => {
    loadLiquidityData();
  }, []);

  const loadLiquidityData = async () => {
    try {
      const stats = await LiquidityManagementService.getLiquidityStats();
      setLiquidityStats(stats);

      const ilAlerts = await LiquidityManagementService.monitorImpermanentLoss();
      setImpermanentLossAlerts(ilAlerts);

      const recommendations = await LiquidityManagementService.getRebalanceRecommendations();
      setRebalanceRecommendations(recommendations);
    } catch (error) {
      console.error('Failed to load liquidity data:', error);
    }
  };

  const handleAddLiquidity = async () => {
    try {
      setLoading(true);
      
      const result = await LiquidityManagementService.addLiquidity(
        addLiquidityForm.protocol,
        addLiquidityForm.token0,
        addLiquidityForm.token1,
        addLiquidityForm.amount0,
        addLiquidityForm.amount1,
        {
          feeLevel: addLiquidityForm.feeLevel,
          priceRange: addLiquidityForm.priceRange,
          autoRebalance: addLiquidityForm.autoRebalance,
          mevProtection
        }
      );

      setAddLiquidityOpen(false);
      await onPositionUpdate();
      await loadLiquidityData();
    } catch (error) {
      console.error('Failed to add liquidity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!selectedPosition) return;

    try {
      setLoading(true);
      
      const result = await LiquidityManagementService.removeLiquidity(
        selectedPosition.id,
        removeLiquidityForm.percentage / 100,
        {
          emergencyExit: removeLiquidityForm.emergencyExit,
          mevProtection: mevProtection && !removeLiquidityForm.emergencyExit
        }
      );

      setRemoveLiquidityOpen(false);
      setSelectedPosition(null);
      await onPositionUpdate();
      await loadLiquidityData();
    } catch (error) {
      console.error('Failed to remove liquidity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRebalancePosition = async (positionId) => {
    try {
      setLoading(true);
      await LiquidityManagementService.rebalancePosition(positionId);
      await onPositionUpdate();
      await loadLiquidityData();
    } catch (error) {
      console.error('Failed to rebalance position:', error);
    } finally {
      setLoading(false);
    }
  };

  const getILSeverityColor = (ilPercentage) => {
    if (ilPercentage > 10) return 'error';
    if (ilPercentage > 5) return 'warning';
    if (ilPercentage > 2) return 'info';
    return 'success';
  };

  const getPositionHealthColor = (health) => {
    if (health >= 80) return 'success';
    if (health >= 60) return 'warning';
    return 'error';
  };

  const renderPositions = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Active Positions ({positions.totalPositions || 0})
          </Typography>
          <Box>
            <Button
              variant="outlined"
              onClick={() => setAddLiquidityOpen(true)}
              startIcon={<Add />}
              sx={{ mr: 1 }}
            >
              Add Liquidity
            </Button>
            <IconButton onClick={loadLiquidityData}>
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        {!positions.positions || positions.positions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <SwapHoriz sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No active liquidity positions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add liquidity to start earning trading fees
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Position</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell align="right">Fees Earned</TableCell>
                  <TableCell align="center">IL Status</TableCell>
                  <TableCell align="center">Health</TableCell>
                  <TableCell align="right">APR</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {positions.positions.map((position) => (
                  <TableRow key={position.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {position.pair.token0.symbol}-{position.pair.token1.symbol}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {position.protocol} • {formatPercentage(position.feeLevel)}% Fee
                        </Typography>
                        {position.concentrated && (
                          <Chip 
                            label="Concentrated" 
                            size="small" 
                            color="primary" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(position.totalValue)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {position.token0Amount.toFixed(4)} {position.pair.token0.symbol} +{' '}
                        {position.token1Amount.toFixed(4)} {position.pair.token1.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        {formatCurrency(position.feesEarned)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        24h: {formatCurrency(position.feesEarned24h)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {position.impermanentLoss && (
                        <Tooltip title={`IL: ${formatPercentage(position.impermanentLoss.impermanentLoss)}`}>
                          <Chip
                            label={formatImpermanentLoss(position.impermanentLoss.impermanentLoss).value}
                            color={getILSeverityColor(position.impermanentLoss.impermanentLoss)}
                            size="small"
                            icon={position.impermanentLoss.impermanentLoss > 5 ? <Warning /> : <Security />}
                          />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center">
                        <LinearProgress
                          variant="determinate"
                          value={position.healthScore || 75}
                          color={getPositionHealthColor(position.healthScore || 75)}
                          sx={{ width: 40, mr: 1 }}
                        />
                        <Typography variant="caption">
                          {position.healthScore || 75}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {formatPercentage(position.apr)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Remove Liquidity">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedPosition(position);
                            setRemoveLiquidityOpen(true);
                          }}
                        >
                          <Remove />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Rebalance">
                        <IconButton
                          size="small"
                          onClick={() => handleRebalancePosition(position.id)}
                          disabled={loading}
                        >
                          <Balance />
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

  const renderImpermanentLossAlerts = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
          <Warning sx={{ mr: 1 }} />
          Impermanent Loss Alerts
          <Badge badgeContent={impermanentLossAlerts.length} color="error" sx={{ ml: 1 }}>
            <div />
          </Badge>
        </Typography>

        {impermanentLossAlerts.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No impermanent loss alerts. Your positions are healthy.
          </Typography>
        ) : (
          <List>
            {impermanentLossAlerts.map((alert, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`${alert.pairName} Position`}
                  secondary={
                    <Box>
                      <Typography variant="body2">
                        Current IL: {formatPercentage(alert.impermanentLoss.impermanentLoss)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {alert.urgency === 'high' ? 'Immediate attention required' : 
                         alert.urgency === 'medium' ? 'Monitor closely' : 'Low priority'}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={alert.urgency}
                    size="small"
                    color={alert.urgency === 'high' ? 'error' : alert.urgency === 'medium' ? 'warning' : 'info'}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );

  const renderRebalanceRecommendations = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Rebalance Recommendations
        </Typography>

        {rebalanceRecommendations.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No rebalancing needed at this time.
          </Typography>
        ) : (
          <List>
            {rebalanceRecommendations.map((rec, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`${rec.pair} Position`}
                  secondary={
                    <Box>
                      <Typography variant="body2">
                        Reason: {rec.reason}
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        Expected improvement: {formatPercentage(rec.expectedImprovement)}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleRebalancePosition(rec.positionId)}
                    disabled={loading}
                  >
                    Rebalance
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );

  const renderLiquidityStats = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {liquidityStats && (
        <>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="primary">
                  {formatCurrency(liquidityStats.totalValue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Liquidity Value
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {formatCurrency(liquidityStats.totalFeesEarned)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Fees Earned
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {formatPercentage(liquidityStats.averageAPR)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average APR
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="error.main">
                  {formatPercentage(liquidityStats.totalImpermanentLoss)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Impermanent Loss
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </>
      )}
    </Grid>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" display="flex" alignItems="center">
          <SwapHoriz sx={{ mr: 2 }} />
          Liquidity Management
        </Typography>
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={mevProtection}
                onChange={(e) => setMevProtection(e.target.checked)}
              />
            }
            label="MEV Protection"
          />
          <Button
            variant="contained"
            onClick={() => setAddLiquidityOpen(true)}
            startIcon={<Add />}
            sx={{ ml: 2 }}
          >
            Add Liquidity
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      {renderLiquidityStats()}

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, value) => setActiveTab(value)}>
          <Tab label="Active Positions" />
          <Tab label="IL Monitoring" />
          <Tab label="Rebalancing" />
        </Tabs>
      </Box>

      {/* Content */}
      {activeTab === 0 && renderPositions()}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            {renderImpermanentLossAlerts()}
          </Grid>
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  IL Protection Settings
                </Typography>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Enable IL Alerts"
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Get notified when IL exceeds thresholds
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      {activeTab === 2 && renderRebalanceRecommendations()}

      {/* Add Liquidity Dialog */}
      <Dialog open={addLiquidityOpen} onClose={() => setAddLiquidityOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Liquidity Position</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Protocol</InputLabel>
                <Select
                  value={addLiquidityForm.protocol}
                  onChange={(e) => setAddLiquidityForm(prev => ({ ...prev, protocol: e.target.value }))}
                >
                  {supportedProtocols.map(protocol => (
                    <MenuItem key={protocol.id} value={protocol.id}>
                      {protocol.name} ({protocol.type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Token A"
                value={addLiquidityForm.token0}
                onChange={(e) => setAddLiquidityForm(prev => ({ ...prev, token0: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Token B"
                value={addLiquidityForm.token1}
                onChange={(e) => setAddLiquidityForm(prev => ({ ...prev, token1: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Amount A"
                type="number"
                value={addLiquidityForm.amount0}
                onChange={(e) => setAddLiquidityForm(prev => ({ ...prev, amount0: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Amount B"
                type="number"
                value={addLiquidityForm.amount1}
                onChange={(e) => setAddLiquidityForm(prev => ({ ...prev, amount1: e.target.value }))}
              />
            </Grid>

            {addLiquidityForm.protocol === 'uniswap_v3' && (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Fee Tier</InputLabel>
                    <Select
                      value={addLiquidityForm.feeLevel}
                      onChange={(e) => setAddLiquidityForm(prev => ({ ...prev, feeLevel: e.target.value }))}
                    >
                      {feeTiers.map(tier => (
                        <MenuItem key={tier} value={tier}>
                          {formatPercentage(tier)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Min Price"
                    type="number"
                    value={addLiquidityForm.priceRange.min}
                    onChange={(e) => setAddLiquidityForm(prev => ({ 
                      ...prev, 
                      priceRange: { ...prev.priceRange, min: e.target.value }
                    }))}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Max Price"
                    type="number"
                    value={addLiquidityForm.priceRange.max}
                    onChange={(e) => setAddLiquidityForm(prev => ({ 
                      ...prev, 
                      priceRange: { ...prev.priceRange, max: e.target.value }
                    }))}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={addLiquidityForm.autoRebalance}
                    onChange={(e) => setAddLiquidityForm(prev => ({ ...prev, autoRebalance: e.target.checked }))}
                  />
                }
                label="Enable Auto-Rebalancing"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddLiquidityOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddLiquidity}
            disabled={loading || !addLiquidityForm.amount0 || !addLiquidityForm.amount1}
          >
            Add Liquidity
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Liquidity Dialog */}
      <Dialog open={removeLiquidityOpen} onClose={() => setRemoveLiquidityOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Remove Liquidity</DialogTitle>
        <DialogContent>
          {selectedPosition && (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedPosition.pair.token0.symbol}-{selectedPosition.pair.token1.symbol} Position
              </Typography>
              
              <Typography gutterBottom sx={{ mt: 3 }}>
                Percentage to Remove: {removeLiquidityForm.percentage}%
              </Typography>
              <Slider
                value={removeLiquidityForm.percentage}
                onChange={(e, value) => setRemoveLiquidityForm(prev => ({ ...prev, percentage: value }))}
                min={1}
                max={100}
                step={1}
                marks={[
                  { value: 25, label: '25%' },
                  { value: 50, label: '50%' },
                  { value: 75, label: '75%' },
                  { value: 100, label: '100%' }
                ]}
                sx={{ mb: 3 }}
              />

              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  You will receive approximately:
                </Typography>
                <Typography variant="body2">
                  {((selectedPosition.token0Amount * removeLiquidityForm.percentage) / 100).toFixed(4)} {selectedPosition.pair.token0.symbol}
                </Typography>
                <Typography variant="body2">
                  {((selectedPosition.token1Amount * removeLiquidityForm.percentage) / 100).toFixed(4)} {selectedPosition.pair.token1.symbol}
                </Typography>
                <Typography variant="body2" color="success.main">
                  + {formatCurrency((selectedPosition.feesEarned * removeLiquidityForm.percentage) / 100)} in fees
                </Typography>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={removeLiquidityForm.emergencyExit}
                    onChange={(e) => setRemoveLiquidityForm(prev => ({ ...prev, emergencyExit: e.target.checked }))}
                  />
                }
                label="Emergency Exit (Skip MEV Protection)"
              />
              
              {removeLiquidityForm.emergencyExit && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Emergency exit will process immediately but may result in higher slippage
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveLiquidityOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={removeLiquidityForm.emergencyExit ? 'error' : 'primary'}
            onClick={handleRemoveLiquidity}
            disabled={loading}
          >
            Remove Liquidity
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LiquidityManagementPanel;