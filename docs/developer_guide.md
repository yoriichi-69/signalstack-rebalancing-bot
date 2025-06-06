# d:\intel\cryptorizz\main\signalstack-rebalancing-bot\docs\developer_guide.md
# SignalStack Developer Guide

## Architecture Overview

SignalStack is a portfolio rebalancing system with three main components:

1. **Smart Contracts**: Handle on-chain portfolio management and rebalancing
2. **Backend API**: Generates signals and provides market data
3. **Frontend UI**: User interface for portfolio monitoring and management

### System Interactions

```mermaid
graph TD
    A[Frontend UI] -->|API Requests| B[Backend API]
    B -->|Generate Signals| C[Signal Generator]
    C -->|Get Price Data| D[Price Service]
    B -->|Return Data| A
    A -->|Transaction Requests| E[Smart Contracts]
    E -->|Execute Swaps| F[DEX/Uniswap]

Smart Contract Architecture
The core of SignalStack is the RebalanceRouterV2 contract which handles:

 Portfolio management
 Token weight management
 Executing trades via DEXes
 Integration with rebalancing strategies

Contract Relationships
classDiagram
    RebalanceRouterV2 --|> Ownable
    RebalanceRouterV2 --|> ReentrancyGuard
    RebalanceRouterV2 --> IUniswapV2Router
    SignalStackStrategy --|> Ownable
    SignalStackStrategy --> RebalanceRouterV2
    
    class RebalanceRouterV2 {
        +uniswapRouter: IUniswapV2Router
        +wethAddress: address
        +supportedTokens: mapping(address => bool)
        +targetWeights: mapping(address => uint)
        +addSupportedToken(token, weight)
        +removeSupportedToken(token)
        +updateTargetWeights(tokens[], weights[])
        +rebalance()
        +executeStrategyRebalance()
    }
    
    class SignalStackStrategy {
        +rebalanceRouter: IRebalanceRouter
        +targetWeights: mapping(address => uint)
        +oracle: address
        +updateTargetWeights(tokens[], weights[])
        +getTargetWeights()
    }

Backend Architecture
The backend system has these key components:

SignalGenerator: Creates trading signals using technical indicators and ML
PredictionModel: ML model for enhancing signals
RiskManager: Detects abnormal market conditions
API Server: Flask-based REST API
Frontend Architecture
The React-based frontend consists of:

Portfolio Dashboard: Overview of portfolio performance
Signal Display: Shows current market signals
Rebalancing Controls: Interface for executing trades
Strategy Selector: Choose between different strategies
Development Setup
Prerequisites
Node.js (v16+)
Python 3.8+
Hardhat
Redis (for caching)

Installation
  # Clone the repository
git clone https://github.com/youruser/signalstack-rebalancing-bot.git

# Install JavaScript dependencies
cd signalstack-rebalancing-bot
npm install

# Install Python dependencies
cd backend
pip install -r requirements.txt

# Compile smart contracts
npx hardhat compile

# Start the backend server
python app.py

# Start the frontend
cd ../frontend
npm start


### Step 2: Add User Documentation
```markdown
# d:\intel\cryptorizz\main\signalstack-rebalancing-bot\docs\user_guide.md
# SignalStack User Guide

## Getting Started

SignalStack is an AI-powered portfolio rebalancing system that helps you optimize your crypto portfolio based on market signals.

### Creating an Account

1. Open the SignalStack dashboard at [app.signalstack.io](https://app.signalstack.io)
2. Click "Sign Up" and create an account using your email
3. You can also use the demo mode to try the platform without connecting a wallet

### Connecting a Wallet

To use real assets:

1. Click "Connect Wallet" in the top-right corner
2. Select your wallet provider (MetaMask, WalletConnect, etc.)
3. Approve the connection request in your wallet

### Using Virtual Demo Mode

To practice without real assets:

1. Click "Try Demo" on the homepage
2. You'll receive a virtual portfolio with demo tokens
3. All trades and rebalances will be simulated

## Portfolio Dashboard

The dashboard provides an overview of your portfolio:

- **Current Value**: Total portfolio value in USD
- **Performance**: Historical performance chart
- **Allocation**: Current asset distribution
- **Risk Assessment**: Risk metrics based on portfolio composition

## Understanding Signals

SignalStack generates trading signals based on:

- **Mean Reversion**: Identifies overbought/oversold conditions
- **Momentum**: Detects price trends and momentum shifts
- **Volatility**: Measures price volatility
- **Breakout**: Detects significant price breakouts
- **ML Analysis**: Machine learning predictions

Each signal ranges from -1 (bearish) to +1 (bullish), and the combined score determines the recommended portfolio allocation.

## Rebalancing Your Portfolio

### Automatic Rebalancing

1. Go to the "Settings" tab
2. Enable "Auto-Rebalance"
3. Set your preferred rebalance frequency (daily, weekly, monthly)
4. Set your target deviation threshold (e.g., 5%)

### Manual Rebalancing

1. Go to the "Portfolio" tab
2. Click "Rebalance Portfolio"
3. Review the proposed changes
4. Click "Confirm Rebalance" to execute

### Custom Weights

You can also set custom target weights:

1. Go to the "Portfolio" tab
2. Click "Custom Weights"
3. Adjust the sliders for each asset
4. Click "Save & Rebalance"

## Strategy Selection

SignalStack offers multiple portfolio strategies:

- **Signal-Based**: Weights based on technical and ML signals
- **Momentum**: Focuses on assets with positive momentum
- **Equal Weight**: Equal allocation to all assets
- **Risk Parity**: Weights inversely proportional to volatility

To change your strategy:

1. Go to the "Strategies" tab
2. Select your preferred strategy
3. Click "Apply Strategy"
4. Confirm the rebalance execution

## Monitoring Performance

The "Performance" tab shows:

- Historical portfolio value
- Comparison to market benchmarks
- Performance attribution by asset
- Risk-adjusted metrics (Sharpe, Sortino)

## Account Security

To keep your account secure:

1. Enable two-factor authentication
2. Use a hardware wallet where possible
3. Set transaction limits
4. Review authorized applications regularly

## Getting Help

If you need assistance:

- Click the "?" icon for contextual help
- Email support@signalstack.io
- Check our knowledge base at [help.signalstack.io](https://help.signalstack.io)