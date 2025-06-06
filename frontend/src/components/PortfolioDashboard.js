// d:\intel\cryptorizz\main\signalstack-rebalancing-bot\frontend\src\components\PortfolioDashboard.js
import React from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';

const PortfolioDashboard = ({ portfolioHistory, currentAllocation, performance }) => {
  // Calculate key metrics
  const totalReturn = performance.totalReturn;
  const sharpeRatio = performance.sharpeRatio;
  const volatility = performance.volatility;
  
  return (
    <div className="dashboard-container">
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Return</h3>
          <p className={totalReturn >= 0 ? 'positive' : 'negative'}>
            {totalReturn.toFixed(2)}%
          </p>
        </div>
        <div className="metric-card">
          <h3>Sharpe Ratio</h3>
          <p>{sharpeRatio.toFixed(2)}</p>
        </div>
        <div className="metric-card">
          <h3>Volatility</h3>
          <p>{volatility.toFixed(2)}%</p>
        </div>
      </div>
      
      <div className="chart-container">
        <h3>Portfolio Value Over Time</h3>
        <Line 
          data={createPortfolioLineChart(portfolioHistory)}
          options={lineChartOptions}
        />
      </div>
      
      <div className="allocation-chart">
        <h3>Current Allocation</h3>
        <Pie 
          data={createAllocationPieChart(currentAllocation)}
          options={pieChartOptions}
        />
      </div>
    </div>
  );
};