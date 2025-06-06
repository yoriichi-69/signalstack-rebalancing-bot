import React from 'react';
import { motion } from 'framer-motion';
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import GlowEffect from '../components/GlowEffect';
import { Tilt } from 'react-tilt';
import MetricCard from '../components/MetricCard';
import DashboardIcon from '@mui/icons-material/Dashboard';

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
  const tiltOptions = {
    max: 15,
    perspective: 1000,
    scale: 1.02,
    transition: true,
    easing: "cubic-bezier(.03,.98,.52,.99)",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.6 }}
    >
      <Box>
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Typography 
            variant="h4" 
            sx={{ 
              mb: 4, 
              background: 'linear-gradient(45deg, #6366f1 30%, #4f46e5 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
              letterSpacing: '-0.025em',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <DashboardIcon sx={{ fontSize: 32 }} />
            Dashboard
          </Typography>
        </motion.div>

        <Grid container spacing={3}>
          <Grid item xs={12} md={3} component={motion.div} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Tilt options={tiltOptions}>
              <GlowEffect color="#6366f1" intensity="low" size="medium">
                <MetricCard
                  title="Portfolio Value"
                  value={16000}
                  prefix="$"
                  decimals={2}
                  icon={<AccountBalance sx={{ fontSize: 28 }} />}
                  trend="+12.5%"
                  trendColor="success"
                />
              </GlowEffect>
            </Tilt>
          </Grid>
          <Grid item xs={12} md={3} component={motion.div} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Tilt options={tiltOptions}>
              <GlowEffect color="#10b981" intensity="low" size="medium">
                <MetricCard
                  title="Performance"
                  value={15.2}
                  suffix="%"
                  decimals={2}
                  icon={<TrendingUp sx={{ fontSize: 28 }} />}
                  trend="+2.3%"
                  trendColor="success"
                />
              </GlowEffect>
            </Tilt>
          </Grid>
          <Grid item xs={12} md={3} component={motion.div} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Tilt options={tiltOptions}>
              <GlowEffect color="#3b82f6" intensity="low" size="medium">
                <MetricCard
                  title="Active Strategies"
                  value={4}
                  icon={<AutoGraph sx={{ fontSize: 28 }} />}
                />
              </GlowEffect>
            </Tilt>
          </Grid>
          <Grid item xs={12} md={3} component={motion.div} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Tilt options={tiltOptions}>
              <GlowEffect color="#f59e0b" intensity="low" size="medium">
                <MetricCard
                  title="Signal Strength"
                  value={75}
                  suffix="%"
                  icon={<Speed sx={{ fontSize: 28 }} />}
                />
              </GlowEffect>
            </Tilt>
          </Grid>

          {/* Portfolio Chart */}
          <Grid item xs={12} md={8} component={motion.div} 
            initial={{ opacity: 0, y: 40 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.7, duration: 0.7 }}
          >
            <Card sx={{ 
              height: '100%',
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Portfolio Performance
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={portfolioValue}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis 
                        dataKey="time" 
                        stroke="rgba(255, 255, 255, 0.5)"
                        tick={{ fill: 'rgba(255, 255, 255, 0.5)' }}
                      />
                      <YAxis 
                        stroke="rgba(255, 255, 255, 0.5)"
                        tick={{ fill: 'rgba(255, 255, 255, 0.5)' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'rgba(30, 41, 59, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 8,
                        }}
                        labelStyle={{ color: 'rgba(255, 255, 255, 0.8)' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#6366f1" 
                        strokeWidth={2}
                        dot={{ fill: '#6366f1', strokeWidth: 2 }}
                        activeDot={{ r: 8, fill: '#6366f1' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="false" 
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Signal Indicators */}
          <Grid item xs={12} md={4} component={motion.div} 
            initial={{ opacity: 0, y: 40 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.8, duration: 0.7 }}
          >
            <Card sx={{ 
              height: '100%',
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Active Signals
                </Typography>
                {signalData.map((signal, index) => (
                  <SignalIndicator key={signal.name} {...signal} />
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </motion.div>
  );
};

export default Dashboard; 