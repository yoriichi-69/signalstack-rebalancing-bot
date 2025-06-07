import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Candlestick } from 'react-chartjs-2';
import './TradingInterface.css';

const TradingInterface = ({ selectedAsset = 'BTC', onTradeExecute }) => {
  const [orderType, setOrderType] = useState('market');
  const [tradeType, setTradeType] = useState('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [chartTimeframe, setChartTimeframe] = useState('1h');
  const [isExecuting, setIsExecuting] = useState(false);
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [recentTrades, setRecentTrades] = useState([]);
  const [technicalIndicators, setTechnicalIndicators] = useState({});
  const [priceData, setPriceData] = useState([]);
  const chartRef = useRef(null);

  useEffect(() => {
    generateMockData();
    const interval = setInterval(generateMockData, 3000);
    return () => clearInterval(interval);
  }, [selectedAsset, chartTimeframe]);

  const generateMockData = () => {
    // Generate realistic price data
    const basePrice = getBasePrice(selectedAsset);
    const prices = [];
    const orderBookData = { bids: [], asks: [] };
    const trades = [];

    // Generate price history for chart
    for (let i = 0; i < 100; i++) {
      const timestamp = Date.now() - (100 - i) * 60000;
      const volatility = 0.02;
      const change = (Math.random() - 0.5) * volatility;
      const price = basePrice * (1 + change * i / 100);
      
      prices.push({
        x: timestamp,
        y: price,
        open: price * 0.999,
        high: price * 1.002,
        low: price * 0.998,
        close: price,
        volume: Math.random() * 1000000
      });
    }

    // Generate order book
    const currentPrice = prices[prices.length - 1].y;
    for (let i = 0; i < 20; i++) {
      orderBookData.bids.push({
        price: currentPrice * (1 - (i + 1) * 0.0001),
        amount: Math.random() * 10,
        total: 0
      });
      orderBookData.asks.push({
        price: currentPrice * (1 + (i + 1) * 0.0001),
        amount: Math.random() * 10,
        total: 0
      });
    }

    // Generate recent trades
    for (let i = 0; i < 10; i++) {
      trades.push({
        price: currentPrice * (1 + (Math.random() - 0.5) * 0.001),
        amount: Math.random() * 5,
        type: Math.random() > 0.5 ? 'buy' : 'sell',
        timestamp: Date.now() - Math.random() * 300000
      });
    }

    // Generate technical indicators
    const indicators = {
      rsi: 30 + Math.random() * 40,
      macd: (Math.random() - 0.5) * 100,
      bollinger: {
        upper: currentPrice * 1.02,
        middle: currentPrice,
        lower: currentPrice * 0.98
      },
      sma20: currentPrice * (0.995 + Math.random() * 0.01),
      ema50: currentPrice * (0.99 + Math.random() * 0.02),
      volume: Math.random() * 1000000
    };

    setPriceData(prices);
    setOrderBook(orderBookData);
    setRecentTrades(trades);
    setTechnicalIndicators(indicators);
  };

  const getBasePrice = (asset) => {
    const basePrices = {
      'BTC': 104890,
      'ETH': 2488,
      'SOL': 152,
      'ADA': 0.35,
      'DOT': 6.5
    };
    return basePrices[asset] || 100;
  };

  const executeTrade = async () => {
    if (!amount || (orderType === 'limit' && !price)) {
      alert('Please fill in all required fields');
      return;
    }

    setIsExecuting(true);

    // Simulate trade execution
    setTimeout(() => {
      const trade = {
        type: tradeType,
        asset: selectedAsset,
        amount: parseFloat(amount),
        price: orderType === 'market' ? getCurrentPrice() : parseFloat(price),
        orderType,
        timestamp: Date.now(),
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        takeProfit: takeProfit ? parseFloat(takeProfit) : null,
        leverage
      };

      onTradeExecute && onTradeExecute(trade);
      
      // Reset form
      setAmount('');
      setPrice('');
      setStopLoss('');
      setTakeProfit('');
      setIsExecuting(false);

      // Show success notification
      showTradeNotification(trade);
    }, 2000);
  };

  const getCurrentPrice = () => {
    return priceData.length > 0 ? priceData[priceData.length - 1].y : 0;
  };

  const showTradeNotification = (trade) => {
    // Integration with notification service
    console.log('Trade executed:', trade);
  };

  const calculateTradeValue = () => {
    const tradeAmount = parseFloat(amount) || 0;
    const tradePrice = orderType === 'market' ? getCurrentPrice() : (parseFloat(price) || 0);
    return tradeAmount * tradePrice;
  };

  const chartData = {
    datasets: [{
      label: `${selectedAsset} Price`,
      data: priceData,
      borderColor: '#40e0d0',
      backgroundColor: 'rgba(64, 224, 208, 0.1)',
      borderWidth: 2,
      fill: false,
      tension: 0.1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#40e0d0',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        type: 'time',
        time: { unit: 'minute' },
        ticks: { color: '#a0a0a0' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        ticks: { 
          color: '#a0a0a0',
          callback: (value) => `$${value.toLocaleString()}`
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  return (
    <div className="trading-interface">
      {/* Trading Chart Section */}
      <div className="trading-chart-section">
        <div className="chart-header">
          <div className="asset-info">
            <h2 className="asset-symbol">{selectedAsset}</h2>
            <div className="price-info">
              <span className="current-price">
                ${getCurrentPrice().toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span className="price-change positive">
                +2.45% (+$2,187.34)
              </span>
            </div>
          </div>

          <div className="chart-controls">
            <div className="timeframe-selector">
              {['1m', '5m', '15m', '1h', '4h', '1d'].map(tf => (
                <motion.button
                  key={tf}
                  className={`timeframe-btn ${chartTimeframe === tf ? 'active' : ''}`}
                  onClick={() => setChartTimeframe(tf)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tf}
                </motion.button>
              ))}
            </div>

            <div className="chart-type-selector">
              <button className="chart-type-btn active">📈 Line</button>
              <button className="chart-type-btn">📊 Candlestick</button>
            </div>
          </div>
        </div>

        <div className="chart-container">
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        </div>

        <div className="technical-indicators">
          <div className="indicator">
            <span className="indicator-label">RSI:</span>
            <span className={`indicator-value ${technicalIndicators.rsi < 30 ? 'oversold' : technicalIndicators.rsi > 70 ? 'overbought' : 'neutral'}`}>
              {technicalIndicators.rsi?.toFixed(1)}
            </span>
          </div>
          <div className="indicator">
            <span className="indicator-label">MACD:</span>
            <span className={`indicator-value ${technicalIndicators.macd > 0 ? 'bullish' : 'bearish'}`}>
              {technicalIndicators.macd?.toFixed(2)}
            </span>
          </div>
          <div className="indicator">
            <span className="indicator-label">Vol:</span>
            <span className="indicator-value">
              {(technicalIndicators.volume / 1000000).toFixed(1)}M
            </span>
          </div>
        </div>
      </div>

      {/* Trading Panel */}
      <div className="trading-panel">
        <div className="order-form">
          <div className="order-type-selector">
            {['market', 'limit', 'stop'].map(type => (
              <motion.button
                key={type}
                className={`order-type-btn ${orderType === type ? 'active' : ''}`}
                onClick={() => setOrderType(type)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </motion.button>
            ))}
          </div>

          <div className="trade-type-selector">
            <motion.button
              className={`trade-type-btn buy ${tradeType === 'buy' ? 'active' : ''}`}
              onClick={() => setTradeType('buy')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Buy
            </motion.button>
            <motion.button
              className={`trade-type-btn sell ${tradeType === 'sell' ? 'active' : ''}`}
              onClick={() => setTradeType('sell')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Sell
            </motion.button>
          </div>

          <div className="form-group">
            <label>Amount ({selectedAsset})</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="form-input"
            />
            <div className="input-helper">
              Available: 1.2547 {selectedAsset}
            </div>
          </div>

          {orderType === 'limit' && (
            <div className="form-group">
              <label>Price (USD)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={getCurrentPrice().toFixed(2)}
                className="form-input"
              />
            </div>
          )}

          <div className="advanced-options">
            <div className="form-group">
              <label>Stop Loss (USD)</label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="Optional"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Take Profit (USD)</label>
              <input
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="Optional"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Leverage: {leverage}x</label>
              <input
                type="range"
                min="1"
                max="10"
                value={leverage}
                onChange={(e) => setLeverage(parseInt(e.target.value))}
                className="leverage-slider"
              />
            </div>
          </div>

          <div className="trade-summary">
            <div className="summary-row">
              <span>Trade Value:</span>
              <span>${calculateTradeValue().toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Fee (0.1%):</span>
              <span>${(calculateTradeValue() * 0.001).toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>${(calculateTradeValue() * 1.001).toLocaleString()}</span>
            </div>
          </div>

          <motion.button
            className={`execute-btn ${tradeType}`}
            onClick={executeTrade}
            disabled={isExecuting || !amount}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isExecuting ? (
              <>
                <motion.div 
                  className="spinner"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Executing...
              </>
            ) : (
              `${tradeType.charAt(0).toUpperCase() + tradeType.slice(1)} ${selectedAsset}`
            )}
          </motion.button>
        </div>

        {/* Order Book */}
        <div className="order-book">
          <h3>Order Book</h3>
          <div className="order-book-content">
            <div className="asks-section">
              <div className="section-header">
                <span>Price (USD)</span>
                <span>Amount</span>
                <span>Total</span>
              </div>
              {orderBook.asks.slice(0, 10).map((ask, index) => (
                <div key={index} className="order-row ask">
                  <span className="price">${ask.price.toFixed(2)}</span>
                  <span className="amount">{ask.amount.toFixed(4)}</span>
                  <span className="total">{(ask.price * ask.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="spread-indicator">
              <span>Spread: $12.34 (0.02%)</span>
            </div>

            <div className="bids-section">
              {orderBook.bids.slice(0, 10).map((bid, index) => (
                <div key={index} className="order-row bid">
                  <span className="price">${bid.price.toFixed(2)}</span>
                  <span className="amount">{bid.amount.toFixed(4)}</span>
                  <span className="total">{(bid.price * bid.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="recent-trades">
          <h3>Recent Trades</h3>
          <div className="trades-list">
            {recentTrades.map((trade, index) => (
              <div key={index} className={`trade-row ${trade.type}`}>
                <span className="trade-price">
                  ${trade.price.toFixed(2)}
                </span>
                <span className="trade-amount">
                  {trade.amount.toFixed(4)}
                </span>
                <span className="trade-time">
                  {new Date(trade.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingInterface;