import uuid
import time
import json
import os
import random
import threading
import requests
from datetime import datetime

class VirtualAccountManager:
    """Manages virtual user accounts, portfolios, and trading bots with persistent storage."""
    
    def __init__(self):
        self.accounts = {}
        self.data_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'cache', 'virtual_accounts.json')
        self.load_accounts()
        self.price_update_interval = 60  # seconds
        self._start_price_updates()
        
    def load_accounts(self):
        """Load accounts from JSON file."""
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r') as f:
                    self.accounts = json.load(f)
                print(f"Loaded {len(self.accounts)} virtual accounts from storage")
        except Exception as e:
            print(f"Error loading accounts: {e}")
            self.accounts = {}
            
    def save_accounts(self):
        """Save accounts to JSON file."""
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
            
            with open(self.data_file, 'w') as f:
                json.dump(self.accounts, f, indent=2)
            print(f"Saved {len(self.accounts)} virtual accounts to storage")
        except Exception as e:
            print(f"Error saving accounts: {e}")

    def create_account(self, user_id, initial_balance=100000):
        """Creates a new virtual account for a user."""
        if user_id in self.accounts:
            return self.accounts[user_id]
        
        account_id = str(uuid.uuid4())
        self.accounts[user_id] = {
            'account_id': account_id,
            'user_id': user_id,
            'balance': initial_balance, # Virtual USD
            'initial_balance': initial_balance, # Store initial balance for accurate PnL calculation
            'portfolio': {}, # {'BTC': 1.5, 'ETH': 10}
            'bots': [], # List of deployed bot configurations
            'trade_history': [],
            'performance_history': [{
                'timestamp': time.time(),
                'balance': initial_balance,
                'portfolio_value': 0,
                'total_value': initial_balance
            }],
            'created_at': time.time()
        }
        print(f"Virtual account created for user {user_id} with ID {account_id}")
        self.save_accounts()
        return self.accounts[user_id]

    def get_account(self, user_id):
        """Retrieves a user's virtual account."""
        return self.accounts.get(user_id)

    def deploy_bot(self, user_id, strategy, risk_profile, allocated_fund):
        """Deploys a new trading bot for a user."""
        account = self.get_account(user_id)
        if not account or account['balance'] < allocated_fund:
            raise ValueError("Insufficient funds to deploy bot.")
            
        bot_id = f"bot_{strategy}_{uuid.uuid4().hex[:6]}"
        
        # Initial asset allocation based on strategy
        initial_assets = self._get_initial_allocation(strategy)
        
        bot = {
            'bot_id': bot_id,
            'strategy': strategy,
            'risk_profile': risk_profile,
            'allocated_fund': allocated_fund,  # Initial investment amount - critical for PnL calculation
            'initial_value': allocated_fund,   # Redundant but kept for backward compatibility  
            'portfolio_value': allocated_fund, # Starts with the allocated fund
            'assets': initial_assets,
            'status': 'active',
            'created_at': time.time(),
            'performance_history': [{
                'timestamp': time.time(),
                'value': allocated_fund,
                'pnl': 0,
                'pnl_percent': 0
            }]
        }
        
        account['bots'].append(bot)
        account['balance'] -= allocated_fund
        
        print(f"Bot {bot_id} deployed for user {user_id} with {allocated_fund} USD.")
        self.save_accounts()
        return bot

    def _get_initial_allocation(self, strategy):
        """Gets initial asset allocation based on strategy."""
        if strategy == 'shannon':
            return {'BTC': 0.5, 'ETH': 0.5}
        elif strategy == 'risk_parity':
            return {'BTC': 0.2, 'ETH': 0.3, 'ADA': 0.2, 'DOT': 0.1, 'USDC': 0.2}
        elif strategy == 'momentum':
            return {'BTC': 0.4, 'ETH': 0.4, 'DOT': 0.2}
        elif strategy == 'tactical':
            return {'BTC': 0.3, 'ETH': 0.3, 'ADA': 0.2, 'DOT': 0.2}
        elif strategy == 'mpt':
            return {'BTC': 0.25, 'ETH': 0.25, 'ADA': 0.15, 'DOT': 0.15, 'USDC': 0.2}
        else: # threshold
            return {'BTC': 0.35, 'ETH': 0.35, 'ADA': 0.3}

    def stop_bot(self, user_id, bot_id):
        """Stops a trading bot and liquidates its assets."""
        account = self.get_account(user_id)
        if not account:
            return False
            
        bot_to_stop = next((bot for bot in account['bots'] if bot['bot_id'] == bot_id), None)
        
        if not bot_to_stop:
            return False
            
        # Liquidate assets and return funds to main balance
        liquidation_value = bot_to_stop.get('portfolio_value', 0)
        account['balance'] += liquidation_value
        bot_to_stop['status'] = 'stopped'
        
        # Record final performance snapshot with correct PnL calculation
        bot_to_stop['performance_history'].append({
            'timestamp': time.time(),
            'value': liquidation_value,
            'pnl': liquidation_value - bot_to_stop['allocated_fund'],
            'pnl_percent': ((liquidation_value / bot_to_stop['allocated_fund']) - 1) * 100
        })
        
        print(f"Bot {bot_id} stopped. {liquidation_value} USD returned to balance.")
        self.save_accounts()
        return True

    def execute_virtual_trade(self, user_id, bot_id, asset, action, amount, price):
        """Executes a virtual trade and updates the portfolio."""
        account = self.get_account(user_id)
        bot = next((b for b in account['bots'] if b['bot_id'] == bot_id), None)
        
        if not account or not bot:
            return
            
        trade_value = amount * price
        
        # Log the trade
        trade = {
            'trade_id': str(uuid.uuid4()),
            'bot_id': bot_id,
            'asset': asset,
            'action': action,
            'amount': amount,
            'price': price,
            'value': trade_value,
            'timestamp': time.time()
        }
        account['trade_history'].append(trade)
        
        # Update portfolio
        if action.upper() == 'BUY':
            bot['assets'][asset] = bot['assets'].get(asset, 0) + amount
        elif action.upper() == 'SELL':
            if bot['assets'].get(asset, 0) < amount:
                print(f"Warning: Attempted to sell more {asset} than available.")
                # Sell what's available
                amount = bot['assets'].get(asset, 0)
            
            bot['assets'][asset] = bot['assets'].get(asset, 0) - amount
            if bot['assets'][asset] <= 0:
                del bot['assets'][asset]
        
        print(f"Trade executed for bot {bot_id}: {action} {amount} {asset} at ${price}")
        self.save_accounts()

    def _start_price_updates(self):
        """Start background thread to update prices periodically."""
        self.price_thread = threading.Thread(target=self._price_update_worker, daemon=True)
        self.price_thread.start()
        
    def _price_update_worker(self):
        """Background worker to update portfolio values based on current prices."""
        while True:
            try:
                self._update_all_portfolios()
                time.sleep(self.price_update_interval)
            except Exception as e:
                print(f"Error in price update worker: {e}")
                time.sleep(10)  # Wait a bit before retrying
    
    def _update_all_portfolios(self):
        """Update values for all portfolios."""
        if not self.accounts:
            return
            
        # Get current prices
        prices = self._get_current_prices()
        if not prices:
            return
            
        current_time = time.time()
        
        for user_id, account in self.accounts.items():
            # Update each active bot
            total_portfolio_value = account['balance']
            
            for bot in account['bots']:
                if bot['status'] != 'active':
                    continue
                    
                # Calculate current portfolio value
                portfolio_value = 0
                for asset, amount in bot['assets'].items():
                    if asset in prices:
                        asset_value = amount * prices[asset]
                        portfolio_value += asset_value
                
                # Update bot portfolio value
                bot['portfolio_value'] = portfolio_value
                
                # Add to performance history (every hour)
                if not bot['performance_history'] or (current_time - bot['performance_history'][-1]['timestamp']) > 3600:
                    # Correctly calculate PnL based on initial investment
                    pnl = portfolio_value - bot['allocated_fund']
                    pnl_percent = ((portfolio_value / bot['allocated_fund']) - 1) * 100 if bot['allocated_fund'] > 0 else 0
                    bot['performance_history'].append({
                        'timestamp': current_time,
                        'value': portfolio_value,
                        'pnl': pnl,
                        'pnl_percent': pnl_percent
                    })
                
                total_portfolio_value += portfolio_value
            
            # Update account performance history (every hour)
            if not account['performance_history'] or (current_time - account['performance_history'][-1]['timestamp']) > 3600:
                # Include total initial investment for accurate PnL calculation
                total_initial_investment = account.get('initial_balance', 100000)
                account['performance_history'].append({
                    'timestamp': current_time,
                    'balance': account['balance'],
                    'portfolio_value': total_portfolio_value - account['balance'],
                    'total_value': total_portfolio_value,
                    'total_initial': total_initial_investment,
                    'pnl': total_portfolio_value - total_initial_investment,
                    'pnl_percent': ((total_portfolio_value / total_initial_investment) - 1) * 100 if total_initial_investment > 0 else 0
                })
        
        # Save accounts after updating
        self.save_accounts()
        
    def _get_current_prices(self):
        """Get current cryptocurrency prices."""
        try:
            # Try to get real prices from CoinGecko API
            url = "https://api.coingecko.com/api/v3/simple/price"
            params = {
                "ids": "bitcoin,ethereum,cardano,polkadot,usd-coin",
                "vs_currencies": "usd"
            }
            response = requests.get(url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                prices = {
                    'BTC': data.get('bitcoin', {}).get('usd', 45000),
                    'ETH': data.get('ethereum', {}).get('usd', 3000),
                    'ADA': data.get('cardano', {}).get('usd', 1.2),
                    'DOT': data.get('polkadot', {}).get('usd', 25),
                    'USDC': data.get('usd-coin', {}).get('usd', 1)
                }
            else:
                # Fallback to simulated prices
                base_prices = {
                    'BTC': 45000,
                    'ETH': 3000,
                    'ADA': 1.2,
                    'DOT': 25,
                    'USDC': 1
                }
                prices = {}
                for token, price in base_prices.items():
                    # Add some random variation (±2%)
                    variation = (random.random() - 0.5) * 0.04
                    prices[token] = price * (1 + variation)
                
            return prices
        except Exception as e:
            print(f"Error fetching prices: {e}")
            return None

    def update_bot_portfolios(self, rebalance_engine, signal_generator, prices=None):
        """Periodically updates all active bots based on their strategies."""
        if not self.accounts:
            return
            
        if not prices:
            prices = self._get_current_prices()
            if not prices:
                return
            
        for user_id, account in self.accounts.items():
            if not account.get('bots'):
                continue

            for bot in account['bots']:
                if bot['status'] != 'active':
                    continue

                print(f"Updating portfolio for bot {bot.get('bot_id')}...")
                
                # Create a representation of the bot's current portfolio weights
                current_weights = {}
                total_value = 0
                
                # Calculate current total value
                for asset, amount in bot['assets'].items():
                    if asset in prices:
                        asset_value = amount * prices[asset]
                        total_value += asset_value
                
                # Calculate weights
                if total_value > 0:
                    for asset, amount in bot['assets'].items():
                        if asset in prices:
                            asset_value = amount * prices[asset]
                            current_weights[asset] = asset_value / total_value
                
                # Fetch a recommendation for the bot's strategy
                recommendation = rebalance_engine.get_rebalance_recommendation(
                    current_weights,
                    signal_generator.generate_signals(),
                    prices,
                    risk_profile=bot['risk_profile'],
                    strategy=bot['strategy']
                )

                if recommendation['recommendation'] == 'REBALANCE':
                    # Perform rebalancing
                    target_weights = recommendation['target_weights']
                    self._rebalance_bot_portfolio(user_id, bot, current_weights, target_weights, prices, total_value)
                    
                    # Update bot portfolio value
                    impact = recommendation['metrics'].get('expected_return_impact', 0)
                    # Add a small random factor to make it realistic (±1%)
                    impact += (random.random() - 0.5) * 0.02
                    bot['portfolio_value'] *= (1 + impact)
                    
                    # Log a synthetic trade for history
                    self.execute_virtual_trade(user_id, bot['bot_id'], 'Portfolio', 'REBALANCE', 1, bot['portfolio_value'])
        
        # Save accounts after updating
        self.save_accounts()
    
    def _rebalance_bot_portfolio(self, user_id, bot, current_weights, target_weights, prices, total_value):
        """Rebalance a bot's portfolio according to target weights."""
        if not prices or total_value <= 0:
            return
            
        # Clear current assets
        bot['assets'] = {}
        
        # Allocate according to target weights
        for asset, weight in target_weights.items():
            if asset in prices and prices[asset] > 0:
                target_value = total_value * weight
                amount = target_value / prices[asset]
                if amount > 0:
                    bot['assets'][asset] = amount
                    
        print(f"Rebalanced portfolio for bot {bot['bot_id']}") 