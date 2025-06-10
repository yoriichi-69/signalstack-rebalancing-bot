#!/usr/bin/env python3
"""
Force update the performance history to fix the 0% display issue
"""

import sys
import os
import time
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.models.virtual_account import VirtualAccountManager

def force_update_performance():
    """Force recalculate and update performance history."""
    print("=== FORCE PERFORMANCE UPDATE ===")
    
    # Create account manager
    account_manager = VirtualAccountManager()
    
    # Get the current default_user account
    account = account_manager.get_account('default_user')
    
    if not account:
        print("❌ No default_user account found")
        return False
    
    print(f"✓ Account found: {account['account_id']}")
    
    # Calculate current values manually
    current_balance = account['balance']
    total_bot_value = 0
    
    # Get current prices
    prices = account_manager._get_current_prices()
    print(f"Current prices: {prices}")
    
    # Calculate bot values
    for bot in account.get('bots', []):
        if bot.get('status') == 'active':
            bot_value = 0
            for asset, amount in bot.get('assets', {}).items():
                price = prices.get(asset, 0)
                asset_value = amount * price
                bot_value += asset_value
                print(f"  {asset}: {amount:.6f} × ${price:.2f} = ${asset_value:.2f}")
            
            # Update bot portfolio value
            bot['portfolio_value'] = bot_value
            total_bot_value += bot_value
            print(f"Bot {bot['bot_id']}: ${bot_value:.2f}")
    
    # Calculate total portfolio value
    total_portfolio_value = current_balance + total_bot_value
    initial_balance = account.get('initial_balance', 100000)
    
    # Calculate PnL
    pnl = total_portfolio_value - initial_balance
    pnl_percent = (pnl / initial_balance) * 100 if initial_balance > 0 else 0
    
    print(f"\n--- CALCULATED VALUES ---")
    print(f"Current balance: ${current_balance:,.2f}")
    print(f"Total bot value: ${total_bot_value:,.2f}")
    print(f"Total portfolio value: ${total_portfolio_value:,.2f}")
    print(f"Initial balance: ${initial_balance:,.2f}")
    print(f"PnL: ${pnl:.2f} ({pnl_percent:+.2f}%)")
    
    # Force add new performance record
    current_time = time.time()
    new_record = {
        'timestamp': current_time,
        'balance': current_balance,
        'portfolio_value': total_bot_value,  # Just bot values
        'total_value': total_portfolio_value,
        'total_initial': initial_balance,
        'pnl': pnl,
        'pnl_percent': pnl_percent
    }
    
    # Add the new record
    if not account.get('performance_history'):
        account['performance_history'] = []
    
    account['performance_history'].append(new_record)
    
    # Keep only recent records (last 100)
    if len(account['performance_history']) > 100:
        account['performance_history'] = account['performance_history'][-100:]
    
    # Save the updated account
    account_manager.accounts['default_user'] = account
    account_manager.save_accounts()
    
    print(f"\n✅ Performance history updated!")
    print(f"Latest record: PnL ${pnl:.2f} ({pnl_percent:+.2f}%)")
    print(f"Frontend should now show: {pnl_percent:+.2f}% Performance")
    
    return True

if __name__ == "__main__":
    force_update_performance()
