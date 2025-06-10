#!/usr/bin/env python3
"""
Test script to compare current crypto prices vs portfolio calculations
to identify the source of the PnL discrepancy.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import requests
from backend.models.virtual_account import VirtualAccountManager

def get_real_crypto_prices():
    """Get current actual crypto prices from CoinGecko."""
    try:
        url = "https://api.coingecko.com/api/v3/simple/price"
        params = {
            'ids': 'bitcoin,ethereum,cardano,polkadot,usd-coin',
            'vs_currencies': 'usd'
        }
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        return {
            'BTC': data.get('bitcoin', {}).get('usd', 0),
            'ETH': data.get('ethereum', {}).get('usd', 0),
            'ADA': data.get('cardano', {}).get('usd', 0),
            'DOT': data.get('polkadot', {}).get('usd', 0),
            'USDC': data.get('usd-coin', {}).get('usd', 0),
        }
    except Exception as e:
        print(f"Error fetching real prices: {e}")
        return None

def test_price_comparison():
    """Compare real prices vs backend prices vs portfolio calculations."""
    print("=== CRYPTO PRICE COMPARISON TEST ===")
    
    # Get real market prices
    real_prices = get_real_crypto_prices()
    if not real_prices:
        print("❌ Failed to fetch real crypto prices")
        return
    
    # Get backend prices
    account_manager = VirtualAccountManager()
    backend_prices = account_manager._get_current_prices()
    
    # Get account data
    account = account_manager.get_account('default_user')
    
    print("\n--- PRICE COMPARISON ---")
    print(f"{'Asset':<6} {'Real Price':<12} {'Backend Price':<14} {'Difference':<12} {'% Diff':<8}")
    print("-" * 60)
    
    total_price_impact = 0
    
    for asset in ['BTC', 'ETH', 'ADA', 'DOT', 'USDC']:
        real_price = real_prices.get(asset, 0)
        backend_price = backend_prices.get(asset, 0) if backend_prices else 0
        
        if real_price > 0 and backend_price > 0:
            diff = backend_price - real_price
            percent_diff = (diff / real_price) * 100
            total_price_impact += abs(percent_diff)
            
            print(f"{asset:<6} ${real_price:<11.2f} ${backend_price:<13.2f} ${diff:<11.2f} {percent_diff:<7.2f}%")
        else:
            print(f"{asset:<6} ${real_price:<11.2f} ${backend_price:<13.2f} N/A         N/A")
    
    print(f"\nTotal price impact: {total_price_impact:.2f}%")
    
    # Analyze portfolio impact
    if account and account.get('bots'):
        print("\n--- PORTFOLIO IMPACT ANALYSIS ---")
        
        for i, bot in enumerate(account['bots']):
            if bot.get('status') != 'active':
                continue
                
            print(f"\nBot {i+1} (${bot.get('allocated_fund', 0):,.2f} allocated):")
            print(f"Backend portfolio value: ${bot.get('portfolio_value', 0):,.2f}")
            
            # Calculate what portfolio value should be with real prices
            real_portfolio_value = 0
            backend_portfolio_value = 0
            
            if bot.get('assets'):
                for asset, amount in bot['assets'].items():
                    real_price = real_prices.get(asset.upper(), 0)
                    backend_price = backend_prices.get(asset.upper(), 0) if backend_prices else 0
                    
                    real_value = amount * real_price
                    backend_value = amount * backend_price
                    
                    real_portfolio_value += real_value
                    backend_portfolio_value += backend_value
                    
                    if amount > 0:
                        print(f"  {asset}: {amount:.6f} × ${real_price:.2f} = ${real_value:.2f} (real)")
                        print(f"  {asset}: {amount:.6f} × ${backend_price:.2f} = ${backend_value:.2f} (backend)")
            
            # Calculate PnL with both prices
            allocated = bot.get('allocated_fund', 0)
            real_pnl = real_portfolio_value - allocated
            backend_pnl = backend_portfolio_value - allocated
            
            real_pnl_percent = (real_pnl / allocated * 100) if allocated > 0 else 0
            backend_pnl_percent = (backend_pnl / allocated * 100) if allocated > 0 else 0
            
            print(f"  Real PnL: ${real_pnl:.2f} ({real_pnl_percent:.2f}%)")
            print(f"  Backend PnL: ${backend_pnl:.2f} ({backend_pnl_percent:.2f}%)")
            print(f"  Difference: ${backend_pnl - real_pnl:.2f}")
            
            # Check if this explains the unrealistic gains
            if abs(backend_pnl_percent) > 10 and abs(real_pnl_percent) < 5:
                print(f"  🚨 FOUND ISSUE: Backend shows {backend_pnl_percent:.2f}% vs realistic {real_pnl_percent:.2f}%")
    
    # Overall assessment
    print("\n--- ANALYSIS RESULT ---")
    if total_price_impact > 50:
        print("🚨 MAJOR PRICE DISCREPANCY: Backend prices significantly differ from market")
        print("   This is likely causing unrealistic PnL calculations")
    elif total_price_impact > 10:
        print("⚠️  MODERATE PRICE DISCREPANCY: Some price differences detected")
        print("   May contribute to PnL inflation")
    else:
        print("✅ PRICES LOOK REASONABLE: Price tracking appears accurate")
        print("   Issue likely in calculation logic, not price data")

if __name__ == "__main__":
    test_price_comparison()
