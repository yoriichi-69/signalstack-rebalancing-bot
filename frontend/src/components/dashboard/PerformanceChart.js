import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import './PerformanceChart.css';

const PerformanceChart = ({ data, timeframe }) => {
  const [chartType, setChartType] = useState('area');
  const [performanceData, setPerformanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock performance data - replace with real data
  const mockData = {
    '1h': [
      { time: '12:00', value: 125420, change: 0 },
      { time: '12:15', value: 125890, change: 0.37 },
      { time: '12:30', value: 124560, change: -0.69 },
      { time: '12:45', value: 126100, change: 0.54 },
      { time: '13:00', value: 127230, change: 1.44 }
    ],
    '24h': [
      { time: '00:00', value: 122400, change: 0 },
      { time: '04:00', value: 123200, change: 0.65 },
      { time: '08:00', value: 121800, change: -0.49 },
      { time: '12:00', value: 125420, change: 2.47 },
      { time: '16:00', value: 126800, change: 3.59 },
      { time: '20:00', value: 125600, change: 2.61 },
      { time: '24:00', value: 127230, change: 3.95 }
    ],
    '7d': [
      { time: 'Mon', value: 118500, change: 0 },
      { time: 'Tue', value: 120200, change: 1.43 },
      { time: 'Wed', value: 119800, change: 1.10 },
      { time: 'Thu', value: 122400, change: 3.29 },
      { time: 'Fri', value: 125420, change: 5.84 },
      { time: 'Sat', value: 126100, change: 6.41 },
      { time: 'Sun', value: 127230, change: 7.37 }
    ]
  };

  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setPerformanceData(data || mockData[timeframe] || mockData['24h']);
      setIsLoading(false);
    }, 500);
  }, [data, timeframe]);

  const currentValue = performanceData[performanceData.length - 1]?.value || 0;
  const previousValue = performanceData[0]?.value || 0;
  const totalChange = ((currentValue - previousValue) / previousValue * 100);
  const totalChangeAmount = currentValue - previousValue;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <p className="tooltip-time">{label}</p>
          <p className="tooltip-value">
            Value: <span>${data.value.toLocaleString()}</span>
          </p>
          <p className={`tooltip-change ${data.change >= 0 ? 'positive' : 'negative'}`}>
            Change: <span>{data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="performance-chart-container">
        <div className="chart-header">
          <div className="chart-skeleton-title"></div>
          <div className="chart-skeleton-stats"></div>
        </div>
        <div className="chart-skeleton"></div>
      </div>
    );
  }

  return (
    <motion.div 
      className="performance-chart-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="chart-header">
        <div className="chart-title-section">
          <h3 className="chart-title">Performance</h3>
          <div className="chart-stats">
            <span className="current-value">${currentValue.toLocaleString()}</span>
            <span className={`change-stats ${totalChange >= 0 ? 'positive' : 'negative'}`}>
              {totalChange >= 0 ? '+' : ''}${totalChangeAmount.toLocaleString()} 
              ({totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="chart-controls">
          <div className="chart-type-selector">
            {['line', 'area'].map(type => (
              <motion.button
                key={type}
                className={`chart-type-btn ${chartType === type ? 'active' : ''}`}
                onClick={() => setChartType(type)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {type === 'line' ? '📈' : '📊'}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'area' ? (
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#00ff88"
                strokeWidth={2}
                fill="url(#colorGradient)"
                dot={{ fill: '#00ff88', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#00ff88', strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#00ff88"
                strokeWidth={3}
                dot={{ fill: '#00ff88', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#00ff88', strokeWidth: 2 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Performance Metrics */}
      <div className="performance-metrics">
        <div className="metric-item">
          <span className="metric-label">24h High</span>
          <span className="metric-value">$128,450</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">24h Low</span>
          <span className="metric-value">$121,200</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Volume</span>
          <span className="metric-value">$45.2K</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Volatility</span>
          <span className="metric-value">2.4%</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PerformanceChart;