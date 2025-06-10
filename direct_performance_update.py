#!/usr/bin/env python3

import time
import requests
import json
import os

def update_performance_directly():
    """Directly update the performance history in the JSON file with correct calculations"""
    
    print("=== DIRECT PERFORMANCE UPDATE ===")
    
    # Path to the accounts file
    accounts_file = os.path.join('backend', 'cache', 'virtual_accounts.json')
    
    # Load current accounts
    if not os.path.exists(accounts_file):
        print(f"❌ Accounts file not found: {accounts_file}")
        return False
    
    with open(accounts_file, 'r') as f:
        accounts = json.load(f)
    
    # Find default_user account
    if 'default_user' not in accounts:
        print("❌ default_user account not found")
        return False
    
    account = accounts['default_user']
    print(f"✓ Found account: {account['account_id']}")
    
    # Calculate current portfolio values
    balance = account.get('balance', 0)
    total_bot_value = 0
    
    for bot in account.get('bots', []):
        if bot.get('status') == 'active':
            total_bot_value += bot.get('portfolio_value', 0)
            print(f"  Bot {bot['bot_id']}: ${bot.get('portfolio_value', 0):,.2f}")
    
    total_value = balance + total_bot_value
    initial_value = 100000
    pnl = total_value - initial_value
    pnl_percent = (pnl / initial_value) * 100
    
    print(f"\n--- CALCULATED VALUES ---")
    print(f"Balance: ${balance:,.2f}")
    print(f"Bot Value: ${total_bot_value:,.2f}")
    print(f"Total Value: ${total_value:,.2f}")
    print(f"Initial Value: ${initial_value:,.2f}")
    print(f"P&L: ${pnl:,.2f} ({pnl_percent:+.2f}%)")
    
    # Create new performance record
    new_record = {
        'timestamp': time.time(),
        'balance': balance,
        'portfolio_value': total_bot_value,
        'total_value': total_value,
        'total_initial': initial_value,
        'pnl': pnl,
        'pnl_percent': pnl_percent
    }
    
    # Replace the last performance record or add new one
    if 'performance_history' not in account:
        account['performance_history'] = []
    
    # Replace the last record instead of adding a new one
    if account['performance_history']:
        account['performance_history'][-1] = new_record
        print("✓ Updated existing performance record")
    else:
        account['performance_history'].append(new_record)
        print("✓ Added new performance record")
    
    # Save the updated accounts
    with open(accounts_file, 'w') as f:
        json.dump(accounts, f, indent=2)
    
    print(f"✅ Saved updated performance to {accounts_file}")
    print(f"Frontend should now show: {pnl_percent:+.2f}% Performance")
    
    return True

if __name__ == "__main__":
    update_performance_directly()
