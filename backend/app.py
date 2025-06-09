from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
import threading
import time
import os
import sys

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import with fallbacks for missing modules
try:
    from signals.strategy import SignalGenerator
except ImportError:
    print("Warning: SignalGenerator not found, using mock")
    class SignalGenerator:
        def __init__(self, tokens):
            self.tokens = tokens
        def generate_signals(self):
            import random
            signals = {}
            for token in self.tokens:
                signals[token] = {
                    'total_score': round((random.random() - 0.5) * 4, 2),
                    'mean_reversion': round((random.random() - 0.5) * 2, 2),
                    'momentum': round((random.random() - 0.5) * 2, 2),
                    'volatility': round(random.random() * 2, 2),
                    'breakout': round((random.random() - 0.5) * 2, 2),
                    'ml_confidence': round(0.5 + random.random() * 0.4, 3)
                }
            return signals
        def calculate_target_weights(self):
            # More realistic weight distribution
            weights = {}
            if 'BTC' in self.tokens:
                weights['BTC'] = 35.0
            if 'ETH' in self.tokens:
                weights['ETH'] = 30.0
            if 'ADA' in self.tokens:
                weights['ADA'] = 15.0
            if 'DOT' in self.tokens:
                weights['DOT'] = 10.0
            if 'USDC' in self.tokens:
                weights['USDC'] = 10.0
            return weights

try:
    from models.model import PredictionModel
except ImportError:
    print("Warning: PredictionModel not found, using mock")
    class PredictionModel:
        def predict(self, data):
            return {'confidence': 0.7, 'prediction': 'neutral'}

try:
    from models.risk_model import RiskManager
except ImportError:
    print("Warning: RiskManager not found, using mock")
    class RiskManager:
        def calculate_portfolio_risk(self, weights, prices, signals):
            return {
                'risk_score': 5.0, 
                'volatility': 25.0,
                'portfolio_volatility': 25.0,
                'max_drawdown': 35.0,
                'sharpe_ratio': 0.8,
                'concentration_risk': 50.0,
                'market_risk': 'Medium',
                'recommendations': ['📊 Risk analysis in progress...']
            }
        def detect_market_anomalies(self, data):
            return {
                'anomalies_detected': False,
                'risk_level': 'Medium',
                'volatility_spike': False,
                'market_stress': 0.3
            }

# Import RebalanceEngine with fallback
try:
    from models.rebalance_engine import RebalanceEngine
except ImportError:
    print("Warning: RebalanceEngine not found, using mock")
    class RebalanceEngine:
        def __init__(self, risk_manager=None):
            self.risk_manager = risk_manager
            self.strategies = {
                'shannon': {'name': "Shannon's Demon"},
                'threshold': {'name': 'Threshold Rebalancing'},
                'mpt': {'name': 'Modern Portfolio Theory'},
                'risk_parity': {'name': 'Risk Parity'},
                'momentum': {'name': 'Momentum-Based'},
                'tactical': {'name': 'Tactical Allocation'}
            }
            
        def get_rebalance_recommendation(self, current_weights, signals, prices, risk_profile=50):
            import random
            import time
            
            return {
                'recommendation': 'REBALANCE' if random.random() > 0.5 else 'HOLD',
                'urgency': random.choice(['LOW', 'MEDIUM', 'HIGH']),
                'strategy': {
                    'key': 'tactical',
                    'name': 'Tactical Allocation',
                    'description': 'Dynamic allocation based on market signals'
                },
                'target_weights': {'BTC': 35.0, 'ETH': 30.0, 'ADA': 15.0, 'DOT': 10.0, 'USDC': 10.0},
                'justification': ['Portfolio drift exceeds threshold', 'Market signals suggest tactical repositioning'],
                'market_condition': 'volatile' if random.random() > 0.5 else 'stable',
                'metrics': {
                    'drift_reduction': 5.2,
                    'expected_return_impact': 0.2,
                    'optimization_score': 7.5
                },
                'timestamp': time.time()
            }
            
        def generate_rebalance_plan(self, current_weights, target_weights, prices, cash=0):
            return [
                {'asset': 'BTC', 'action': 'BUY', 'amount': 0.05, 'value': 2250},
                {'asset': 'ETH', 'action': 'SELL', 'amount': 0.75, 'value': 2250}
            ]

