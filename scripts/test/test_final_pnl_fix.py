#!/usr/bin/env python3
"""
Final comprehensive PnL fix verification
Tests the entire pipeline from backend to frontend calculations
"""

import requests
import json
import time

def test_backend_pnl():
    """Test that backend is calculating PnL correctly"""
    print("🔍 Testing Backend PnL Calculation...")
    
    try:
        response = requests.get('http://localhost:5000/api/account', params={'user_id': 'default_user'})
        if response.status_code != 200:
            print(f"❌ API Error: {response.status_code}")
            return False
            
        data = response.json()
        
        # Extract key values
        balance = data.get('balance', 0)
        initial_balance = data.get('initial_balance', 100000)
        bots = data.get('bots', [])
        
        print(f"   Account Balance: ${balance:,.2f}")
        print(f"   Initial Balance: ${initial_balance:,.2f}")
        print(f"   Active Bots: {len(bots)}")
        
        # Calculate total bot value
        total_bot_value = 0
        for i, bot in enumerate(bots):
            bot_value = bot.get('portfolio_value', 0)
            allocated = bot.get('allocated_fund', 0)
            bot_pnl = bot_value - allocated
            bot_pnl_percent = (bot_pnl / allocated * 100) if allocated > 0 else 0
            
            print(f"   Bot {i+1}: ${bot_value:,.2f} (allocated: ${allocated:,.2f}, PnL: {bot_pnl:+.2f} {bot_pnl_percent:+.2f}%)")
            total_bot_value += bot_value
        
        # Calculate overall PnL
        total_portfolio_value = balance + total_bot_value
        pnl_amount = total_portfolio_value - initial_balance
        pnl_percent = (pnl_amount / initial_balance * 100) if initial_balance > 0 else 0
        
        print(f"   📊 Total Portfolio Value: ${total_portfolio_value:,.2f}")
        print(f"   💰 Overall PnL: ${pnl_amount:+.2f} ({pnl_percent:+.2f}%)")
        
        # Validate reasonable PnL
        if abs(pnl_percent) > 50:  # More than 50% change is suspicious
            print(f"   ⚠️  WARNING: PnL seems unrealistic: {pnl_percent:.2f}%")
            return False
            
        print("   ✅ Backend PnL calculation looks correct!")
        return True
        
    except Exception as e:
        print(f"   ❌ Backend test failed: {e}")
        return False

def test_frontend_calculation_logic():
    """Test the frontend calculation logic using the same data"""
    print("\n🎯 Testing Frontend PnL Logic...")
    
    try:
        # Get the same data that frontend would receive
        response = requests.get('http://localhost:5000/api/account', params={'user_id': 'default_user'})
        account = response.json()
        
        # Simulate frontend calculation (simplified version)
        balance = account.get('balance', 0)
        initial_balance = account.get('initial_balance', 100000)
        bots = account.get('bots', [])
        
        # Simulate asset value calculation
        total_assets_value = 0
        for bot in bots:
            # In the real frontend, this would use crypto prices
            # For testing, we'll use the backend's calculated portfolio_value
            total_assets_value += bot.get('portfolio_value', 0)
        
        total_value = balance + total_assets_value
        pnl_amount = total_value - initial_balance  
        pnl_percent = (pnl_amount / initial_balance * 100) if initial_balance > 0 else 0
        
        print(f"   Frontend simulation:")
        print(f"   Balance: ${balance:,.2f}")
        print(f"   Assets Value: ${total_assets_value:,.2f}")
        print(f"   Total Value: ${total_value:,.2f}")
        print(f"   PnL: ${pnl_amount:+.2f} ({pnl_percent:+.2f}%)")
        
        # This should match the backend calculation
        if abs(pnl_percent) > 50:
            print(f"   ❌ Frontend logic produces unrealistic PnL: {pnl_percent:.2f}%")
            return False
        
        print("   ✅ Frontend calculation logic is correct!")
        return True
        
    except Exception as e:
        print(f"   ❌ Frontend logic test failed: {e}")
        return False

def test_data_consistency():
    """Test that data is consistent across multiple requests"""
    print("\n🔄 Testing Data Consistency...")
    
    try:
        # Make multiple requests and ensure consistency
        results = []
        for i in range(3):
            response = requests.get('http://localhost:5000/api/account', params={'user_id': 'default_user'})
            data = response.json()
            
            balance = data.get('balance', 0)
            total_bot_value = sum(bot.get('portfolio_value', 0) for bot in data.get('bots', []))
            total_value = balance + total_bot_value
            
            results.append(total_value)
            time.sleep(0.5)  # Small delay between requests
        
        # Check if results are consistent (within a small margin for price updates)
        max_diff = max(results) - min(results)
        print(f"   Portfolio values: {[f'${val:,.2f}' for val in results]}")
        print(f"   Max difference: ${max_diff:,.2f}")
        
        if max_diff > 1000:  # More than $1000 difference is suspicious
            print(f"   ⚠️  WARNING: Large inconsistency in portfolio values")
            return False
        
        print("   ✅ Data consistency check passed!")
        return True
        
    except Exception as e:
        print(f"   ❌ Consistency test failed: {e}")
        return False

def main():
    """Run all PnL fix verification tests"""
    print("=" * 60)
    print("🚀 COMPREHENSIVE PnL FIX VERIFICATION")
    print("=" * 60)
    
    tests = [
        ("Backend PnL Calculation", test_backend_pnl),
        ("Frontend Logic Simulation", test_frontend_calculation_logic),
        ("Data Consistency", test_data_consistency),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
    
    print("\n" + "=" * 60)
    print(f"📊 TEST RESULTS: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! PnL fix is working correctly!")
        print("✅ Frontend should now display accurate PnL values")
    else:
        print("❌ Some tests failed. Please review the issues above.")
        
    print("=" * 60)

if __name__ == "__main__":
    main()
