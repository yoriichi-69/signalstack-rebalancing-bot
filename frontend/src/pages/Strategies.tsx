import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Settings,
  TrendingUp,
  TrendingDown,
  Speed,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

// Mock data for demonstration
const strategies = [
  {
    id: 1,
    name: 'Mean Reversion',
    description: 'Trades based on price deviations from moving averages',
    performance: 12.5,
    winRate: 68,
    trades: 45,
    status: 'active',
    chartData: [
      { time: 'Jan', value: 100 },
      { time: 'Feb', value: 112 },
      { time: 'Mar', value: 108 },
      { time: 'Apr', value: 115 },
      { time: 'May', value: 122 },
      { time: 'Jun', value: 125 },
    ],
  },
  {
    id: 2,
    name: 'Momentum',
    description: 'Follows strong price trends with volume confirmation',
    performance: 8.2,
    winRate: 72,
    trades: 38,
    status: 'active',
    chartData: [
      { time: 'Jan', value: 100 },
      { time: 'Feb', value: 105 },
      { time: 'Mar', value: 108 },
      { time: 'Apr', value: 112 },
      { time: 'May', value: 115 },
      { time: 'Jun', value: 118 },
    ],
  },
  {
    id: 3,
    name: 'Volatility Breakout',
    description: 'Identifies and trades volatility expansion patterns',
    performance: 15.8,
    winRate: 65,
    trades: 52,
    status: 'paused',
    chartData: [
      { time: 'Jan', value: 100 },
      { time: 'Feb', value: 108 },
      { time: 'Mar', value: 115 },
      { time: 'Apr', value: 112 },
      { time: 'May', value: 118 },
      { time: 'Jun', value: 125 },
    ],
  },
];

const StrategyCard: React.FC<{
  strategy: typeof strategies[0];
}> = ({ strategy }) => {
  const isActive = strategy.status === 'active';

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {strategy.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {strategy.description}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={isActive ? 'Pause Strategy' : 'Activate Strategy'}>
              <IconButton size="small" color={isActive ? 'primary' : 'default'}>
                {isActive ? <Pause /> : <PlayArrow />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Configure Strategy">
              <IconButton size="small">
                <Settings />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Performance
            </Typography>
            <Typography
              variant="h6"
              color={strategy.performance >= 0 ? 'success.main' : 'error.main'}
            >
              {strategy.performance >= 0 ? '+' : ''}
              {strategy.performance}%
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Win Rate
            </Typography>
            <Typography variant="h6">{strategy.winRate}%</Typography>
          </Grid>
        </Grid>

        <Box sx={{ height: 100 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={strategy.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="time" stroke="rgba(255, 255, 255, 0.5)" />
              <YAxis hide />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 41, 59, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={isActive ? '#6366f1' : '#6b7280'}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip
            label={isActive ? 'Active' : 'Paused'}
            color={isActive ? 'success' : 'default'}
            size="small"
          />
          <Typography variant="caption" color="text.secondary">
            {strategy.trades} trades
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const Strategies: React.FC = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Trading Strategies</Typography>
        <Button variant="contained" color="primary">
          Add Strategy
        </Button>
      </Box>

      <Grid container spacing={3}>
        {strategies.map((strategy) => (
          <Grid item xs={12} md={4} key={strategy.id}>
            <StrategyCard strategy={strategy} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Strategies; 