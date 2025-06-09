import BlockchainService from './BlockchainService';
import { ethers } from 'ethers';

class CrossChainBridgeService {
  constructor() {
    this.bridgeProviders = new Map();
    this.bridgeRoutes = new Map();
    this.pendingTransfers = new Map();
    this.transferHistory = new Map();
    
    // Bridge protocols and their capabilities
    this.bridges = {
      layerzero: {
        name: 'LayerZero',
        type: 'omnichain',
        chains: [1, 56, 137, 43114, 10, 42161], // Multi-chain support
        tokens: ['ETH', 'USDC', 'USDT', 'BTC'],
        fees: { base: 0.1, variable: 0.05 }, // 0.1% base + 0.05% variable
        speed: 'fast', // 2-5 minutes
        security: 'high'
      },
      polygon_bridge: {
        name: 'Polygon PoS Bridge',
        type: 'pos',
        chains: [1, 137], // Ethereum <-> Polygon
        tokens: ['ETH', 'USDC', 'USDT', 'DAI', 'WBTC'],
        fees: { base: 0, variable: 0.001 }, // Gas only + 0.1% variable
        speed: 'medium', // 7-8 minutes
        security: 'high'
      },
      multichain: {
        name: 'Multichain',
        type: 'lock_mint',
        chains: [1, 56, 137, 43114, 250, 42161],
        tokens: ['USDC', 'USDT', 'DAI', 'WBTC', 'ETH'],
        fees: { base: 0.1, variable: 0.1 }, // 0.1% base + 0.1% variable
        speed: 'medium', // 10-30 minutes
        security: 'medium'
      },
      hop: {
        name: 'Hop Protocol',
        type: 'amm',
        chains: [1, 137, 10, 42161], // Ethereum + L2s
        tokens: ['ETH', 'USDC', 'USDT', 'DAI'],
        fees: { base: 0.04, variable: 0.2 }, // 0.04% base + 0.2% variable
        speed: 'fast', // 1-5 minutes
        security: 'high'
      },
      stargate: {
        name: 'Stargate Finance',
        type: 'liquidity',
        chains: [1, 56, 137, 43114, 10, 42161],
        tokens: ['USDC', 'USDT', 'DAI', 'FRAX'],
        fees: { base: 0.06, variable: 0.1 }, // 0.06% base + 0.1% variable
        speed: 'fast', // 1-3 minutes
        security: 'high'
      }
    };
    
    // Chain gas tokens for fee calculation
    this.chainGasTokens = {
      1: { symbol: 'ETH', decimals: 18 },
      56: { symbol: 'BNB', decimals: 18 },
      137: { symbol: 'MATIC', decimals: 18 },
      43114: { symbol: 'AVAX', decimals: 18 },
      10: { symbol: 'ETH', decimals: 18 },
      42161: { symbol: 'ETH', decimals: 18 },
      250: { symbol: 'FTM', decimals: 18 }
    };
    
    // Bridge contract addresses by chain
    this.bridgeContracts = {
      1: {
        layerzero: '0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675',
        polygon_bridge: '0xA0c68C638235ee32657e8f720a23ceC1bFc77C77',
        multichain: '0x6b7a87899490EcE95443e979cA9485CBE7E71522',
        hop: '0xb8901acB165ed027E32754E0FFe830802919727f',
        stargate: '0x8731d54E9D02c286767d56ac03e8037C07e01e98'
      },
      137: {
        layerzero: '0x3c2269811836af69497E5F486A85D7316753cf62',
        polygon_bridge: '0x8484Ef722627bf18ca5Ae6BcF031c23E6e922B30',
        multichain: '0x4F4495243837681061C4743b74B3eEdf548D56A5',
        hop: '0xTBD',
        stargate: '0x45A01E4e04F14f7A4a6702c74187c5F6222033cd'
      }
    };
  }

  // Initialize cross-chain bridge service
  async initialize() {
    try {
      await BlockchainService.initialize();
      await this.loadBridgeRoutes();
      await this.loadPendingTransfers();
      
      console.log('Cross-Chain Bridge Service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize cross-chain bridge service:', error);
      return false;
    }
  }