# Import VirtualAccountManager with fallback
try:
    from models.virtual_account import VirtualAccountManager
except ImportError:
    print("Warning: VirtualAccountManager not found, using mock")
    class VirtualAccountManager:
        def __init__(self): self.accounts = {}
        def create_account(self, user_id, **kwargs): self.accounts[user_id] = {'balance': 100000, 'bots': []}; return self.accounts[user_id]
        def get_account(self, user_id): return self.accounts.get(user_id)
        def deploy_bot(self, user_id, **kwargs): return {'bot_id': 'mock_bot', 'status': 'active'}
        def stop_bot(self, user_id, bot_id): return True
        def update_bot_portfolios(self, *args): print("Updating mock bot portfolios...")

# Import PriceService with fallback
try:
    from services.price_service import PriceService
except ImportError:
    print("Warning: PriceService not found, using mock")
    class PriceService:
        def get_latest_prices(self, tokens):
            import random
            base_prices = {
                'BTC': 45000,
                'ETH': 3000,
                'ADA': 1.20,
                'DOT': 25.0,
                'USDC': 1.00
            }
            # Add some random variation
            prices = {}
            for token in tokens:
                if token in base_prices:
                    variation = (random.random() - 0.5) * 0.1  # ±5% variation
                    prices[token] = base_prices[token] * (1 + variation)
            return prices
        
        def get_historical_data(self):
            # Return mock historical data
            return {
                'BTC': [45000, 44500, 46000, 45800, 45200],
                'ETH': [3000, 2950, 3100, 3050, 2980],
                'timestamps': [time.time() - i*3600 for i in range(5)]
            }

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Global cache for data
cache = {
    'signals': {},
    'prices': {},
    'risk_assessment': {},
    'weights': {},
    'last_update': None,
    'market_data': {},
    'historical_data': {},
    'rebalance_recommendation': None,
    'portfolio_data': {
        'current_weights': {
            'BTC': 0.32, 
            'ETH': 0.28, 
            'ADA': 0.18, 
            'DOT': 0.12, 
            'USDC': 0.10
        },
        'total_value': 125000
    }
}

# Initialize services
risk_manager = RiskManager()
signal_generator = SignalGenerator(['BTC', 'ETH', 'ADA', 'DOT', 'USDC'])
price_service = PriceService()
rebalance_engine = RebalanceEngine(risk_manager)
account_manager = VirtualAccountManager()

# Create a default user account for demo
DEFAULT_USER_ID = "trading_user_01"
account_manager.create_account(DEFAULT_USER_ID)

