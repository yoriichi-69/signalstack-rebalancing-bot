# d:\intel\cryptorizz\main\signalstack-rebalancing-bot\backend\app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
import threading
import time

from signals.strategy import SignalGenerator
from models.model import PredictionModel
from models.risk_model import RiskManager

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

# Global cache
cache = {
    'signals': {},
    'prices': {},
    'risk_assessment': {},
    'last_update': None
}

# Background data refresh thread
def background_refresh():
    global cache
    
    while True:
        try:
            logger.info("Refreshing data...")
            
            # Update prices
            price_service = PriceService()
            prices = price_service.get_latest_prices(['BTC', 'ETH', 'USDC'])
            
            # Generate signals
            generator = SignalGenerator(['BTC', 'ETH', 'USDC'])
            signals = generator.generate_signals()
            weights = generator.calculate_target_weights()
            
            # Run risk assessment
            risk_manager = RiskManager()
            risk_data = risk_manager.detect_market_anomalies(price_service.get_historical_data())
            
            # Update cache
            cache = {
                'signals': signals,
                'weights': weights,
                'prices': prices,
                'risk_assessment': risk_data,
                'last_update': time.time()
            }
            
            logger.info("Data refresh completed")
        except Exception as e:
            logger.error(f"Error in background refresh: {str(e)}")
        
        # Wait before next refresh
        time.sleep(300)  # 5 minutes

# Start background thread
refresh_thread = threading.Thread(target=background_refresh, daemon=True)
refresh_thread.start()

@app.route('/api/signals', methods=['GET'])
def get_signals():
    return jsonify({
        'signals': cache['signals'],
        'weights': cache['weights'],
        'last_update': cache['last_update']
    })

@app.route('/api/prices', methods=['GET'])
def get_prices():
    return jsonify(cache['prices'])

@app.route('/api/risk', methods=['GET'])
def get_risk():
    return jsonify(cache['risk_assessment'])

@app.route('/api/portfolio/rebalance', methods=['POST'])
def rebalance_portfolio():
    # This would connect to the blockchain for real rebalancing
    # For demo purposes, we'll just simulate it
    data = request.json
    weights = data.get('weights', {})
    account_id = data.get('accountId')
    
    # Log the rebalance request
    logger.info(f"Rebalance request for account {account_id}: {weights}")
    
    # In a real implementation, this would trigger the contract call
    
    return jsonify({
        'success': True,
        'message': 'Portfolio rebalance initiated'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)