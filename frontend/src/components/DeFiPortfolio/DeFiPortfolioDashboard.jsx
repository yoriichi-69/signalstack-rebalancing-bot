import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  TrendingUp,
  AccountBalance,
  SwapHoriz,
  Flash,
  Bridge,
  Agriculture,
  Warning,
  Refresh,
  Settings,
  Timeline,
  Assessment
} from '@mui/icons-material';
import YieldFarmingService from '../../services/YieldFarmingService';
import CrossChainBridgeService from '../../services/CrossChainBridgeService';
import FlashLoanService from '../../services/FlashLoanService';
import LiquidityManagementService from '../../services/LiquidityManagementService';
import BlockchainService from '../../services/BlockchainService';
import YieldFarmingPanel from './YieldFarmingPanel';
import CrossChainBridgePanel from './CrossChainBridgePanel';
import FlashLoanPanel from './FlashLoanPanel';
import LiquidityManagementPanel from './LiquidityManagementPanel';
import PortfolioOverview from './PortfolioOverview';
import './DeFiPortfolioDashboard.css';

const DeFiPortfolioDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [portfolioData, setPortfolioData] = useState(null);
  const [yieldOpportunities, setYieldOpportunities] = useState([]);
  const [bridgeTransfers, setBridgeTransfers] = useState([]);
  const [flashLoanOpportunities, setFlashLoanOpportunities] = useState([]);
  const [liquidityPositions, setLiquidityPositions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stats, setStats] = useState({
    totalValue: 0,
    totalYield: 0,
    activeStrategies: 0,
    pendingTransactions: 0
  });

  // Initialize dashboard data
  useEffect(() => {
    initializeDashboard();
  }, []);

  // Auto-refresh data
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshAllData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      
      // Initialize all services
      await Promise.all([
        YieldFarmingService.initialize(),
        CrossChainBridgeService.initialize(),
        FlashLoanService.initialize(),
        LiquidityManagementService.initialize()
      ]);
      
      // Load initial data
      await refreshAllData();
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize DeFi dashboard:', error);
      setAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        message: 'Failed to initialize DeFi dashboard'
      }]);
      setLoading(false);
    }
  };

  const refreshAllData = useCallback(async () => {
    try {
      // Fetch portfolio overview
      const portfolio = await fetchPortfolioOverview();
      setPortfolioData(portfolio);
      
      // Fetch yield farming data
      const yieldData = await YieldFarmingService.findOptimalYieldOpportunities(portfolio.assets, 0.3);
      setYieldOpportunities(yieldData.opportunities || []);
      
      // Fetch bridge transfers
      const transfers = CrossChainBridgeService.getPendingTransfers();
      setBridgeTransfers(transfers);
      
      // Fetch flash loan opportunities
      const flashOpps = FlashLoanService.getAvailableOpportunities();
      setFlashLoanOpportunities(flashOpps);
      
      // Fetch liquidity positions
      const liquidityStats = await LiquidityManagementService.getLiquidityStats();
      setLiquidityPositions(liquidityStats);
      
      // Update stats
      updateDashboardStats(portfolio, yieldData, transfers, flashOpps, liquidityStats);
      
      // Check for alerts
      await checkForAlerts();
      
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
    }
  }, []);

  const fetchPortfolioOverview = async () => {
    // Mock portfolio data - replace with actual portfolio service
    return {
      totalValue: 50000 + Math.random() * 10000,
      assets: [
        { symbol: 'ETH', amount: 10, value: 20000, price: 2000 },
        { symbol: 'USDC', amount: 15000, value: 15000, price: 1 },
        { symbol: 'WBTC', amount: 0.3, value: 12000, price: 40000 },
        { symbol: 'DAI', amount: 8000, value: 8000, price: 1 }
      ],
      chains: {
        ethereum: 0.6,
        polygon: 0.25,
        bsc: 0.15
      },
      allocation: {
        defi: 0.4,
        farming: 0.3,
        liquidity: 0.2,
        spot: 0.1
      }
    };
  };

  const updateDashboardStats = (portfolio, yieldData, transfers, flashOpps, liquidityStats) => {
    setStats({
      totalValue: portfolio.totalValue,
      totalYield: yieldData.totalExpectedYield || 0,
      activeStrategies: (yieldOpportunities.length + liquidityStats.totalPositions || 0),
      pendingTransactions: transfers.length
    });
  };

  const checkForAlerts = async () => {
    try {
      const newAlerts = [];
      
      // Check for impermanent loss alerts
      const ilAlerts = await LiquidityManagementService.monitorImpermanentLoss();
      ilAlerts.forEach(alert => {
        if (alert.urgency === 'high') {
          newAlerts.push({
            id: `il_${alert.pairName}_${Date.now()}`,
            type: 'warning',
            message: `High impermanent loss detected in ${alert.pairName}: ${alert.impermanentLoss.impermanentLoss.toFixed(2)}%`,
            action: 'Review Position',
            data: alert
          });
        }
      });
      
      // Check for profitable flash loan opportunities
      const profitableFlash = flashLoanOpportunities.filter(opp => opp.profit > 500);
      if (profitableFlash.length > 0) {
        newAlerts.push({
          id: `flash_${Date.now()}`,
          type: 'info',
          message: `${profitableFlash.length} profitable flash loan opportunities available`,
          action: 'View Opportunities'
        });
      }
      
      // Check for failed bridge transfers
      const failedTransfers = bridgeTransfers.filter(t => t.status === 'failed');
      failedTransfers.forEach(transfer => {
        newAlerts.push({
          id: `bridge_fail_${transfer.id}`,
          type: 'error',
          message: `Bridge transfer failed: ${transfer.route.token} to ${transfer.route.toChain}`,
          action: 'Retry Transfer',
          data: transfer
        });
      });
      
      setAlerts(prev => [...prev.slice(-10), ...newAlerts]); // Keep last 10 + new alerts
    } catch (error) {
      console.error('Failed to check for alerts:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAlertAction = (alert) => {
    switch (alert.action) {
      case 'Review Position':
        setActiveTab(3); // Switch to liquidity management tab
        break;
      case 'View Opportunities':
        setActiveTab(2); // Switch to flash loan tab
        break;
      case 'Retry Transfer':
        setActiveTab(1); // Switch to bridge tab
        break;
      default:
        break;
    }
    
    // Remove alert after action
    setAlerts(prev => prev.filter(a => a.id !== alert.id));
  };

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Initializing DeFi Portfolio Dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="defi-portfolio-dashboard">
      {/* Header with Stats */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            DeFi Portfolio Dashboard
          </Typography>
          <Box>
            <Tooltip title="Refresh Data">
              <IconButton onClick={refreshAllData}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton onClick={() => setSettingsOpen(true)}>
                <Settings />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card className="stat-card">
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AccountBalance sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h6">
                      ${stats.totalValue.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Portfolio Value
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className="stat-card">
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingUp sx={{ mr: 2, color: 'success.main' }} />
                  <Box>
                    <Typography variant="h6">
                      ${stats.totalYield.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Annual Yield Potential
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className="stat-card">
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Agriculture sx={{ mr: 2, color: 'warning.main' }} />
                  <Box>
                    <Typography variant="h6">
                      {stats.activeStrategies}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Strategies
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className="stat-card">
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Timeline sx={{ mr: 2, color: 'info.main' }} />
                  <Box>
                    <Typography variant="h6">
                      {stats.pendingTransactions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Transactions
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Box sx={{ mb: 3 }}>
            {alerts.slice(0, 3).map(alert => (
              <Alert
                key={alert.id}
                severity={alert.type}
                sx={{ mb: 1 }}
                action={
                  <Box>
                    {alert.action && (
                      <Button
                        size="small"
                        onClick={() => handleAlertAction(alert)}
                        sx={{ mr: 1 }}
                      >
                        {alert.action}
                      </Button>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      ×
                    </IconButton>
                  </Box>
                }
              >
                {alert.message}
              </Alert>
            ))}
          </Box>
        )}
      </Box>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab
              icon={<Assessment />}
              label="Overview"
              iconPosition="start"
            />
            <Tab
              icon={
                <Badge badgeContent={bridgeTransfers.length} color="secondary">
                  <Bridge />
                </Badge>
              }
              label="Cross-Chain Bridge"
              iconPosition="start"
            />
            <Tab
              icon={
                <Badge badgeContent={flashLoanOpportunities.length} color="error">
                  <Flash />
                </Badge>
              }
              label="Flash Loans"
              iconPosition="start"
            />
            <Tab
              icon={<SwapHoriz />}
              label="Liquidity Management"
              iconPosition="start"
            />
            <Tab
              icon={
                <Badge badgeContent={yieldOpportunities.length} color="primary">
                  <Agriculture />
                </Badge>
              }
              label="Yield Farming"
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <CardContent>
          {/* Tab Panels */}
          {activeTab === 0 && (
            <PortfolioOverview
              portfolioData={portfolioData}
              yieldOpportunities={yieldOpportunities}
              bridgeTransfers={bridgeTransfers}
              flashLoanOpportunities={flashLoanOpportunities}
              liquidityPositions={liquidityPositions}
              onTabSwitch={setActiveTab}
            />
          )}

          {activeTab === 1 && (
            <CrossChainBridgePanel
              transfers={bridgeTransfers}
              onTransferUpdate={refreshAllData}
            />
          )}

          {activeTab === 2 && (
            <FlashLoanPanel
              opportunities={flashLoanOpportunities}
              onStrategyExecute={refreshAllData}
            />
          )}

          {activeTab === 3 && (
            <LiquidityManagementPanel
              positions={liquidityPositions}
              onPositionUpdate={refreshAllData}
            />
          )}

          {activeTab === 4 && (
            <YieldFarmingPanel
              opportunities={yieldOpportunities}
              onStrategyExecute={refreshAllData}
            />
          )}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>DeFi Dashboard Settings</DialogTitle>
        <DialogContent>
          {/* Settings content will be implemented in next part */}
          <Typography>Settings panel coming soon...</Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DeFiPortfolioDashboard;