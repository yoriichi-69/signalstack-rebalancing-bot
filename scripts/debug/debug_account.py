#!/usr/bin/env python3

from backend.models.virtual_account import VirtualAccountManager

def main():
    vam = VirtualAccountManager()
    account = vam.get_account('default_user')
    
    print("=== ACCOUNT DEBUG ===")
    print(f"Balance: {account.get('balance', 'NOT SET')}")
    print(f"Number of bots: {len(account.get('bots', []))}")
    
    for i, bot in enumerate(account.get('bots', [])):
        print(f"\nBot {i}: {bot['bot_id']}")
        print(f"  Status: {bot['status']}")
        print(f"  Assets: {bot.get('assets', {})}")
        print(f"  Portfolio Value: {bot.get('portfolio_value', 'NOT SET')}")

if __name__ == "__main__":
    main()