def background_refresh():
    """Background thread to refresh data periodically"""
    global cache
    
    while True:
        try:
            logger.info("Refreshing market data...")
            
            # Update prices using PriceService
            try:
                prices = price_service.get_latest_prices(['BTC', 'ETH', 'ADA', 'DOT', 'USDC'])
            except Exception as e:
                logger.warning(f"PriceService failed, using mock data: {e}")
                # Fallback to mock prices with realistic variation
                mock_prices = {
                    'BTC': 45000 + (time.time() % 1000 - 500) * 10,
                    'ETH': 3000 + (time.time() % 200 - 100) * 2,
                    'ADA': 1.20 + (time.time() % 20 - 10) * 0.001,
                    'DOT': 25.0 + (time.time() % 50 - 25) * 0.1,
                    'USDC': 1.00
                }
                prices = mock_prices
            
            # Generate signals
            signals = signal_generator.generate_signals()
            weights = signal_generator.calculate_target_weights()
            
            # Generate rebalance recommendation
            try:
                rebalance_recommendation = rebalance_engine.get_rebalance_recommendation(
                    cache['portfolio_data']['current_weights'],
                    signals,
                    prices,
                    risk_profile=50  # Default to moderate risk
                )
            except Exception as e:
                logger.warning(f"Rebalance recommendation failed: {e}")
                rebalance_recommendation = None
            
            # Update virtual bot portfolios
            try:
                account_manager.update_bot_portfolios(rebalance_engine, signal_generator, prices)
            except Exception as e:
                logger.error(f"Failed to update bot portfolios: {e}")
            
            # Run risk assessment
            try:
                historical_data = price_service.get_historical_data()
                risk_data = risk_manager.detect_market_anomalies(historical_data)
                portfolio_risk = risk_manager.calculate_portfolio_risk(weights, prices, signals)
                
                # Merge risk data
                risk_assessment = {**risk_data, **portfolio_risk}
            except Exception as e:
                logger.warning(f"Risk assessment failed: {e}")
                risk_assessment = {
                    'risk_score': 5.0,
                    'market_risk': 'Medium',
                    'recommendations': ['📊 Risk analysis in progress...']
                }
            
            # Create market overview data
            market_data = {
                'fear_greed_index': int(50 + (time.time() % 100 - 50) * 0.8),
                'total_market_cap': 2.1e12,  # $2.1T
                'btc_dominance': 42.5,
                'active_cryptos': 23847,
                'market_change_24h': round((time.time() % 20 - 10) * 0.1, 2),
                'volume_24h': 1.2e11,  # $120B
                'trending': ['BTC', 'ETH', 'ADA', 'DOT', 'SOL']
            }
            
            # Update cache
            cache.update({
                'signals': signals,
                'weights': weights,
                'prices': prices,
                'risk_assessment': risk_assessment,
                'market_data': market_data,
                'historical_data': price_service.get_historical_data() if hasattr(price_service, 'get_historical_data') else {},
                'rebalance_recommendation': rebalance_recommendation,
                'last_update': time.time()
            })
            
            logger.info("Data refresh completed successfully")
            
        except Exception as e:
            logger.error(f"Error in background refresh: {e}")
        
        # Wait before next refresh (5 minutes for production, 1 minute for demo)
        time.sleep(60)  # 1 minute for demo

# Start background thread
refresh_thread = threading.Thread(target=background_refresh, daemon=True)
refresh_thread.start()

# API Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': time.time(),
        'last_update': cache.get('last_update', 'Never'),
        'services': {
            'signals': 'active',
            'prices': 'active',
            'risk_manager': 'active',
            'rebalance_engine': 'active'
        }
    })

@app.route('/api/signals', methods=['GET'])
def get_signals():
    """Get trading signals and target weights"""
    return jsonify({
        'signals': cache['signals'],
        'weights': cache['weights'],
        'last_update': cache['last_update']
    })

@app.route('/api/prices', methods=['GET'])
def get_prices():
    """Get current cryptocurrency prices"""
    return jsonify({
        'prices': cache['prices'],
        'last_update': cache['last_update']
    })

@app.route('/api/risk', methods=['GET'])
def get_risk():
    """Get risk assessment data"""
    return jsonify({
        'risk_assessment': cache['risk_assessment'],
        'last_update': cache['last_update']
    })

@app.route('/api/market', methods=['GET'])
def get_market_overview():
    """Get market overview data"""
    return jsonify({
        'market_data': cache['market_data'],
        'last_update': cache['last_update']
    })

