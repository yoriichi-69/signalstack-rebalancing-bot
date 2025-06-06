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
  decimals = 0,
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
      background: 'rgba(30, 41, 59, 0.7)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'transform 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-4px)',
      },
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ 
            mr: 2,
            p: 1,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {icon}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
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