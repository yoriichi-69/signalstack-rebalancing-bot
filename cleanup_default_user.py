#!/usr/bin/env python3
"""
Cleanup script for corrupted default_user account in virtual trading system.
This script specifically targets the default_user account to remove corrupted bot data
while preserving the properly reset trading_user_01 account.
"""

import json
import uuid
import time
from datetime import datetime

def cleanup_default_user():
    """Clean up the corrupted default_user account data."""
    
    virtual_accounts_file = "backend/cache/virtual_accounts.json"
    
    print("🔍 Loading virtual accounts data...")
    
    try:
        with open(virtual_accounts_file, 'r') as f:
            accounts = json.load(f)
    except FileNotFoundError:
        print("❌ Virtual accounts file not found!")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing virtual accounts JSON: {e}")
        return False
    
    # Create backup with timestamp
    backup_timestamp = str(int(time.time() * 1000))
    backup_file = f"virtual_accounts_backup_cleanup_{backup_timestamp}.json"
    
    print(f"📁 Creating backup: {backup_file}")
    with open(backup_file, 'w') as f:
        json.dump(accounts, f, indent=2)
    
    # Check if default_user exists
    if "default_user" not in accounts:
        print("✅ default_user account not found - nothing to clean up")
        return True
      # Print current state before cleanup
    if "default_user" in accounts:
        current_user = accounts["default_user"]
        print(f"  📊 Current default_user state:")
        print(f"    💰 Balance: ${current_user.get('balance', 0):,.2f}")
        print(f"    🤖 Active Bots: {len(current_user.get('bots', []))}")
        if current_user.get('bots'):
            for bot in current_user['bots']:
                print(f"      Bot {bot['bot_id']}: Portfolio Value ${bot.get('portfolio_value', 0):,.2f}")
    
    # Reset default_user account to clean state
    print("🧹 Cleaning up default_user account...")
    
    current_time = time.time()
    
    # Completely replace default_user with clean state
    clean_default_user = {
        "account_id": str(uuid.uuid4()),
        "user_id": "default_user",
        "balance": 100000,
        "portfolio": {},
        "bots": [],
        "trade_history": [],
        "performance_history": [
            {
                "timestamp": current_time,
                "balance": 100000,
                "portfolio_value": 0,
                "total_value": 100000,
                "total_initial": 100000,
                "pnl": 0,
                "pnl_percent": 0.0
            }
        ]
    }
    
    # Force replace the default_user entry
    accounts["default_user"] = clean_default_user
    
    # Save the cleaned data
    print("💾 Saving cleaned virtual accounts data...")
    with open(virtual_accounts_file, 'w') as f:
        json.dump(accounts, f, indent=2)
    
    print("✅ Successfully cleaned up default_user account!")
    print("📊 Account Summary:")
    for user_id, account in accounts.items():
        balance = account.get('balance', 0)
        bot_count = len(account.get('bots', []))
        total_portfolio_value = sum(bot.get('portfolio_value', 0) for bot in account.get('bots', []))
        
        print(f"  👤 {user_id}:")
        print(f"    💰 Balance: ${balance:,.2f}")
        print(f"    🤖 Active Bots: {bot_count}")
        print(f"    📈 Total Portfolio Value: ${total_portfolio_value:,.2f}")
        print(f"    💯 Total Account Value: ${balance + total_portfolio_value:,.2f}")
        print()
    
    return True

if __name__ == "__main__":
    print("🚀 Starting default_user cleanup process...")
    print(f"📅 Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    success = cleanup_default_user()
    
    print("=" * 60)
    if success:
        print("✅ Cleanup completed successfully!")
        print("🎯 Next steps:")
        print("  1. Test the frontend to verify portfolio values are correct")
        print("  2. Deploy new bots to test proper PnL calculations") 
        print("  3. Monitor account balances display correctly at 100k")
    else:
        print("❌ Cleanup failed - check the error messages above")
