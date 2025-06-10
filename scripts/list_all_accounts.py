#!/usr/bin/env python3

from backend.models.virtual_account import VirtualAccountManager

def main():
    vam = VirtualAccountManager()
    
    print("=== ALL ACCOUNTS ===")
    print(f"Account keys: {list(vam.accounts.keys())}")
    
    for user_id, account in vam.accounts.items():
        print(f"\nAccount: {user_id}")
        print(f"  Balance: ${account.get('balance', 0):,.2f}")
        print(f"  Bots: {len(account.get('bots', []))}")
        
        for bot in account.get('bots', []):
            print(f"    Bot {bot['bot_id']}: {bot['status']}")
            if bot.get('assets'):
                for asset, amount in bot['assets'].items():
                    print(f"      {asset}: {amount}")

if __name__ == "__main__":
    main()
