#!/usr/bin/env python3
"""
Debug script to identify the allocation calculation bug in deploy_bot()
"""

import requests
import json

def test_allocation_calculation():
    """Test the allocation calculation logic to identify the bug"""
    
    # Simulate the deploy_bot calculation logic
    allocated_fund = 10000  # $10,000 allocation
    strategy = 'momentum'
    
    # Get current prices (simulate API call)
    try:
        response = requests.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,polkadot&vs_currencies=usd')
        data = response.json()
        prices = {
            'BTC': data.get('bitcoin', {}).get('usd', 45000),
            'ETH': data.get('ethereum', {}).get('usd', 3000), 
            'DOT': data.get('polkadot', {}).get('usd', 25)
        }
    except:
        # Fallback prices
        prices = {
            'BTC': 45000,
            'ETH': 3000,
            'DOT': 25
        }
    
    print(f"Current prices: {prices}")
    
    # Get allocation weights for momentum strategy
    def get_initial_allocation(strategy):
        if strategy == 'momentum':
            return {'BTC': 0.4, 'ETH': 0.4, 'DOT': 0.2}
        else:
            return {'BTC': 0.35, 'ETH': 0.35, 'ADA': 0.3}
    
    allocation_weights = get_initial_allocation(strategy)
    print(f"Allocation weights: {allocation_weights}")
    
    actual_assets = {}
    
    print(f"\nCalculating allocation for ${allocated_fund}:")
    print("=" * 50)
    
    total_usd_check = 0
    for asset, weight in allocation_weights.items():
        if asset in prices and prices[asset] > 0:
            # Calculate USD value for this asset
            usd_value = allocated_fund * weight
            # Convert to actual cryptocurrency amount
            crypto_amount = usd_value / prices[asset]
            actual_assets[asset] = crypto_amount
            total_usd_check += usd_value
            
            print(f"{asset}: ${usd_value:.2f} = {crypto_amount:.6f} {asset} @ ${prices[asset]:.2f}")
    
    print(f"\nTotal USD allocated: ${total_usd_check:.2f}")
    
    # Now calculate portfolio value 
    portfolio_value = 0
    print(f"\nCalculating portfolio value:")
    print("=" * 30)
    
    for asset, amount in actual_assets.items():
        value = amount * prices[asset]
        portfolio_value += value
        print(f"{asset}: {amount:.6f} * ${prices[asset]:.2f} = ${value:.2f}")
    
    print(f"\nTotal portfolio value: ${portfolio_value:.2f}")
    print(f"Expected portfolio value: ${allocated_fund:.2f}")
    print(f"Difference: ${portfolio_value - allocated_fund:.2f}")
    
    if abs(portfolio_value - allocated_fund) > 1:
        print("❌ BUG DETECTED: Portfolio value doesn't match allocated fund!")
    else:
        print("✅ Allocation calculation is correct")
    
    return actual_assets, portfolio_value

def check_live_bot_data():
    """Check what the actual bot data looks like"""
    try:
        response = requests.get('http://localhost:5000/api/account')
        data = response.json()
        
        print("\n" + "="*60)
        print("LIVE BOT DATA ANALYSIS")
        print("="*60)
        
        for bot in data.get('bots', []):
            print(f"\nBot ID: {bot['bot_id']}")
            print(f"Strategy: {bot['strategy']}")
            print(f"Allocated Fund: ${bot['allocated_fund']:,.2f}")
            print(f"Portfolio Value: ${bot['portfolio_value']:,.2f}")
            print(f"Assets:")
            
            total_check = 0
            for asset, amount in bot.get('assets', {}).items():
                # Use sample prices for calculation
                sample_prices = {'BTC': 45000, 'ETH': 3000, 'DOT': 25, 'ADA': 1.2, 'USDC': 1}
                price = sample_prices.get(asset, 1)
                value = amount * price
                total_check += value
                print(f"  {asset}: {amount:,.6f} * ${price:,.2f} = ${value:,.2f}")
            
            print(f"Total calculated value: ${total_check:,.2f}")
            
            pnl = bot['portfolio_value'] - bot['allocated_fund']
            pnl_percent = (pnl / bot['allocated_fund']) * 100 if bot['allocated_fund'] > 0 else 0
            
            print(f"PnL: ${pnl:,.2f} ({pnl_percent:+.2f}%)")
            
            if bot['portfolio_value'] > bot['allocated_fund'] * 1000:  # More than 1000x gain
                print("❌ MASSIVE CORRUPTION DETECTED!")
            
    except Exception as e:
        print(f"Error checking live data: {e}")

if __name__ == "__main__":
    print("ALLOCATION BUG DIAGNOSTIC TOOL")
    print("="*40)
    
    # Test the calculation logic
    assets, portfolio_value = test_allocation_calculation()
    
    # Check live bot data
    check_live_bot_data()
    
    print("\n" + "="*60)
    print("ANALYSIS COMPLETE")
    print("="*60)