  // Load available bridge routes
  async loadBridgeRoutes() {
    try {
      for (const [bridgeId, bridge] of Object.entries(this.bridges)) {
        for (const fromChain of bridge.chains) {
          for (const toChain of bridge.chains) {
            if (fromChain !== toChain) {
              for (const token of bridge.tokens) {
                const routeKey = `${bridgeId}_${fromChain}_${toChain}_${token}`;
                this.bridgeRoutes.set(routeKey, {
                  bridgeId,
                  bridge,
                  fromChain,
                  toChain,
                  token,
                  available: true
                });
              }
            }
          }
        }
      }
      
      console.log(`Loaded ${this.bridgeRoutes.size} bridge routes`);
    } catch (error) {
      console.error('Failed to load bridge routes:', error);
    }
  }

  // Load pending transfers from local storage
  async loadPendingTransfers() {
    try {
      const stored = localStorage.getItem('crosschain_pending_transfers');
      if (stored) {
        const transfers = JSON.parse(stored);
        for (const [id, transfer] of Object.entries(transfers)) {
          this.pendingTransfers.set(id, transfer);
        }
      }
    } catch (error) {
      console.error('Failed to load pending transfers:', error);
    }
  }

  // Save pending transfers to local storage
  savePendingTransfers() {
    try {
      const transfers = Object.fromEntries(this.pendingTransfers);
      localStorage.setItem('crosschain_pending_transfers', JSON.stringify(transfers));
    } catch (error) {
      console.error('Failed to save pending transfers:', error);
    }
  }

  // Find optimal bridge route
  async findOptimalRoute(fromChain, toChain, token, amount, priority = 'cost') {
    try {
      const availableRoutes = [];
      
      // Find all available routes for this transfer
      for (const [routeKey, route] of this.bridgeRoutes) {
        if (route.fromChain === fromChain && 
            route.toChain === toChain && 
            route.token === token &&
            route.available) {
          
          const routeInfo = await this.getRouteInfo(route, amount);
          availableRoutes.push(routeInfo);
        }
      }

      if (availableRoutes.length === 0) {
        throw new Error('No available routes found');
      }

      // Sort routes based on priority
      const sortedRoutes = this.sortRoutesByPriority(availableRoutes, priority);
      
      return {
        optimalRoute: sortedRoutes[0],
        allRoutes: sortedRoutes,
        savings: sortedRoutes.length > 1 ? 
          this.calculateSavings(sortedRoutes[0], sortedRoutes[1]) : 0
      };
    } catch (error) {
      console.error('Failed to find optimal route:', error);
      throw error;
    }
  }

  // Get detailed route information
  async getRouteInfo(route, amount) {
    try {
      const fees = await this.calculateBridgeFees(route, amount);
      const timeEstimate = this.getTimeEstimate(route.bridge.speed);
      const security = this.getSecurityScore(route.bridge.security);
      
      return {
        ...route,
        amount: parseFloat(amount),
        fees: fees,
        timeEstimate: timeEstimate,
        security: security,
        netAmount: parseFloat(amount) - fees.total,
        costEfficiency: (parseFloat(amount) - fees.total) / parseFloat(amount),
        reliabilityScore: await this.getBridgeReliability(route.bridgeId)
      };
    } catch (error) {
      console.error('Failed to get route info:', error);
      throw error;
    }
  }

  // Calculate bridge fees
  async calculateBridgeFees(route, amount) {
    try {
      const bridge = route.bridge;
      const baseFee = (parseFloat(amount) * bridge.fees.base) / 100;
      const variableFee = (parseFloat(amount) * bridge.fees.variable) / 100;
      
      // Get gas fees for both chains
      const sourceGasFee = await this.estimateGasFee(route.fromChain, 'bridge_send');
      const destGasFee = await this.estimateGasFee(route.toChain, 'bridge_receive');
      
      return {
        baseFee: baseFee,
        variableFee: variableFee,
        sourceGas: sourceGasFee,
        destGas: destGasFee,
        total: baseFee + variableFee + sourceGasFee + destGasFee,
        breakdown: {
          protocolFee: baseFee + variableFee,
          gasFees: sourceGasFee + destGasFee
        }
      };
    } catch (error) {
      console.error('Failed to calculate bridge fees:', error);
      return { baseFee: 0, variableFee: 0, sourceGas: 0, destGas: 0, total: 0 };
    }
  }

  // Estimate gas fee for chain operation
  async estimateGasFee(chainId, operation) {
    try {
      // Mock gas estimation - replace with actual network calls
      const gasEstimates = {
        bridge_send: { 1: 0.02, 56: 0.001, 137: 0.01, 43114: 0.005 },
        bridge_receive: { 1: 0.01, 56: 0.0005, 137: 0.005, 43114: 0.0025 }
      };
      
      return gasEstimates[operation][chainId] || 0.01;
    } catch (error) {
      console.error('Failed to estimate gas fee:', error);
      return 0.01;
    }
  }