@app.route('/api/portfolio/rebalance', methods=['POST'])
def rebalance_portfolio():
    """Execute portfolio rebalancing"""
    try:
        data = request.json
        weights = data.get('weights', {})
        account_id = data.get('accountId')
        risk_profile = data.get('riskProfile', 50)
        strategy = data.get('strategy', 'tactical')
        
        logger.info(f"Rebalance request for account {account_id}: {weights} (Strategy: {strategy})")
        
        # Get current portfolio state
        current_weights = cache['portfolio_data']['current_weights']
        prices = cache['prices']
        
        # Generate rebalance plan
        rebalance_plan = rebalance_engine.generate_rebalance_plan(
            current_weights, 
            weights or cache['rebalance_recommendation']['target_weights'],
            prices
        )
        
        # Simulate rebalancing delay
        time.sleep(1)
        
        # Generate mock transaction hash
        import hashlib
        tx_data = f"{account_id}_{weights}_{time.time()}"
        tx_hash = "0x" + hashlib.md5(tx_data.encode()).hexdigest()[:16]
        
        # Update portfolio weights (simulation)
        if weights:
            # Convert percentage weights to decimals
            new_weights = {k: v/100 for k, v in weights.items()}
            cache['portfolio_data']['current_weights'] = new_weights
        
        return jsonify({
            'success': True,
            'message': 'Portfolio rebalance completed successfully',
            'transaction_hash': tx_hash,
            'gas_used': '0.005 ETH',
            'execution_time': '1.2s',
            'rebalance_plan': rebalance_plan
        })
        
    except Exception as e:
        logger.error(f"Rebalance error: {e}")
        return jsonify({
            'success': False,
            'message': f'Rebalance failed: {str(e)}'
        }), 500

