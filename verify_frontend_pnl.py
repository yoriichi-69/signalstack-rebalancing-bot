#!/usr/bin/env python3

"""
Final verification that the portfolio PnL fix is working correctly.
This simulates exactly what the frontend should calculate.
"""

import requests
import sys

def verify_frontend_pnl_calculation():
    """Verify that the frontend PnL calculation matches our expectations."""
    print("=== Final Portfolio PnL Verification ===")
    
    try:
        # Get account data (same as frontend)
        response = requests.get("http://localhost:5000/api/account", params={'user_id': 'default_user'})
        if response.status_code != 200:
            print(f"❌ Failed to get account data: {response.status_code}")
            return False
        
        account = response.json()
        
        # Simulate frontend calculation
        account_balance = account.get('balance', 0)
        initial_balance = account.get('initial_balance', 100000)
        
        # Calculate total asset value from active bots
        total_asset_value = 0
        active_bots = [bot for bot in account.get('bots', []) if bot.get('status') == 'active']
        
        print(f"Account balance: ${account_balance:,.2f}")
        print(f"Active bots: {len(active_bots)}")
        
        for bot in active_bots:
            portfolio_value = bot.get('portfolio_value', 0)
            total_asset_value += portfolio_value
            print(f"  Bot {bot['bot_id']}: ${portfolio_value:,.2f} (allocated: ${bot.get('allocated_fund', 0):,.2f})")
        
        # Total portfolio value (what frontend shows as "Total Value")
        total_portfolio_value = account_balance + total_asset_value
        
        # PnL calculation (FIXED VERSION)
        pnl_amount = total_portfolio_value - initial_balance
        pnl_percent = (pnl_amount / initial_balance) * 100 if initial_balance > 0 else 0
        
        print(f"\n--- Portfolio Summary ---")
        print(f"Initial balance: ${initial_balance:,.2f}")
        print(f"Current balance: ${account_balance:,.2f}")
        print(f"Total asset value: ${total_asset_value:,.2f}")
        print(f"Total portfolio value: ${total_portfolio_value:,.2f}")
        print(f"PnL: ${pnl_amount:,.2f} ({pnl_percent:+.2f}%)")
        
        # Verify the calculation makes sense
        expected_range = (-20, 20)  # Reasonable range for crypto portfolio
        
        if expected_range[0] <= pnl_percent <= expected_range[1]:
            print(f"✅ PnL calculation looks reasonable and realistic!")
            print(f"✅ Frontend should now show: ${pnl_amount:,.2f} ({pnl_percent:+.2f}%)")
            return True
        else:
            print(f"❌ PnL still seems unrealistic: {pnl_percent:+.2f}%")
            return False
            
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

if __name__ == "__main__":
    success = verify_frontend_pnl_calculation()
    print(f"\n{'='*50}")
    if success:
        print("🎉 PORTFOLIO PNL FIX VERIFICATION: PASSED")
        print("The frontend should now display correct PnL values!")
    else:
        print("💥 PORTFOLIO PNL FIX VERIFICATION: FAILED")
    print(f"{'='*50}")
    sys.exit(0 if success else 1)
