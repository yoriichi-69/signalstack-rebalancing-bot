#!/usr/bin/env python3
"""
Reset script to fix virtual trading system issues:
1. Reset all account balances to 100k
2. Clear all bots and trading history
3. Fix corrupted data structures
"""

import json
import os
import time
from datetime import datetime

def reset_virtual_accounts():
    """Reset all virtual accounts to initial state with 100k balance"""
    
    # Path to the virtual accounts file
    accounts_file = os.path.join('backend', 'cache', 'virtual_accounts.json')
    backup_file = os.path.join('backend', 'cache', f'virtual_accounts_backup_{int(time.time())}.json')
    
    # Create backup
    if os.path.exists(accounts_file):
        with open(accounts_file, 'r') as f:
            backup_data = json.load(f)
        with open(backup_file, 'w') as f:
            json.dump(backup_data, f, indent=2)
        print(f"✅ Backup created: {backup_file}")
    
    # Reset accounts data
    reset_data = {}
    
    # Define users to reset
    users_to_reset = ['default_user', 'trading_user_01']
    
    for user_id in users_to_reset:
        reset_data[user_id] = {
            "account_id": f"reset_{user_id}_{int(time.time())}",
            "user_id": user_id,
            "balance": 100000,  # Reset to 100k
            "initial_balance": 100000,  # Store initial balance for PnL calculation
            "portfolio": {},
            "bots": [],  # Clear all bots
            "trade_history": [],  # Clear trade history
            "performance_history": [
                {
                    "timestamp": time.time(),
                    "balance": 100000,
                    "portfolio_value": 0,
                    "total_value": 100000,
                    "total_initial": 100000,
                    "pnl": 0,
                    "pnl_percent": 0.0
                }
            ],
            "created_at": time.time()
        }
    
    # Write reset data
    with open(accounts_file, 'w') as f:
        json.dump(reset_data, f, indent=2)
    
    print("✅ Virtual accounts reset successfully!")
    print(f"✅ All users now have $100,000 balance")
    print(f"✅ All bots and trading history cleared")
    print(f"✅ Performance history reset")
    
    return True

if __name__ == "__main__":
    print("🔄 Starting virtual accounts reset...")
    print("This will:")
    print("  - Reset all balances to $100,000")
    print("  - Clear all trading bots")
    print("  - Clear all trading history")
    print("  - Reset performance metrics")
    print()
    
    confirm = input("Are you sure you want to proceed? (yes/no): ").lower().strip()
    
    if confirm == 'yes':
        if reset_virtual_accounts():
            print("\n🎉 Reset completed successfully!")
            print("You can now restart the backend server to apply changes.")
        else:
            print("\n❌ Reset failed!")
    else:
        print("❌ Reset cancelled.")