import BlockchainService from './BlockchainService';
import DeFiProtocolService from './DeFiProtocolService';
import { ethers } from 'ethers';

class YieldFarmingService {
  constructor() {
    this.farmingPools = new Map();
    this.activeFarms = new Set();
    this.harvestThreshold = 10; // $10 minimum for auto-harvest
    this.compoundingEnabled = true;
    this.riskTolerance = 'medium'; // low, medium, high
    
    // Yield farming protocols
    this.protocols = {
      pancakeswap: {
        name: 'PancakeSwap',
        chains: [56], // BSC
        type: 'dex',
        features: ['farming', 'pools', 'auto-compound']
      },
      quickswap: {
        name: 'QuickSwap',
        chains: [137], // Polygon
        type: 'dex',
        features: ['farming', 'pools', 'dragon-syrup']
      },
      sushiswap: {
        name: 'SushiSwap',
        chains: [1, 137, 56, 43114], // Multi-chain
        type: 'dex',
        features: ['farming', 'onsen', 'kashi']
      },
      convex: {
        name: 'Convex Finance',
        chains: [1], // Ethereum
        type: 'yield-optimizer',
        features: ['curve-boosting', 'auto-compound']
      },
      yearn: {
        name: 'Yearn Finance',
        chains: [1, 137, 250, 43114], // Multi-chain
        type: 'vault',
        features: ['auto-compound', 'strategy-optimization']
      }
    };
    
    this.riskProfiles = {
      low: {
        maxAPY: 15,
        minTVL: 10000000, // $10M minimum TVL
        maxPriceImpact: 1, // 1% max price impact
        stablecoinRatio: 0.7, // 70% stablecoins minimum
        allowedProtocols: ['aave', 'compound', 'yearn']
      },
      medium: {
        maxAPY: 50,
        minTVL: 1000000, // $1M minimum TVL
        maxPriceImpact: 3, // 3% max price impact
        stablecoinRatio: 0.4, // 40% stablecoins minimum
        allowedProtocols: ['aave', 'compound', 'yearn', 'sushiswap', 'quickswap']
      },
      high: {
        maxAPY: 1000,
        minTVL: 100000, // $100K minimum TVL
        maxPriceImpact: 10, // 10% max price impact
        stablecoinRatio: 0, // No stablecoin requirement
        allowedProtocols: ['all']
      }
    };
  }

  // Initialize yield farming service
  async initialize() {
    try {
      await DeFiProtocolService.initialize();
      await this.loadFarmingPools();
      
      console.log('Yield Farming Service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize yield farming service:', error);
      return false;
    }
  }

  // Scan and load available farming pools
  async loadFarmingPools() {
    try {
      const currentNetwork = BlockchainService.getCurrentNetwork();
      const availableProtocols = Object.entries(this.protocols)
        .filter(([id, protocol]) => protocol.chains.includes(currentNetwork.chainId));

      for (const [protocolId, protocol] of availableProtocols) {
        try {
          const pools = await this.loadProtocolPools(protocolId);
          pools.forEach(pool => {
            this.farmingPools.set(`${protocolId}_${pool.id}`, {
              ...pool,
              protocol: protocolId,
              protocolName: protocol.name
            });
          });
        } catch (error) {
          console.warn(`Failed to load pools from ${protocolId}:`, error);
        }
      }

      console.log(`Loaded ${this.farmingPools.size} farming pools`);
    } catch (error) {
      console.error('Failed to load farming pools:', error);
      throw error;
    }
  }

  // Load pools from specific protocol
  async loadProtocolPools(protocolId) {
    switch (protocolId) {
      case 'pancakeswap':
        return await this.loadPancakeSwapPools();
      case 'quickswap':
        return await this.loadQuickSwapPools();
      case 'sushiswap':
        return await this.loadSushiSwapPools();
      case 'convex':
        return await this.loadConvexPools();
      case 'yearn':
        return await this.loadYearnVaults();
      default:
        return [];
    }
  }

