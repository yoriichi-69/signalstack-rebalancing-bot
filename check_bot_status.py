#!/usr/bin/env python3
"""
Check all users and their bots status
"""
import json

def main():
    with open('backend/cache/virtual_accounts.json', 'r') as f:
        data = json.load(f)
    
    print("=== USER BOTS STATUS ===\n")
    
    for user_id, account in data.items():
        bots = account.get('bots', [])
        print(f"User: {user_id}")
        print(f"  Bots: {len(bots)}")
        
        if bots:
            for bot in bots:
                bot_id = bot.get('bot_id', 'unknown')
                portfolio_value = bot.get('portfolio_value', 0)
                allocated_fund = bot.get('allocated_fund', 0)
                status = bot.get('status', 'unknown')
                print(f"    - {bot_id}: ${portfolio_value:.2f} (allocated: ${allocated_fund:.2f}) [{status}]")
        print()

if __name__ == "__main__":
    main()
