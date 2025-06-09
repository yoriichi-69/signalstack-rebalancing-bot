import BlockchainService from './BlockchainService';
import { ethers } from 'ethers';

class DeFiProtocolService {
  constructor() {
    this.protocols = {
      uniswap: {
        name: 'Uniswap V3',
        type: 'dex',
        fees: [0.01, 0.05, 0.30, 1.00], // 0.01%, 0.05%, 0.3%, 1%
        supported: [1, 137, 10, 42161] // Ethereum, Polygon, Optimism, Arbitrum
      },
      aave: {
        name: 'Aave V3',
        type: 'lending',
        supported: [1, 137, 43114, 10] // Ethereum, Polygon, Avalanche, Optimism
      },
      compound: {
        name: 'Compound V3',
        type: 'lending',
        supported: [1, 137] // Ethereum, Polygon
      },
      curve: {
        name: 'Curve Finance',
        type: 'dex',
        fees: [0.04], // 0.04% typical
        supported: [1, 137, 250, 43114] // Ethereum, Polygon, Fantom, Avalanche
      }
    };

    this.slippageTolerance = 0.5; // 0.5% default
    this.deadline = 20; // 20 minutes default
  }

  // Initialize DeFi service
  async initialize() {
    try {
      const isBlockchainReady = await BlockchainService.initialize();
      if (!isBlockchainReady) {
        throw new Error('Blockchain service not available');
      }
      
      console.log('DeFi Protocol Service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize DeFi service:', error);
      return false;
    }
  }

  // Get available protocols for current network
  getAvailableProtocols() {
    const currentNetwork = BlockchainService.getCurrentNetwork();
    
    return Object.entries(this.protocols)
      .filter(([key, protocol]) => protocol.supported.includes(currentNetwork.chainId))
      .map(([key, protocol]) => ({
        id: key,
        ...protocol
      }));
  }

  // Get optimal trading route
  async getOptimalRoute(tokenIn, tokenOut, amountIn, protocols = ['uniswap', 'curve']) {
    try {
      const routes = [];
      
      for (const protocolId of protocols) {
        try {
          const route = await this.getProtocolRoute(protocolId, tokenIn, tokenOut, amountIn);
          if (route) {
            routes.push({
              protocol: protocolId,
              ...route
            });
          }
        } catch (error) {
          console.warn(`Failed to get route from ${protocolId}:`, error);
        }
      }

      // Sort by best output amount
      routes.sort((a, b) => parseFloat(b.amountOut) - parseFloat(a.amountOut));
      
      return {
        bestRoute: routes[0] || null,
        allRoutes: routes,
        savings: routes.length > 1 ? 
          ((parseFloat(routes[0]?.amountOut || 0) - parseFloat(routes[1]?.amountOut || 0)) / parseFloat(routes[1]?.amountOut || 1)) * 100 : 0
      };
    } catch (error) {
      console.error('Failed to get optimal route:', error);
      throw error;
    }
  }

  // Get route from specific protocol
  async getProtocolRoute(protocolId, tokenIn, tokenOut, amountIn) {
    switch (protocolId) {
      case 'uniswap':
        return await this.getUniswapRoute(tokenIn, tokenOut, amountIn);
      case 'curve':
        return await this.getCurveRoute(tokenIn, tokenOut, amountIn);
      default:
        throw new Error(`Unsupported protocol: ${protocolId}`);
    }
  }

  // Get Uniswap V3 route
  async getUniswapRoute(tokenIn, tokenOut, amountIn) {
    try {
      const contractAddresses = BlockchainService.getContractAddresses();
      const routerAddress = contractAddresses.UNISWAP_V3_ROUTER;
      
      if (!routerAddress) {
        throw new Error('Uniswap not supported on this network');
      }

      // Mock route calculation - replace with actual Uniswap SDK
      const mockPriceImpact = Math.random() * 2; // 0-2% price impact
      const mockAmountOut = parseFloat(amountIn) * 0.998; // 0.2% fee simulation
      
      return {
        amountIn: amountIn,
        amountOut: mockAmountOut.toString(),
        priceImpact: mockPriceImpact,
        fee: 0.3, // 0.3% fee tier
        route: [tokenIn, tokenOut],
        estimatedGas: '150000'
      };
    } catch (error) {
      console.error('Failed to get Uniswap route:', error);
      throw error;
    }
  }

