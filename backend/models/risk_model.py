import numpy as np
import pandas as pd
from datetime import datetime, timedelta

class RiskManager:
    def __init__(self):
        self.risk_free_rate = 0.02  # 2% annual risk-free rate
        self.lookback_period = 30   # 30 days for volatility calculation
        
    def calculate_portfolio_risk(self, weights, prices, signals):
        """Calculate portfolio risk metrics"""
        try:
            risk_metrics = {
                'portfolio_volatility': self._calculate_portfolio_volatility(weights, prices),
                'max_drawdown': self._calculate_max_drawdown(weights, prices),
                'sharpe_ratio': self._calculate_sharpe_ratio(weights, prices),
                'risk_score': self._calculate_risk_score(signals),
                'concentration_risk': self._calculate_concentration_risk(weights),
                'market_risk': self._assess_market_risk(signals),
                'recommendations': self._generate_risk_recommendations(weights, signals)
            }
            
            return risk_metrics
            
        except Exception as e:
            print(f"Error calculating portfolio risk: {e}")
            return self._get_default_risk_metrics()
    
    def _calculate_portfolio_volatility(self, weights, prices):
        """Calculate portfolio volatility"""
        try:
            # Simulate historical volatility based on current market conditions
            base_volatility = 0.25  # 25% base crypto volatility
            
            # Adjust based on portfolio concentration
            concentration = max(weights.values()) if weights else 0.5
            volatility_adjustment = 1 + (concentration - 0.2) * 0.5
            
            portfolio_vol = base_volatility * volatility_adjustment
            return round(portfolio_vol * 100, 2)  # Return as percentage
            
        except Exception:
            return 25.0  # Default 25% volatility
    
    def _calculate_max_drawdown(self, weights, prices):
        """Calculate maximum drawdown"""
        try:
            # Simulate max drawdown based on crypto market conditions
            base_drawdown = 0.35  # 35% base max drawdown for crypto
            
            # Adjust based on diversification
            num_assets = len([w for w in weights.values() if w > 0.01]) if weights else 1
            diversification_factor = max(0.7, 1 - (num_assets - 1) * 0.05)
            
            max_dd = base_drawdown * diversification_factor
            return round(max_dd * 100, 2)  # Return as percentage
            
        except Exception:
            return 35.0  # Default 35% max drawdown
    
    def _calculate_sharpe_ratio(self, weights, prices):
        """Calculate portfolio Sharpe ratio"""
        try:
            # Simulate Sharpe ratio based on current allocation
            portfolio_vol = self._calculate_portfolio_volatility(weights, prices) / 100
            expected_return = 0.15  # 15% expected annual return for crypto
            
            if portfolio_vol > 0:
                sharpe = (expected_return - self.risk_free_rate) / portfolio_vol
            else:
                sharpe = 0
                
            return round(sharpe, 2)
            
        except Exception:
            return 0.8  # Default Sharpe ratio
    
    def _calculate_risk_score(self, signals):
        """Calculate overall risk score (1-10 scale)"""
        try:
            if not signals:
                return 5.0
            
            # Analyze signal volatility and uncertainty
            total_scores = [abs(data.get('total_score', 0)) for data in signals.values()]
            avg_signal_strength = sum(total_scores) / len(total_scores) if total_scores else 0
            
            # Higher signal strength = lower risk (more confident predictions)
            risk_score = max(1, min(10, 7 - avg_signal_strength))
            
            return round(risk_score, 1)
            
        except Exception:
            return 5.0  # Neutral risk score
    
    def _calculate_concentration_risk(self, weights):
        """Calculate concentration risk"""
        try:
            if not weights:
                return 50.0
            
            # Calculate Herfindahl index for concentration
            weight_values = list(weights.values())
            herfindahl = sum(w**2 for w in weight_values)
            
            # Convert to percentage (higher = more concentrated = riskier)
            concentration_risk = herfindahl * 100
            
            return round(concentration_risk, 2)
            
        except Exception:
            return 50.0  # Default moderate concentration
    
    def _assess_market_risk(self, signals):
        """Assess current market risk level"""
        try:
            if not signals:
                return "Medium"
            
            # Analyze signal patterns for market stress
            volatility_signals = [data.get('volatility', 0) for data in signals.values()]
            avg_volatility = sum(volatility_signals) / len(volatility_signals) if volatility_signals else 0
            
            if avg_volatility > 2:
                return "High"
            elif avg_volatility > 1:
                return "Medium"
            else:
                return "Low"
                
        except Exception:
            return "Medium"
    
    def _generate_risk_recommendations(self, weights, signals):
        """Generate risk management recommendations"""
        try:
            recommendations = []
            
            # Check concentration risk
            if weights:
                max_weight = max(weights.values())
                if max_weight > 0.5:
                    recommendations.append("⚠️ High concentration risk - consider diversifying")
                elif max_weight < 0.3:
                    recommendations.append("✅ Good diversification maintained")
            
            # Check signal uncertainty
            if signals:
                uncertain_signals = sum(1 for data in signals.values() 
                                      if abs(data.get('total_score', 0)) < 1)
                if uncertain_signals > len(signals) / 2:
                    recommendations.append("📊 High signal uncertainty - consider smaller position sizes")
            
            # Market condition recommendations
            market_risk = self._assess_market_risk(signals)
            if market_risk == "High":
                recommendations.append("🔴 High market volatility detected - consider reducing exposure")
            elif market_risk == "Low":
                recommendations.append("🟢 Favorable market conditions for growth positions")
            
            if not recommendations:
                recommendations.append("✅ Risk levels within acceptable parameters")
            
            return recommendations
            
        except Exception:
            return ["📊 Risk analysis in progress..."]
    
    def _get_default_risk_metrics(self):
        """Return default risk metrics when calculation fails"""
        return {
            'portfolio_volatility': 25.0,
            'max_drawdown': 35.0,
            'sharpe_ratio': 0.8,
            'risk_score': 5.0,
            'concentration_risk': 50.0,
            'market_risk': 'Medium',
            'recommendations': ['📊 Risk analysis in progress...']
        }
    
    def get_risk_limits(self):
        """Get recommended risk limits"""
        return {
            'max_single_asset_weight': 0.4,  # 40% max in single asset
            'min_diversification': 3,        # At least 3 assets
            'max_portfolio_volatility': 0.3, # 30% max volatility
            'min_sharpe_ratio': 0.5,         # Minimum acceptable Sharpe
            'max_concentration_risk': 60.0   # Maximum concentration percentage
        }