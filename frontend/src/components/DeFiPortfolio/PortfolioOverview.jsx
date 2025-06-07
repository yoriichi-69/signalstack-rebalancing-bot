import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Launch,
  Timeline,
  PieChart,
  BarChart,
  AccountBalance,
  Agriculture,
  SwapHoriz,
  Bridge
} from '@mui/icons-material';
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const PortfolioOverview = ({
  portfolioData,
  yieldOpportunities,
  bridgeTransfers,
  flashLoanOpportunities,
  liquidityPositions,
  onTabSwitch
}) => {
  const [viewMode, setViewMode] = useState('summary'); // summary, detailed, analytics

  if (!portfolioData) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6">Loading portfolio data...</Typography>
      </Box>
    );
  }

  // Prepare chart data
  const chainAllocationData = Object.entries(portfolioData.chains).map(([chain, percentage]) => ({
    name: chain.charAt(0).toUpperCase() + chain.slice(1),
    value: percentage * 100,
    amount: portfolioData.totalValue * percentage
  }));

  const strategyAllocationData = Object.entries(portfolioData.allocation).map(([strategy, percentage]) => ({
    name: strategy.charAt(0).toUpperCase() + strategy.slice(1),
    value: percentage * 100,
    amount: portfolioData.totalValue * percentage
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const renderSummaryView = () => (
    <Grid container spacing={3}>
      {/* Portfolio Assets */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Asset Holdings
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Asset</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell align="right">Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {portfolioData.assets.map((asset) => (
                    <TableRow key={asset.symbol}>
                      <TableCell component="th" scope="row">
                        <Box display="flex" alignItems="center">
                          <Typography variant="body2" fontWeight="bold">
                            {asset.symbol}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {asset.amount.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        ${asset.value.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        ${asset.price.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Chain Distribution */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Chain Distribution
            </Typography>
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={chainAllocationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chainAllocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Yield Opportunities */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Top Yield Opportunities
              </Typography>
              <Button
                size="small"
                onClick={() => onTabSwitch(4)}
                endIcon={<Launch />}
              >
                View All
              </Button>
            </Box>
            <List dense>
              {yieldOpportunities.slice(0, 3).map((opportunity, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={opportunity.pool?.name || 'Unknown Pool'}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          APY: {opportunity.pool?.apy?.toFixed(2)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Expected: ${opportunity.expectedAnnualYield?.toFixed(0)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={opportunity.pool?.riskLevel}
                      size="small"
                      color={
                        opportunity.pool?.riskLevel === 'low' ? 'success' :
                        opportunity.pool?.riskLevel === 'medium' ? 'warning' : 'error'
                      }
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Flash Loan Opportunities */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Flash Loan Opportunities
              </Typography>
              <Button
                size="small"
                onClick={() => onTabSwitch(2)}
                endIcon={<Launch />}
              >
                View All
              </Button>
            </Box>
            <List dense>
              {flashLoanOpportunities.slice(0, 3).map((opportunity, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={
                      opportunity.type === 'arbitrage' ?
                        `${opportunity.pair?.token0}-${opportunity.pair?.token1} Arbitrage` :
                        `${opportunity.protocol} Liquidation`
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          Profit: ${(opportunity.profit || opportunity.estimatedProfit)?.toFixed(0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {opportunity.type === 'arbitrage' ?
                            `${opportunity.buyDEX} → ${opportunity.sellDEX}` :
                            `Health Factor: ${opportunity.healthFactor?.toFixed(3)}`
                          }
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={opportunity.type}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Bridge Transfers Status */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Recent Bridge Transfers
              </Typography>
              <Button
                size="small"
                onClick={() => onTabSwitch(1)}
                endIcon={<Launch />}
              >
                Manage Bridges
              </Button>
            </Box>
            {bridgeTransfers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No active bridge transfers
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Route</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>ETA</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bridgeTransfers.slice(0, 5).map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell>
                          {transfer.route?.fromChain} → {transfer.route?.toChain}
                        </TableCell>
                        <TableCell>
                          {transfer.amount} {transfer.route?.token}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={transfer.status}
                            size="small"
                            color={
                              transfer.status === 'completed' ? 'success' :
                              transfer.status === 'failed' ? 'error' :
                              transfer.status === 'pending' ? 'warning' : 'default'
                            }
                          />
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
                          {transfer.estimatedCompletion ?
                            new Date(transfer.estimatedCompletion).toLocaleTimeString() :
                            'N/A'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderDetailedView = () => (
    <Grid container spacing={3}>
      {/* Strategy Allocation Chart */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Strategy Allocation
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={strategyAllocationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Value']} />
                  <Bar dataKey="amount" fill="#8884d8" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Performance Metrics */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            <Box sx={{ py: 2 }}>
              {/* Mock performance data */}
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography>24h Change:</Typography>
                <Box display="flex" alignItems="center">
                  <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
                  <Typography color="success.main">+2.34%</Typography>
                </Box>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography>7d Change:</Typography>
                <Box display="flex" alignItems="center">
                  <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
                  <Typography color="success.main">+12.67%</Typography>
                </Box>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography>30d Change:</Typography>
                <Box display="flex" alignItems="center">
                  <TrendingDown sx={{ color: 'error.main', mr: 1 }} />
                  <Typography color="error.main">-3.21%</Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography>Current APY:</Typography>
                <Typography fontWeight="bold">
                  {yieldOpportunities.length > 0 ?
                    (yieldOpportunities.reduce((sum, opp) => sum + (opp.pool?.apy || 0), 0) / yieldOpportunities.length).toFixed(2) :
                    '0.00'
                  }%
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography>Risk Score:</Typography>
                <Chip
                  label="Medium"
                  size="small"
                  color="warning"
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Active Strategies */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Active DeFi Strategies
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Agriculture sx={{ mr: 2, color: 'primary.main' }} />
                      <Typography variant="h6">Yield Farming</Typography>
                    </Box>
                    <Typography variant="h4" color="primary">
                      {yieldOpportunities.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active opportunities
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => onTabSwitch(4)}
                      sx={{ mt: 1 }}
                    >
                      Manage
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <SwapHoriz sx={{ mr: 2, color: 'secondary.main' }} />
                      <Typography variant="h6">Liquidity</Typography>
                    </Box>
                    <Typography variant="h4" color="secondary">
                      {liquidityPositions.totalPositions || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      LP positions
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => onTabSwitch(3)}
                      sx={{ mt: 1 }}
                    >
                      Manage
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Bridge sx={{ mr: 2, color: 'info.main' }} />
                      <Typography variant="h6">Cross-Chain</Typography>
                    </Box>
                    <Typography variant="h4" color="info">
                      {bridgeTransfers.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active transfers
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => onTabSwitch(1)}
                      sx={{ mt: 1 }}
                    >
                      Manage
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Timeline sx={{ mr: 2, color: 'warning.main' }} />
                      <Typography variant="h6">Flash Loans</Typography>
                    </Box>
                    <Typography variant="h4" color="warning">
                      {flashLoanOpportunities.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Opportunities
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => onTabSwitch(2)}
                      sx={{ mt: 1 }}
                    >
                      Manage
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      {/* View Mode Selector */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant={viewMode === 'summary' ? 'contained' : 'outlined'}
          onClick={() => setViewMode('summary')}
          sx={{ mr: 1 }}
          startIcon={<AccountBalance />}
        >
          Summary
        </Button>
        <Button
          variant={viewMode === 'detailed' ? 'contained' : 'outlined'}
          onClick={() => setViewMode('detailed')}
          sx={{ mr: 1 }}
          startIcon={<BarChart />}
        >
          Detailed
        </Button>
        <Button
          variant={viewMode === 'analytics' ? 'contained' : 'outlined'}
          onClick={() => setViewMode('analytics')}
          startIcon={<Timeline />}
        >
          Analytics
        </Button>
      </Box>

      {/* Content based on view mode */}
      {viewMode === 'summary' && renderSummaryView()}
      {viewMode === 'detailed' && renderDetailedView()}
      {viewMode === 'analytics' && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6">Advanced Analytics</Typography>
          <Typography variant="body2" color="text.secondary">
            Coming soon...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PortfolioOverview;