  // Load PancakeSwap farming pools
  async loadPancakeSwapPools() {
    try {
      // Mock PancakeSwap pools - replace with actual API
      return [
        {
          id: 'cake_bnb',
          name: 'CAKE-BNB LP',
          tokens: ['CAKE', 'BNB'],
          apy: 45.2,
          tvl: 125000000,
          rewardTokens: ['CAKE'],
          poolType: 'liquidity',
          autoCompound: true,
          riskLevel: 'medium',
          impermanentLoss: 'medium'
        },
        {
          id: 'busd_usdt',
          name: 'BUSD-USDT LP',
          tokens: ['BUSD', 'USDT'],
          apy: 12.8,
          tvl: 89000000,
          rewardTokens: ['CAKE'],
          poolType: 'stable',
          autoCompound: true,
          riskLevel: 'low',
          impermanentLoss: 'low'
        },
        {
          id: 'cake_single',
          name: 'CAKE Staking',
          tokens: ['CAKE'],
          apy: 65.5,
          tvl: 450000000,
          rewardTokens: ['CAKE'],
          poolType: 'single',
          autoCompound: true,
          riskLevel: 'medium',
          impermanentLoss: 'none'
        }
      ];
    } catch (error) {
      console.error('Failed to load PancakeSwap pools:', error);
      return [];
    }
  }

  // Load QuickSwap pools
  async loadQuickSwapPools() {
    try {
      // Mock QuickSwap pools
      return [
        {
          id: 'quick_matic',
          name: 'QUICK-MATIC LP',
          tokens: ['QUICK', 'MATIC'],
          apy: 38.7,
          tvl: 15000000,
          rewardTokens: ['QUICK', 'dQUICK'],
          poolType: 'liquidity',
          autoCompound: false,
          riskLevel: 'high',
          impermanentLoss: 'high'
        },
        {
          id: 'usdc_usdt',
          name: 'USDC-USDT LP',
          tokens: ['USDC', 'USDT'],
          apy: 8.5,
          tvl: 25000000,
          rewardTokens: ['QUICK'],
          poolType: 'stable',
          autoCompound: false,
          riskLevel: 'low',
          impermanentLoss: 'low'
        }
      ];
    } catch (error) {
      console.error('Failed to load QuickSwap pools:', error);
      return [];
    }
  }

  // Load SushiSwap pools
  async loadSushiSwapPools() {
    try {
      // Mock SushiSwap pools
      return [
        {
          id: 'sushi_eth',
          name: 'SUSHI-ETH LP',
          tokens: ['SUSHI', 'ETH'],
          apy: 25.6,
          tvl: 35000000,
          rewardTokens: ['SUSHI'],
          poolType: 'liquidity',
          autoCompound: false,
          riskLevel: 'medium',
          impermanentLoss: 'medium'
        }
      ];
    } catch (error) {
      console.error('Failed to load SushiSwap pools:', error);
      return [];
    }
  }

  // Load Convex pools
  async loadConvexPools() {
    try {
      // Mock Convex pools
      return [
        {
          id: 'cvx_3pool',
          name: 'Curve 3Pool (CVX)',
          tokens: ['DAI', 'USDC', 'USDT'],
          apy: 8.2,
          tvl: 890000000,
          rewardTokens: ['CRV', 'CVX'],
          poolType: 'stable',
          autoCompound: true,
          riskLevel: 'low',
          impermanentLoss: 'very_low'
        }
      ];
    } catch (error) {
      console.error('Failed to load Convex pools:', error);
      return [];
    }
  }

  // Load Yearn vaults
  async loadYearnVaults() {
    try {
      // Mock Yearn vaults
      return [
        {
          id: 'yvusdc',
          name: 'USDC Vault',
          tokens: ['USDC'],
          apy: 6.8,
          tvl: 125000000,
          rewardTokens: ['USDC'],
          poolType: 'vault',
          autoCompound: true,
          riskLevel: 'low',
          impermanentLoss: 'none'
        }
      ];
    } catch (error) {
      console.error('Failed to load Yearn vaults:', error);
      return [];
    }
  }

