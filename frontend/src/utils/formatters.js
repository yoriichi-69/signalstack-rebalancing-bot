// Format currency values
export const formatCurrency = (value, currency = 'USD', decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0.00';
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return formatter.format(value);
};

// Format percentage values
export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }

  return `${value.toFixed(decimals)}%`;
};

// Format large numbers with suffixes
export const formatLargeNumber = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  const suffixes = ['', 'K', 'M', 'B', 'T'];
  let suffixIndex = 0;
  let formattedValue = value;

  while (formattedValue >= 1000 && suffixIndex < suffixes.length - 1) {
    formattedValue /= 1000;
    suffixIndex++;
  }

  return `${formattedValue.toFixed(decimals)}${suffixes[suffixIndex]}`;
};

// Format time duration
export const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  const now = new Date();
  const target = new Date(timestamp);
  const diff = target - now;

  if (diff < 0) {
    return 'Completed';
  }

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else {
    return `${minutes}m`;
  }
};

// Format blockchain addresses
export const formatAddress = (address, startChars = 6, endChars = 4) => {
  if (!address) return '';
  
  if (address.length <= startChars + endChars) {
    return address;
  }

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

// Get chain name from chain ID
export const getChainName = (chainId) => {
  const chainNames = {
    1: 'Ethereum',
    56: 'BSC',
    137: 'Polygon',
    43114: 'Avalanche',
    10: 'Optimism',
    42161: 'Arbitrum',
    250: 'Fantom'
  };

  return chainNames[chainId] || `Chain ${chainId}`;
};

// Format token amounts
export const formatTokenAmount = (amount, decimals = 18, displayDecimals = 4) => {
  if (!amount) return '0';
  
  const value = parseFloat(amount) / Math.pow(10, decimals);
  return value.toFixed(displayDecimals);
};

// Format APY with color coding
export const formatAPYWithColor = (apy) => {
  const formatted = formatPercentage(apy);
  let color = 'text.primary';
  
  if (apy >= 50) color = 'success.main';
  else if (apy >= 20) color = 'warning.main';
  else if (apy < 5) color = 'text.secondary';
  
  return { formatted, color };
};

// Format risk level
export const formatRiskLevel = (riskLevel) => {
  const riskMap = {
    low: { label: 'Low Risk', color: 'success' },
    medium: { label: 'Medium Risk', color: 'warning' },
    high: { label: 'High Risk', color: 'error' },
    very_high: { label: 'Very High Risk', color: 'error' }
  };
  
  return riskMap[riskLevel] || { label: 'Unknown', color: 'default' };
};

// Format transaction status
export const formatTransactionStatus = (status) => {
  const statusMap = {
    pending: { label: 'Pending', color: 'warning' },
    completed: { label: 'Completed', color: 'success' },
    failed: { label: 'Failed', color: 'error' },
    cancelled: { label: 'Cancelled', color: 'default' },
    timeout: { label: 'Timeout', color: 'error' }
  };
  
  return statusMap[status] || { label: 'Unknown', color: 'default' };
};

// Format gas price in Gwei
export const formatGasPrice = (gasPrice) => {
  if (!gasPrice) return '0 Gwei';
  
  const gwei = gasPrice / 1e9;
  return `${gwei.toFixed(1)} Gwei`;
};

// Format block number
export const formatBlockNumber = (blockNumber) => {
  if (!blockNumber) return 'N/A';
  return `#${blockNumber.toLocaleString()}`;
};

// Format timestamp to relative time
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  const now = new Date();
  const time = new Date(timestamp);
  const diff = now - time;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

// Format health factor
export const formatHealthFactor = (healthFactor) => {
  if (!healthFactor) return 'N/A';
  
  const factor = parseFloat(healthFactor);
  let color = 'success.main';
  let status = 'Healthy';
  
  if (factor < 1.1) {
    color = 'error.main';
    status = 'Liquidatable';
  } else if (factor < 1.5) {
    color = 'warning.main';
    status = 'At Risk';
  }
  
  return {
    value: factor.toFixed(3),
    color,
    status
  };
};

// Format impermanent loss
export const formatImpermanentLoss = (ilPercentage) => {
  if (!ilPercentage) return { value: '0%', color: 'success.main', severity: 'low' };
  
  let color = 'success.main';
  let severity = 'low';
  
  if (ilPercentage > 10) {
    color = 'error.main';
    severity = 'severe';
  } else if (ilPercentage > 5) {
    color = 'warning.main';
    severity = 'high';
  } else if (ilPercentage > 2) {
    color = 'warning.main';
    severity = 'moderate';
  }
  
  return {
    value: `${ilPercentage.toFixed(2)}%`,
    color,
    severity
  };
};

// Format protocol name
export const formatProtocolName = (protocolId) => {
  const protocolNames = {
    aave: 'Aave',
    compound: 'Compound',
    uniswap: 'Uniswap',
    sushiswap: 'SushiSwap',
    pancakeswap: 'PancakeSwap',
    quickswap: 'QuickSwap',
    curve: 'Curve',
    balancer: 'Balancer',
    yearn: 'Yearn',
    convex: 'Convex',
    dydx: 'dYdX',
    euler: 'Euler',
    layerzero: 'LayerZero',
    hop: 'Hop Protocol',
    stargate: 'Stargate',
    multichain: 'Multichain'
  };
  
  return protocolNames[protocolId] || protocolId.charAt(0).toUpperCase() + protocolId.slice(1);
};