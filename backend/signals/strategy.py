import numpy as np
import pandas as pd
import requests
import random
import time
import math
from datetime import datetime, timedelta

class SignalGenerator:
    def __init__(self, tokens=None):
        self.tokens = tokens or ['BTC', 'ETH', 'ADA', 'DOT', 'USDC']
        self.signals = {}
        self.use_real_data = True  # Toggle for real vs mock data
        self.api_timeout = 5  # Timeout for API calls
    
    def fetch_price_data(self, token, days=30):
        """Fetch historical price data from CoinGecko API with fallback"""
        if not self.use_real_data:
            return self._generate_mock_price_data(token, days)
            
        try:
            # Map tokens to CoinGecko IDs
            token_map = {
                'BTC': 'bitcoin',
                'ETH': 'ethereum', 
                'ADA': 'cardano',
                'DOT': 'polkadot',
                'USDC': 'usd-coin'
            }
            
            coin_id = token_map.get(token.upper(), token.lower())
            endpoint = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
            params = {
                'vs_currency': 'usd',
                'days': days,
                'interval': 'daily'
            }
            
            response = requests.get(endpoint, params=params, timeout=self.api_timeout)
            
            if response.status_code == 200:
                data = response.json()
                prices = [price[1] for price in data['prices']]
                timestamps = [datetime.fromtimestamp(price[0]/1000) for price in data['prices']]
                
                df = pd.DataFrame({
                    'price': prices,
                    'timestamp': timestamps
                }).set_index('timestamp')
                
                print(f"✅ Real data fetched for {token}: {len(prices)} data points")
                return df
            else:
                print(f"⚠️ API error for {token}: {response.status_code}")
                return self._generate_mock_price_data(token, days)
                
        except requests.exceptions.Timeout:
            print(f"⏰ API timeout for {token}, using mock data")
            return self._generate_mock_price_data(token, days)
        except Exception as e:
            print(f"❌ API error for {token}: {e}, using mock data")
            return self._generate_mock_price_data(token, days)
    
    def _generate_mock_price_data(self, token, days=30):
        """Generate realistic mock price data for fallback"""
        # Base prices for realistic simulation
        base_prices = {
            'BTC': 45000,
            'ETH': 3000,
            'ADA': 1.20,
            'DOT': 25.0,
            'USDC': 1.00
        }
        
        base_price = base_prices.get(token, 100)
        
        # Generate dates
        today = datetime.now()
        dates = [today - timedelta(days=i) for i in range(days)]
        dates.reverse()
        
        # Generate realistic price movement with trend and volatility
        prices = []
        current_price = base_price
        
        for i in range(days):
            # Add trend (slight upward bias for crypto)
            trend = 0.001 if token != 'USDC' else 0
            
            # Add random walk with volatility
            volatility = 0.05 if token != 'USDC' else 0.001
            change = np.random.normal(trend, volatility)
            
            current_price = current_price * (1 + change)
            prices.append(max(0.01, current_price))  # Prevent negative prices
        
        df = pd.DataFrame({
            'price': prices
        }, index=dates)
        
        print(f"📊 Mock data generated for {token}: {len(prices)} data points")
        return df
    
    def calculate_mean_reversion(self, prices, window=14):
        """Calculate mean reversion signal using SMA"""
        if len(prices) < window:
            return 0
            
        sma = prices.rolling(window=window).mean().iloc[-1]
        current_price = prices.iloc[-1]
        
        deviation = (current_price - sma) / sma
        
        if deviation > 0.05:  # 5% above SMA
            return -1  # Overbought, likely to revert down
        elif deviation < -0.05:  # 5% below SMA
            return 1   # Oversold, likely to revert up
        else:
            return deviation * 10  # Scaled signal between -0.5 and 0.5
    
    def calculate_momentum(self, prices, window=14):
        """Calculate RSI-based momentum signal"""
        if len(prices) <= window:
            return 0
            
        try:
            # Calculate RSI
            delta = prices.diff()
            gain = delta.clip(lower=0)
            loss = -delta.clip(upper=0)
            
            avg_gain = gain.rolling(window=window).mean()
            avg_loss = loss.rolling(window=window).mean()
            
            # Avoid division by zero
            avg_loss = avg_loss.replace(0, 0.0001)
            
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
            
            last_rsi = rsi.iloc[-1]
            
            if np.isnan(last_rsi):
                return 0
            
            # Convert RSI to signal (-1 to 1)
            if last_rsi > 70:
                return -1  # Overbought
            elif last_rsi < 30:
                return 1   # Oversold
            else:
                return (50 - last_rsi) / 20  # Scaled signal
                
        except Exception as e:
            print(f"RSI calculation error: {e}")
            return 0
    
    def calculate_volatility(self, prices, window=14):
        """Calculate volatility-based signal"""
        if len(prices) <= window:
            return 0
            
        try:
            # Calculate rolling volatility
            returns = prices.pct_change().dropna()
            volatility = returns.rolling(window=window).std()
            current_vol = volatility.iloc[-1]
            
            if np.isnan(current_vol):
                return 0
            
            # Higher volatility = higher risk = negative signal
            # Lower volatility = lower risk = positive signal
            if current_vol > 0.05:  # High volatility (5%+ daily)
                return -1
            elif current_vol < 0.01:  # Very low volatility (1% daily)
                return 1
            else:
                return (0.03 - current_vol) / 0.02  # Scaled signal
                
        except Exception as e:
            print(f"Volatility calculation error: {e}")
            return 0
    
    def calculate_breakout(self, prices, window=20):
        """Calculate Bollinger Bands breakout signal"""
        if len(prices) <= window:
            return 0
            
        try:
            sma = prices.rolling(window=window).mean()
            std = prices.rolling(window=window).std()
            
            upper_band = sma + 2 * std
            lower_band = sma - 2 * std
            
            current_price = prices.iloc[-1]
            current_upper = upper_band.iloc[-1]
            current_lower = lower_band.iloc[-1]
            current_sma = sma.iloc[-1]
            
            if np.isnan(current_upper) or np.isnan(current_lower):
                return 0
            
            if current_price > current_upper:
                return 1   # Bullish breakout
            elif current_price < current_lower:
                return -1  # Bearish breakdown
            else:
                # Position within bands (-1 to 1)
                band_position = (current_price - current_sma) / (current_upper - current_sma)
                return max(-1, min(1, band_position))
                
        except Exception as e:
            print(f"Breakout calculation error: {e}")
            return 0
    
    def calculate_ml_confidence(self, signals_dict):
        """Calculate ML confidence based on signal alignment"""
        try:
            signals = [signals_dict['mean_reversion'], signals_dict['momentum'], 
                      signals_dict['volatility'], signals_dict['breakout']]
            
            # Remove any NaN values
            signals = [s for s in signals if not np.isnan(s)]
            
            if not signals:
                return 0.5
            
            # Check signal alignment
            avg_signal = np.mean(signals)
            signal_std = np.std(signals)
            
            # Higher confidence when signals agree
            base_confidence = 0.7
            alignment_bonus = max(0, 0.25 - signal_std)  # Up to 25% bonus for alignment
            strength_bonus = min(0.15, abs(avg_signal) * 0.1)  # Up to 15% for strong signals
            
            confidence = base_confidence + alignment_bonus + strength_bonus
            return max(0.3, min(0.95, confidence))
            
        except Exception as e:
            print(f"ML confidence calculation error: {e}")
            return 0.5
    
    def generate_signals(self):
        """Generate comprehensive trading signals for all tokens"""
        results = {}
        
        for token in self.tokens:
            try:
                print(f"🔍 Generating signals for {token}...")
                
                # Get price data (real or mock)
                df = self.fetch_price_data(token, days=60)  # More data for better signals
                
                if df is None or len(df) < 20:
                    print(f"⚠️ Insufficient data for {token}, using default signals")
                    results[token] = self._get_default_signals()
                    continue
                
                # Calculate individual signals
                mean_reversion = self.calculate_mean_reversion(df['price'])
                momentum = self.calculate_momentum(df['price'])
                volatility = self.calculate_volatility(df['price'])
                breakout = self.calculate_breakout(df['price'])
                
                # Clean signals (handle NaN)
                signals_dict = {
                    'mean_reversion': self._clean_signal(mean_reversion),
                    'momentum': self._clean_signal(momentum),
                    'volatility': self._clean_signal(volatility),
                    'breakout': self._clean_signal(breakout)
                }
                
                # Calculate total score with weights
                weights = {'mean_reversion': 0.3, 'momentum': 0.3, 'volatility': 0.2, 'breakout': 0.2}
                total_score = sum(signals_dict[key] * weights[key] for key in weights.keys())
                
                # Calculate ML confidence
                ml_confidence = self.calculate_ml_confidence(signals_dict)
                
                results[token] = {
                    **signals_dict,
                    'total_score': round(total_score, 3),
                    'ml_confidence': round(ml_confidence, 3),
                    'timestamp': time.time()
                }
                
                print(f"✅ {token} signals: Score={total_score:.2f}, Confidence={ml_confidence:.2f}")
                
            except Exception as e:
                print(f"❌ Error generating signals for {token}: {e}")
                results[token] = self._get_default_signals()
        
        self.signals = results
        return results
    
    def _clean_signal(self, signal):
        """Clean and validate signal values"""
        if signal is None or np.isnan(signal) or np.isinf(signal):
            return 0.0
        return max(-2, min(2, float(signal)))  # Clamp between -2 and 2
    
    def _get_default_signals(self):
        """Return default signals when calculation fails"""
        return {
            'mean_reversion': 0.0,
            'momentum': 0.0,
            'volatility': 0.0,
            'breakout': 0.0,
            'total_score': 0.0,
            'ml_confidence': 0.5,
            'timestamp': time.time()
        }
    
    def calculate_target_weights(self):
        """Convert signals to target portfolio weights"""
        if not self.signals:
            self.generate_signals()
        
        try:
            # Extract scores and confidences
            token_scores = {}
            for token, data in self.signals.items():
                score = data.get('total_score', 0)
                confidence = data.get('ml_confidence', 0.5)
                
                # Weight score by confidence
                weighted_score = score * confidence
                token_scores[token] = weighted_score
            
            # Separate stablecoin (USDC) from volatile assets
            stable_tokens = ['USDC']
            volatile_tokens = [t for t in self.tokens if t not in stable_tokens]
            
            # Calculate weights for volatile tokens
            volatile_scores = {t: token_scores.get(t, 0) for t in volatile_tokens}
            
            # Add base score to make all values positive
            min_score = min(volatile_scores.values()) if volatile_scores else 0
            adjustment = abs(min_score) + 1 if min_score < 0 else 1
            
            adjusted_scores = {t: score + adjustment for t, score in volatile_scores.items()}
            total_volatile_score = sum(adjusted_scores.values())
            
            # Allocate 80-90% to volatile assets, 10-20% to stable
            volatile_allocation = 85  # 85% to volatile assets
            stable_allocation = 15    # 15% to stable assets
            
            weights = {}
            
            # Calculate weights for volatile tokens
            if total_volatile_score > 0:
                for token in volatile_tokens:
                    weight = (adjusted_scores[token] / total_volatile_score) * volatile_allocation
                    weight = max(5, min(40, weight))  # Bounds: 5-40%
                    weights[token] = round(weight, 1)
            else:
                # Equal weights if no clear signals
                equal_weight = volatile_allocation / len(volatile_tokens)
                for token in volatile_tokens:
                    weights[token] = round(equal_weight, 1)
            
            # Allocate remaining to stable tokens
            for token in stable_tokens:
                weights[token] = stable_allocation
            
            # Normalize to ensure sum = 100%
            total_weight = sum(weights.values())
            if total_weight != 100:
                adjustment = 100 - total_weight
                # Add adjustment to largest volatile token
                largest_token = max(volatile_tokens, key=lambda t: weights.get(t, 0))
                weights[largest_token] = max(5, weights[largest_token] + adjustment)
            
            print(f"📊 Target weights calculated: {weights}")
            return weights
            
        except Exception as e:
            print(f"❌ Error calculating target weights: {e}")
            # Fallback to equal weights
            equal_weight = round(100 / len(self.tokens), 1)
            return {token: equal_weight for token in self.tokens}
    
    def get_signal_summary(self):
        """Get a summary of current signals"""
        if not self.signals:
            return "No signals generated yet"
        
        summary = []
        for token, data in self.signals.items():
            score = data.get('total_score', 0)
            confidence = data.get('ml_confidence', 0)
            
            signal_strength = "Strong" if abs(score) > 1 else "Weak" if abs(score) > 0.5 else "Neutral"
            signal_direction = "Bullish" if score > 0 else "Bearish" if score < 0 else "Neutral"
            
            summary.append(f"{token}: {signal_direction} {signal_strength} (Confidence: {confidence:.0%})")
        
        return "\n".join(summary)

# Example usage and testing
if __name__ == "__main__":
    print("🚀 Testing SignalStack Strategy Engine...")
    
    generator = SignalGenerator(['BTC', 'ETH', 'ADA', 'DOT', 'USDC'])
    
    print("\n📊 Generating signals...")
    signals = generator.generate_signals()
    
    print("\n🎯 Calculating target weights...")
    weights = generator.calculate_target_weights()
    
    print("\n📋 Signal Summary:")
    print(generator.get_signal_summary())
    
    print(f"\n💼 Target Portfolio Weights:")
    for token, weight in weights.items():
        print(f"   {token}: {weight}%")
    
    print(f"\n✅ Strategy engine test completed!")