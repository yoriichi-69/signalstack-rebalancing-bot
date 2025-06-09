import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import time

class RebalanceEngine:
    """Advanced Portfolio Rebalancing Engine with multiple strategies"""
    
    def __init__(self, risk_manager=None):
        self.risk_manager = risk_manager
        self.strategies = {
            'shannon': {
                'name': "Shannon's Demon",
                'description': 'Equal-weight rebalancing strategy that benefits from volatility harvesting'
            },
            'threshold': {
                'name': 'Threshold Rebalancing',
                'description': 'Rebalance only when asset weights drift beyond threshold'
            },
            'mpt': {
                'name': 'Modern Portfolio Theory',
                'description': 'Optimize for maximum Sharpe ratio'
            },
            'risk_parity': {
                'name': 'Risk Parity',
                'description': 'Allocate based on equal risk contribution'
            },
            'momentum': {
                'name': 'Momentum-Based',
                'description': 'Allocate more to assets with positive momentum'
            },
            'tactical': {
                'name': 'Tactical Allocation',
                'description': 'Dynamic allocation based on market signals'
            }
        }
    
    def calculate_rebalance_need(self, current_weights, target_weights, threshold=0.05):
        """Calculate whether portfolio needs rebalancing based on threshold"""
        if not current_weights or not target_weights:
            return False, 0, {}
            
        drift_values = {}
        max_drift = 0
        
        for asset, target in target_weights.items():
            current = current_weights.get(asset, 0)
            drift = abs(current - target)
            drift_values[asset] = drift
            max_drift = max(max_drift, drift)
        
        needs_rebalance = max_drift > threshold
        
        return needs_rebalance, max_drift, drift_values
    
    def generate_rebalance_plan(self, current_weights, target_weights, prices, cash=0):
        """Generate detailed rebalancing execution plan"""
        if not current_weights or not target_weights or not prices:
            return []
            
        total_value = sum(current_weights.get(asset, 0) * prices.get(asset, 0) for asset in current_weights)
        total_value += cash  # Add available cash
        
        trade_plan = []
        
        for asset in set(list(current_weights.keys()) + list(target_weights.keys())):
            current_weight = current_weights.get(asset, 0)
            target_weight = target_weights.get(asset, 0)
            price = prices.get(asset, 0)
            
            if price <= 0:
                continue  # Skip assets with no price data
                
            current_value = current_weight * total_value
            target_value = target_weight * total_value / 100  # Target weights as percentages
            
            trade_value = target_value - current_value
            trade_amount = trade_value / price if price > 0 else 0
            
            if abs(trade_value) > 1:  # Ignore tiny trades
                action = "BUY" if trade_value > 0 else "SELL"
                trade_plan.append({
                    'asset': asset,
                    'action': action,
                    'amount': abs(round(trade_amount, 8)),
                    'value': abs(round(trade_value, 2)),
                    'current_allocation': round(current_weight * 100, 2) if current_weight else 0,
                    'target_allocation': target_weight,
                    'price': price
                })
        
        return sorted(trade_plan, key=lambda x: abs(x['value']), reverse=True)
    
    def calculate_rebalance_metrics(self, current_weights, target_weights, historical_data=None):
        """Calculate metrics to evaluate rebalance effectiveness"""
        try:
            metrics = {
                'drift_reduction': 0,
                'risk_impact': 0,
                'expected_return_impact': 0,
                'transaction_cost_estimate': 0,
                'volatility_impact': 0,
                'sharpe_impact': 0,
                'optimization_score': 0
            }
            
            if not current_weights or not target_weights:
                return metrics
            
            # Calculate drift reduction
            drift_sum = sum(abs(current_weights.get(k, 0) - target_weights.get(k, 0)/100) 
                          for k in set(list(current_weights.keys()) + list(target_weights.keys())))
            metrics['drift_reduction'] = round(drift_sum * 100, 2)
            
            # Simple transaction cost estimate (0.1% of traded value)
            value_traded = sum(abs(current_weights.get(k, 0) - target_weights.get(k, 0)/100) 
                            for k in set(list(current_weights.keys()) + list(target_weights.keys())))
            metrics['transaction_cost_estimate'] = round(value_traded * 0.001 * 100, 4)  # As percentage
            
            # Risk and return impacts (simplified model)
            if target_weights.get('USDC', 0) > current_weights.get('USDC', 0) * 100:
                # More stablecoins = lower risk but lower returns
                metrics['risk_impact'] = -0.2  # Negative means risk reduction
                metrics['expected_return_impact'] = -0.1  # Slightly negative return impact
                metrics['volatility_impact'] = -0.15
            else:
                # More crypto exposure = higher risk and higher returns
                metrics['risk_impact'] = 0.15
                metrics['expected_return_impact'] = 0.2
                metrics['volatility_impact'] = 0.1
            
            # Impact on Sharpe ratio (simplified)
            if metrics['expected_return_impact'] > abs(metrics['risk_impact']):
                metrics['sharpe_impact'] = 0.1  # Positive impact
            else:
                metrics['sharpe_impact'] = -0.05  # Negative impact
            
            # Overall optimization score
            metrics['optimization_score'] = round((
                metrics['drift_reduction'] * 0.4 +  # 40% weight on drift reduction
                metrics['expected_return_impact'] * 0.3 +  # 30% on return impact
                (1 - metrics['transaction_cost_estimate']) * 0.1 +  # 10% on minimizing costs
                (metrics['sharpe_impact'] + 0.2) * 0.2  # 20% on Sharpe ratio impact
            ) * 10, 1)  # 0-10 scale
            
            return metrics
            
        except Exception as e:
            print(f"Error calculating rebalance metrics: {e}")
            return metrics
    
    def apply_rebalance_strategy(self, portfolio, signals, prices, strategy='tactical', risk_profile=50):
        """Apply selected rebalancing strategy to determine target weights"""
        if not portfolio or not signals or not prices:
            return {}
            
        # Normalize risk profile to 0-1 scale
        risk_factor = min(100, max(0, risk_profile)) / 100
        
        # Convert to lower case for consistency
        strategy = strategy.lower()
        
        # Default allocation (tactical)
        target_weights = {}
        
        if strategy == 'shannon':
            # Equal weight strategy (Shannon's Demon)
            equal_weight = round(100 / len(portfolio), 1)
            target_weights = {asset: equal_weight for asset in portfolio}
            
        elif strategy == 'threshold':
            # Threshold is more of a trigger than an allocation strategy.
            # For calculation, we can assume it targets a pre-defined allocation.
            # Here, we'll use equal weights as a stand-in.
            if not portfolio:
                return {}
            equal_weight = round(100 / len(portfolio), 1)
            target_weights = {asset: equal_weight for asset in portfolio}
            
        elif strategy == 'mpt':
            # Modern Portfolio Theory (simplified)
            # Higher risk profile = more weight to higher expected return assets
            # Sort assets by expected return (using signal score as proxy)
            sorted_assets = sorted(
                [(asset, signals.get(asset, {}).get('total_score', 0)) for asset in portfolio],
                key=lambda x: x[1], 
                reverse=True
            )
            
            # Allocate based on risk profile and ranking
            base_allocation = 100 / len(portfolio)
            
            for i, (asset, _) in enumerate(sorted_assets):
                # Higher rank = higher allocation for high risk, lower for low risk
                rank_factor = (len(sorted_assets) - i) / len(sorted_assets)
                adjustment = (rank_factor - 0.5) * risk_factor * 20  # +/- 10% adjustment
                target_weights[asset] = max(5, min(40, base_allocation + adjustment))
            
        elif strategy == 'risk_parity':
            # Risk Parity (simplified)
            # Estimate volatility using signals
            volatilities = {}
            for asset in portfolio:
                volatility = signals.get(asset, {}).get('volatility', 0.5)
                # Normalize volatility
                volatilities[asset] = max(0.1, min(2.0, volatility * 2))
            
            # Inverse volatility weighting
            total_inv_vol = sum(1/volatilities.get(asset, 1) for asset in portfolio)
            
            for asset in portfolio:
                inv_vol = 1 / volatilities.get(asset, 1)
                weight = (inv_vol / total_inv_vol) * 100
                target_weights[asset] = max(5, min(40, round(weight, 1)))
                
        elif strategy == 'momentum':
            # Momentum-based strategy
            # Use momentum signal to adjust weights
            momentum_scores = {}
            for asset in portfolio:
                momentum = signals.get(asset, {}).get('momentum', 0)
                momentum_scores[asset] = max(-1, min(1, momentum))
            
            # Base allocation
            equal_weight = 100 / len(portfolio)
            
            for asset in portfolio:
                momentum_adj = momentum_scores.get(asset, 0) * risk_factor * 15  # +/- 15% adjustment
                target_weights[asset] = max(5, min(40, equal_weight + momentum_adj))
                
        else:  # Default 'tactical'
            # Tactical allocation based on all signals
            # Extract scores
            scores = {}
            for asset in portfolio:
                # Combine signals into a composite score
                signal_data = signals.get(asset, {})
                total_score = signal_data.get('total_score', 0)
                momentum = signal_data.get('momentum', 0)
                mean_reversion = signal_data.get('mean_reversion', 0)
                
                # Weight signal components based on risk profile
                if risk_factor > 0.7:  # Aggressive
                    composite = total_score * 0.6 + momentum * 0.4
                elif risk_factor < 0.3:  # Conservative
                    composite = total_score * 0.3 + mean_reversion * 0.4 + 0.3  # Bias toward mean reversion
                else:  # Moderate
                    composite = total_score * 0.5 + momentum * 0.2 + mean_reversion * 0.2 + 0.1
                    
                scores[asset] = max(-1, min(1, composite))
            
            # Convert scores to weights
            total_score = sum(max(0.1, scores.get(asset, 0) + 1) for asset in portfolio)
            
            for asset in portfolio:
                # Normalize and adjust
                norm_score = (scores.get(asset, 0) + 1) / total_score
                
                # Apply risk factor - higher risk = more differentiation
                weight = 100 * norm_score * (1 + (scores.get(asset, 0) * risk_factor))
                
                # Ensure minimum weight and cap maximum weight
                target_weights[asset] = max(5, min(40, round(weight * 50, 1)))
        
        # Ensure weights sum to 100%
        total = sum(target_weights.values())
        if total != 100 and total > 0:
            # Add/subtract from largest weight
            if not target_weights: # a check to prevent crash on empty target_weights
                return target_weights
            largest_asset = max(target_weights.items(), key=lambda x: x[1])[0]
            target_weights[largest_asset] = round(target_weights[largest_asset] + (100 - total), 1)
        
        return target_weights
    
    def get_rebalance_recommendation(self, current_weights, signals, prices, risk_profile=50):
        """Get actionable rebalance recommendation with justification"""
        try:
            # Test different strategies
            strategy_results = {}
            for strategy_key in self.strategies.keys():
                target_weights = self.apply_rebalance_strategy(
                    current_weights.keys(), signals, prices, strategy=strategy_key, risk_profile=risk_profile
                )
                
                need_rebalance, max_drift, _ = self.calculate_rebalance_need(
                    current_weights, {k: v/100 for k, v in target_weights.items()}
                )
                
                metrics = self.calculate_rebalance_metrics(
                    current_weights, target_weights
                )
                
                strategy_results[strategy_key] = {
                    'target_weights': target_weights,
                    'need_rebalance': need_rebalance,
                    'max_drift': max_drift,
                    'metrics': metrics,
                    'score': metrics['optimization_score']
                }
            
            # Find optimal strategy
            best_strategy = max(strategy_results.items(), key=lambda x: x[1]['score'])
            strategy_key = best_strategy[0]
            strategy_data = best_strategy[1]
            
            # Generate recommendation
            market_condition = "volatile" if any(abs(s.get('total_score', 0)) > 1 for s in signals.values()) else "stable"
            action = "REBALANCE" if strategy_data['need_rebalance'] else "HOLD"
            urgency = "HIGH" if strategy_data['max_drift'] > 0.1 else "MEDIUM" if strategy_data['max_drift'] > 0.05 else "LOW"
            
            justification = []
            if strategy_data['need_rebalance']:
                justification.append(f"Portfolio drift of {strategy_data['max_drift']*100:.1f}% exceeds threshold")
                
                # Add strategy-specific justification
                if strategy_key == 'momentum':
                    assets_momentum = [(k, signals.get(k, {}).get('momentum', 0)) for k in current_weights.keys()]
                    positive_momentum = [a for a, m in assets_momentum if m > 0.5]
                    negative_momentum = [a for a, m in assets_momentum if m < -0.5]
                    
                    if positive_momentum:
                        justification.append(f"Positive momentum detected in {', '.join(positive_momentum)}")
                    if negative_momentum:
                        justification.append(f"Negative momentum detected in {', '.join(negative_momentum)}")
                        
                elif strategy_key == 'risk_parity':
                    justification.append("Risk distribution is sub-optimal")
                    
                elif strategy_key == 'tactical':
                    justification.append("Market signals suggest tactical repositioning")
                    
                justification.append(f"Expected optimization improvement: {strategy_data['metrics']['optimization_score']}/10")
            else:
                justification.append("Portfolio currently within acceptable drift parameters")
            
            return {
                'recommendation': action,
                'urgency': urgency,
                'strategy': {
                    'key': strategy_key,
                    'name': self.strategies[strategy_key]['name'],
                    'description': self.strategies[strategy_key]['description']
                },
                'target_weights': strategy_data['target_weights'],
                'justification': justification,
                'market_condition': market_condition,
                'metrics': strategy_data['metrics'],
                'timestamp': time.time()
            }
            
        except Exception as e:
            print(f"Error generating rebalance recommendation: {e}")
            return {
                'recommendation': "ERROR",
                'urgency': "LOW",
                'strategy': {'key': 'tactical', 'name': 'Tactical Allocation'},
                'target_weights': {},
                'justification': [f"Error: {str(e)}"],
                'market_condition': "unknown",
                'metrics': {},
                'timestamp': time.time()
            }