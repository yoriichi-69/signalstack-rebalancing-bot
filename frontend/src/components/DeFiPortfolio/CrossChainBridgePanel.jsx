import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import {
  Bridge,
  SwapHoriz,
  Speed,
  Security,
  AttachMoney,
  Refresh,
  Launch,
  Timeline,
  CheckCircle,
  Error,
  Pending,
  Cancel
} from '@mui/icons-material';
import CrossChainBridgeService from '../../services/CrossChainBridgeService';
import { formatCurrency, formatTime, getChainName } from '../../utils/formatters';

const CrossChainBridgePanel = ({ transfers, onTransferUpdate }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [bridgeDialogOpen, setBridgeDialogOpen] = useState(false);
  const [routeComparisonOpen, setRouteComparisonOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [allRoutes, setAllRoutes] = useState([]);
  const [bridgeStats, setBridgeStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transferProgress, setTransferProgress] = useState(null);

  // Bridge form state
  const [bridgeForm, setBridgeForm] = useState({
    fromChain: 1, // Ethereum
    toChain: 137, // Polygon
    token: 'USDC',
    amount: '',
    recipient: '',
    priority: 'cost' // cost, speed, security, reliability
  });

  // Supported chains and tokens
  const supportedChains = [
    { id: 1, name: 'Ethereum', symbol: 'ETH' },
    { id: 56, name: 'BSC', symbol: 'BNB' },
    { id: 137, name: 'Polygon', symbol: 'MATIC' },
    { id: 43114, name: 'Avalanche', symbol: 'AVAX' },
    { id: 10, name: 'Optimism', symbol: 'ETH' },
    { id: 42161, name: 'Arbitrum', symbol: 'ETH' }
  ];

  const supportedTokens = ['ETH', 'USDC', 'USDT', 'DAI', 'WBTC'];

  useEffect(() => {
    loadBridgeStats();
  }, []);

  const loadBridgeStats = async () => {
    try {
      const stats = await CrossChainBridgeService.getBridgeStats();
      setBridgeStats(stats);
    } catch (error) {
      console.error('Failed to load bridge stats:', error);
    }
  };

  const handleFindRoutes = async () => {
    try {
      setLoading(true);
      
      const routeResult = await CrossChainBridgeService.findOptimalRoute(
        bridgeForm.fromChain,
        bridgeForm.toChain,
        bridgeForm.token,
        bridgeForm.amount,
        bridgeForm.priority
      );

      setSelectedRoute(routeResult.optimalRoute);
      setAllRoutes(routeResult.allRoutes);
      setRouteComparisonOpen(true);
    } catch (error) {
      console.error('Failed to find routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteBridge = async () => {
    if (!selectedRoute) return;

    try {
      setLoading(true);
      setTransferProgress({ step: 'preparing' });

      const result = await CrossChainBridgeService.executeCrossChainTransfer(
        selectedRoute,
        bridgeForm.amount,
        {
          recipient: bridgeForm.recipient || undefined,
          progressCallback: setTransferProgress
        }
      );

      setRouteComparisonOpen(false);
      setBridgeDialogOpen(false);
      setBridgeForm(prev => ({ ...prev, amount: '', recipient: '' }));
      
      await onTransferUpdate();
      await loadBridgeStats();

    } catch (error) {
      console.error('Failed to execute bridge:', error);
    } finally {
      setLoading(false);
      setTransferProgress(null);
    }
  };

  const handleCancelTransfer = async (transferId) => {
    try {
      await CrossChainBridgeService.cancelTransfer(transferId);
      await onTransferUpdate();
    } catch (error) {
      console.error('Failed to cancel transfer:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle color="success" />;
      case 'failed': return <Error color="error" />;
      case 'pending': return <Pending color="warning" />;
      case 'cancelled': return <Cancel color="disabled" />;
      default: return <Timeline />;
    }
  };

  const getRouteIcon = (bridgeId) => {
    const icons = {
      layerzero: '🌐',
      polygon_bridge: '🔷',
      multichain: '🔗',
      hop: '🐰',
      stargate: '⭐'
    };
    return icons[bridgeId] || '🌉';
  };

  const renderActiveTransfers = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Active Transfers ({transfers.length})
          </Typography>
          <IconButton onClick={onTransferUpdate}>
            <Refresh />
          </IconButton>
        </Box>

        {transfers.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Bridge sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No active transfers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start a new cross-chain transfer to see it here
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Route</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Bridge</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>ETA</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Typography variant="body2" fontWeight="bold">
                          {getChainName(transfer.route?.fromChain)} → {getChainName(transfer.route?.toChain)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {transfer.amount} {transfer.route?.token}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <span style={{ marginRight: 8 }}>
                          {getRouteIcon(transfer.route?.bridgeId)}
                        </span>
                        <Typography variant="body2">
                          {transfer.route?.bridge?.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getStatusIcon(transfer.status)}
                        <Chip
                          label={transfer.status}
                          size="small"
                          color={
                            transfer.status === 'completed' ? 'success' :
                            transfer.status === 'failed' ? 'error' :
                            transfer.status === 'pending' ? 'warning' : 'default'
                          }
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ minWidth: 100 }}>
                        <LinearProgress
                          variant="determinate"
                          value={transfer.progress || 0}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="caption">
                          {(transfer.progress || 0).toFixed(0)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {transfer.estimatedCompletion ?
                          formatTime(transfer.estimatedCompletion) :
                          'N/A'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {transfer.status === 'pending' && (
                        <Tooltip title="Cancel Transfer">
                          <IconButton
                            size="small"
                            onClick={() => handleCancelTransfer(transfer.id)}
                          >
                            <Cancel />
                          </IconButton>
                        </Tooltip>
                      )}
                      {transfer.sourceTransaction && (
                        <Tooltip title="View Transaction">
                          <IconButton
                            size="small"
                            onClick={() => window.open(`https://etherscan.io/tx/${transfer.sourceTransaction}`, '_blank')}
                          >
                            <Launch />
                          </IconButton>
                        </Tooltip>
                      )}
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

  const renderBridgeStats = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {bridgeStats && (
        <>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="primary">
                  {bridgeStats.totalBridges}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available Bridges
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {bridgeStats.supportedChains}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supported Chains
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {formatTime(bridgeStats.averageTransferTime)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Transfer Time
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {formatCurrency(bridgeStats.totalVolume)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Volume
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </>
      )}
    </Grid>
  );

  const renderNewBridge = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          New Cross-Chain Transfer
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>From Chain</InputLabel>
              <Select
                value={bridgeForm.fromChain}
                onChange={(e) => setBridgeForm(prev => ({ ...prev, fromChain: e.target.value }))}
              >
                {supportedChains.map(chain => (
                  <MenuItem key={chain.id} value={chain.id}>
                    {chain.name} ({chain.symbol})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>To Chain</InputLabel>
              <Select
                value={bridgeForm.toChain}
                onChange={(e) => setBridgeForm(prev => ({ ...prev, toChain: e.target.value }))}
              >
                {supportedChains.filter(chain => chain.id !== bridgeForm.fromChain).map(chain => (
                  <MenuItem key={chain.id} value={chain.id}>
                    {chain.name} ({chain.symbol})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Token</InputLabel>
              <Select
                value={bridgeForm.token}
                onChange={(e) => setBridgeForm(prev => ({ ...prev, token: e.target.value }))}
              >
                {supportedTokens.map(token => (
                  <MenuItem key={token} value={token}>
                    {token}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={bridgeForm.amount}
              onChange={(e) => setBridgeForm(prev => ({ ...prev, amount: e.target.value }))}
              sx={{ mb: 2 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Recipient Address (Optional)"
              value={bridgeForm.recipient}
              onChange={(e) => setBridgeForm(prev => ({ ...prev, recipient: e.target.value }))}
              sx={{ mb: 2 }}
              helperText="Leave empty to send to your own address"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={bridgeForm.priority}
                onChange={(e) => setBridgeForm(prev => ({ ...prev, priority: e.target.value }))}
              >
                <MenuItem value="cost">Lowest Cost</MenuItem>
                <MenuItem value="speed">Fastest Speed</MenuItem>
                <MenuItem value="security">Highest Security</MenuItem>
                <MenuItem value="reliability">Most Reliable</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleFindRoutes}
              disabled={!bridgeForm.amount || loading}
              startIcon={<Bridge />}
            >
              Find Best Routes
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" display="flex" alignItems="center">
          <Bridge sx={{ mr: 2 }} />
          Cross-Chain Bridge
        </Typography>
        <Button
          variant="contained"
          onClick={() => setBridgeDialogOpen(true)}
          startIcon={<SwapHoriz />}
        >
          New Transfer
        </Button>
      </Box>

      {/* Stats */}
      {renderBridgeStats()}

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, value) => setActiveTab(value)}>
          <Tab label="Active Transfers" />
          <Tab label="Transfer History" />
        </Tabs>
      </Box>

      {/* Content */}
      {activeTab === 0 && renderActiveTransfers()}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6">Transfer History</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Coming soon...
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* New Bridge Dialog */}
      <Dialog open={bridgeDialogOpen} onClose={() => setBridgeDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>New Cross-Chain Transfer</DialogTitle>
        <DialogContent>
          {renderNewBridge()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBridgeDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Route Comparison Dialog */}
      <Dialog open={routeComparisonOpen} onClose={() => setRouteComparisonOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Compare Bridge Routes</DialogTitle>
        <DialogContent>
          {transferProgress ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Executing Transfer...
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {transferProgress.step === 'preparing' && 'Preparing transaction...'}
                {transferProgress.step === 'sending' && 'Sending transaction...'}
                {transferProgress.step === 'tracking' && `Tracking transfer: ${transferProgress.sourceHash}`}
                {transferProgress.step === 'completed' && `Transfer completed: ${transferProgress.destinationHash}`}
                {transferProgress.step === 'failed' && `Transfer failed: ${transferProgress.error}`}
              </Typography>
              {transferProgress.step !== 'completed' && transferProgress.step !== 'failed' && (
                <LinearProgress sx={{ width: '100%' }} />
              )}
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Bridge</TableCell>
                    <TableCell align="right">Total Fee</TableCell>
                    <TableCell align="right">Time</TableCell>
                    <TableCell align="center">Security</TableCell>
                    <TableCell align="center">Reliability</TableCell>
                    <TableCell align="right">Net Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allRoutes.map((route, index) => (
                    <TableRow 
                      key={index}
                      selected={selectedRoute?.bridgeId === route.bridgeId}
                      onClick={() => setSelectedRoute(route)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <span style={{ marginRight: 8 }}>
                            {getRouteIcon(route.bridgeId)}
                          </span>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {route.bridge?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {route.bridge?.type}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatCurrency(route.fees?.total)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {((route.fees?.total / route.amount) * 100).toFixed(2)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" alignItems="center" justifyContent="flex-end">
                          <Speed sx={{ mr: 0.5, fontSize: 16 }} />
                          <Typography variant="body2">
                            {route.timeEstimate?.min}-{route.timeEstimate?.max} min
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" alignItems="center" justifyContent="center">
                          <Security sx={{ mr: 0.5, fontSize: 16 }} />
                          <Typography variant="body2">
                            {route.security}/100
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {route.reliabilityScore}%
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {formatCurrency(route.netAmount)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          {!transferProgress && (
            <>
              <Button onClick={() => setRouteComparisonOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleExecuteBridge}
                disabled={!selectedRoute || loading}
              >
                Execute Transfer
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CrossChainBridgePanel;