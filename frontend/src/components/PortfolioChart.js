import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const PortfolioValueChart = ({ portfolioHistory = [] }) => {
  // Format data for the chart
  const data = {
    labels: portfolioHistory.map(item => {
      const date = new Date(item.timestamp);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }),
    datasets: [
      {
        label: 'Portfolio Value (USD)',
        data: portfolioHistory.map(item => item.value),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Portfolio Value Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <div style={{ height: '300px' }}>
      {portfolioHistory.length > 1 ? (
        <Line options={options} data={data} />
      ) : (
        <div className="no-data-message">Start rebalancing to see performance data.</div>
      )}
    </div>
  );
};

export const TokenWeightsChart = ({ tokens = [], currentWeights = [], targetWeights = [] }) => {
  const data = {
    labels: tokens,
    datasets: [
      {
        label: 'Current Weights (%)',
        data: currentWeights,
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
      {
        label: 'Target Weights (%)',
        data: targetWeights,
        backgroundColor: 'rgba(153, 102, 255, 0.7)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Portfolio Token Weights Comparison',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <div style={{ height: '300px' }}>
      <Bar options={options} data={data} />
    </div>
  );
};