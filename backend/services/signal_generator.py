import numpy as np
import pandas as pd
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from .price_service import PriceService

logger = logging.getLogger(__name__)

class SignalGenerator:
    def __init__(self, tokens: Optional[List[str]] = None):
        self.tokens = tokens or ['BTC', 'ETH', 'ADA', 'DOT', 'USDC']
        self.price_service = PriceService()
        self.signals = {}
        self.last_update = 0
        self.update_interval = 300  # Update signals every 5 minutes
        
    def calculate_rsi(self, prices: List[float], period: int = 14) -> float:
        """Calculate Relative Strength Index"""
        if len(prices) < period + 1:
            return 50.0  # Default to neutral if not enough data
            
        deltas = np.diff(prices)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        
        avg_gain = np.mean(gains[:period])
        avg_loss = np.mean(losses[:period])
        
        if avg_loss == 0:
            return 100.0
            
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
        
    def calculate_macd(self, prices: List[float]) -> Dict[str, float]:
        """Calculate MACD (Moving Average Convergence Divergence)"""
        if len(prices) < 26:
            return {'macd': 0, 'signal': 0, 'histogram': 0}
            
        exp1 = pd.Series(prices).ewm(span=12, adjust=False).mean()
        exp2 = pd.Series(prices).ewm(span=26, adjust=False).mean()
        macd = exp1 - exp2
        signal = macd.ewm(span=9, adjust=False).mean()
        histogram = macd - signal
        
        return {
            'macd': macd.iloc[-1],
            'signal': signal.iloc[-1],
            'histogram': histogram.iloc[-1]
        }
        
    def calculate_volatility(self, prices: List[float], period: int = 20) -> float:
        """Calculate price volatility"""
        if len(prices) < period:
            return 0.0
            
        returns = np.diff(prices) / prices[:-1]
        return np.std(returns) * np.sqrt(252)  # Annualized volatility
        
    def analyze_volume(self, volumes: List[float]) -> Dict[str, float]:
        """Analyze trading volume"""
        if len(volumes) < 2:
            return {'increasing': False, 'strength': 0.0}
            
        avg_volume = np.mean(volumes)
        current_volume = volumes[-1]
        volume_change = (current_volume - avg_volume) / avg_volume
        
        return {
            'increasing': volume_change > 0,
            'strength': volume_change
        }
        
    def generate_signal(self, token: str) -> Dict:
        """Generate trading signal for a single token"""
        try:
            # Get historical data
            historical_data = self.price_service.get_historical_data(token, days=30)
            if not historical_data['prices']:
                return self._get_default_signal(token)
                
            # Extract price and volume data
            prices = [price[1] for price in historical_data['prices']]
            volumes = [volume[1] for volume in historical_data['total_volumes']]
            
            # Calculate technical indicators
            rsi = self.calculate_rsi(prices)
            macd = self.calculate_macd(prices)
            volatility = self.calculate_volatility(prices)
            volume_analysis = self.analyze_volume(volumes)
            
            # Generate signal score (-1 to 1)
            signal_score = 0
            
            # RSI contribution
            if rsi > 70:
                signal_score -= 0.3
            elif rsi < 30:
                signal_score += 0.3
                
            # MACD contribution
            if macd['histogram'] > 0:
                signal_score += 0.2
            else:
                signal_score -= 0.2
                
            # Volume contribution
            if volume_analysis['increasing']:
                signal_score += 0.2 * volume_analysis['strength']
            else:
                signal_score -= 0.2 * abs(volume_analysis['strength'])
                
            # Volatility adjustment
            if volatility > 0.5:  # High volatility
                signal_score *= 0.8  # Reduce signal strength
                
            # Determine signal type and confidence
            signal_type = 'BUY' if signal_score > 0.2 else 'SELL' if signal_score < -0.2 else 'HOLD'
            confidence = min(abs(signal_score) * 100, 100)
            
            # Calculate price targets
            current_price = prices[-1]
            if signal_type == 'BUY':
                take_profit = current_price * (1 + volatility * 2)
                stop_loss = current_price * (1 - volatility)
            else:
                take_profit = current_price * (1 - volatility * 2)
                stop_loss = current_price * (1 + volatility)
                
            return {
                'symbol': token,
                'type': signal_type,
                'confidence': round(confidence),
                'signal_score': round(signal_score, 2),
                'price': current_price,
                'price_targets': {
                    'take_profit': round(take_profit, 2),
                    'stop_loss': round(stop_loss, 2)
                },
                'indicators': {
                    'rsi': round(rsi, 2),
                    'macd': round(macd['macd'], 2),
                    'volatility': round(volatility, 4),
                    'volume_trend': 'increasing' if volume_analysis['increasing'] else 'decreasing'
                },
                'timestamp': datetime.now().timestamp()
            }
            
        except Exception as e:
            logger.error(f"Error generating signal for {token}: {e}")
            return self._get_default_signal(token)
            
    def _get_default_signal(self, token: str) -> Dict:
        """Generate a default neutral signal"""
        return {
            'symbol': token,
            'type': 'HOLD',
            'confidence': 50,
            'signal_score': 0,
            'price': 0,
            'price_targets': {
                'take_profit': 0,
                'stop_loss': 0
            },
            'indicators': {
                'rsi': 50,
                'macd': 0,
                'volatility': 0,
                'volume_trend': 'neutral'
            },
            'timestamp': datetime.now().timestamp()
        }
        
    def generate_signals(self) -> Dict[str, Dict]:
        """Generate signals for all tracked tokens"""
        current_time = time.time()
        
        # Check if we need to update signals
        if current_time - self.last_update < self.update_interval:
            return self.signals
            
        new_signals = {}
        for token in self.tokens:
            new_signals[token] = self.generate_signal(token)
            
        self.signals = new_signals
        self.last_update = current_time
        return self.signals
        
    def calculate_target_weights(self) -> Dict[str, float]:
        """Calculate target portfolio weights based on signals"""
        signals = self.generate_signals()
        total_score = sum(abs(signal['signal_score']) for signal in signals.values())
        
        if total_score == 0:
            # Equal weights if no signals
            return {token: 1.0 / len(self.tokens) for token in self.tokens}
            
        weights = {}
        for token, signal in signals.items():
            # Weight is proportional to signal strength
            weights[token] = abs(signal['signal_score']) / total_score
            
        return weights 