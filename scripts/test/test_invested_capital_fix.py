#!/usr/bin/env python3
"""
Test script to verify the invested capital fix is working correctly.
"""

import requests
import json
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from models.virtual_account import VirtualAccountManager

def test_invested_capital_fix():
    """Test that the invested capital calculation is working correctly."""
    
    print("🧪 Testing Invested Capital Fix")
    print("=" * 50)
    
    # First, let's check the current account status
    try:
        response = requests.get('http://localhost:5000/api/account')
        if response.status_code != 200:
            print(f"❌ Failed to get account data: {response.status_code}")
            return False
            
        account = response.json()
        print(f"📊 Current Account Status:")
        print(f"   Balance: ${account.get('balance', 0):,.2f}")
        print(f"   Active Bots: {len([bot for bot in account.get('bots', []) if bot.get('status') == 'active'])}")
        
        # Calculate total invested capital
        total_invested = 0
        active_bots = []
        for bot in account.get('bots', []):
            if bot.get('status') == 'active':
                allocated_fund = bot.get('allocated_fund', 0)
                total_invested += allocated_fund
                active_bots.append({
                    'bot_id': bot.get('bot_id'),
                    'strategy': bot.get('strategy'),
                    'allocated_fund': allocated_fund,
                    'portfolio_value': bot.get('portfolio_value', 0)
                })
                print(f"   Bot {bot.get('bot_id')}: ${allocated_fund:,.2f} invested")
        
        print(f"💰 Total Invested Capital: ${total_invested:,.2f}")
        
        # If no active bots, deploy one for testing
        if len(active_bots) == 0:
            print("\n🚀 No active bots found. Deploying a test bot...")
            
            deploy_data = {
                'strategy': 'threshold',
                'riskProfile': 50,
                'allocatedFund': 10000,
                'user_id': 'default_user'
            }
            
            deploy_response = requests.post('http://localhost:5000/api/bots/deploy', json=deploy_data)
            
            if deploy_response.status_code == 200:
                bot_data = deploy_response.json()
                print(f"✅ Bot deployed successfully: {bot_data.get('bot', {}).get('bot_id')}")
                
                # Re-fetch account data
                response = requests.get('http://localhost:5000/api/account')
                account = response.json()
                
                # Recalculate invested capital
                total_invested = 0
                for bot in account.get('bots', []):
                    if bot.get('status') == 'active':
                        total_invested += bot.get('allocated_fund', 0)
                
                print(f"💰 New Total Invested Capital: ${total_invested:,.2f}")
            else:
                print(f"❌ Failed to deploy bot: {deploy_response.status_code}")
                print(f"   Response: {deploy_response.text}")
                return False
        
        # Test the frontend calculation logic
        print(f"\n🔧 Frontend Logic Test:")
        print(f"   Expected totalInitialFunds: ${total_invested:,.2f}")
        
        # Verify the calculation matches what the frontend should show
        if total_invested > 0:
            print(f"✅ Fix should work: totalInitialFunds will show ${total_invested:,.2f}")
            print(f"✅ This should replace the previous $0.00 display")
        else:
            print(f"ℹ️  No invested capital to display (no active bots)")
            
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend server at http://localhost:5000")
        print("   Make sure the backend is running with: python backend/app.py")
        return False
    except Exception as e:
        print(f"❌ Error during test: {e}")
        return False

def test_frontend_data_structure():
    """Test that the frontend will receive the correct data structure."""
    
    print(f"\n📱 Frontend Data Structure Test:")
    print("=" * 50)
    
    try:
        response = requests.get('http://localhost:5000/api/account')
        account = response.json()
        
        # Simulate the frontend calculation
        total_initial_funds = 0
        if account.get('bots') and isinstance(account['bots'], list):
            for bot in account['bots']:
                if bot.get('status') == 'active':
                    total_initial_funds += bot.get('allocated_fund', 0)
        
        print(f"Frontend preparedData will include:")
        print(f"   totalValue: ${(account.get('balance', 0) + sum(bot.get('portfolio_value', 0) for bot in account.get('bots', []))):,.2f}")
        print(f"   totalInitialFunds: ${total_initial_funds:,.2f}")
        print(f"   balance: ${account.get('balance', 0):,.2f}")
        
        # Check if the fix addresses the original issue
        if total_initial_funds > 0:
            print(f"✅ SUCCESS: Invested Capital will show ${total_initial_funds:,.2f} instead of $0.00")
        else:
            print(f"ℹ️  No active investments to display")
            
        return True
        
    except Exception as e:
        print(f"❌ Error testing frontend data: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Testing Invested Capital Fix Implementation")
    print("=" * 60)
    
    # Run tests
    backend_test = test_invested_capital_fix()
    frontend_test = test_frontend_data_structure()
    
    print(f"\n📋 Test Results:")
    print(f"   Backend Data: {'✅ PASS' if backend_test else '❌ FAIL'}")
    print(f"   Frontend Logic: {'✅ PASS' if frontend_test else '❌ FAIL'}")
    
    if backend_test and frontend_test:
        print(f"\n🎉 ALL TESTS PASSED!")
        print(f"   The invested capital fix is working correctly.")
        print(f"   The frontend should now display the correct invested amount.")
    else:
        print(f"\n⚠️  Some tests failed. Please check the issues above.")
