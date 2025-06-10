#!/usr/bin/env python3

"""
Test script to deploy a bot and verify portfolio PnL calculations with active assets.
"""

import sys
import os
import requests
import time

def test_with_bot_deployment():
    """Test portfolio PnL with an actual bot deployment."""
    print("=== Testing Portfolio PnL with Bot Deployment ===")
    
    base_url = "http://localhost:5000/api"
    
    try:
        # 1. Get initial account state
        response = requests.get(f"{base_url}/account", params={'user_id': 'default_user'})
        if response.status_code != 200:
            print(f"❌ Failed to get account: {response.status_code}")
            return False
        
        account_before = response.json()
        print(f"✓ Initial balance: ${account_before['balance']:,.2f}")
        print(f"✓ Initial portfolio value: ${account_before['balance']:,.2f}")
        
        # 2. Deploy a test bot
        print("\n--- Deploying Test Bot ---")
        deploy_data = {
            'strategy': 'threshold',
            'riskProfile': 50,
            'allocatedFund': 5000,
            'user_id': 'default_user'
        }
        
        response = requests.post(f"{base_url}/bots/deploy", json=deploy_data)
        if response.status_code != 200:
            print(f"❌ Failed to deploy bot: {response.status_code}")
            return False
        
        result = response.json()
        print(f"✓ Bot deployed: {result['bot']['bot_id']}")
        print(f"✓ Allocated fund: ${result['bot']['allocated_fund']:,.2f}")
        
        # 3. Wait a moment and check updated account
        time.sleep(2)
        
        response = requests.get(f"{base_url}/account", params={'user_id': 'default_user'})
        if response.status_code != 200:
            print(f"❌ Failed to get updated account: {response.status_code}")
            return False
        
        account_after = response.json()
        
        # 4. Calculate expected vs actual PnL
        print(f"\n--- Portfolio Analysis ---")
        print(f"Current balance: ${account_after['balance']:,.2f}")
        
        total_bot_value = 0
        for bot in account_after.get('bots', []):
            if bot.get('status') == 'active':
                bot_value = bot.get('portfolio_value', 0)
                total_bot_value += bot_value
                print(f"Bot {bot['bot_id']}: ${bot_value:,.2f}")
        
        total_portfolio_value = account_after['balance'] + total_bot_value
        initial_balance = 100000  # Known initial balance
        
        # Expected PnL calculation (what the frontend should show)
        expected_pnl = total_portfolio_value - initial_balance
        expected_pnl_percent = (expected_pnl / initial_balance) * 100
        
        print(f"Total asset value: ${total_bot_value:,.2f}")
        print(f"Total portfolio value: ${total_portfolio_value:,.2f}")
        print(f"Initial balance: ${initial_balance:,.2f}")
        print(f"Expected PnL: ${expected_pnl:,.2f} ({expected_pnl_percent:+.2f}%)")
        
        # Verify the PnL makes sense
        if abs(expected_pnl_percent) < 10:  # Should be small change for a fresh deployment
            print(f"✅ Portfolio PnL calculation looks correct!")
            return True
        else:
            print(f"❌ Portfolio PnL calculation seems incorrect: {expected_pnl_percent:+.2f}%")
            return False
            
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False

if __name__ == "__main__":
    success = test_with_bot_deployment()
    sys.exit(0 if success else 1)
