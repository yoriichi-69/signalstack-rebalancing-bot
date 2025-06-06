import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  AccountBalance,
  AutoGraph,
  Speed,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data for demonstration
const portfolioValue = [
  { time: 'Jan', value: 10000 },
  { time: 'Feb', value: 12000 },
  { time: 'Mar', value: 11500 },
  { time: 'Apr', value: 13000 },
  { time: 'May', value: 14500 },
  { time: 'Jun', value: 16000 },
];

const signalData = [
  { name: 'Mean Reversion', value: 1 },
  { name: 'Momentum', value: -1 },
  { name: 'Volatility', value: 0 },
  { name: 'Breakout', value: 1 },
];

const MetricCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
}> = ({ title, value, icon, trend }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography color="text.secondary" variant="subtitle2">
          {title}
        </Typography>
        {icon}
      </Box>
      <Typography variant="h4" component="div" sx={{ mb: 1 }}>
        {value}
      </Typography>
      {trend && (
        <Typography
          variant="body2"
          color={trend.startsWith('+') ? 'success.main' : 'error.main'}
        >
          {trend}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const SignalIndicator: React.FC<{
  name: string;
  value: number;
}> = ({ name, value }) => (
  <Box sx={{ mb: 2 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
      <Typography variant="body2">{name}</Typography>
      <Typography
        variant="body2"
        color={value === 1 ? 'success.main' : value === -1 ? 'error.main' : 'warning.main'}
      >
        {value === 1 ? 'Bullish' : value === -1 ? 'Bearish' : 'Neutral'}
      </Typography>
    </Box>
    <LinearProgress
      variant="determinate"
      value={((value + 1) / 2) * 100}
      sx={{
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        '& .MuiLinearProgress-bar': {
          backgroundColor: value === 1 ? 'success.main' : value === -1 ? 'error.main' : 'warning.main',
        },
      }}
    />
  </Box>
);

const Dashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Portfolio Value"
            value="$16,000"
            icon={<AccountBalance color="primary" />}
            trend="+12.5%"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Performance"
            value="+15.2%"
            icon={<TrendingUp color="success" />}
            trend="+2.3%"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Active Strategies"
            value="4"
            icon={<AutoGraph color="info" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Signal Strength"
            value="75%"
            icon={<Speed color="warning" />}
          />
        </Grid>

        {/* Portfolio Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Portfolio Value
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={portfolioValue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis dataKey="time" stroke="rgba(255, 255, 255, 0.5)" />
                  <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Signal Indicators */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Signal Indicators
            </Typography>
            {signalData.map((signal) => (
              <SignalIndicator
                key={signal.name}
                name={signal.name}
                value={signal.value}
              />
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 