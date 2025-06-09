import BlockchainService from './BlockchainService';
import DeFiProtocolService from './DeFiProtocolService';
import { ethers } from 'ethers';

class LiquidityManagementService {
  constructor() {
    this.liquidityPositions = new Map();
    this.impermanentLossThreshold = 10; // 10% IL threshold
    this.rebalanceThreshold = 5; // 5% imbalance threshold
    this.autoRebalanceEnabled = false;
    
    // LP token contracts by network
    this.lpTokens = {
      1: { // Ethereum
        'USDC_ETH': '0x...',
        'WBTC_ETH': '0x...',
        'DAI_USDC': '0x...'
      },
      137: { // Polygon
        'USDC_MATIC': '0x...',
        'QUICK_MATIC': '0x...',
        'USDC_USDT': '0x...'
      }
    };
  }

  // Initialize liquidity management
  async initialize() {
    try {
      await DeFiProtocolService.initialize();
      await this.loadExistingPositions();
      
      console.log('Liquidity Management Service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize liquidity management:', error);
      return false;
    }
  }

  // Load existing LP positions
  async loadExistingPositions() {
    try {
      const account = BlockchainService.account;
      if (!account) return;

      const currentNetwork = BlockchainService.getCurrentNetwork();
      const networkLPs = this.lpTokens[currentNetwork.chainId] || {};
      
      for (const [pairName, lpAddress] of Object.entries(networkLPs)) {
        try {
          const position = await this.getLPPosition(lpAddress, account);
          if (position.balance > 0) {
            this.liquidityPositions.set(pairName, {
              ...position,
              lpAddress,
              pairName
            });
          }
        } catch (error) {
          console.warn(`Failed to load LP position for ${pairName}:`, error);
        }
      }
      
      console.log(`Loaded ${this.liquidityPositions.size} LP positions`);
    } catch (error) {
      console.error('Failed to load existing positions:', error);
    }
  }

  // Get LP position details
  async getLPPosition(lpAddress, account) {
    try {
      const lpContract = new ethers.Contract(
        lpAddress,
        [
          'function balanceOf(address) view returns (uint256)',
          'function totalSupply() view returns (uint256)',
          'function getReserves() view returns (uint112, uint112, uint32)',
          'function token0() view returns (address)',
          'function token1() view returns (address)'
        ],
        BlockchainService.provider
      );

      const [balance, totalSupply, reserves, token0, token1] = await Promise.all([
        lpContract.balanceOf(account),
        lpContract.totalSupply(),
        lpContract.getReserves(),
        lpContract.token0(),
        lpContract.token1()
      ]);

      const sharePercentage = totalSupply.gt(0) ? balance.mul(10000).div(totalSupply).toNumber() / 10000 : 0;
      
      return {
        balance: parseFloat(ethers.utils.formatEther(balance)),
        sharePercentage: sharePercentage,
        token0Address: token0,
        token1Address: token1,
        reserve0: parseFloat(ethers.utils.formatEther(reserves[0])),
        reserve1: parseFloat(ethers.utils.formatEther(reserves[1])),
        lastUpdate: reserves[2]
      };
    } catch (error) {
      console.error('Failed to get LP position:', error);
      throw error;
    }
  }

  // Calculate impermanent loss
  async calculateImpermanentLoss(pairName, entryPrice0, entryPrice1) {
    try {
      const position = this.liquidityPositions.get(pairName);
      if (!position) {
        throw new Error('Position not found');
      }

      // Get current prices
      const currentPrice0 = await this.getTokenPrice(position.token0Address);
      const currentPrice1 = await this.getTokenPrice(position.token1Address);
      
      // Calculate price ratio changes
      const entryRatio = entryPrice0 / entryPrice1;
      const currentRatio = currentPrice0 / currentPrice1;
      const priceRatioChange = currentRatio / entryRatio;
      
      // Calculate impermanent loss
      // IL = 2 * sqrt(price_ratio) / (1 + price_ratio) - 1
      const impermanentLoss = (2 * Math.sqrt(priceRatioChange)) / (1 + priceRatioChange) - 1;
      const impermanentLossPercentage = Math.abs(impermanentLoss) * 100;
      
      return {
        impermanentLoss: impermanentLossPercentage,
        priceRatioChange: priceRatioChange,
        entryRatio: entryRatio,
        currentRatio: currentRatio,
        severity: this.getILSeverity(impermanentLossPercentage)
      };
    } catch (error) {
      console.error('Failed to calculate impermanent loss:', error);
      throw error;
    }
  }

