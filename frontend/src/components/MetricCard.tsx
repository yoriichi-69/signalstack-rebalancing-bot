import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent
} from '@mui/material';
import CountUp from 'react-countup';
import { SvgIconProps } from '@mui/material/SvgIcon';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  trendColor?: 'success' | 'error' | 'warning' | 'info';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  prefix = '',
  suffix = '',
  decimals = 2,
  trendColor = 'success',
}) => {
  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString('en-US', { 
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : value;

  return (
    <Card sx={{ 
      height: '100%',
      background: 'rgba(21, 21, 32, 0.7)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(0, 255, 157, 0.1)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(45deg, rgba(0, 255, 157, 0.1), rgba(255, 0, 255, 0.1))',
        opacity: 0,
        transition: 'opacity 0.3s ease',
      },
      '&:hover': {
        transform: 'translateY(-4px)',
        border: '1px solid rgba(0, 255, 157, 0.3)',
        boxShadow: '0 8px 30px rgba(0, 255, 157, 0.2)',
        '&::before': {
          opacity: 1,
        },
        '& .metric-icon': {
          transform: 'scale(1.1) rotate(5deg)',
          color: '#00ff9d',
        },
        '& .metric-value': {
          textShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
        },
      },
    }}>
      <CardContent>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2,
          position: 'relative',
        }}>
          <Box sx={{ 
            mr: 2,
            p: 1.5,
            borderRadius: 2,
            background: 'rgba(0, 255, 157, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
          }} className="metric-icon">
            {icon}
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              background: 'linear-gradient(45deg, #00ff9d 30%, #00cc7d 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {title}
          </Typography>
        </Box>
        <Typography 
          variant="h4" 
          sx={{ 
            mb: 1, 
            fontWeight: 700,
            color: '#00ff9d',
            transition: 'all 0.3s ease',
          }}
          className="metric-value"
        >
          {prefix}{formattedValue}{suffix}
        </Typography>
        {trend && (
          <Typography 
            variant="body2" 
            color={`${trendColor}.main`}
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontWeight: 500,
              textShadow: '0 0 10px rgba(0, 255, 157, 0.3)',
            }}
          >
            {trend}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard; 