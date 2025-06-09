#!/usr/bin/env python3

"""
End-to-end test to verify the complete virtual trading system works through the API.
"""

import requests
import time
import json

def test_api_bot_deployment():
    """Test deploying a bot through the API."""
    print("=== Testing API Bot Deployment ===")
    
    base_url = "http://localhost:5000/api"
    
    # First, get initial account state
    print("1. Getting initial account state...")
    response = requests.get(f"{base_url}/account", params={'user_id': 'test_user'})
    if response.status_code == 200:
        initial_account = response.json()
        print(f"   ✓ Initial balance: ${initial_account.get('balance', 0):,.2f}")
        print(f"   ✓ Initial bots: {len(initial_account.get('bots', []))}")
    else:
        print(f"   ❌ Failed to get account: {response.status_code}")
        return False
    
    # Deploy a new bot
    print("2. Deploying a new bot...")
    bot_data = {
        'user_id': 'test_user',
        'strategy': 'threshold',
        'riskProfile': 50,
        'allocatedFund': 5000
    }
    
    response = requests.post(f"{base_url}/bots/deploy", json=bot_data)
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            bot = result.get('bot', {})
            print(f"   ✓ Bot deployed: {bot.get('bot_id')}")
            print(f"   ✓ Allocated fund: ${bot.get('allocated_fund', 0):,.2f}")
            print(f"   ✓ Initial portfolio value: ${bot.get('portfolio_value', 0):,.2f}")
        else:
            print(f"   ❌ Bot deployment failed: {result.get('error', 'Unknown error')}")
            return False
    else:
        print(f"   ❌ API call failed: {response.status_code}")
        try:
            error_data = response.json()
            print(f"   Error: {error_data}")
        except:
            print(f"   Raw response: {response.text}")
        return False
    
    # Get updated account state
    print("3. Verifying account state after deployment...")
    response = requests.get(f"{base_url}/account", params={'user_id': 'test_user'})
    if response.status_code == 200:
        updated_account = response.json()
        new_balance = updated_account.get('balance', 0)
        bots = updated_account.get('bots', [])
        
        print(f"   ✓ Updated balance: ${new_balance:,.2f}")
        print(f"   ✓ Number of bots: {len(bots)}")
        
        # Check the deployed bot
        if bots:
            bot = bots[-1]  # Get the latest bot
            portfolio_value = bot.get('portfolio_value', 0)
            allocated_fund = bot.get('allocated_fund', 0)
            
            print(f"   ✓ Bot portfolio value: ${portfolio_value:,.2f}")
            print(f"   ✓ Bot allocated fund: ${allocated_fund:,.2f}")
            
            # Check for corruption
            if portfolio_value > allocated_fund * 10:  # More than 10x indicates corruption
                print(f"   ❌ CORRUPTION DETECTED: Portfolio value is {portfolio_value/allocated_fund:.1f}x the allocated fund")
                return False
            else:
                print(f"   ✅ NO CORRUPTION: Portfolio value is reasonable")
        
        # Check balance deduction
        expected_balance = initial_account.get('balance', 100000) - 5000
        if abs(new_balance - expected_balance) < 1:  # Allow small rounding differences
            print(f"   ✅ Balance correctly deducted")
        else:
            print(f"   ❌ Balance deduction error: Expected ${expected_balance:,.2f}, got ${new_balance:,.2f}")
            return False
    else:
        print(f"   ❌ Failed to get updated account: {response.status_code}")
        return False
    
    # Wait and check for background corruption
    print("4. Waiting 10 seconds to check for background corruption...")
    time.sleep(10)
    
    response = requests.get(f"{base_url}/account", params={'user_id': 'test_user'})
    if response.status_code == 200:
        final_account = response.json()
        bots = final_account.get('bots', [])
        
        if bots:
            bot = bots[-1]
            final_portfolio_value = bot.get('portfolio_value', 0)
            allocated_fund = bot.get('allocated_fund', 0)
            
            print(f"   ✓ Final portfolio value: ${final_portfolio_value:,.2f}")
            
            # Check for massive growth indicating background corruption
            if final_portfolio_value > allocated_fund * 10:
                print(f"   ❌ BACKGROUND CORRUPTION: Portfolio grew to {final_portfolio_value/allocated_fund:.1f}x")
                return False
            else:
                print(f"   ✅ NO BACKGROUND CORRUPTION: Value remains reasonable")
    
    return True

def main():
    """Run the end-to-end test."""
    print("🚀 Starting End-to-End API Test")
    print("=" * 50)
    
    try:
        # Check if backend is running
        response = requests.get("http://localhost:5000/api/account", params={'user_id': 'test_user'}, timeout=5)
        print("✓ Backend server is running")
    except Exception as e:
        print(f"❌ Backend server is not running: {e}")
        print("Please start the backend server with: python backend/app.py")
        return False
    
    # Run the test
    test_passed = test_api_bot_deployment()
    
    print("=" * 50)
    if test_passed:
        print("🎉 END-TO-END TEST PASSED! The virtual trading system is fully functional.")
    else:
        print("💥 END-TO-END TEST FAILED! There are still issues to resolve.")
    
    return test_passed

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