  // Find optimal yield opportunities
  async findOptimalYieldOpportunities(portfolio, targetAllocation = 0.3) {
    try {
      const opportunities = [];
      const riskProfile = this.riskProfiles[this.riskTolerance];
      
      // Filter pools based on risk profile
      const suitablePools = Array.from(this.farmingPools.values()).filter(pool => {
        return pool.apy <= riskProfile.maxAPY &&
               pool.tvl >= riskProfile.minTVL &&
               this.isProtocolAllowed(pool.protocol, riskProfile.allowedProtocols);
      });

      // Calculate optimal allocation for each asset
      for (const asset of portfolio) {
        const assetOpportunities = await this.findAssetOpportunities(asset, suitablePools);
        
        if (assetOpportunities.length > 0) {
          const optimalAmount = asset.value * targetAllocation;
          const bestOpportunity = assetOpportunities[0];
          
          opportunities.push({
            asset: asset.symbol,
            currentValue: asset.value,
            recommendedAmount: optimalAmount,
            pool: bestOpportunity,
            expectedAnnualYield: (optimalAmount * bestOpportunity.apy) / 100,
            riskLevel: bestOpportunity.riskLevel,
            confidence: this.calculateOpportunityConfidence(bestOpportunity)
          });
        }
      }

      // Sort by expected yield
      opportunities.sort((a, b) => b.expectedAnnualYield - a.expectedAnnualYield);

      return {
        opportunities,
        totalExpectedYield: opportunities.reduce((sum, opp) => sum + opp.expectedAnnualYield, 0),
        averageAPY: opportunities.length > 0 ? 
          opportunities.reduce((sum, opp) => sum + opp.pool.apy, 0) / opportunities.length : 0,
        riskScore: this.calculatePortfolioRiskScore(opportunities)
      };
    } catch (error) {
      console.error('Failed to find optimal yield opportunities:', error);
      throw error;
    }
  }

  // Find opportunities for specific asset
  async findAssetOpportunities(asset, pools) {
    const opportunities = [];
    
    for (const pool of pools) {
      // Check if asset is supported in this pool
      if (pool.tokens.includes(asset.symbol)) {
        const opportunity = {
          ...pool,
          compatibilityScore: this.calculateCompatibilityScore(asset, pool),
          liquidityDepth: await this.checkLiquidityDepth(pool, asset.value),
          entryExitCosts: await this.calculateEntryExitCosts(pool, asset.value)
        };
        
        opportunities.push(opportunity);
      }
    }

    // Sort by compatibility score
    opportunities.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    
    return opportunities;
  }

  // Calculate compatibility score
  calculateCompatibilityScore(asset, pool) {
    let score = 0;
    
    // Base APY score (0-50 points)
    score += Math.min(pool.apy, 50);
    
    // TVL score (0-25 points)
    score += Math.min(pool.tvl / 1000000, 25); // $1M = 1 point
    
    // Risk alignment (0-15 points)
    const riskAlignment = {
      low: { low: 15, medium: 10, high: 0 },
      medium: { low: 10, medium: 15, high: 5 },
      high: { low: 5, medium: 10, high: 15 }
    };
    score += riskAlignment[this.riskTolerance][pool.riskLevel] || 0;
    
    // Auto-compound bonus (0-10 points)
    if (pool.autoCompound) score += 10;
    
    return score;
  }

  // Check liquidity depth
  async checkLiquidityDepth(pool, amount) {
    try {
      // Mock liquidity check - replace with actual DEX API calls
      const liquidityRatio = amount / pool.tvl;
      
      return {
        sufficient: liquidityRatio < 0.05, // Less than 5% of pool
        priceImpact: liquidityRatio * 2, // Estimated price impact
        liquidityRatio: liquidityRatio
      };
    } catch (error) {
      console.error('Failed to check liquidity depth:', error);
      return { sufficient: false, priceImpact: 10, liquidityRatio: 1 };
    }
  }

  // Calculate entry/exit costs
  async calculateEntryExitCosts(pool, amount) {
    try {
      let costs = {
        gasCost: 0,
        swapFees: 0,
        protocolFees: 0,
        total: 0
      };

      // Estimate gas costs
      const gasPrice = await BlockchainService.provider.getGasPrice();
      const estimatedGas = pool.poolType === 'vault' ? 200000 : 350000; // More gas for LP operations
      costs.gasCost = parseFloat(ethers.utils.formatEther(gasPrice.mul(estimatedGas)));

      // Swap fees (if LP position)
      if (pool.poolType === 'liquidity') {
        costs.swapFees = amount * 0.003; // 0.3% average DEX fee
      }

      // Protocol fees
      costs.protocolFees = amount * 0.001; // 0.1% average protocol fee

      costs.total = costs.gasCost + costs.swapFees + costs.protocolFees;

      return costs;
    } catch (error) {
      console.error('Failed to calculate entry/exit costs:', error);
      return { gasCost: 0, swapFees: 0, protocolFees: 0, total: 0 };
    }
  }

