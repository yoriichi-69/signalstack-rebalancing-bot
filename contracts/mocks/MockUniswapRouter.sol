\cryptorizz\main\signalstack-rebalancing-bot\contracts\mocks\MockUniswapRouter.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockUniswapRouter {
    address public weth;
    
    constructor(address _weth) {
        weth = _weth;
    }
    
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts) {
        // Mock implementation - just transfer tokens
        address tokenIn = path[0];
        address tokenOut = path[path.length - 1];
        
        // Transfer input token from sender to this contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        // Mock output amount (1:1 ratio for simplicity)
        uint amountOut = amountIn;
        
        // Transfer output token to recipient
        IERC20(tokenOut).transfer(to, amountOut);
        
        // Return amounts
        amounts = new uint[](path.length);
        amounts[0] = amountIn;
        amounts[path.length - 1] = amountOut;
        
        return amounts;
    }
    
    function getAmountsOut(uint amountIn, address[] calldata path) 
        external view returns (uint[] memory amounts) {
        // Mock implementation - 1:1 conversion
        amounts = new uint[](path.length);
        for (uint i = 0; i < path.length; i++) {
            amounts[i] = amountIn;
        }
        return amounts;
    }
}