  // Get IL severity level
  getILSeverity(ilPercentage) {
    if (ilPercentage < 2) return 'low';
    if (ilPercentage < 5) return 'moderate';
    if (ilPercentage < 10) return 'high';
    return 'severe';
  }

  // Get token price (mock - replace with actual price oracle)
  async getTokenPrice(tokenAddress) {
    try {
      // Mock price - replace with actual price feed
      return Math.random() * 1000 + 100; // Random price between $100-$1100
    } catch (error) {
      console.error('Failed to get token price:', error);
      return 0;
    }
  }

  // Monitor all LP positions for IL
  async monitorImpermanentLoss() {
    try {
      const alerts = [];
      
      for (const [pairName, position] of this.liquidityPositions) {
        // Mock entry prices - in real implementation, store these when position is created
        const entryPrice0 = 2000; // Mock ETH price at entry
        const entryPrice1 = 1; // Mock USDC price at entry
        
        const ilData = await this.calculateImpermanentLoss(pairName, entryPrice0, entryPrice1);
        
        if (ilData.impermanentLoss > this.impermanentLossThreshold) {
          alerts.push({
            pairName: pairName,
            position: position,
            impermanentLoss: ilData,
            recommendation: this.getILRecommendation(ilData),
            urgency: ilData.severity === 'severe' ? 'high' : 'medium'
          });
        }
      }
      
      return alerts;
    } catch (error) {
      console.error('Failed to monitor impermanent loss:', error);
      throw error;
    }
  }

  // Get IL recommendation
  getILRecommendation(ilData) {
    if (ilData.severity === 'severe') {
      return {
        action: 'REMOVE_LIQUIDITY',
        reason: 'Severe impermanent loss detected',
        priority: 'HIGH'
      };
    } else if (ilData.severity === 'high') {
      return {
        action: 'MONITOR_CLOSELY',
        reason: 'High impermanent loss - consider exit strategy',
        priority: 'MEDIUM'
      };
    } else {
      return {
        action: 'CONTINUE',
        reason: 'Impermanent loss within acceptable range',
        priority: 'LOW'
      };
    }
  }

  // Add liquidity to pool
  async addLiquidity(token0, token1, amount0, amount1, options = {}) {
    try {
      const {
        slippageTolerance = 2,
        deadline = 20,
        minLPTokens = 0
      } = options;

      // Get optimal amounts
      const optimalAmounts = await this.calculateOptimalAmounts(token0, token1, amount0, amount1);
      
      // Build add liquidity transaction
      const transaction = await this.buildAddLiquidityTransaction(
        token0, 
        token1, 
        optimalAmounts.amount0, 
        optimalAmounts.amount1,
        slippageTolerance,
        deadline
      );
      
      const result = await BlockchainService.executeTransaction(transaction);
      
      // Update local position tracking
      await this.updatePositionTracking(token0, token1, optimalAmounts);
      
      return {
        ...result,
        addedAmount0: optimalAmounts.amount0,
        addedAmount1: optimalAmounts.amount1,
        lpTokensReceived: await this.estimateLPTokensReceived(optimalAmounts)
      };
    } catch (error) {
      console.error('Failed to add liquidity:', error);
      throw error;
    }
  }

  // Calculate optimal liquidity amounts
  async calculateOptimalAmounts(token0, token1, amount0, amount1) {
    try {
      // Get current pool reserves
      const pairAddress = await this.getPairAddress(token0, token1);
      const reserves = await this.getPoolReserves(pairAddress);
      
      // Calculate optimal ratio
      const ratio = reserves.reserve1 / reserves.reserve0;
      
      // Adjust amounts to match pool ratio
      const optimalAmount1 = amount0 * ratio;
      const optimalAmount0 = amount1 / ratio;
      
      if (optimalAmount1 <= amount1) {
        return {
          amount0: amount0,
          amount1: optimalAmount1
        };
      } else {
        return {
          amount0: optimalAmount0,
          amount1: amount1
        };
      }
    } catch (error) {
      console.error('Failed to calculate optimal amounts:', error);
      throw error;
    }
  }

