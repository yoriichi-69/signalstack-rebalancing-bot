#!/usr/bin/env python3
"""
Debug script to trace exactly what happens during bot deployment and immediate rebalancing.
This will help us identify where the portfolio value inflation is coming from.
"""

import requests
import json
import time

def get_account_info():
    """Get current account information."""
    try:
        response = requests.get('http://localhost:5000/api/account')
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error getting account: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def get_current_prices():
    """Get current mock prices."""
    try:
        response = requests.get('http://localhost:5000/api/prices')
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error getting prices: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def deploy_test_bot():
    """Deploy a test bot and trace the process."""
    data = {
        "strategy": "shannon",
        "allocated_fund": 10000,
        "risk_profile": "medium"
    }
    
    try:
        response = requests.post('http://localhost:5000/api/bots/deploy', json=data)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error deploying bot: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def main():
    print("🔍 Debugging Immediate Rebalance Issue")
    print("=" * 60)
    
    # Step 1: Get current prices
    print("📊 Step 1: Getting current prices...")
    prices = get_current_prices()
    if prices:
        print("Current prices:")
        for asset, price in prices.get('prices', {}).items():
            print(f"  {asset}: ${price:.2f}")
    else:
        print("❌ Failed to get prices")
        return
    
    # Step 2: Get account status before deployment
    print("\n👤 Step 2: Account status before deployment...")
    account_before = get_account_info()
    if account_before:
        print(f"  Balance: ${account_before['balance']:,.2f}")
        print(f"  Active Bots: {len(account_before.get('bots', []))}")
    
    # Step 3: Deploy bot
    print("\n🚀 Step 3: Deploying test bot...")
    bot_response = deploy_test_bot()
    if not bot_response:
        print("❌ Failed to deploy bot")
        return
    
    bot = bot_response.get('bot', {})
    print(f"  Bot ID: {bot.get('bot_id')}")
    print(f"  Allocated Fund: ${bot.get('allocated_fund'):,.2f}")
    print(f"  Initial Portfolio Value: ${bot.get('portfolio_value'):,.2f}")
    print("  Initial Assets:")
    for asset, amount in bot.get('assets', {}).items():
        asset_price = prices.get('prices', {}).get(asset, 0)
        usd_value = amount * asset_price
        print(f"    {asset}: {amount:.6f} (${usd_value:.2f} @ ${asset_price:.2f})")
    
    # Step 4: Check account immediately after deployment
    print("\n📈 Step 4: Account status immediately after deployment...")
    account_after = get_account_info()
    if account_after:
        print(f"  Balance: ${account_after['balance']:,.2f}")
        active_bots = [bot for bot in account_after.get('bots', []) if bot['status'] == 'active']
        print(f"  Active Bots: {len(active_bots)}")
        
        for bot in active_bots:
            print(f"\n  Bot {bot['bot_id']}:")
            print(f"    Allocated Fund: ${bot.get('allocated_fund'):,.2f}")
            print(f"    Portfolio Value: ${bot.get('portfolio_value'):,.2f}")
            print(f"    Status: {bot.get('status')}")
            print("    Current Assets:")
            total_calculated = 0
            for asset, amount in bot.get('assets', {}).items():
                asset_price = prices.get('prices', {}).get(asset, 0)
                usd_value = amount * asset_price
                total_calculated += usd_value
                print(f"      {asset}: {amount:.6f} (${usd_value:.2f} @ ${asset_price:.2f})")
            
            print(f"    Calculated Total: ${total_calculated:.2f}")
            
            # Check for discrepancy
            allocated = bot.get('allocated_fund', 0)
            portfolio = bot.get('portfolio_value', 0)
            if abs(portfolio - allocated) > 1:  # Allow for small rounding errors
                print(f"    ⚠️  DISCREPANCY: Portfolio value ${portfolio:.2f} != Allocated fund ${allocated:.2f}")
                print(f"    ⚠️  Difference: ${portfolio - allocated:.2f}")
            else:
                print(f"    ✅ Portfolio value matches allocated fund")
    
    # Step 5: Wait a few seconds and check again (to see if rebalancing triggers)
    print("\n⏳ Step 5: Waiting 10 seconds to see if rebalancing triggers...")
    time.sleep(10)
    
    account_later = get_account_info()
    if account_later:
        active_bots = [bot for bot in account_later.get('bots', []) if bot['status'] == 'active']
        
        for bot in active_bots:
            if bot['bot_id'] == bot_response.get('bot', {}).get('bot_id'):
                print(f"\n  Bot {bot['bot_id']} after 10 seconds:")
                print(f"    Allocated Fund: ${bot.get('allocated_fund'):,.2f}")
                print(f"    Portfolio Value: ${bot.get('portfolio_value'):,.2f}")
                
                allocated = bot.get('allocated_fund', 0)
                portfolio = bot.get('portfolio_value', 0)
                if abs(portfolio - allocated) > 1:
                    print(f"    ⚠️  REBALANCE ISSUE: Portfolio grew to ${portfolio:.2f} from ${allocated:.2f}")
                    print(f"    ⚠️  Growth: ${portfolio - allocated:.2f} ({((portfolio/allocated)-1)*100:.1f}%)")
                else:
                    print(f"    ✅ Portfolio value still matches allocated fund")

if __name__ == "__main__":
    main()
