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
    'historical_data': {}
}

# Initialize services
risk_manager = RiskManager()
signal_generator = SignalGenerator(['BTC', 'ETH', 'ADA', 'DOT', 'USDC'])
price_service = PriceService()

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
            'risk_manager': 'active'
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
        
        logger.info(f"Rebalance request for account {account_id}: {weights}")
        
        # Simulate rebalancing delay
        time.sleep(1)
        
        # Generate mock transaction hash
        import hashlib
        tx_data = f"{account_id}_{weights}_{time.time()}"
        tx_hash = "0x" + hashlib.md5(tx_data.encode()).hexdigest()[:16]
        
        return jsonify({
            'success': True,
            'message': 'Portfolio rebalance completed successfully',
            'transaction_hash': tx_hash,
            'gas_used': '0.005 ETH',
            'execution_time': '1.2s'
        })
        
    except Exception as e:
        logger.error(f"Rebalance error: {e}")
        return jsonify({
            'success': False,
            'message': f'Rebalance failed: {str(e)}'
        }), 500

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
    print("💰 Starting price feeds...")
    print("✅ Server ready on http://localhost:5000")
    print("\n📋 Available endpoints:")
    print("   • GET  /api/health        - Health check")
    print("   • GET  /api/signals       - Trading signals")
    print("   • GET  /api/prices        - Current prices")
    print("   • GET  /api/risk          - Risk assessment")
    print("   • GET  /api/market        - Market overview")
    print("   • POST /api/portfolio/rebalance - Rebalance portfolio")
    print("   • GET  /api/portfolio/history   - Portfolio history")
    print("   • GET  /api/transactions  - Recent transactions")
    print("\n🌐 Frontend should connect to: http://localhost:5000")
    
    app.run(host='0.0.0.0', port=5000, debug=True)