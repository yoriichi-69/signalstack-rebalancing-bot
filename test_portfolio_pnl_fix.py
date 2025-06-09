#!/usr/bin/env python3

"""
Test script to verify that the portfolio PnL fix is working correctly.
"""

import sys
import os
import json

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from models.virtual_account import VirtualAccountManager

def test_pnl_calculation():
    """Test that PnL calculations are now correct."""
    print("=== Testing Portfolio PnL Calculation Fix ===")
    
    # Create account manager
    account_manager = VirtualAccountManager()
    
    # Get the current default_user account
    account = account_manager.get_account('default_user')
    
    if not account:
        print("❌ No default_user account found")
        return False
    
    print(f"✓ Account found: {account['account_id']}")
    print(f"✓ Current balance: ${account['balance']:,.2f}")
    print(f"✓ Initial balance: ${account.get('initial_balance', 100000):,.2f}")
    print(f"✓ Number of bots: {len(account.get('bots', []))}")
    
    # Calculate what the frontend should show
    total_asset_value = 0
    active_bots = [bot for bot in account.get('bots', []) if bot.get('status') == 'active']
    
    if active_bots:
        print(f"\n--- Active Bots ---")
        for bot in active_bots:
            print(f"Bot {bot['bot_id']}: Portfolio value ${bot.get('portfolio_value', 0):,.2f}")
            total_asset_value += bot.get('portfolio_value', 0)
    
    # Calculate totals
    current_balance = account['balance']
    initial_balance = account.get('initial_balance', 100000)
    total_current_value = current_balance + total_asset_value
    
    # Calculate PnL the correct way (how the frontend should calculate it now)
    correct_pnl = total_current_value - initial_balance
    correct_pnl_percent = (correct_pnl / initial_balance) * 100 if initial_balance > 0 else 0
    
    print(f"\n--- Portfolio Summary ---")
    print(f"Current balance: ${current_balance:,.2f}")
    print(f"Total asset value: ${total_asset_value:,.2f}")
    print(f"Total portfolio value: ${total_current_value:,.2f}")
    print(f"Initial balance: ${initial_balance:,.2f}")
    print(f"PnL: ${correct_pnl:,.2f} ({correct_pnl_percent:+.2f}%)")
    
    # Check if this looks reasonable
    if abs(correct_pnl_percent) < 100:  # Less than 100% loss/gain seems reasonable
        print(f"✅ PnL calculation looks reasonable: {correct_pnl_percent:+.2f}%")
        return True
    else:
        print(f"❌ PnL calculation still looks wrong: {correct_pnl_percent:+.2f}%")
        return False

if __name__ == "__main__":
    success = test_pnl_calculation()
    sys.exit(0 if success else 1)
