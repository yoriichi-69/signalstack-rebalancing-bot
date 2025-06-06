import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

// Mock data for demonstration
const assets = [
  { name: 'Bitcoin', symbol: 'BTC', allocation: 35, value: 5600, change: 2.5 },
  { name: 'Ethereum', symbol: 'ETH', allocation: 25, value: 4000, change: -1.2 },
  { name: 'Solana', symbol: 'SOL', allocation: 20, value: 3200, change: 5.8 },
  { name: 'Cardano', symbol: 'ADA', allocation: 15, value: 2400, change: 0.5 },
  { name: 'Polkadot', symbol: 'DOT', allocation: 5, value: 800, change: -2.1 },
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Portfolio: React.FC = () => {
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Portfolio</Typography>
        <Button variant="contained" color="primary">
          Rebalance Portfolio
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Portfolio Overview */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Asset Allocation
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assets}
                    dataKey="allocation"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, allocation }) => `${name} (${allocation}%)`}
                  >
                    {assets.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `${value}%`}
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Portfolio Summary */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Portfolio Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography color="text.secondary" variant="subtitle2">
                  Total Value
                </Typography>
                <Typography variant="h5">${totalValue.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography color="text.secondary" variant="subtitle2">
                  Assets
                </Typography>
                <Typography variant="h5">{assets.length}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography color="text.secondary" variant="subtitle2">
                  Last Rebalance
                </Typography>
                <Typography variant="h5">2 days ago</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography color="text.secondary" variant="subtitle2">
                  Next Rebalance
                </Typography>
                <Typography variant="h5">5 days</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Asset Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Assets
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Asset</TableCell>
                    <TableCell align="right">Allocation</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell align="right">24h Change</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow key={asset.symbol}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle2">{asset.name}</Typography>
                          <Typography
                            variant="caption"
                            sx={{ ml: 1, color: 'text.secondary' }}
                          >
                            {asset.symbol}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">{asset.allocation}%</TableCell>
                      <TableCell align="right">
                        ${asset.value.toLocaleString()}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: asset.change >= 0 ? 'success.main' : 'error.main',
                        }}
                      >
                        {asset.change >= 0 ? '+' : ''}
                        {asset.change}%
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={asset.allocation > 20 ? 'Overweight' : 'Balanced'}
                          color={asset.allocation > 20 ? 'warning' : 'success'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Portfolio; 