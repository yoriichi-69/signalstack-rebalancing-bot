import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { fetchPortfolios, rebalancePortfolio } from '../api/portfolio';
import { Portfolio as PortfolioType } from '../types/portfolio';
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
  Skeleton,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Sector,
} from 'recharts';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import useSound from 'use-sound';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Custom shape for the active pie sector
const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5} // Explode effect
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#fff">{`${(percent * 100).toFixed(2)}%`}</text>
    </g>
  );
};

const successSound = 'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa4c7b.mp3'; // fun pop sound

const Portfolio: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: portfolios, isLoading, error } = useQuery<PortfolioType[]>('portfolios', fetchPortfolios);
  const mutation = useMutation((id: string) => rebalancePortfolio(id), {
    onSuccess: () => {
      toast.success('Portfolio rebalanced successfully');
      queryClient.invalidateQueries('portfolios');
    },
    onError: () => {
      toast.error('Rebalance failed');
    },
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [play] = useSound(successSound, { volume: 0.25 });

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handleRebalance = (id: string) => {
    mutation.mutate(id, {
      onSuccess: () => {
        setShowConfetti(true);
        play();
        setTimeout(() => setShowConfetti(false), 2500);
      }
    });
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" width="100%" height={300} />
      </Box>
    );
  }

  if (error || !portfolios || portfolios.length === 0) {
    return <Typography variant="h6">No portfolios found.</Typography>;
  }

  const portfolio = portfolios[0];
  const assetsData = portfolio.assets.map(asset => ({
    name: asset.symbol,
    symbol: asset.symbol,
    allocation: asset.weight * 100,
    value: asset.currentPrice * asset.quantity,
  }));
  const totalValue = portfolio.totalValue;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={250} recycle={false} />}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4">Portfolio</Typography>
          <Button variant="contained" color="primary" onClick={() => handleRebalance(portfolio._id)}>
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
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      data={assetsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      dataKey="allocation"
                      onMouseEnter={onPieEnter}
                    >
                      {assetsData.map((entry, index) => (
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
                  <Typography variant="h5">{assetsData.length}</Typography>
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
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assetsData.map((asset) => (
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
                        <TableCell align="right">{asset.allocation.toFixed(2)}%</TableCell>
                        <TableCell align="right">${asset.value.toLocaleString()}</TableCell>
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
    </motion.div>
  );
};

export default Portfolio; 