  // Calculate opportunity confidence
  calculateOpportunityConfidence(pool) {
    let confidence = 0.5; // Base 50% confidence
    
    // TVL confidence boost
    if (pool.tvl > 100000000) confidence += 0.2; // $100M+ TVL
    else if (pool.tvl > 10000000) confidence += 0.1; // $10M+ TVL
    
    // Risk level adjustment
    const riskAdjustment = {
      low: 0.2,
      medium: 0.1,
      high: -0.1
    };
    confidence += riskAdjustment[pool.riskLevel] || 0;
    
    // Auto-compound bonus
    if (pool.autoCompound) confidence += 0.1;
    
    // Protocol reputation
    const protocolReputation = {
      yearn: 0.2,
      convex: 0.15,
      sushiswap: 0.1,
      pancakeswap: 0.1,
      quickswap: 0.05
    };
    confidence += protocolReputation[pool.protocol] || 0;
    
    return Math.min(0.95, Math.max(0.1, confidence));
  }

  // Calculate portfolio risk score
  calculatePortfolioRiskScore(opportunities) {
    if (opportunities.length === 0) return 0;
    
    const riskValues = { low: 1, medium: 2, high: 3, very_high: 4 };
    const weightedRisk = opportunities.reduce((sum, opp) => {
      const riskValue = riskValues[opp.pool.riskLevel] || 2;
      const weight = opp.recommendedAmount;
      return sum + (riskValue * weight);
    }, 0);
    
    const totalWeight = opportunities.reduce((sum, opp) => sum + opp.recommendedAmount, 0);
    
    return totalWeight > 0 ? weightedRisk / totalWeight : 0;
  }

  // Execute yield farming strategy
  async executeYieldStrategy(opportunities, options = {}) {
    try {
      const {
        maxSlippage = 2,
        autoCompound = this.compoundingEnabled,
        progressCallback = null
      } = options;

      const results = [];
      const errors = [];

      for (let i = 0; i < opportunities.length; i++) {
        const opportunity = opportunities[i];
        
        try {
          if (progressCallback) {
            progressCallback({
              step: 'executing',
              current: i + 1,
              total: opportunities.length,
              opportunity: opportunity.pool.name
            });
          }

          const result = await this.enterYieldPosition(opportunity, {
            maxSlippage,
            autoCompound
          });
          
          results.push(result);
          
          // Add to active farms tracking
          this.activeFarms.add(`${opportunity.pool.protocol}_${opportunity.pool.id}`);
          
        } catch (error) {
          console.error(`Failed to enter position in ${opportunity.pool.name}:`, error);
          errors.push({
            opportunity: opportunity.pool.name,
            error: error.message
          });
        }
      }

      return { results, errors };
    } catch (error) {
      console.error('Failed to execute yield strategy:', error);
      throw error;
    }
  }

  // Enter specific yield position
  async enterYieldPosition(opportunity, options = {}) {
    const { maxSlippage = 2, autoCompound = true } = options;
    const pool = opportunity.pool;
    
    try {
      let transaction;
      
      switch (pool.poolType) {
        case 'single':
          transaction = await this.buildSingleStakeTransaction(pool, opportunity.recommendedAmount);
          break;
        case 'liquidity':
          transaction = await this.buildLiquidityProvisionTransaction(pool, opportunity.recommendedAmount, maxSlippage);
          break;
        case 'vault':
          transaction = await this.buildVaultDepositTransaction(pool, opportunity.recommendedAmount);
          break;
        case 'stable':
          transaction = await this.buildStablePoolTransaction(pool, opportunity.recommendedAmount, maxSlippage);
          break;
        default:
          throw new Error(`Unsupported pool type: ${pool.poolType}`);
      }

      const result = await BlockchainService.executeTransaction(transaction);
      
      return {
        pool: pool.name,
        amount: opportunity.recommendedAmount,
        transaction: result,
        expectedAPY: pool.apy,
        autoCompound: autoCompound
      };
    } catch (error) {
      console.error('Failed to enter yield position:', error);
      throw error;
    }
  }

  // Build single stake transaction
  async buildSingleStakeTransaction(pool, amount) {
    // Mock transaction builder - replace with actual protocol integration
    return {
      to: '0x...', // Staking contract address
      data: '0x...', // Encoded stake function call
      value: '0'
    };
  }