  // Get time estimate
  getTimeEstimate(speed) {
    const timeRanges = {
      fast: { min: 1, max: 5, unit: 'minutes' },
      medium: { min: 5, max: 30, unit: 'minutes' },
      slow: { min: 30, max: 120, unit: 'minutes' }
    };
    
    return timeRanges[speed] || timeRanges.medium;
  }

  // Get security score
  getSecurityScore(level) {
    const scores = { high: 95, medium: 75, low: 50 };
    return scores[level] || 75;
  }

  // Get bridge reliability score
  async getBridgeReliability(bridgeId) {
    try {
      // Mock reliability scores - replace with actual metrics
      const reliabilityScores = {
        layerzero: 98,
        polygon_bridge: 96,
        multichain: 85,
        hop: 92,
        stargate: 94
      };
      
      return reliabilityScores[bridgeId] || 80;
    } catch (error) {
      console.error('Failed to get bridge reliability:', error);
      return 80;
    }
  }

  // Sort routes by priority
  sortRoutesByPriority(routes, priority) {
    switch (priority) {
      case 'cost':
        return routes.sort((a, b) => a.fees.total - b.fees.total);
      case 'speed':
        return routes.sort((a, b) => a.timeEstimate.max - b.timeEstimate.max);
      case 'security':
        return routes.sort((a, b) => b.security - a.security);
      case 'reliability':
        return routes.sort((a, b) => b.reliabilityScore - a.reliabilityScore);
      default:
        // Balanced score: cost efficiency * reliability * security
        return routes.sort((a, b) => {
          const scoreA = a.costEfficiency * (a.reliabilityScore / 100) * (a.security / 100);
          const scoreB = b.costEfficiency * (b.reliabilityScore / 100) * (b.security / 100);
          return scoreB - scoreA;
        });
    }
  }

  // Calculate savings between routes
  calculateSavings(bestRoute, alternativeRoute) {
    const savingsAmount = alternativeRoute.fees.total - bestRoute.fees.total;
    const savingsPercentage = (savingsAmount / alternativeRoute.fees.total) * 100;
    
    return {
      amount: savingsAmount,
      percentage: savingsPercentage
    };
  }

  // Execute cross-chain transfer
  async executeCrossChainTransfer(route, amount, options = {}) {
    try {
      const {
        slippageTolerance = 1,
        recipient = BlockchainService.account,
        progressCallback = null
      } = options;

      const transferId = this.generateTransferId();
      
      if (progressCallback) {
        progressCallback({ step: 'preparing', transferId });
      }

      // Build bridge transaction
      const transaction = await this.buildBridgeTransaction(route, amount, recipient, slippageTolerance);
      
      if (progressCallback) {
        progressCallback({ step: 'sending', transferId });
      }

      // Execute transaction on source chain
      const result = await BlockchainService.executeTransaction(transaction);
      
      // Track transfer
      const transfer = {
        id: transferId,
        route: route,
        amount: amount,
        recipient: recipient,
        sourceTransaction: result.hash,
        status: 'pending',
        timestamp: new Date().toISOString(),
        estimatedCompletion: this.calculateCompletionTime(route.timeEstimate)
      };
      
      this.pendingTransfers.set(transferId, transfer);
      this.savePendingTransfers();
      
      if (progressCallback) {
        progressCallback({ step: 'tracking', transferId, sourceHash: result.hash });
      }

      // Start monitoring
      this.monitorTransfer(transferId, progressCallback);
      
      return {
        transferId,
        sourceTransaction: result,
        estimatedCompletion: transfer.estimatedCompletion
      };
    } catch (error) {
      console.error('Failed to execute cross-chain transfer:', error);
      throw error;
    }
  }

  // Build bridge transaction
  async buildBridgeTransaction(route, amount, recipient, slippage) {
    try {
      const contractAddress = this.bridgeContracts[route.fromChain][route.bridgeId];
      
      if (!contractAddress) {
        throw new Error(`Bridge contract not found for ${route.bridgeId} on chain ${route.fromChain}`);
      }

      // Calculate minimum amount out with slippage
      const minAmountOut = (parseFloat(amount) * (1 - slippage / 100)).toString();
      
      let transaction;
      
      switch (route.bridgeId) {
        case 'layerzero':
          transaction = await this.buildLayerZeroTransaction(route, amount, recipient, minAmountOut);
          break;
        case 'polygon_bridge':
          transaction = await this.buildPolygonBridgeTransaction(route, amount, recipient);
          break;
        case 'multichain':
          transaction = await this.buildMultichainTransaction(route, amount, recipient);
          break;
        case 'hop':
          transaction = await this.buildHopTransaction(route, amount, recipient, minAmountOut);
          break;
        case 'stargate':
          transaction = await this.buildStargateTransaction(route, amount, recipient, minAmountOut);
          break;
        default:
          throw new Error(`Unsupported bridge: ${route.bridgeId}`);
      }
      
      return transaction;
    } catch (error) {
      console.error('Failed to build bridge transaction:', error);
      throw error;
    }
  }