  // Get Curve route
  async getCurveRoute(tokenIn, tokenOut, amountIn) {
    try {
      // Mock Curve route - replace with actual Curve SDK
      const mockPriceImpact = Math.random() * 1; // 0-1% price impact (better for stables)
      const mockAmountOut = parseFloat(amountIn) * 0.9996; // 0.04% fee
      
      return {
        amountIn: amountIn,
        amountOut: mockAmountOut.toString(),
        priceImpact: mockPriceImpact,
        fee: 0.04, // 0.04% fee
        route: [tokenIn, tokenOut],
        estimatedGas: '120000'
      };
    } catch (error) {
      console.error('Failed to get Curve route:', error);
      throw error;
    }
  }

  // Execute swap transaction
  async executeSwap(route, options = {}) {
    try {
      const {
        slippage = this.slippageTolerance,
        deadline = this.deadline,
        recipient = BlockchainService.account
      } = options;

      // Calculate minimum amount out with slippage
      const minAmountOut = (parseFloat(route.amountOut) * (1 - slippage / 100)).toString();
      
      let transaction;
      
      switch (route.protocol) {
        case 'uniswap':
          transaction = await this.buildUniswapTransaction(route, minAmountOut, deadline, recipient);
          break;
        case 'curve':
          transaction = await this.buildCurveTransaction(route, minAmountOut, recipient);
          break;
        default:
          throw new Error(`Unsupported protocol: ${route.protocol}`);
      }

      // Execute transaction
      const result = await BlockchainService.executeTransaction(transaction, {
        onProgress: options.onProgress
      });

      return {
        ...result,
        route,
        minAmountOut,
        slippageUsed: slippage
      };
    } catch (error) {
      console.error('Failed to execute swap:', error);
      throw error;
    }
  }

  // Build Uniswap transaction
  async buildUniswapTransaction(route, minAmountOut, deadline, recipient) {
    const contractAddresses = BlockchainService.getContractAddresses();
    const routerAddress = contractAddresses.UNISWAP_V3_ROUTER;
    
    // Mock transaction builder - replace with actual Uniswap SDK
    return {
      to: routerAddress,
      data: '0x', // Encoded function call would go here
      value: route.route[0] === 'ETH' ? ethers.utils.parseEther(route.amountIn) : '0'
    };
  }

  // Build Curve transaction
  async buildCurveTransaction(route, minAmountOut, recipient) {
    // Mock Curve transaction - replace with actual implementation
    return {
      to: '0x...', // Curve pool address
      data: '0x', // Encoded function call
      value: '0'
    };
  }

  // Get lending opportunities
  async getLendingOpportunities(token, amount) {
    try {
      const opportunities = [];
      const availableProtocols = this.getAvailableProtocols().filter(p => p.type === 'lending');
      
      for (const protocol of availableProtocols) {
        try {
          const opportunity = await this.getLendingRate(protocol.id, token, amount);
          if (opportunity) {
            opportunities.push({
              protocol: protocol.id,
              name: protocol.name,
              ...opportunity
            });
          }
        } catch (error) {
          console.warn(`Failed to get lending rate from ${protocol.id}:`, error);
        }
      }

      // Sort by APY
      opportunities.sort((a, b) => b.apy - a.apy);
      
      return opportunities;
    } catch (error) {
      console.error('Failed to get lending opportunities:', error);
      throw error;
    }
  }

