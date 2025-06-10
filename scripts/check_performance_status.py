#!/usr/bin/env python3
"""
Check current account status and bot deployment to debug performance display
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.models.virtual_account import VirtualAccountManager

def check_account_status():
    """Check if there are active bots and proper PnL data."""
    print("=== ACCOUNT STATUS DEBUG ===")
    
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
    
    # Check bots
    print(f"\n--- BOTS STATUS ---")
    if not account.get('bots'):
        print("❌ NO BOTS DEPLOYED!")
        print("This is why Performance shows 0.00% - no trading activity to track")
        print("Deploy a bot to see performance metrics")
        return False
    
    total_bots = len(account['bots'])
    active_bots = [bot for bot in account['bots'] if bot.get('status') == 'active']
    
    print(f"Total bots: {total_bots}")
    print(f"Active bots: {len(active_bots)}")
    
    if len(active_bots) == 0:
        print("❌ NO ACTIVE BOTS!")
        print("This is why Performance shows 0.00% - no active trading")
        return False
    
    # Check bot details
    for i, bot in enumerate(active_bots, 1):
        print(f"\nBot {i}:")
        print(f"  ID: {bot['bot_id']}")
        print(f"  Strategy: {bot['strategy']}")
        print(f"  Allocated: ${bot.get('allocated_fund', 0):,.2f}")
        print(f"  Portfolio Value: ${bot.get('portfolio_value', 0):,.2f}")
        
        pnl = bot.get('portfolio_value', 0) - bot.get('allocated_fund', 0)
        pnl_percent = (pnl / bot.get('allocated_fund', 1)) * 100
        print(f"  PnL: ${pnl:.2f} ({pnl_percent:+.2f}%)")
    
    # Check performance history
    print(f"\n--- PERFORMANCE HISTORY ---")
    if account.get('performance_history'):
        print(f"Records: {len(account['performance_history'])}")
        if len(account['performance_history']) > 0:
            latest = account['performance_history'][-1]
            print("Latest record:")
            print(f"  Timestamp: {latest.get('timestamp', 'N/A')}")
            print(f"  Total Value: ${latest.get('total_value', 0):,.2f}")
            print(f"  PnL: ${latest.get('pnl', 0):,.2f}")
            print(f"  PnL %: {latest.get('pnl_percent', 0):+.2f}%")
            
            if latest.get('pnl_percent', 0) != 0:
                print("✅ Performance data available - frontend should show this")
            else:
                print("⚠️ Performance data exists but PnL is 0%")
        else:
            print("❌ No performance history records")
    else:
        print("❌ No performance history found")
    
    return True

if __name__ == "__main__":
    check_account_status()
