// d:\intel\cryptorizz\main\signalstack-rebalancing-bot\contracts\RebalanceRouterV2.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function getAmountsOut(
        uint amountIn, 
        address[] calldata path
    ) external view returns (uint[] memory amounts);
}

interface IRebalanceStrategy {
    function getTargetWeights() external view returns (address[] memory tokens, uint[] memory weights);
}

contract RebalanceRouterV2 is Ownable, ReentrancyGuard {
    using SafeMath for uint;
    
    IUniswapV2Router public immutable uniswapRouter;
    address public immutable wethAddress;
    
    // Supported tokens
    mapping(address => bool) public supportedTokens;
    address[] public tokenList;
    
    // Portfolio data
    mapping(address => uint) public targetWeights; // in basis points (1/100 of a percent)
    uint public constant TOTAL_WEIGHT = 10000; // 100%
    uint public slippageTolerance = 50; // 0.5%
    
    // Strategy
    IRebalanceStrategy public strategy;
    bool public useStrategy = false;
    
    // Events
    event TokenAdded(address token, uint weight);
    event TokenRemoved(address token);
    event TargetWeightsUpdated(address[] tokens, uint[] weights);
    event RebalanceExecuted(uint[] amountsSwapped);
    event StrategySet(address strategyContract, bool enabled);
    
    constructor(address _uniswapRouter, address _wethAddress) Ownable(msg.sender) {
        uniswapRouter = IUniswapV2Router(_uniswapRouter);
        wethAddress = _wethAddress;
    }
    
    // Add supported token
    function addSupportedToken(address token, uint weight) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(!supportedTokens[token], "Token already supported");
        
        supportedTokens[token] = true;
        tokenList.push(token);
        targetWeights[token] = weight;
        
        // Ensure weights sum to 100%
        _validateWeights();
        
        emit TokenAdded(token, weight);
    }
    
    // Remove token
    function removeSupportedToken(address token) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        
        supportedTokens[token] = false;
        targetWeights[token] = 0;
        
        // Remove from list
        for (uint i = 0; i < tokenList.length; i++) {
            if (tokenList[i] == token) {
                tokenList[i] = tokenList[tokenList.length - 1];
                tokenList.pop();
                break;
            }
        }
        
        // Ensure weights sum to 100%
        _validateWeights();
        
        emit TokenRemoved(token);
    }
    
    // Update target weights
    function updateTargetWeights(address[] calldata tokens, uint[] calldata weights) external onlyOwner {
        require(tokens.length == weights.length, "Arrays length mismatch");
        
        uint totalWeight = 0;
        
        for (uint i = 0; i < tokens.length; i++) {
            require(supportedTokens[tokens[i]], "Unsupported token");
            targetWeights[tokens[i]] = weights[i];
            totalWeight += weights[i];
        }
        
        require(totalWeight == TOTAL_WEIGHT, "Weights must sum to 100%");
        
        emit TargetWeightsUpdated(tokens, weights);
    }
    
    // Set rebalance strategy
    function setStrategy(address _strategy, bool _enabled) external onlyOwner {
        strategy = IRebalanceStrategy(_strategy);
        useStrategy = _enabled;
        
        emit StrategySet(_strategy, _enabled);
    }
    
    // Execute strategy-based rebalance
    function executeStrategyRebalance() external nonReentrant {
        require(useStrategy, "No strategy enabled");
        require(address(strategy) != address(0), "Strategy not set");
        
        // Get weights from strategy
        (address[] memory tokens, uint[] memory weights) = strategy.getTargetWeights();
        
        // Update target weights
        for (uint i = 0; i < tokens.length; i++) {
            if (supportedTokens[tokens[i]]) {
                targetWeights[tokens[i]] = weights[i];
            }
        }
        
        // Execute rebalance
        _rebalance();
    }
    
    // Manual rebalance
    function rebalance() external nonReentrant {
        _rebalance();
    }
    
    // Internal rebalance logic
    function _rebalance() internal {
        uint[] memory swapAmounts = new uint[](tokenList.length);
        uint[] memory tokenValues = getPortfolioTokenValues();
        uint totalValue = getPortfolioTotalValue();
        
        if (totalValue == 0) return; // Empty portfolio
        
        // Calculate desired amounts for each token
        for (uint i = 0; i < tokenList.length; i++) {
            address token = tokenList[i];
            uint targetValue = totalValue.mul(targetWeights[token]).div(TOTAL_WEIGHT);
            uint currentValue = tokenValues[i];
            
            // If current allocation is different from target by more than 1%
            if (currentValue > targetValue.mul(101).div(100) || 
                currentValue < targetValue.mul(99).div(100)) {
                
                // Need to swap
                if (currentValue > targetValue) {
                    // Sell excess
                    uint excessValue = currentValue.sub(targetValue);
                    uint balance = IERC20(token).balanceOf(address(this));
                    uint amountToSell = balance.mul(excessValue).div(currentValue);
                    
                    swapAmounts[i] = amountToSell;
                }
            }
        }
        
        // Execute swaps
        for (uint i = 0; i < tokenList.length; i++) {
            if (swapAmounts[i] > 0) {
                _executeSwap(tokenList[i], swapAmounts[i]);
            }
        }
        
        emit RebalanceExecuted(swapAmounts);
    }
    
    // Execute swap based on calculated amounts
    function _executeSwap(address tokenFrom, uint amountIn) internal {
        // Find the most underweight token
        address mostUnderweightToken = _findMostUnderweightToken();
        
        if (mostUnderweightToken != address(0)) {
            // Prepare swap path
            address[] memory path = new address[](3);
            path[0] = tokenFrom;
            path[1] = wethAddress;
            path[2] = mostUnderweightToken;
            
            // If direct path exists
            if (tokenFrom == wethAddress || mostUnderweightToken == wethAddress) {
                path = new address[](2);
                path[0] = tokenFrom;
                path[1] = mostUnderweightToken;
            }
            
            // Get expected output amount
            uint[] memory amounts = uniswapRouter.getAmountsOut(amountIn, path);
            uint amountOutMin = amounts[amounts.length - 1].mul(10000 - slippageTolerance).div(10000);
            
            // Approve router
            IERC20(tokenFrom).approve(address(uniswapRouter), amountIn);
            
            // Execute swap
            uniswapRouter.swapExactTokensForTokens(
                amountIn,
                amountOutMin,
                path,
                address(this),
                block.timestamp + 300
            );
        }
    }
    
    // Find the most underweight token
    function _findMostUnderweightToken() internal view returns (address) {
        address mostUnderweightToken = address(0);
        int256 highestDeficit = 0;
        
        uint[] memory tokenValues = getPortfolioTokenValues();
        uint totalValue = getPortfolioTotalValue();
        
        if (totalValue == 0) return address(0);
        
        for (uint i = 0; i < tokenList.length; i++) {
            address token = tokenList[i];
            uint targetValue = totalValue.mul(targetWeights[token]).div(TOTAL_WEIGHT);
            uint currentValue = tokenValues[i];
            
            if (currentValue < targetValue) {
                int256 deficit = int256(targetValue) - int256(currentValue);
                
                if (deficit > highestDeficit) {
                    highestDeficit = deficit;
                    mostUnderweightToken = token;
                }
            }
        }
        
        return mostUnderweightToken;
    }
    
    // Validate that weights sum to 100%
    function _validateWeights() internal view {
        uint totalWeight = 0;
        
        for (uint i = 0; i < tokenList.length; i++) {
            if (supportedTokens[tokenList[i]]) {
                totalWeight += targetWeights[tokenList[i]];
            }
        }
        
        require(totalWeight == TOTAL_WEIGHT, "Weights must sum to 100%");
    }
    
    // Portfolio valuation functions
    function getPortfolioTokenValues() public view returns (uint[] memory values) {
        values = new uint[](tokenList.length);
        
        for (uint i = 0; i < tokenList.length; i++) {
            address token = tokenList[i];
            if (!supportedTokens[token]) continue;
            
            uint balance = IERC20(token).balanceOf(address(this));
            
            // For simplicity, we'll assume all tokens have the same decimals (18)
            // In a production version, you would need to handle different decimals
            values[i] = balance;
            
            // If token is not WETH, convert to WETH value
            if (token != wethAddress && balance > 0) {
                address[] memory path = new address[](2);
                path[0] = token;
                path[1] = wethAddress;
                
                try uniswapRouter.getAmountsOut(balance, path) returns (uint[] memory amounts) {
                    values[i] = amounts[1]; // WETH value
                } catch {
                    // If price lookup fails, keep the raw balance
                }
            }
        }
        
        return values;
    }
    
    function getPortfolioTotalValue() public view returns (uint totalValue) {
        uint[] memory values = getPortfolioTokenValues();
        
        for (uint i = 0; i < values.length; i++) {
            totalValue += values[i];
        }
        
        return totalValue;
    }
    
    function getPortfolioSummary() external view returns (
        address[] memory tokens,
        uint[] memory balances,
        uint[] memory values,
        uint[] memory currentWeights,
        uint[] memory targetWeightsResult
    ) {
        tokens = new address[](tokenList.length);
        balances = new uint[](tokenList.length);
        values = new uint[](tokenList.length);
        currentWeights = new uint[](tokenList.length);
        targetWeightsResult = new uint[](tokenList.length);
        
        // Get values
        values = getPortfolioTokenValues();
        uint totalValue = 0;
        
        for (uint i = 0; i < tokenList.length; i++) {
            totalValue += values[i];
        }
        
        // Calculate weights
        for (uint i = 0; i < tokenList.length; i++) {
            tokens[i] = tokenList[i];
            balances[i] = IERC20(tokenList[i]).balanceOf(address(this));
            targetWeightsResult[i] = targetWeights[tokenList[i]];
            
            if (totalValue > 0) {
                currentWeights[i] = values[i] * TOTAL_WEIGHT / totalValue;
            } else {
                currentWeights[i] = 0;
            }
        }
        
        return (tokens, balances, values, currentWeights, targetWeightsResult);
    }
    
    // Emergency functions
    function setSlippageTolerance(uint tolerance) external onlyOwner {
        require(tolerance <= 1000, "Tolerance too high"); // Max 10%
        slippageTolerance = tolerance;
    }
    
    function rescueTokens(address token, uint amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
}