  // Build liquidity provision transaction
  async buildLiquidityProvisionTransaction(pool, totalAmount, maxSlippage) {
    try {
      // Calculate optimal token split
      const tokenSplit = await this.calculateOptimalTokenSplit(pool.tokens, totalAmount);
      
      // Get optimal route for token swaps if needed
      const swapTransactions = [];
      for (const [token, targetAmount] of Object.entries(tokenSplit)) {
        // Add swap transactions if needed
      }
      
      // Build add liquidity transaction
      const addLiquidityTx = {
        to: '0x...', // DEX router address
        data: '0x...', // Encoded addLiquidity function call
        value: '0'
      };
      
      return [
        ...swapTransactions,
        addLiquidityTx
      ];
    } catch (error) {
      console.error('Failed to build liquidity provision transaction:', error);
      throw error;
    }
  }

  // Build vault deposit transaction
  async buildVaultDepositTransaction(pool, amount) {
    return {
      to: '0x...', // Vault contract address
      data: '0x...', // Encoded deposit function call
      value: '0'
    };
  }

  // Build stable pool transaction
  async buildStablePoolTransaction(pool, amount, maxSlippage) {
    return {
      to: '0x...', // Stable pool contract
      data: '0x...', // Encoded add_liquidity function call
      value: '0'
    };
  }

  // Calculate optimal token split for LP
  async calculateOptimalTokenSplit(tokens, totalAmount) {
    try {
      // Mock optimal split calculation - replace with actual pool ratio queries
      const split = {};
      const amountPerToken = totalAmount / tokens.length;
      
      tokens.forEach(token => {
        split[token] = amountPerToken;
      });
      
      return split;
    } catch (error) {
      console.error('Failed to calculate optimal token split:', error);
      throw error;
    }
  }

  // Monitor active farms for harvest opportunities
  async monitorActiveFarms() {
    try {
      const harvestOpportunities = [];
      
      for (const farmId of this.activeFarms) {
        const farm = this.farmingPools.get(farmId);
        if (!farm) continue;
        
        const pendingRewards = await this.getPendingRewards(farm);
        const rewardValue = await this.calculateRewardValue(pendingRewards);
        
        if (rewardValue >= this.harvestThreshold) {
          harvestOpportunities.push({
            farm: farm,
            pendingRewards: pendingRewards,
            rewardValue: rewardValue,
            gasEstimate: await this.estimateHarvestGas(farm),
            profitability: rewardValue - await this.estimateHarvestGas(farm)
          });
        }
      }
      
      // Sort by profitability
      harvestOpportunities.sort((a, b) => b.profitability - a.profitability);
      
      return harvestOpportunities;
    } catch (error) {
      console.error('Failed to monitor active farms:', error);
      throw error;
    }
  }

  // Get pending rewards from farm
  async getPendingRewards(farm) {
    try {
      // Mock pending rewards - replace with actual contract calls
      return {
        tokens: farm.rewardTokens.map(token => ({
          symbol: token,
          amount: Math.random() * 100, // Random pending amount
          decimals: 18
        }))
      };
    } catch (error) {
      console.error('Failed to get pending rewards:', error);
      return { tokens: [] };
    }
  }

  // Calculate USD value of rewards
  async calculateRewardValue(pendingRewards) {
    try {
      let totalValue = 0;
      
      for (const token of pendingRewards.tokens) {
        // Mock price lookup - replace with actual price oracle
        const tokenPrice = Math.random() * 100; // Random price
        totalValue += token.amount * tokenPrice;
      }
      
      return totalValue;
    } catch (error) {
      console.error('Failed to calculate reward value:', error);
      return 0;
    }
  }

  // Estimate harvest gas cost
  async estimateHarvestGas(farm) {
    try {
      const gasPrice = await BlockchainService.provider.getGasPrice();
      const estimatedGas = 150000; // Typical harvest gas
      const gasCostEth = parseFloat(ethers.utils.formatEther(gasPrice.mul(estimatedGas)));
      
      // Convert to USD - mock ETH price
      const ethPrice = 2000; // Mock ETH price
      return gasCostEth * ethPrice;
    } catch (error) {
      console.error('Failed to estimate harvest gas:', error);
      return 50; // Default $50 gas estimate
    }
  }

