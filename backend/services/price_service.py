import requests
import time
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class PriceService:
    def __init__(self):
        self.base_url = "https://api.coingecko.com/api/v3"
        self.cache = {}
        self.cache_timeout = 60  # Cache prices for 60 seconds
        self.last_update = 0
        
    def _get_coin_id(self, token: str) -> str:
        """Map token symbols to CoinGecko IDs"""
        token_map = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'ADA': 'cardano',
            'DOT': 'polkadot',
            'USDC': 'usd-coin',
            'SOL': 'solana',
            'AVAX': 'avalanche-2',
            'DOGE': 'dogecoin'
        }
        return token_map.get(token.upper(), token.lower())
    
    def get_latest_prices(self, tokens: List[str]) -> Dict[str, float]:
        """Get latest prices for multiple tokens"""
        current_time = time.time()
        
        # Check if cache is still valid
        if current_time - self.last_update < self.cache_timeout:
            return {token: self.cache.get(token, 0.0) for token in tokens}
        
        try:
            # Convert tokens to CoinGecko IDs
            coin_ids = [self._get_coin_id(token) for token in tokens]
            ids_param = ','.join(coin_ids)
            
            # Make API request
            url = f"{self.base_url}/simple/price"
            params = {
                'ids': ids_param,
                'vs_currencies': 'usd'
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            # Process response
            data = response.json()
            prices = {}
            
            for token in tokens:
                coin_id = self._get_coin_id(token)
                if coin_id in data:
                    prices[token] = data[coin_id]['usd']
                    self.cache[token] = data[coin_id]['usd']
            
            self.last_update = current_time
            return prices
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching prices: {e}")
            # Return cached prices if available, otherwise return 0
            return {token: self.cache.get(token, 0.0) for token in tokens}
    
    def get_historical_data(self, token: str, days: int = 7) -> Dict:
        """Get historical price data for a token"""
        try:
            coin_id = self._get_coin_id(token)
            url = f"{self.base_url}/coins/{coin_id}/market_chart"
            params = {
                'vs_currency': 'usd',
                'days': days
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            return {
                'prices': data['prices'],
                'market_caps': data['market_caps'],
                'total_volumes': data['total_volumes']
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching historical data: {e}")
            return {
                'prices': [],
                'market_caps': [],
                'total_volumes': []
            } 