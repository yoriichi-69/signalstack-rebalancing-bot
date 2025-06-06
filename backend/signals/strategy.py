import numpy as np
import pandas as pd
import requests
from datetime import datetime, timedelta

class SignalGenerator:
    def __init__(self, tokens=None):
        self.tokens = tokens or ['ETH', 'BTC', 'USDC']
        self.signals = {}
    
    def fetch_price_data(self, token, days=30):
        """Fetch historical price data from an API"""
        # For the prototype, you can use CoinGecko API
        # This is a simplified example
        endpoint = f"https://api.coingecko.com/api/v3/coins/{token.lower()}/market_chart"
        params = {
            'vs_currency': 'usd',
            'days': days,
            'interval': 'daily'
        }
        
        response = requests.get(endpoint, params=params)
        if response.status_code == 200:
            data = response.json()
            prices = [price[1] for price in data['prices']]
            return pd.DataFrame({
                'price': prices,
                'timestamp': [datetime.fromtimestamp(price[0]/1000) for price in data['prices']]
            }).set_index('timestamp')
        else:
            # If API fails, return dummy data for prototype
            print(f"Warning: Using dummy data for {token}")
            today = datetime.now()
            dates = [today - timedelta(days=i) for i in range(days)]
            return pd.DataFrame({
                'price': np.random.normal(100, 10, days)
            }, index=dates[::-1])
    
    def calculate_mean_reversion(self, prices, window=14):
        """Calculate if price is above or below moving average"""
        if len(prices) < window:
            return 0
            
        sma = prices.rolling(window=window).mean().iloc[-1]
        current_price = prices.iloc[-1]
        
        if current_price > sma * 1.05:
            return -1  # Overbought, likely to revert down
        elif current_price < sma * 0.95:
            return 1   # Oversold, likely to revert up
        else:
            return 0   # Neutral
    
    def calculate_momentum(self, prices, window=14):
        """Calculate RSI-based momentum"""
        if len(prices) <= window:
            return 0
            
        # Simple RSI calculation
        delta = prices.diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        
        avg_gain = gain.rolling(window=window).mean()
        avg_loss = loss.rolling(window=window).mean()
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        last_rsi = rsi.iloc[-1]
        
        if last_rsi > 70:
            return -1  # Overbought
        elif last_rsi < 30:
            return 1   # Oversold
        else:
            return 0   # Neutral
    
    def calculate_volatility(self, prices, window=14):
        """ATR-based volatility signal"""
        if len(prices) <= window:
            return 0
            
        # Simplified ATR
        volatility = prices.rolling(window=window).std() / prices.rolling(window=window).mean()
        current_vol = volatility.iloc[-1]
        
        # Higher volatility might mean more risk, thus reduce positions
        if current_vol > 0.1:  # 10% volatility
            return -1
        elif current_vol < 0.03:  # Very low volatility
            return 1
        else:
            return 0
    
    def calculate_breakout(self, prices, window=20):
        """Bollinger Bands breakout signal"""
        if len(prices) <= window:
            return 0
            
        sma = prices.rolling(window=window).mean()
        std = prices.rolling(window=window).std()
        
        upper_band = sma + 2 * std
        lower_band = sma - 2 * std
        
        current_price = prices.iloc[-1]
        current_upper = upper_band.iloc[-1]
        current_lower = lower_band.iloc[-1]
        
        if current_price > current_upper:
            return 1   # Bullish breakout
        elif current_price < current_lower:
            return -1  # Bearish breakdown
        else:
            return 0   # Inside bands, neutral
    
    def generate_signals(self):
        """Generate signals for all tokens"""
        results = {}
        
        for token in self.tokens:
            # Get price data
            df = self.fetch_price_data(token)
            
            # Calculate individual signals
            mean_reversion = self.calculate_mean_reversion(df['price'])
            momentum = self.calculate_momentum(df['price'])
            volatility = self.calculate_volatility(df['price'])
            breakout = self.calculate_breakout(df['price'])
            
            # Aggregate signals
            total_score = mean_reversion + momentum + volatility + breakout
            
            results[token] = {
                'mean_reversion': mean_reversion,
                'momentum': momentum,
                'volatility': volatility,
                'breakout': breakout,
                'total_score': total_score
            }
        
        self.signals = results
        return results
    
    def calculate_target_weights(self):
        """Convert signals to target weights"""
        if not self.signals:
            self.generate_signals()
            
        # Convert scores to weights
        scores = {token: data['total_score'] for token, data in self.signals.items()}
        
        # Normalize scores to weights (0-100%)
        # For simplicity, we'll use a basic approach where we add 4 to scores to make them positive
        adjusted_scores = {token: score + 4 for token, score in scores.items()}  # Now between 0-8
        
        total_score = sum(adjusted_scores.values())
        if total_score == 0:
            # Equal weight if all signals are neutral
            weights = {token: 100 / len(self.tokens) for token in self.tokens}
        else:
            weights = {token: (score / total_score) * 100 for token, score in adjusted_scores.items()}
            
        # Round to integers
        weights = {token: round(weight) for token, weight in weights.items()}
        
        # Ensure weights sum to 100%
        adjustment = 100 - sum(weights.values())
        if adjustment != 0:
            # Add adjustment to the first token
            first_token = list(weights.keys())[0]
            weights[first_token] += adjustment
            
        return weights

# Example usage
if __name__ == "__main__":
    generator = SignalGenerator(['ETH', 'BTC', 'USDC'])
    signals = generator.generate_signals()
    weights = generator.calculate_target_weights()
    
    print("Signals:", signals)
    print("Target Weights:", weights)