  // Auto-harvest profitable farms
  async autoHarvest() {
    try {
      const opportunities = await this.monitorActiveFarms();
      const profitableHarvests = opportunities.filter(opp => opp.profitability > 0);
      
      const results = [];
      
      for (const opportunity of profitableHarvests) {
        try {
          const result = await this.harvestFarm(opportunity.farm);
          results.push(result);
          
          // Auto-compound if enabled
          if (this.compoundingEnabled && opportunity.farm.autoCompound) {
            await this.compoundRewards(opportunity.farm, result.rewards);
          }
        } catch (error) {
          console.error(`Failed to harvest ${opportunity.farm.name}:`, error);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Failed to auto-harvest:', error);
      throw error;
    }
  }

  // Harvest specific farm
  async harvestFarm(farm) {
    try {
      const transaction = {
        to: '0x...', // Farm contract address
        data: '0x...', // Encoded harvest function call
        value: '0'
      };
      
      const result = await BlockchainService.executeTransaction(transaction);
      
      return {
        farm: farm.name,
        transaction: result,
        rewards: await this.getPendingRewards(farm)
      };
    } catch (error) {
      console.error('Failed to harvest farm:', error);
      throw error;
    }
  }

  // Compound rewards back into farm
  async compoundRewards(farm, rewards) {
    try {
      // Build compound transaction
      const transaction = {
        to: '0x...', // Farm contract address
        data: '0x...', // Encoded compound function call
        value: '0'
      };
      
      const result = await BlockchainService.executeTransaction(transaction);
      
      return result;
    } catch (error) {
      console.error('Failed to compound rewards:', error);
      throw error;
    }
  }

  // Exit yield position
  async exitYieldPosition(farmId, percentage = 100) {
    try {
      const farm = this.farmingPools.get(farmId);
      if (!farm) {
        throw new Error('Farm not found');
      }

      // First harvest pending rewards
      await this.harvestFarm(farm);
      
      // Then exit position
      const transaction = await this.buildExitTransaction(farm, percentage);
      const result = await BlockchainService.executeTransaction(transaction);
      
      // Remove from active farms if fully exiting
      if (percentage === 100) {
        this.activeFarms.delete(farmId);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to exit yield position:', error);
      throw error;
    }
  }

  // Build exit transaction
  async buildExitTransaction(farm, percentage) {
    // Mock exit transaction - replace with actual protocol integration
    return {
      to: '0x...', // Farm contract address
      data: '0x...', // Encoded withdraw function call
      value: '0'
    };
  }

  // Utility: Check if protocol is allowed
  isProtocolAllowed(protocol, allowedProtocols) {
    return allowedProtocols.includes('all') || allowedProtocols.includes(protocol);
  }

  // Set risk tolerance
  setRiskTolerance(level) {
    if (['low', 'medium', 'high'].includes(level)) {
      this.riskTolerance = level;
      console.log(`Risk tolerance set to ${level}`);
    }
  }

  // Set harvest threshold
  setHarvestThreshold(amount) {
    this.harvestThreshold = Math.max(1, amount);
    console.log(`Harvest threshold set to $${this.harvestThreshold}`);
  }

  // Enable/disable auto-compounding
  setAutoCompounding(enabled) {
    this.compoundingEnabled = enabled;
    console.log(`Auto-compounding ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Get farming statistics
  async getFarmingStats() {
    try {
      const activeFarmsList = Array.from(this.activeFarms).map(id => this.farmingPools.get(id)).filter(Boolean);
      
      let totalTVL = 0;
      let averageAPY = 0;
      let totalRewards = 0;
      
      for (const farm of activeFarmsList) {
        totalTVL += farm.tvl || 0;
        averageAPY += farm.apy || 0;
        
        const rewards = await this.calculateRewardValue(await this.getPendingRewards(farm));
        totalRewards += rewards;
      }
      
      if (activeFarmsList.length > 0) {
        averageAPY /= activeFarmsList.length;
      }
      
      return {
        activeFarms: activeFarmsList.length,
        totalTVL: totalTVL,
        averageAPY: averageAPY,
        pendingRewards: totalRewards,
        riskTolerance: this.riskTolerance,
        autoCompoundEnabled: this.compoundingEnabled,
        harvestThreshold: this.harvestThreshold
      };
    } catch (error) {
      console.error('Failed to get farming stats:', error);
      throw error;
    }
  }
}

export default new YieldFarmingService();