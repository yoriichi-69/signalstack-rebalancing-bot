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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Mock data for demonstration
const performanceData = [
  { month: 'Jan', portfolio: 10000, benchmark: 10000 },
  { month: 'Feb', portfolio: 11200, benchmark: 10500 },
  { month: 'Mar', portfolio: 10800, benchmark: 10200 },
  { month: 'Apr', portfolio: 11500, benchmark: 10800 },
  { month: 'May', portfolio: 12200, benchmark: 11200 },
  { month: 'Jun', portfolio: 13000, benchmark: 11500 },
];

const signalAccuracy = [
  { strategy: 'Mean Reversion', accuracy: 68, trades: 45 },
  { strategy: 'Momentum', accuracy: 72, trades: 38 },
  { strategy: 'Volatility', accuracy: 65, trades: 52 },
  { strategy: 'Breakout', accuracy: 70, trades: 41 },
];

const recentTrades = [
  {
    id: 1,
    date: '2024-03-15',
    asset: 'BTC',
    type: 'Buy',
    amount: 0.5,
    price: 65000,
    value: 32500,
    strategy: 'Mean Reversion',
  },
  {
    id: 2,
    date: '2024-03-14',
    asset: 'ETH',
    type: 'Sell',
    amount: 2.5,
    price: 3500,
    value: 8750,
    strategy: 'Momentum',
  },
  {
    id: 3,
    date: '2024-03-13',
    asset: 'SOL',
    type: 'Buy',
    amount: 25,
    price: 120,
    value: 3000,
    strategy: 'Breakout',
  },
];

const Analytics: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Analytics
      </Typography>

      <Grid container spacing={3}>
        {/* Performance Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Portfolio Performance</Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Time Range</InputLabel>
                <Select label="Time Range" defaultValue="6m">
                  <MenuItem value="1m">1 Month</MenuItem>
                  <MenuItem value="3m">3 Months</MenuItem>
                  <MenuItem value="6m">6 Months</MenuItem>
                  <MenuItem value="1y">1 Year</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.5)" />
                  <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="portfolio"
                    name="Portfolio"
                    stroke="#6366f1"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="benchmark"
                    name="Benchmark"
                    stroke="#6b7280"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Signal Accuracy */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Signal Accuracy
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={signalAccuracy}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis dataKey="strategy" stroke="rgba(255, 255, 255, 0.5)" />
                  <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="accuracy" fill="#6366f1" name="Accuracy %" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Trades */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Recent Trades
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Asset</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell>Strategy</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTrades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>{trade.date}</TableCell>
                      <TableCell>{trade.asset}</TableCell>
                      <TableCell>
                        <Chip
                          label={trade.type}
                          color={trade.type === 'Buy' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{trade.amount}</TableCell>
                      <TableCell align="right">
                        ${trade.value.toLocaleString()}
                      </TableCell>
                      <TableCell>{trade.strategy}</TableCell>
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

export default Analytics; 