  // Get lending rate from protocol
  async getLendingRate(protocolId, token, amount) {
    switch (protocolId) {
      case 'aave':
        return await this.getAaveRate(token, amount);
      case 'compound':
        return await this.getCompoundRate(token, amount);
      default:
        throw new Error(`Unsupported lending protocol: ${protocolId}`);
    }
  }

  // Get Aave lending rate
  async getAaveRate(token, amount) {
    try {
      // Mock Aave rate - replace with actual Aave SDK
      const mockAPY = 2.5 + Math.random() * 3; // 2.5-5.5% APY
      const mockLiquidityAvailable = true;
      
      return {
        apy: mockAPY,
        liquidityAvailable: mockLiquidityAvailable,
        minimumAmount: '0.01',
        collateralFactor: 0.8, // 80% collateral factor
        isStable: true
      };
    } catch (error) {
      console.error('Failed to get Aave rate:', error);
      throw error;
    }
  }

  // Get Compound rate
  async getCompoundRate(token, amount) {
    try {
      // Mock Compound rate - replace with actual Compound SDK
      const mockAPY = 2.0 + Math.random() * 2.5; // 2-4.5% APY
      
      return {
        apy: mockAPY,
        liquidityAvailable: true,
        minimumAmount: '0.1',
        collateralFactor: 0.75, // 75% collateral factor
        isStable: false
      };
    } catch (error) {
      console.error('Failed to get Compound rate:', error);
      throw error;
    }
  }

  // Execute lending transaction
  async executeLending(protocolId, token, amount, options = {}) {
    try {
      let transaction;
      
      switch (protocolId) {
        case 'aave':
          transaction = await this.buildAaveLendingTransaction(token, amount);
          break;
        case 'compound':
          transaction = await this.buildCompoundLendingTransaction(token, amount);
          break;
        default:
          throw new Error(`Unsupported lending protocol: ${protocolId}`);
      }

      const result = await BlockchainService.executeTransaction(transaction, {
        onProgress: options.onProgress
      });

      return result;
    } catch (error) {
      console.error('Failed to execute lending:', error);
      throw error;
    }
  }

  // Build Aave lending transaction
  async buildAaveLendingTransaction(token, amount) {
    const contractAddresses = BlockchainService.getContractAddresses();
    const lendingPoolAddress = contractAddresses.AAVE_LENDING_POOL;
    
    // Mock transaction - replace with actual Aave SDK
    return {
      to: lendingPoolAddress,
      data: '0x', // Encoded deposit function call
      value: token === 'ETH' ? ethers.utils.parseEther(amount) : '0'
    };
  }

  // Build Compound lending transaction
  async buildCompoundLendingTransaction(token, amount) {
    // Mock Compound transaction - replace with actual implementation
    return {
      to: '0x...', // cToken address
      data: '0x', // Encoded mint function call
      value: token === 'ETH' ? ethers.utils.parseEther(amount) : '0'
    };
  }

  // Set slippage tolerance
  setSlippageTolerance(slippage) {
    this.slippageTolerance = Math.max(0.1, Math.min(50, slippage)); // 0.1% to 50%
    console.log(`Slippage tolerance set to ${this.slippageTolerance}%`);
  }

  // Set transaction deadline
  setDeadline(minutes) {
    this.deadline = Math.max(1, Math.min(60, minutes)); // 1 to 60 minutes
    console.log(`Transaction deadline set to ${this.deadline} minutes`);
  }

  // Get protocol statistics
  async getProtocolStats(protocolId) {
    try {
      // Mock stats - replace with actual protocol APIs
      return {
        protocol: protocolId,
        tvl: Math.random() * 10000000000, // $0-10B TVL
        volume24h: Math.random() * 1000000000, // $0-1B 24h volume
        users24h: Math.floor(Math.random() * 50000), // 0-50k daily users
        avgApy: 2 + Math.random() * 8, // 2-10% average APY
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Failed to get protocol stats:', error);
      throw error;
    }
  }
}

export default new DeFiProtocolService();