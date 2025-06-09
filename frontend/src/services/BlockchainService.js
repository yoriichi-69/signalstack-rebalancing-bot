import { ethers } from 'ethers';
import Web3 from 'web3';

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.web3 = null;
    this.account = null;
    this.chainId = null;
    this.isConnected = false;
    
    // Network configurations
    this.networks = {
      1: {
        name: 'Ethereum Mainnet',
        rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
        explorer: 'https://etherscan.io',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
      },
      137: {
        name: 'Polygon',
        rpcUrl: 'https://polygon-rpc.com',
        explorer: 'https://polygonscan.com',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }
      },
      56: {
        name: 'BSC',
        rpcUrl: 'https://bsc-dataseed.binance.org',
        explorer: 'https://bscscan.com',
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }
      },
      43114: {
        name: 'Avalanche',
        rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
        explorer: 'https://snowtrace.io',
        nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 }
      }
    };
    
    // Contract addresses for different networks
    this.contractAddresses = {
      1: { // Ethereum
        USDC: '0xA0b86a33E6441c0c25Ae99e1D6C3A2b82C2Bd9b8',
        USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        UNISWAP_V3_ROUTER: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
        AAVE_LENDING_POOL: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9'
      },
      137: { // Polygon
        USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
        QUICKSWAP_ROUTER: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
        AAVE_LENDING_POOL: '0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf'
      }
    };
    
    this.gasSettings = {
      low: { gasPrice: ethers.utils.parseUnits('20', 'gwei'), priority: 'standard' },
      medium: { gasPrice: ethers.utils.parseUnits('30', 'gwei'), priority: 'fast' },
      high: { gasPrice: ethers.utils.parseUnits('50', 'gwei'), priority: 'fastest' }
    };
  }

  // Initialize blockchain connection
  async initialize() {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        // Initialize ethers provider
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        this.web3 = new Web3(window.ethereum);
        
        // Get network info
        const network = await this.provider.getNetwork();
        this.chainId = network.chainId;
        
        console.log('Blockchain service initialized for network:', this.networks[this.chainId]?.name || 'Unknown');
        return true;
      } else {
        console.warn('MetaMask not detected');
        return false;
      }
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      return false;
    }
  }

  // Connect wallet
  async connectWallet() {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.account = accounts[0];
      this.signer = this.provider.getSigner(this.account);
      this.isConnected = true;

      // Get network info
      const network = await this.provider.getNetwork();
      this.chainId = network.chainId;

      console.log('Wallet connected:', this.account);
      console.log('Network:', this.networks[this.chainId]?.name || 'Unknown');

      // Setup event listeners
      this.setupEventListeners();

      return {
        account: this.account,
        chainId: this.chainId,
        network: this.networks[this.chainId]?.name || 'Unknown'
      };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  // Disconnect wallet
  async disconnectWallet() {
    this.account = null;
    this.signer = null;
    this.isConnected = false;
    console.log('Wallet disconnected');
  }

  // Setup event listeners for wallet changes
  setupEventListeners() {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          this.disconnectWallet();
        } else {
          this.account = accounts[0];
          this.signer = this.provider.getSigner(this.account);
          console.log('Account changed to:', this.account);
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        this.chainId = parseInt(chainId, 16);
        console.log('Network changed to:', this.networks[this.chainId]?.name || 'Unknown');
        window.location.reload(); // Reload to reset state
      });
    }
  }

  // Switch network
  async switchNetwork(targetChainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }]
      });
      
      this.chainId = targetChainId;
      return true;
    } catch (error) {
      // Network not added to wallet
      if (error.code === 4902) {
        return await this.addNetwork(targetChainId);
      }
      throw error;
    }
  }

  // Add network to wallet
  async addNetwork(chainId) {
    const network = this.networks[chainId];
    if (!network) {
      throw new Error('Unsupported network');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${chainId.toString(16)}`,
          chainName: network.name,
          rpcUrls: [network.rpcUrl],
          blockExplorerUrls: [network.explorer],
          nativeCurrency: network.nativeCurrency
        }]
      });
      
      this.chainId = chainId;
      return true;
    } catch (error) {
      console.error('Failed to add network:', error);
      throw error;
    }
  }

  // Get account balance
  async getBalance(tokenAddress = null) {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      if (!tokenAddress) {
        // Native token balance (ETH, MATIC, etc.)
        const balance = await this.provider.getBalance(this.account);
        return ethers.utils.formatEther(balance);
      } else {
        // ERC20 token balance
        const contract = new ethers.Contract(
          tokenAddress,
          ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
          this.provider
        );
        
        const [balance, decimals] = await Promise.all([
          contract.balanceOf(this.account),
          contract.decimals()
        ]);
        
        return ethers.utils.formatUnits(balance, decimals);
      }
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  // Get token info
  async getTokenInfo(tokenAddress) {
    try {
      const contract = new ethers.Contract(
        tokenAddress,
        [
          'function name() view returns (string)',
          'function symbol() view returns (string)',
          'function decimals() view returns (uint8)',
          'function totalSupply() view returns (uint256)'
        ],
        this.provider
      );

      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply()
      ]);

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals,
        totalSupply: ethers.utils.formatUnits(totalSupply, decimals)
      };
    } catch (error) {
      console.error('Failed to get token info:', error);
      throw error;
    }
  }

  // Estimate gas for transaction
  async estimateGas(transaction) {
    try {
      const gasEstimate = await this.provider.estimateGas(transaction);
      const gasPrice = await this.provider.getGasPrice();
      
      return {
        gasLimit: gasEstimate,
        gasPrice: gasPrice,
        estimatedCost: gasEstimate.mul(gasPrice),
        estimatedCostEth: ethers.utils.formatEther(gasEstimate.mul(gasPrice))
      };
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      throw error;
    }
  }

  // Get optimal gas settings
  async getOptimalGasSettings(priority = 'medium') {
    try {
      // Get current gas price from network
      const currentGasPrice = await this.provider.getGasPrice();
      
      // EIP-1559 support check
      const feeData = await this.provider.getFeeData();
      
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        // EIP-1559 transaction
        const priorityMultipliers = { low: 1, medium: 1.2, high: 1.5 };
        const multiplier = priorityMultipliers[priority] || 1.2;
        
        return {
          type: 2, // EIP-1559
          maxFeePerGas: feeData.maxFeePerGas.mul(Math.floor(multiplier * 100)).div(100),
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas.mul(Math.floor(multiplier * 100)).div(100)
        };
      } else {
        // Legacy transaction
        const priorityMultipliers = { low: 1, medium: 1.2, high: 1.5 };
        const multiplier = priorityMultipliers[priority] || 1.2;
        
        return {
          type: 0, // Legacy
          gasPrice: currentGasPrice.mul(Math.floor(multiplier * 100)).div(100)
        };
      }
    } catch (error) {
      console.error('Failed to get optimal gas settings:', error);
      return this.gasSettings[priority];
    }
  }

  // Execute transaction with retry logic
  async executeTransaction(transaction, options = {}) {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }

    const {
      gasPriority = 'medium',
      maxRetries = 3,
      retryDelay = 2000,
      onProgress = null
    } = options;

    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (onProgress) {
          onProgress({ step: 'preparing', attempt, maxRetries });
        }

        // Get optimal gas settings
        const gasSettings = await this.getOptimalGasSettings(gasPriority);
        
        // Prepare transaction
        const txRequest = {
          ...transaction,
          ...gasSettings
        };

        if (onProgress) {
          onProgress({ step: 'estimating_gas', attempt, maxRetries });
        }

        // Estimate gas if not provided
        if (!txRequest.gasLimit) {
          const gasEstimate = await this.estimateGas(txRequest);
          txRequest.gasLimit = gasEstimate.gasLimit.mul(110).div(100); // Add 10% buffer
        }

        if (onProgress) {
          onProgress({ step: 'sending', attempt, maxRetries });
        }

        // Send transaction
        const tx = await this.signer.sendTransaction(txRequest);
        
        if (onProgress) {
          onProgress({ step: 'confirming', attempt, maxRetries, txHash: tx.hash });
        }

        // Wait for confirmation
        const receipt = await tx.wait();
        
        if (onProgress) {
          onProgress({ step: 'confirmed', attempt, maxRetries, txHash: tx.hash, receipt });
        }

        return {
          hash: tx.hash,
          receipt,
          gasUsed: receipt.gasUsed,
          gasPrice: tx.gasPrice || gasSettings.maxFeePerGas,
          cost: receipt.gasUsed.mul(tx.gasPrice || gasSettings.maxFeePerGas)
        };

      } catch (error) {
        lastError = error;
        console.error(`Transaction attempt ${attempt} failed:`, error);
        
        if (onProgress) {
          onProgress({ step: 'error', attempt, maxRetries, error: error.message });
        }

        // Check if error is retryable
        if (!this.isRetryableError(error) || attempt === maxRetries) {
          break;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }

    throw lastError;
  }

  // Check if error is retryable
  isRetryableError(error) {
    const retryableErrors = [
      'network error',
      'timeout',
      'nonce too low',
      'replacement transaction underpriced',
      'server error'
    ];

    return retryableErrors.some(retryable => 
      error.message.toLowerCase().includes(retryable)
    );
  }

  // Batch multiple transactions
  async batchTransactions(transactions, options = {}) {
    const results = [];
    const errors = [];

    for (let i = 0; i < transactions.length; i++) {
      try {
        const result = await this.executeTransaction(transactions[i], {
          ...options,
          onProgress: (progress) => {
            if (options.onProgress) {
              options.onProgress({
                ...progress,
                transactionIndex: i,
                totalTransactions: transactions.length
              });
            }
          }
        });
        results.push(result);
      } catch (error) {
        errors.push({ index: i, error });
        
        // Stop on first error unless continueOnError is true
        if (!options.continueOnError) {
          break;
        }
      }
    }

    return { results, errors };
  }

  // Get transaction status
  async getTransactionStatus(txHash) {
    try {
      const [tx, receipt] = await Promise.all([
        this.provider.getTransaction(txHash),
        this.provider.getTransactionReceipt(txHash)
      ]);

      if (!tx) {
        return { status: 'not_found' };
      }

      if (!receipt) {
        return { status: 'pending', transaction: tx };
      }

      return {
        status: receipt.status === 1 ? 'success' : 'failed',
        transaction: tx,
        receipt,
        confirmations: receipt.confirmations,
        gasUsed: receipt.gasUsed,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      throw error;
    }
  }

  // Get current network info
  getCurrentNetwork() {
    return {
      chainId: this.chainId,
      name: this.networks[this.chainId]?.name || 'Unknown',
      isSupported: !!this.networks[this.chainId],
      explorer: this.networks[this.chainId]?.explorer,
      nativeCurrency: this.networks[this.chainId]?.nativeCurrency
    };
  }

  // Get contract addresses for current network
  getContractAddresses() {
    return this.contractAddresses[this.chainId] || {};
  }

  // Utility: Format address for display
  formatAddress(address, length = 8) {
    if (!address) return '';
    return `${address.slice(0, length)}...${address.slice(-4)}`;
  }

  // Utility: Check if address is valid
  isValidAddress(address) {
    return ethers.utils.isAddress(address);
  }

  // Utility: Convert to checksum address
  toChecksumAddress(address) {
    return ethers.utils.getAddress(address);
  }
}

export default new BlockchainService();