  // Build LayerZero transaction
  async buildLayerZeroTransaction(route, amount, recipient, minAmountOut) {
    const contractAddress = this.bridgeContracts[route.fromChain].layerzero;
    
    // Mock LayerZero transaction - replace with actual SDK
    return {
      to: contractAddress,
      data: '0x...', // Encoded sendFrom function call
      value: route.token === 'ETH' ? ethers.utils.parseEther(amount) : '0'
    };
  }

  // Build Polygon Bridge transaction
  async buildPolygonBridgeTransaction(route, amount, recipient) {
    const contractAddress = this.bridgeContracts[route.fromChain].polygon_bridge;
    
    // Mock Polygon Bridge transaction
    return {
      to: contractAddress,
      data: '0x...', // Encoded deposit/withdraw function call
      value: route.token === 'ETH' ? ethers.utils.parseEther(amount) : '0'
    };
  }

  // Build Multichain transaction
  async buildMultichainTransaction(route, amount, recipient) {
    const contractAddress = this.bridgeContracts[route.fromChain].multichain;
    
    // Mock Multichain transaction
    return {
      to: contractAddress,
      data: '0x...', // Encoded anySwapOut function call
      value: '0'
    };
  }

  // Build Hop transaction
  async buildHopTransaction(route, amount, recipient, minAmountOut) {
    const contractAddress = this.bridgeContracts[route.fromChain].hop;
    
    // Mock Hop transaction
    return {
      to: contractAddress,
      data: '0x...', // Encoded sendToL2 function call
      value: route.token === 'ETH' ? ethers.utils.parseEther(amount) : '0'
    };
  }

  // Build Stargate transaction
  async buildStargateTransaction(route, amount, recipient, minAmountOut) {
    const contractAddress = this.bridgeContracts[route.fromChain].stargate;
    
    // Mock Stargate transaction
    return {
      to: contractAddress,
      data: '0x...', // Encoded swap function call
      value: '0'
    };
  }

