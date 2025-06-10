import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AccountService from '../../services/AccountService';
import RebalanceService from '../../services/RebalanceService';
import './VirtualTradingTerminal.css';
import axios from 'axios';

// Bot Card Component
const BotCard = ({ bot, onStopBot, onResumeBot, onDeleteBot, cryptoPrices }) => {
  const { bot_id, strategy, risk_profile, allocated_fund, status, assets } = bot;

  const portfolio_value = useMemo(() => {
    if (!assets || !cryptoPrices || Object.keys(cryptoPrices).length === 0) {
      return bot.portfolio_value || 0;
    }
    return Object.entries(assets).reduce((sum, [asset, amount]) => {
      const price = asset.toUpperCase() === 'USD' ? 1 : (cryptoPrices[asset.toUpperCase()] || 0);
      return sum + amount * price;
    }, 0);
  }, [assets, cryptoPrices, bot.portfolio_value]);

  const { pnl, pnlPercent } = useMemo(() => {
    // Calculate PnL by comparing the current portfolio value against the initial allocated funds
    // This is what the user expected to see - how much they've gained or lost from their investment
    const pnl = portfolio_value - allocated_fund;
    const pnlPercent = allocated_fund > 0 ? (pnl / allocated_fund) * 100 : 0;
    return { pnl, pnlPercent };
  }, [portfolio_value, allocated_fund]);

  const [pnlState, setPnlState] = useState({ value: pnl, direction: 'none' });

  useEffect(() => {
    if (pnl !== pnlState.value && pnlState.value !== 0) {
      const direction = pnl > pnlState.value ? 'up' : 'down';
      setPnlState({ value: pnl, direction });

      const timer = setTimeout(() => {
        setPnlState((prevState) => ({ ...prevState, direction: 'none' }));
      }, 1500);

      return () => clearTimeout(timer);
    } else if (pnlState.value === 0 && pnl !== 0) {
      setPnlState({ value: pnl, direction: 'none' });
    }
  }, [pnl, pnlState.value]);

  // Calculate total assets
  const totalAssets = assets ? Object.keys(assets).length : 0;

  return (
    <motion.div
      className={`bot-card status-${status}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bot-card-header">
        <span className="bot-strategy">{strategy.replace('_', ' ')}</span>
        <span className={`bot-status-badge status-${status}`}>{status}</span>
      </div>
      <div className="bot-card-body">
        <div className="bot-metric">
          <span className="metric-label">Initial Funds</span>
          <span className="metric-value">${allocated_fund.toLocaleString()}</span>
        </div>
        <div className="bot-metric">
          <span className="metric-label">Current Value</span>
          <span className="metric-value">${portfolio_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="bot-metric">
          <span className="metric-label">PnL</span>
          <span className={`metric-value ${pnl >= 0 ? 'positive' : 'negative'} pnl-ticker--${pnlState.direction}`}>
            {pnl >= 0 ? '+' : '-'}${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({pnlPercent.toFixed(2)}%)
          </span>
        </div>
      </div>
      <div className="bot-assets">
        <div className="bot-assets-header">
          <span className="assets-title">Assets ({totalAssets})</span>
        </div>
        <div className="bot-assets-list">
          {assets && Object.entries(assets).map(([asset, amount]) => (
            <div key={asset} className="bot-asset-item">
              <div className={`asset-icon token-${asset.toLowerCase()}`}>{asset}</div>
              <div className="asset-amount">{amount.toFixed(6)}</div>
            </div>
          ))}
          {(!assets || totalAssets === 0) && <div className="no-assets">No assets currently held</div>}
        </div>
      </div>
      <div className="bot-card-footer">
      {status === 'active' && (
          <button onClick={() => onStopBot(bot_id)} className="stop-bot-btn">
            Stop Bot
          </button>
        )}
        {status === 'stopped' && (
          <div className="stopped-bot-actions">
            <button onClick={() => onResumeBot(bot_id)} className="resume-bot-btn">
              Resume
            </button>
            <button onClick={() => onDeleteBot(bot_id)} className="delete-bot-btn">
              Delete
          </button>
        </div>
      )}
      </div>
    </motion.div>
  );
};

// Main Terminal Component
const VirtualTradingTerminal = ({ account: propAccount, setVirtualAccount, enableMultipleBots = true }) => {
  const [account, setAccount] = useState(propAccount || null);
  const [strategies, setStrategies] = useState({});
  const [loading, setLoading] = useState(!propAccount);
  const [error, setError] = useState('');
  const [cryptoPrices, setCryptoPrices] = useState({});

  // Form state
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [riskProfile, setRiskProfile] = useState(50);
  const [allocation, setAllocation] = useState(10000);

  const fetchAccountData = useCallback(async () => {
    try {
      if (!propAccount) {
        const accountData = await AccountService.getAccount();
        setAccount(accountData);
      }
    } catch (err) {
      setError('Failed to fetch account data.');
      console.error(err);
    }
  }, [propAccount]);

  const fetchCryptoPrices = useCallback(async () => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,cardano,ripple,dogecoin,shiba-inu,avalanche-2,chainlink,polkadot,tether&vs_currencies=usd');
        const remoteData = response.data;
        const prices = {};
        if (remoteData.bitcoin) prices.BTC = remoteData.bitcoin.usd;
        if (remoteData.ethereum) prices.ETH = remoteData.ethereum.usd;
        if (remoteData.solana) prices.SOL = remoteData.solana.usd;
        if (remoteData.binancecoin) prices.BNB = remoteData.binancecoin.usd;
        if (remoteData.cardano) prices.ADA = remoteData.cardano.usd;
        if (remoteData.ripple) prices.XRP = remoteData.ripple.usd;
        if (remoteData.dogecoin) prices.DOGE = remoteData.dogecoin.usd;
        if (remoteData['shiba-inu']) prices.SHIB = remoteData['shiba-inu'].usd;
        if (remoteData['avalanche-2']) prices.AVAX = remoteData['avalanche-2'].usd;
        if (remoteData.chainlink) prices.LINK = remoteData.chainlink.usd;
        if (remoteData.polkadot) prices.DOT = remoteData.polkadot.usd;
        if (remoteData.tether) prices.USDT = remoteData.tether.usd;
        setCryptoPrices(prices);
    } catch (err) {
        console.error("Failed to fetch crypto prices", err);
    }
  }, []);

  useEffect(() => {
    fetchCryptoPrices();
    const priceInterval = setInterval(fetchCryptoPrices, 30000); // Refresh every 30 seconds
    return () => clearInterval(priceInterval);
  }, [fetchCryptoPrices]);

  useEffect(() => {
    // If account is passed as prop, use it
    if (propAccount) {
      setAccount(propAccount);
      setLoading(false);
    } else {
      fetchAccountData();
    }
    
    const init = async () => {
      setLoading(true);
      try {
        const stratData = await RebalanceService.getStrategies();
        setStrategies(stratData);
        if (Object.keys(stratData).length > 0) {
            setSelectedStrategy(Object.keys(stratData)[0] || '');
        }
      } catch (err) {
        setError('Failed to fetch strategies.');
        console.error(err);
      }
      setLoading(false);
    };
    init();

    // Only set up interval if account is not provided as prop
    if (!propAccount) {
      const interval = setInterval(fetchAccountData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchAccountData, propAccount]);

  // When propAccount changes, update local state
  useEffect(() => {
    if (propAccount) {
      setAccount(propAccount);
    }
  }, [propAccount]);

  const handleDeployBot = async (e) => {
    e.preventDefault();
    setError('');
    if (!account) {
      setError("Account data not available.");
      return;
    }
    
    // Check if there's an active bot with the same strategy and user hasn't enabled multiple bots
    if (!enableMultipleBots && account.bots && account.bots.some(bot => bot.status === 'active' && bot.strategy === selectedStrategy)) {
      setError(`Bot with '${selectedStrategy}' strategy is already active. Stop it first or enable multiple bots to deploy another.`);
      return;
    }

    // Check if there's enough balance
    if (account.balance < allocation) {
      setError(`Insufficient balance. Available: $${account.balance.toLocaleString()}`);
      return;
    }
    
    setLoading(true);
    try {
      const result = await AccountService.deployBot(selectedStrategy, riskProfile, allocation);
      if (result.success) {
        // Refresh account data
        const accountData = await AccountService.getAccount();
        setAccount(accountData);
        if (setVirtualAccount) {
          setVirtualAccount(accountData);
        }
      } else {
        setError(result.error || 'Failed to deploy bot.');
      }
    } catch (err) {
      setError(err.message || 'Error deploying bot.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStopBot = async (botId) => {
    setLoading(true);
    setError('');
    try {
      const result = await AccountService.stopBot(botId);
      if (result.success) {
        // Refresh account data
        const accountData = await AccountService.getAccount();
        setAccount(accountData);
        if (setVirtualAccount) {
          setVirtualAccount(accountData);
        }
      } else {
        setError(result.error || `Failed to stop bot ${botId}.`);
      }
    } catch (err) {
      setError(`Error stopping bot: ${err.message || err}`);
      console.error('Error stopping bot:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeBot = async (botId) => {
    setLoading(true);
    setError('');
    try {
      const result = await AccountService.resumeBot(botId);
      if (result.success) {
        // Refresh account data
        const accountData = await AccountService.getAccount();
        setAccount(accountData);
        if (setVirtualAccount) {
          setVirtualAccount(accountData);
        }
      } else {
        setError(result.error || `Failed to resume bot ${botId}.`);
      }
    } catch (err) {
      setError(`Error resuming bot: ${err.message || err}`);
      console.error('Error resuming bot:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBot = async (botId) => {
    setLoading(true);
    setError('');
    try {
      const result = await AccountService.deleteBot(botId);
      if (result.success) {
        const accountData = await AccountService.getAccount();
        setAccount(accountData);
        if (setVirtualAccount) {
          setVirtualAccount(accountData);
        }
      } else {
        setError(result.error || `Failed to delete bot ${botId}.`);
      }
    } catch (err) {
      setError(`Error deleting bot: ${err.message || err}`);
      console.error('Error deleting bot:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="virtual-trading-terminal">
      <div className="terminal-loading">Loading Virtual Terminal...</div>
    </div>
  );

  // Group bots by status
  const activeBots = account?.bots ? account.bots.filter(b => b.status === 'active') : [];
  const stoppedBots = account?.bots ? account.bots.filter(b => b.status === 'stopped') : [];

  return (
    <div className="virtual-trading-terminal">
      <div className="terminal-header">
        <h1>Virtual Trading Terminal</h1>
        <div className="account-balance">
          Available Balance: <span>${account?.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
      </div>

      {error && <div className="terminal-error">{error}</div>}

      <div className="terminal-content">
        {/* Deployment Form */}
        <div className="deployment-section">
          <h2>Deploy a New Bot</h2>
          <form onSubmit={handleDeployBot} className="deploy-form">
            <div className="form-group">
              <label>Strategy</label>
              <select value={selectedStrategy} onChange={(e) => setSelectedStrategy(e.target.value)}>
                {Object.entries(strategies).map(([key, strat]) => (
                  <option key={key} value={key}>{strat.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Risk Profile ({riskProfile})</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={riskProfile} 
                onChange={(e) => setRiskProfile(Number(e.target.value))}
                className="risk-slider"
              />
            </div>
            <div className="form-group">
              <label>Fund Allocation</label>
              <input 
                type="number" 
                value={allocation} 
                onChange={(e) => setAllocation(Number(e.target.value))} 
                step="1000"
                min="1000"
                max={account?.balance || 100000}
              />
            </div>
            <motion.button 
              type="submit" 
              className="deploy-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!account || account.balance < 1000}
            >
              Deploy Bot
            </motion.button>
          </form>
        </div>

        {/* Bots Display */}
        <div className="bots-section">
          <h2>Active Bots</h2>
          <AnimatePresence>
            <div className="bots-grid">
              {activeBots.length > 0 ? (
                activeBots.map(bot => (
                  <BotCard key={bot.bot_id} bot={bot} onStopBot={handleStopBot} onResumeBot={handleResumeBot} onDeleteBot={handleDeleteBot} cryptoPrices={cryptoPrices} />
                ))
              ) : (
                <div className="empty-message">
                  <h3>No Active Bots</h3>
                  <p>Deploy a new bot to start trading with virtual funds.</p>
                </div>
              )}
            </div>
          </AnimatePresence>

          <h2>Stopped Bots</h2>
          <div className="bots-grid">
            {stoppedBots.length > 0 ? (
              stoppedBots.map(bot => (
                <BotCard key={bot.bot_id} bot={bot} onStopBot={handleStopBot} onResumeBot={handleResumeBot} onDeleteBot={handleDeleteBot} cryptoPrices={cryptoPrices} />
              ))
            ) : (
              <div className="empty-message">
                <h3>No Stopped Bots</h3>
                <p>Bots you stop will appear here with their final performance.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualTradingTerminal; 