  // Get pair address
  async getPairAddress(token0, token1) {
    // Mock pair address calculation - replace with actual factory contract
    return '0x...';
  }

  // Get pool reserves
  async getPoolReserves(pairAddress) {
    try {
      const pairContract = new ethers.Contract(
        pairAddress,
        ['function getReserves() view returns (uint112, uint112, uint32)'],
        BlockchainService.provider
      );
      
      const reserves = await pairContract.getReserves();
      
      return {
        reserve0: parseFloat(ethers.utils.formatEther(reserves[0])),
        reserve1: parseFloat(ethers.utils.formatEther(reserves[1])),
        blockTimestamp: reserves[2]
      };
    } catch (error) {
      console.error('Failed to get pool reserves:', error);
      throw error;
    }
  }

  // Build add liquidity transaction
  async buildAddLiquidityTransaction(token0, token1, amount0, amount1, slippage, deadline) {
    const contractAddresses = BlockchainService.getContractAddresses();
    const routerAddress = contractAddresses.UNISWAP_V3_ROUTER; // Or appropriate DEX router
    
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60);
    const minAmount0 = (amount0 * (1 - slippage / 100)).toString();
    const minAmount1 = (amount1 * (1 - slippage / 100)).toString();
    
    // Mock transaction - replace with actual router call encoding
    return {
      to: routerAddress,
      data: '0x...', // Encoded addLiquidity function call
      value: token0 === 'ETH' || token1 === 'ETH' ? 
        ethers.utils.parseEther((token0 === 'ETH' ? amount0 : amount1).toString()) : '0'
    };
  }

  // Remove liquidity from pool
  async removeLiquidity(pairName, lpTokenAmount, options = {}) {
    try {
      const {
        slippageTolerance = 2,
        deadline = 20
      } = options;

      const position = this.liquidityPositions.get(pairName);
      if (!position) {
        throw new Error('LP position not found');
      }

      // Build remove liquidity transaction
      const transaction = await this.buildRemoveLiquidityTransaction(
        position,
        lpTokenAmount,
        slippageTolerance,
        deadline
      );
      
      const result = await BlockchainService.executeTransaction(transaction);
      
      // Update position tracking
      await this.updatePositionAfterRemoval(pairName, lpTokenAmount);
      
      return result;
    } catch (error) {
      console.error('Failed to remove liquidity:', error);
      throw error;
    }
  }

  // Build remove liquidity transaction
  async buildRemoveLiquidityTransaction(position, lpTokenAmount, slippage, deadline) {
    const contractAddresses = BlockchainService.getContractAddresses();
    const routerAddress = contractAddresses.UNISWAP_V3_ROUTER;
    
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60);
    
    // Calculate minimum amounts out
    const sharePercentage = lpTokenAmount / position.balance;
    const minAmount0 = (position.reserve0 * sharePercentage * (1 - slippage / 100)).toString();
    const minAmount1 = (position.reserve1 * sharePercentage * (1 - slippage / 100)).toString();
    
    // Mock transaction - replace with actual router call encoding
    return {
      to: routerAddress,
      data: '0x...', // Encoded removeLiquidity function call
      value: '0'
    };
  }

  // Rebalance LP position
  async rebalanceLPPosition(pairName, targetRatio = null) {
    try {
      const position = this.liquidityPositions.get(pairName);
      if (!position) {
        throw new Error('LP position not found');
      }

      // Calculate current ratio
      const currentRatio = position.reserve0 / position.reserve1;
      const poolRatio = await this.getPoolRatio(position.lpAddress);
      
      // Use pool ratio as target if not specified
      const target = targetRatio || poolRatio;
      
      // Check if rebalancing is needed
      const imbalance = Math.abs(currentRatio - target) / target;
      
      if (imbalance < this.rebalanceThreshold / 100) {
        return { needed: false, reason: 'Position is already balanced' };
      }

      // Calculate rebalancing steps
      const steps = await this.calculateRebalanceSteps(position, target);
      
      // Execute rebalancing
      const results = [];
      for (const step of steps) {
        const result = await BlockchainService.executeTransaction(step.transaction);
        results.push(result);
      }
      
      return {
        needed: true,
        steps: steps.length,
        results: results,
        newRatio: target
      };
    } catch (error) {
      console.error('Failed to rebalance LP position:', error);
      throw error;
    }
  }

  // Get pool ratio
  async getPoolRatio(lpAddress) {
    try {
      const reserves = await this.getPoolReserves(lpAddress);
      return reserves.reserve0 / reserves.reserve1;
    } catch (error) {
      console.error('Failed to get pool ratio:', error);
      return 1;
    }
  }

  // Calculate rebalance steps
  async calculateRebalanceSteps(position, targetRatio) {
    // Mock rebalancing calculation - implement actual logic
    return [
      {
        action: 'SWAP',
        fromToken: position.token0Address,
        toToken: position.token1Address,
        amount: '1000',
        transaction: {
          to: '0x...',
          data: '0x...',
          value: '0'
        }
      }
    ];
  }

  // Auto-rebalance all positions
  async autoRebalanceAll() {
    if (!this.autoRebalanceEnabled) return;

    try {
      const results = [];
      
      for (const [pairName, position] of this.liquidityPositions) {
        try {
          const result = await this.rebalanceLPPosition(pairName);
          if (result.needed) {
            results.push({
              pairName,
              ...result
            });
          }
        } catch (error) {
          console.error(`Failed to rebalance ${pairName}:`, error);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Failed to auto-rebalance positions:', error);
      throw error;
    }
  }

  // Update position tracking
  async updatePositionTracking(token0, token1, amounts) {
    const pairName = `${token0}_${token1}`;
    const lpAddress = await this.getPairAddress(token0, token1);
    
    // Update or create position entry
    const existingPosition = this.liquidityPositions.get(pairName);
    if (existingPosition) {
      // Update existing position
      existingPosition.balance += amounts.amount0 + amounts.amount1; // Simplified
    } else {
      // Create new position entry
      const newPosition = await this.getLPPosition(lpAddress, BlockchainService.account);
      this.liquidityPositions.set(pairName, {
        ...newPosition,
        lpAddress,
        pairName
      });
    }
  }

  // Update position after removal
  async updatePositionAfterRemoval(pairName, removedAmount) {
    const position = this.liquidityPositions.get(pairName);
    if (position) {
      position.balance -= removedAmount;
      
      // Remove if balance is zero
      if (position.balance <= 0) {
        this.liquidityPositions.delete(pairName);
      }
    }
  }

  // Estimate LP tokens received
  async estimateLPTokensReceived(amounts) {
    // Mock estimation - replace with actual calculation
    return amounts.amount0 + amounts.amount1; // Simplified
  }

  // Set IL threshold
  setILThreshold(threshold) {
    this.impermanentLossThreshold = Math.max(1, Math.min(50, threshold));
    console.log(`IL threshold set to ${this.impermanentLossThreshold}%`);
  }

  // Set rebalance threshold
  setRebalanceThreshold(threshold) {
    this.rebalanceThreshold = Math.max(1, Math.min(20, threshold));
    console.log(`Rebalance threshold set to ${this.rebalanceThreshold}%`);
  }

  // Enable/disable auto-rebalancing
  setAutoRebalance(enabled) {
    this.autoRebalanceEnabled = enabled;
    console.log(`Auto-rebalancing ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Get liquidity management stats
  async getLiquidityStats() {
    try {
      let totalValue = 0;
      let totalIL = 0;
      let positions = 0;
      
      for (const [pairName, position] of this.liquidityPositions) {
        const value = (position.reserve0 + position.reserve1) * position.sharePercentage;
        totalValue += value;
        positions++;
        
        // Calculate IL for each position (mock entry prices)
        try {
          const ilData = await this.calculateImpermanentLoss(pairName, 2000, 1);
          totalIL += ilData.impermanentLoss;
        } catch (error) {
          // Skip IL calculation if it fails
        }
      }
      
      return {
        totalPositions: positions,
        totalValue: totalValue,
        averageIL: positions > 0 ? totalIL / positions : 0,
        ilThreshold: this.impermanentLossThreshold,
        rebalanceThreshold: this.rebalanceThreshold,
        autoRebalanceEnabled: this.autoRebalanceEnabled
      };
    } catch (error) {
      console.error('Failed to get liquidity stats:', error);
      throw error;
    }
  }
}

export default new LiquidityManagementService();