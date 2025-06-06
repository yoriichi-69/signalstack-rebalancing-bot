import React, { ReactNode } from 'react';
import { Box, SxProps, Theme } from '@mui/material';
import { keyframes } from '@emotion/react';

interface GlowEffectProps {
  children: ReactNode;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  intensity?: 'low' | 'medium' | 'high';
  sx?: SxProps<Theme>;
}

const GlowEffect: React.FC<GlowEffectProps> = ({
  children,
  color = '#8b5cf6',
  size = 'medium',
  intensity = 'medium',
  sx = {}
}) => {
  // Size map
  const sizeMap = {
    small: '5px',
    medium: '10px',
    large: '15px'
  };
  
  // Intensity map
  const intensityMap = {
    low: 0.3,
    medium: 0.6,
    high: 0.9
  };
  
  // Animation
  const pulse = keyframes`
    0% {
      box-shadow: 0 0 ${sizeMap[size]} ${color}${intensityMap[intensity]};
    }
    50% {
      box-shadow: 0 0 ${parseInt(sizeMap[size]) * 2}px ${color}${intensityMap[intensity]};
    }
    100% {
      box-shadow: 0 0 ${sizeMap[size]} ${color}${intensityMap[intensity]};
    }
  `;
  
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-block',
        animation: `${pulse} 3s infinite ease-in-out`,
        '&:hover': {
          animation: 'none',
          boxShadow: `0 0 ${parseInt(sizeMap[size]) * 2.5}px ${color}${intensityMap[intensity]}`,
          transform: 'translateY(-2px)',
        },
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        borderRadius: '12px',
        ...sx
      }}
    >
      {children}
    </Box>
  );
};

export default GlowEffect; 