  // Generate unique transfer ID
  generateTransferId() {
    return `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Calculate completion time
  calculateCompletionTime(timeEstimate) {
    const avgTime = (timeEstimate.min + timeEstimate.max) / 2;
    return new Date(Date.now() + avgTime * 60 * 1000).toISOString();
  }

  // Monitor transfer progress
  async monitorTransfer(transferId, progressCallback) {
    const transfer = this.pendingTransfers.get(transferId);
    if (!transfer) return;

    try {
      // Start polling for completion
      const pollInterval = setInterval(async () => {
        try {
          const status = await this.checkTransferStatus(transfer);
          
          if (status.completed) {
            transfer.status = 'completed';
            transfer.destinationTransaction = status.destinationHash;
            transfer.completedAt = new Date().toISOString();
            
            this.pendingTransfers.delete(transferId);
            this.addToHistory(transfer);
            
            if (progressCallback) {
              progressCallback({ 
                step: 'completed', 
                transferId, 
                destinationHash: status.destinationHash 
              });
            }
            
            clearInterval(pollInterval);
          } else if (status.failed) {
            transfer.status = 'failed';
            transfer.error = status.error;
            
            if (progressCallback) {
              progressCallback({ 
                step: 'failed', 
                transferId, 
                error: status.error 
              });
            }
            
            clearInterval(pollInterval);
          } else {
            if (progressCallback) {
              progressCallback({ 
                step: 'pending', 
                transferId, 
                progress: status.progress 
              });
            }
          }
        } catch (error) {
          console.error(`Error monitoring transfer ${transferId}:`, error);
        }
      }, 30000); // Check every 30 seconds

      // Set timeout for maximum monitoring time
      setTimeout(() => {
        clearInterval(pollInterval);
        if (transfer.status === 'pending') {
          transfer.status = 'timeout';
          if (progressCallback) {
            progressCallback({ step: 'timeout', transferId });
          }
        }
      }, 60 * 60 * 1000); // 1 hour timeout
    } catch (error) {
      console.error('Failed to monitor transfer:', error);
    }
  }

  // Check transfer status
  async checkTransferStatus(transfer) {
    try {
      // Mock status check - replace with actual bridge API calls
      const elapsed = Date.now() - new Date(transfer.timestamp).getTime();
      const expectedTime = (transfer.route.timeEstimate.min + transfer.route.timeEstimate.max) / 2 * 60 * 1000;
      
      if (elapsed >= expectedTime) {
        return {
          completed: true,
          destinationHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          progress: 100
        };
      } else {
        return {
          completed: false,
          failed: false,
          progress: Math.min(95, (elapsed / expectedTime) * 100)
        };
      }
    } catch (error) {
      console.error('Failed to check transfer status:', error);
      return { completed: false, failed: true, error: error.message };
    }
  }

  // Add transfer to history
  addToHistory(transfer) {
    this.transferHistory.set(transfer.id, transfer);
    
    // Save to localStorage
    try {
      const history = Object.fromEntries(this.transferHistory);
      localStorage.setItem('crosschain_transfer_history', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save transfer history:', error);
    }
  }

  // Get pending transfers
  getPendingTransfers() {
    return Array.from(this.pendingTransfers.values());
  }

  // Get transfer history
  getTransferHistory(limit = 50) {
    return Array.from(this.transferHistory.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  // Cancel pending transfer (if possible)
  async cancelTransfer(transferId) {
    const transfer = this.pendingTransfers.get(transferId);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    // Check if cancellation is possible (usually only before bridge confirmation)
    const canCancel = await this.checkCancellationPossibility(transfer);
    
    if (!canCancel) {
      throw new Error('Transfer cannot be cancelled at this stage');
    }

    // Perform cancellation (implementation depends on bridge protocol)
    transfer.status = 'cancelled';
    transfer.cancelledAt = new Date().toISOString();
    
    this.pendingTransfers.delete(transferId);
    this.addToHistory(transfer);
    
    return true;
  }

  // Check if transfer can be cancelled
  async checkCancellationPossibility(transfer) {
    // Mock cancellation check - depends on bridge protocol
    const elapsed = Date.now() - new Date(transfer.timestamp).getTime();
    return elapsed < 5 * 60 * 1000; // Can cancel within 5 minutes
  }

  // Get supported chains
  getSupportedChains() {
    const chains = new Set();
    Object.values(this.bridges).forEach(bridge => {
      bridge.chains.forEach(chain => chains.add(chain));
    });
    return Array.from(chains);
  }

  // Get supported tokens for chain pair
  getSupportedTokens(fromChain, toChain) {
    const tokens = new Set();
    
    Object.values(this.bridges).forEach(bridge => {
      if (bridge.chains.includes(fromChain) && bridge.chains.includes(toChain)) {
        bridge.tokens.forEach(token => tokens.add(token));
      }
    });
    
    return Array.from(tokens);
  }

  // Get bridge statistics
  async getBridgeStats() {
    try {
      const stats = {
        totalBridges: Object.keys(this.bridges).length,
        totalRoutes: this.bridgeRoutes.size,
        pendingTransfers: this.pendingTransfers.size,
        completedTransfers: this.transferHistory.size,
        supportedChains: this.getSupportedChains().length,
        averageTransferTime: await this.calculateAverageTransferTime(),
        totalVolume: await this.calculateTotalVolume()
      };
      
      return stats;
    } catch (error) {
      console.error('Failed to get bridge stats:', error);
      throw error;
    }
  }

  // Calculate average transfer time
  async calculateAverageTransferTime() {
    const completedTransfers = Array.from(this.transferHistory.values())
      .filter(t => t.status === 'completed' && t.completedAt);
    
    if (completedTransfers.length === 0) return 0;
    
    const totalTime = completedTransfers.reduce((sum, transfer) => {
      const start = new Date(transfer.timestamp);
      const end = new Date(transfer.completedAt);
      return sum + (end - start);
    }, 0);
    
    return totalTime / completedTransfers.length / (1000 * 60); // Average in minutes
  }

  // Calculate total bridge volume
  async calculateTotalVolume() {
    const allTransfers = [
      ...Array.from(this.pendingTransfers.values()),
      ...Array.from(this.transferHistory.values())
    ];
    
    return allTransfers.reduce((sum, transfer) => sum + parseFloat(transfer.amount), 0);
  }
}

export default new CrossChainBridgeService();