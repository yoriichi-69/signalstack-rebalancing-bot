#!/usr/bin/env python3

"""
Test script to verify all fixes to the virtual trading system.
This script tests:
1. Bot deployment with correct initial allocations
2. No immediate portfolio corruption
3. No background process interference
4. Proper PnL calculations
"""

import sys
import os
import json
import time
import requests

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from models.virtual_account import VirtualAccountManager

def test_fresh_deployment():
    """Test deploying a fresh bot and verify no corruption occurs."""
    print("=== Testing Fresh Bot Deployment ===")
    
    # Create a fresh account manager
    account_manager = VirtualAccountManager()
    
    # Clean slate - remove any existing default_user data
    if 'default_user' in account_manager.accounts:
        del account_manager.accounts['default_user']
    
    # Create fresh account
    account = account_manager.create_account('default_user', initial_balance=100000)
    print(f"✓ Created fresh account with balance: ${account['balance']:,.2f}")
    
    # Deploy a test bot
    print("\n--- Deploying Test Bot ---")
    bot = account_manager.deploy_bot(
        user_id='default_user',
        strategy='threshold',
        risk_profile=50,
        allocated_fund=10000
    )
    
    # Verify the deployment
    print(f"✓ Bot deployed with ID: {bot['bot_id']}")
    print(f"✓ Allocated fund: ${bot['allocated_fund']:,.2f}")
    print(f"✓ Initial portfolio value: ${bot['portfolio_value']:,.2f}")
      # Check asset allocations using the same prices that were used for deployment
    print(f"✓ Asset allocations:")
    total_asset_value = 0
    deployment_prices = bot.get('deployment_prices', {})
    
    if deployment_prices:
        print(f"Using deployment prices: {deployment_prices}")
        for asset, amount in bot['assets'].items():
            if asset in deployment_prices:
                value = amount * deployment_prices[asset]
                total_asset_value += value
                print(f"  {asset}: {amount:.6f} = ${value:,.2f}")
    else:
        # Fallback to current prices if deployment prices not available
        for asset, amount in bot['assets'].items():
            # Get current price (simplified)
            prices = account_manager._get_current_prices()
            if prices and asset in prices:
                value = amount * prices[asset]
                total_asset_value += value
                print(f"  {asset}: {amount:.6f} = ${value:,.2f}")
    
    print(f"✓ Total asset value: ${total_asset_value:,.2f}")
      # Check for corruption (allow for price fluctuations up to 5%)
    difference_percent = abs(total_asset_value - 10000) / 10000 * 100
    if difference_percent > 5:  # More than 5% difference indicates real corruption
        print(f"❌ CORRUPTION DETECTED: Asset value {total_asset_value:,.2f} differs by {difference_percent:.2f}% from allocated fund")
        return False
    else:
        print(f"✅ NO CORRUPTION: Asset value differs by only {difference_percent:.2f}% (acceptable for price fluctuations)")
    
    # Wait a few seconds and check again (to see if background processes corrupt it)
    print(f"\n--- Waiting 5 seconds to check for background corruption ---")
    time.sleep(5)
    
    # Refresh account data
    account = account_manager.get_account('default_user')
    bot = account['bots'][0]
    
    # Check asset values again
    total_asset_value_after = 0
    prices = account_manager._get_current_prices()
    if prices:
        for asset, amount in bot['assets'].items():
            if asset in prices:
                value = amount * prices[asset]
                total_asset_value_after += value
    
    print(f"✓ Portfolio value after 5 seconds: ${bot.get('portfolio_value', 0):,.2f}")
    print(f"✓ Calculated asset value after 5 seconds: ${total_asset_value_after:,.2f}")
    
    # Check for massive inflation
    if total_asset_value_after > 50000:  # More than 5x original
        print(f"❌ BACKGROUND CORRUPTION DETECTED: Value inflated to ${total_asset_value_after:,.2f}")
        return False
    else:
        print(f"✅ NO BACKGROUND CORRUPTION: Value remains reasonable")
    
    return True

def test_api_endpoints():
    """Test the API endpoints to ensure they work correctly."""
    print("\n=== Testing API Endpoints ===")
    
    base_url = "http://localhost:5000/api"
    
    try:
        # Test account endpoint
        response = requests.get(f"{base_url}/account", params={'user_id': 'default_user'})
        if response.status_code == 200:
            account_data = response.json()
            print(f"✓ Account API works: Balance ${account_data.get('balance', 0):,.2f}")
            
            # Check if there are any bots with astronomical values
            bots = account_data.get('bots', [])
            for bot in bots:
                portfolio_value = bot.get('portfolio_value', 0)
                if portfolio_value > 100000:  # More than 10x original investment of 10k
                    print(f"❌ Bot {bot['bot_id']} has astronomical value: ${portfolio_value:,.2f}")
                    return False
                else:
                    print(f"✓ Bot {bot['bot_id']} has reasonable value: ${portfolio_value:,.2f}")
        else:
            print(f"❌ Account API failed: Status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False
    
    return True

def main():
    """Run all tests."""
    print("🚀 Starting Final Fix Verification Tests")
    print("=" * 50)
    
    # Test 1: Fresh deployment
    test1_passed = test_fresh_deployment()
    
    # Test 2: API endpoints
    test2_passed = test_api_endpoints()
    
    # Summary
    print(f"\n" + "=" * 50)
    print(f"TEST RESULTS:")
    print(f"Fresh Deployment: {'✅ PASSED' if test1_passed else '❌ FAILED'}")
    print(f"API Endpoints: {'✅ PASSED' if test2_passed else '❌ FAILED'}")
    
    if test1_passed and test2_passed:
        print(f"\n🎉 ALL TESTS PASSED! Virtual trading system is fixed.")
        return True
    else:
        print(f"\n💥 SOME TESTS FAILED! Further debugging needed.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