@app.route('/api/portfolio/recommendation', methods=['GET'])
def get_rebalance_recommendation():
    """Get portfolio rebalance recommendation"""
    try:
        risk_profile = request.args.get('risk_profile', 50, type=int)
        
        if not cache.get('rebalance_recommendation') or risk_profile != 50:
            # Generate new recommendation if risk profile changed
            recommendation = rebalance_engine.get_rebalance_recommendation(
                cache['portfolio_data']['current_weights'],
                cache['signals'],
                cache['prices'],
                risk_profile=risk_profile
            )
        else:
            recommendation = cache['rebalance_recommendation']
            
        return jsonify({
            'recommendation': recommendation,
            'last_update': cache['last_update']
        })
        
    except Exception as e:
        logger.error(f"Rebalance recommendation error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/portfolio/history', methods=['GET'])
def get_portfolio_history():
    """Get portfolio performance history"""
    try:
        # Generate mock historical data
        history = []
        current_time = time.time()
        
        for i in range(30):  # 30 days of data
            timestamp = current_time - (i * 24 * 3600)  # Go back in days
            value = 100000 + (i * 1000) + ((time.time() + i) % 5000 - 2500)
            
            history.append({
                'timestamp': timestamp,
                'portfolio_value': round(value, 2),
                'daily_return': round(((time.time() + i) % 10 - 5) * 0.5, 2),
                'cumulative_return': round((value - 100000) / 100000 * 100, 2)
            })
        
        return jsonify({
            'history': list(reversed(history)),  # Most recent first
            'total_return': round((history[0]['portfolio_value'] - 100000) / 100000 * 100, 2),
            'last_update': cache['last_update']
        })
        
    except Exception as e:
        logger.error(f"Portfolio history error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/portfolio/data', methods=['GET'])
def get_portfolio_data():
    """Get current portfolio data"""
    try:
        return jsonify({
            'portfolio': cache['portfolio_data'],
            'last_update': cache['last_update']
        })
    except Exception as e:
        logger.error(f"Portfolio data error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/account', methods=['GET'])
def get_virtual_account():
    """Get the user's virtual account details."""
    user_id = request.args.get('user_id', 'default_user')
    account = account_manager.get_account(user_id)
    
    if not account:
        account = account_manager.create_account(user_id)
    
    # Return serializable version of account
    # Ensure all necessary data is included for frontend display
    return jsonify(account)

@app.route('/api/bots/deploy', methods=['POST'])
def deploy_bot():
    """Deploy a new trading bot with the specified strategy."""
    data = request.json
    user_id = data.get('user_id', 'default_user')
    strategy = data.get('strategy', 'threshold')
    risk_profile = data.get('riskProfile', 50)
    allocated_fund = data.get('allocatedFund', 10000)
    
    try:
        account = account_manager.get_account(user_id)
        if not account:
            account = account_manager.create_account(user_id)
            
        bot = account_manager.deploy_bot(user_id, strategy, risk_profile, allocated_fund)
        
        # Trigger an immediate update to set initial portfolio
        prices = price_service.get_latest_prices(['BTC', 'ETH', 'ADA', 'DOT', 'USDC'])
        account_manager.update_bot_portfolios(rebalance_engine, signal_generator, prices)
        
        return jsonify({'success': True, 'bot': bot})
    except Exception as e:
        logger.error(f"Bot deployment error: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/api/bots/<bot_id>/stop', methods=['POST'])
def stop_bot(bot_id):
    """Stop a trading bot."""
    try:
        success = account_manager.stop_bot(DEFAULT_USER_ID, bot_id)
        if not success:
            return jsonify({'error': 'Bot not found or could not be stopped'}), 404
        return jsonify({'success': True, 'message': f'Bot {bot_id} stopped successfully.'})
    except Exception as e:
        logger.error(f"Failed to stop bot {bot_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/strategies', methods=['GET'])
def get_strategies():
    """Get available rebalancing strategies"""
    try:
        return jsonify({
            'strategies': rebalance_engine.strategies,
            'default_strategy': 'tactical'
        })
    except Exception as e:
        logger.error(f"Strategies error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get recent transactions"""
    try:
        # Generate mock transaction data
        transactions = []
        current_time = time.time()
        
        for i in range(10):  # 10 recent transactions
            tx = {
                'id': f"tx_{i+1}",
                'timestamp': current_time - (i * 3600),  # Hours ago
                'type': 'rebalance' if i % 3 == 0 else 'trade',
                'from_token': 'USDC',
                'to_token': ['BTC', 'ETH', 'ADA', 'DOT'][i % 4],
                'amount': round(1000 + (i * 200), 2),
                'gas_fee': round(0.005 + (i * 0.001), 4),
                'status': 'completed',
                'tx_hash': f"0x{''.join([hex(i*j)[2:] for j in range(8)])}"
            }
            transactions.append(tx)
        
        return jsonify({
            'transactions': transactions,
            'last_update': cache['last_update']
        })
        
    except Exception as e:
        logger.error(f"Transactions error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/portfolio/performance', methods=['GET'])
def get_performance_history():
    """Get performance history for account and bots."""
    user_id = request.args.get('user_id', 'default_user')
    
    try:
        account = account_manager.get_account(user_id)
        if not account:
            account = account_manager.create_account(user_id)
            
        # Extract just the performance data
        performance = {
            'account': account.get('performance_history', []),
            'bots': {}
        }
        
        # Get performance for each bot
        for bot in account.get('bots', []):
            performance['bots'][bot['bot_id']] = bot.get('performance_history', [])
            
        return jsonify(performance)
    except Exception as e:
        logger.error(f"Error fetching performance data: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("🚀 Starting SignalStack Backend Server...")
    print("📡 Initializing signal generators...")
    print("🔍 Loading risk models...")
    print("💵 Initializing rebalancing engine...")
    print("💰 Starting price feeds...")
    print("✅ Server ready on http://localhost:5000")
    print("\n📋 Available endpoints:")
    print("   • GET  /api/health        - Health check")
    print("   • GET  /api/signals       - Trading signals")
    print("   • GET  /api/prices        - Current prices")
    print("   • GET  /api/risk          - Risk assessment")
    print("   • GET  /api/market        - Market overview")
    print("   • POST /api/portfolio/rebalance    - Rebalance portfolio")
    print("   • GET  /api/portfolio/recommendation - Rebalance recommendation")
    print("   • GET  /api/portfolio/history   - Portfolio history")
    print("   • GET  /api/portfolio/data      - Current portfolio")
    print("   • GET  /api/strategies          - Available strategies")
    print("   • GET  /api/transactions  - Recent transactions")
    print("   --- Virtual Account ---")
    print("   • GET  /api/account             - Get virtual account details")
    print("   • POST /api/bots/deploy        - Deploy a new trading bot")
    print("   • POST /api/bots/<id>/stop     - Stop a trading bot")
    print("\n🌐 Frontend should connect to: http://localhost:5000")
    
    app.run(host='0.0.0.0', port=5000, debug=True)